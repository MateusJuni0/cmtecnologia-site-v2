/* =========================================================
   C&M Tecnologia v2 — Inês LIVE voice (real, hands-free)
   mic → silence-detect (VAD) → WAV 16k → /api/ines → play reply → loop
   Exposes window.inesLive = { toggle, supported, active }
   ========================================================= */
(() => {
  const btn = document.getElementById('voiceBtn');
  const statusEl = document.getElementById('voiceStatus');
  const scriptEl = document.getElementById('voiceScript');
  const wavesEl = document.getElementById('waves');
  if (!btn) return;
  const bars = wavesEl ? Array.from(wavesEl.querySelectorAll('i')) : [];
  const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && (window.AudioContext || window.webkitAudioContext));

  const SPEAK_THRESH = 0.02, SILENCE_MS = 1100, MIN_UTTER_MS = 350, MAX_UTTER_MS = 14000;
  let active = false, stream = null, ac = null, analyser = null, data = null, rec = null, chunks = [];
  let state = 'idle', speaking = false, uttStart = 0, lastVoice = 0, rafId = 0, player = null;
  const history = [];
  let leadSent = false;

  const setStatus = (t) => { if (statusEl) statusEl.textContent = t; };
  function setState(s) {
    state = s;
    btn.classList.toggle('live', active);
    btn.classList.toggle('st-listen', s === 'listening');
    btn.classList.toggle('st-think', s === 'thinking');
    btn.classList.toggle('st-speak', s === 'speaking');
  }
  function addLine(who, label, text) {
    if (!scriptEl || !text) return;
    const el = document.createElement('div');
    el.className = 'vline ' + (who === 'ines' ? 'ines' : 'user');
    el.innerHTML = '<span class="who"></span><p></p>';
    el.querySelector('.who').textContent = label;
    el.querySelector('p').textContent = text;
    scriptEl.appendChild(el); scriptEl.scrollTop = scriptEl.scrollHeight;
    while (scriptEl.children.length > 8) scriptEl.removeChild(scriptEl.firstChild);
  }

  /* ---- waves: reactive to mic while listening ---- */
  function wavesLoop() {
    if (bars.length) {
      if (state === 'listening' && analyser) {
        analyser.getByteFrequencyData(data);
        for (let i = 0; i < bars.length; i++) { const v = data[Math.min(data.length - 1, i * 3 + 4)] / 255; bars[i].style.height = (6 + v * 42) + 'px'; }
      } else if (state === 'speaking') {
        for (const b of bars) b.style.height = (8 + Math.random() * 34) + 'px';
      } else if (state === 'thinking') {
        const t = Date.now() / 200; for (let i = 0; i < bars.length; i++) bars[i].style.height = (8 + Math.abs(Math.sin(t + i * 0.4)) * 16) + 'px';
      } else { for (const b of bars) b.style.height = '6px'; }
    }
    rafId = requestAnimationFrame(wavesLoop);
  }

  /* ---- VAD: detect when the visitor finished speaking ---- */
  function startUtterance() {
    chunks = [];
    try { rec = new MediaRecorder(stream); } catch (e) { return; }
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = onUtteranceStop;
    rec.start(); uttStart = Date.now();
  }
  function vadTick() {
    if (state !== 'listening' || !analyser) return;
    analyser.getByteTimeDomainData(data);
    let sum = 0; for (let i = 0; i < data.length; i++) { const x = (data[i] - 128) / 128; sum += x * x; }
    const rms = Math.sqrt(sum / data.length); const now = Date.now();
    if (rms > SPEAK_THRESH) { if (!rec) startUtterance(); speaking = true; lastVoice = now; }
    if (speaking && rec) { if (now - uttStart > MAX_UTTER_MS || now - lastVoice > SILENCE_MS) { endUtterance(); return; } }
    setTimeout(vadTick, 60);
  }
  function endUtterance() {
    if (!rec || rec.state === 'inactive') return;
    const dur = Date.now() - uttStart; speaking = false;
    if (dur < MIN_UTTER_MS) { try { rec.stop(); } catch (e) {} rec = null; chunks = []; if (active) listen(); return; }
    try { rec.stop(); } catch (e) {}
  }
  function onUtteranceStop() {
    const type = (rec && rec.mimeType) || 'audio/webm';
    const blob = new Blob(chunks, { type }); rec = null;
    if (!blob.size) { if (active) listen(); return; }
    process(blob);
  }
  function listen() {
    if (!active) return;
    setState('listening'); setStatus('● a ouvir… fale agora'); speaking = false; rec = null; vadTick();
  }

  async function process(blob) {
    setState('thinking'); setStatus('… a pensar');
    try {
      const buf = await blob.arrayBuffer();
      const wavB64 = await toWav16kBase64(buf);
      const r = await fetch('/api/ines', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ audio: wavB64, mime: 'audio/wav', history }) });
      const j = await r.json();
      if (!r.ok || j.error) { setStatus('Ups — tente outra vez.'); if (active) listen(); return; }
      if (j.heard) { addLine('user', 'Você', j.heard); history.push({ role: 'user', text: j.heard }); }
      if (j.reply) { addLine('ines', 'Inês', j.reply); history.push({ role: 'ines', text: j.reply }); }
      if (j.lead && (j.lead.contact || j.lead.name) && !leadSent) {
        leadSent = true;
        fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: 'Inês (voz)', name: j.lead.name, contact: j.lead.contact, need: j.lead.need, transcript: history.slice() }) }).catch(() => {});
      }
      if (j.audio) await speak(j.audio);
      if (active) listen();
    } catch (e) { setStatus('Falha de ligação.'); if (active) listen(); }
  }
  function speak(b64) {
    return new Promise(async (resolve) => {
      setState('speaking'); setStatus('● a Inês está a falar');
      let done = false; const finish = () => { if (!done) { done = true; resolve(); } };
      // iOS-safe playback via Web Audio (AudioContext was unlocked on the tap; <audio>.play() is blocked off-gesture)
      try {
        if (ac && ac.state === 'suspended') await ac.resume();
        if (ac) {
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const audioBuf = await ac.decodeAudioData(bytes.buffer);
          const node = ac.createBufferSource();
          node.buffer = audioBuf; node.connect(ac.destination);
          node.onended = finish; node.start();
          return;
        }
      } catch (e) { /* fall through to <audio> */ }
      try {
        player = new Audio('data:audio/wav;base64,' + b64);
        player.onended = finish; player.onerror = finish;
        player.play().catch(finish);
      } catch (e) { finish(); }
    });
  }

  /* ---- decode recorded audio → mono 16k 16-bit WAV (base64) ---- */
  async function toWav16kBase64(arrayBuffer) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const audioBuf = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const inRate = audioBuf.sampleRate, ch = audioBuf.numberOfChannels, len = audioBuf.length;
    const mono = new Float32Array(len);
    for (let c = 0; c < ch; c++) { const d = audioBuf.getChannelData(c); for (let i = 0; i < len; i++) mono[i] += d[i] / ch; }
    try { ctx.close(); } catch (e) {}
    const outRate = 16000, ratio = inRate / outRate, outLen = Math.max(1, Math.floor(len / ratio));
    const pcm = new Int16Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const start = Math.floor(i * ratio), end = Math.min(len, Math.floor((i + 1) * ratio));
      let s = 0, n = 0; for (let k = start; k < end; k++) { s += mono[k]; n++; }
      let v = n ? s / n : 0; v = Math.max(-1, Math.min(1, v)); pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    const buffer = new ArrayBuffer(44 + pcm.length * 2), view = new DataView(buffer);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); view.setUint32(4, 36 + pcm.length * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, outRate, true); view.setUint32(28, outRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    ws(36, 'data'); view.setUint32(40, pcm.length * 2, true);
    let off = 44; for (let i = 0; i < pcm.length; i++, off += 2) view.setInt16(off, pcm[i], true);
    const bytes = new Uint8Array(buffer); let bin = ''; const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(bin);
  }

  async function startCall() {
    if (!supported) { setStatus('O teu navegador não suporta voz ao vivo — vê o exemplo escrito ↓'); return; }
    setStatus('… a pedir acesso ao microfone');
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { setStatus('Preciso do microfone para falar 🎙️ (autorize e tente de novo)'); return; }
    active = true; history.length = 0; leadSent = false; if (scriptEl) scriptEl.innerHTML = '';
    const Ctx = window.AudioContext || window.webkitAudioContext; ac = new Ctx();
    try { if (ac.state === 'suspended') await ac.resume(); } catch (e) {}
    const src = ac.createMediaStreamSource(stream); analyser = ac.createAnalyser(); analyser.fftSize = 2048;
    data = new Uint8Array(analyser.fftSize); src.connect(analyser);
    if (!rafId) wavesLoop();
    addLine('ines', 'Inês', 'Olá! Fala a Inês, da C&M Tecnologia. Em que posso ajudar?');
    history.push({ role: 'ines', text: 'Olá! Fala a Inês, da C&M Tecnologia. Em que posso ajudar?' });
    listen();
  }
  function endCall() {
    active = false; setState('idle'); setStatus('Chamada terminada · toca para falar de novo');
    try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) {} rec = null;
    try { if (player) player.pause(); } catch (e) {}
    try { stream && stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    try { ac && ac.close(); } catch (e) {} analyser = null;
  }

  window.inesLive = { toggle: () => (active ? endCall() : startCall()), supported, get active() { return active; } };
})();
