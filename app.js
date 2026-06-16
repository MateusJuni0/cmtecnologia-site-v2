/* =========================================================
   C&M Tecnologia v2 — interactions
   Lenis + GSAP · scene crossfade · demos · premium modal
   ========================================================= */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', () => ScrollTrigger.update());
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---------- progress + nav ---------- */
  const progress = document.getElementById('progress');
  const nav = document.getElementById('nav');
  function onScroll() {
    const el = document.documentElement;
    const y = window.scrollY || el.scrollTop;
    const max = el.scrollHeight - el.clientHeight;
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', y > 40);
  }
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- background crossfade + reveals ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  const navActive = (id) => navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));

  // mobile menu (hamburger) toggle
  const navToggle = document.getElementById('navToggle');
  if (navToggle && nav) {
    const closeMenu = () => { nav.classList.remove('menu-open'); navToggle.setAttribute('aria-expanded', 'false'); };
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.forEach((a) => a.addEventListener('click', closeMenu));
  }

  // ---- background video: desktop = scroll-scrubbed (#bgvideo) / mobile = native autoplay loop (#bgvideo-m) ----
  const bgvideo = document.getElementById('bgvideo');
  const bgmobile = document.getElementById('bgvideo-m');
  const mobileLayout = window.matchMedia('(max-width: 768px)').matches;

  // Mobile clip plays purely via the HTML `autoplay` attribute — no load()/source swap, which
  // was the exact JS step that left it frozen on Android. Just a light safety nudge here.
  if (bgmobile) {
    if (mobileLayout) {
      bgmobile.muted = true; bgmobile.playsInline = true;
      const kick = () => { const p = bgmobile.play(); if (p && typeof p.catch === 'function') p.catch(() => {}); };
      bgmobile.addEventListener('canplay', kick);
      bgmobile.addEventListener('loadeddata', kick);
      ['touchstart', 'pointerdown', 'scroll'].forEach((ev) => window.addEventListener(ev, kick, { once: true, passive: true }));
      kick();
    } else {
      bgmobile.removeAttribute('autoplay'); bgmobile.preload = 'none'; bgmobile.pause();
    }
  }

  // Desktop clip is scroll-scrubbed (hidden on mobile, so skip it there to save data).
  if (bgvideo && !mobileLayout && !reduced) {
    bgvideo.muted = true; bgvideo.loop = false; bgvideo.preload = 'auto'; bgvideo.pause();
    bgvideo.load();
    let target = 0, cur = 0;
    const onScrub = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, (window.scrollY || 0) / max)) : 0;
    };
    if (lenis) lenis.on('scroll', onScrub);
    window.addEventListener('scroll', onScrub, { passive: true });
    onScrub();
    const tick = () => {
      cur += (target - cur) * 0.085;
      const dur = bgvideo.duration;
      if (dur && isFinite(dur)) { try { bgvideo.currentTime = cur * (dur - 0.06); } catch (e) {} }
      requestAnimationFrame(tick);
    };
    if (bgvideo.readyState >= 1) requestAnimationFrame(tick);
    else bgvideo.addEventListener('loadedmetadata', () => requestAnimationFrame(tick), { once: true });
  } else if (bgvideo) {
    bgvideo.preload = 'none'; bgvideo.pause();
  }

  const sections = Array.from(document.querySelectorAll('section.scene'));
  sections.forEach((sec, i) => {
    const idx = parseInt(sec.dataset.scene || i, 10);
    const items = sec.querySelectorAll('.reveal');
    if (hasGSAP) {
      ScrollTrigger.create({
        trigger: sec, start: 'top center', end: 'bottom center',
        onToggle: (self) => { if (self.isActive) navActive(sec.id); },
      });
      if (reduced) gsap.set(items, { opacity: 1, y: 0 });
      else gsap.fromTo(items, { y: 42, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: sec, start: 'top 74%' } });
    } else {
      items.forEach((e) => { e.style.opacity = 1; });
    }
  });

  /* ---------- magnetic + tilt ---------- */
  if (!isTouch && !reduced) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.32}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1000px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- depth parallax (premium) ---------- */
  if (!isTouch && !reduced) {
    const bgEl = document.getElementById('bg');
    let tmx = 0, tmy = 0, cmx = 0, cmy = 0;
    window.addEventListener('mousemove', (e) => { tmx = e.clientX / window.innerWidth - 0.5; tmy = e.clientY / window.innerHeight - 0.5; });
    const ploop = () => {
      cmx += (tmx - cmx) * 0.06; cmy += (tmy - cmy) * 0.06;
      if (bgEl) bgEl.style.transform = `translate(${cmx * -22}px, ${cmy * -15}px) scale(1.07)`;
      requestAnimationFrame(ploop);
    };
    ploop();
    if (hasGSAP) {
      gsap.to('#hero .wrap', { yPercent: 20, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  /* ---------- lazy painel iframe ---------- */
  const lazyFrame = document.querySelector('.lazy-frame');
  if (lazyFrame) {
    const load = () => {
      if (lazyFrame.src) return;
      lazyFrame.src = lazyFrame.dataset.src;
      lazyFrame.addEventListener('load', () => {
        lazyFrame.classList.add('ready');
        const l = lazyFrame.parentElement.querySelector('.frame-loading');
        if (l) l.classList.add('hide');
      });
    };
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => { if (en.isIntersecting) { load(); io.disconnect(); } });
    }, { rootMargin: '400px' });
    io.observe(lazyFrame);
  }

  /* ---------- works gallery ---------- */
  const works = document.getElementById('works');
  if (works) {
    [
      { img: 'scenes/cronos-fullpage.jpg', name: 'Cronos', kind: 'E-commerce de jogos · loja premium', domain: 'cronosgame.com.br', modal: 'cronos' },
      { img: 'scenes/templates-fullpage.jpg', name: 'CM Templates Pro', kind: 'Biblioteca SaaS · 7.559 designs', domain: 'templates.cmtecnologia.pt', modal: 'templates' },
      { img: 'scenes/painel-fullpage.jpg', name: 'Painel Boutique', kind: 'Dashboard em tempo real', domain: 'painel.cmtecnologia.pt', modal: 'painel' },
    ].forEach((it) => {
      const c = document.createElement('button');
      c.className = 'work'; c.dataset.modal = it.modal;
      c.innerHTML = `<span class="work-shot"><img src="${it.img}" alt="${it.name}" loading="lazy" onerror="this.closest('.work').classList.add('noimg')"/><em class="work-go">Espreitar ↗</em></span>` +
        `<span class="work-meta"><b>${it.name}</b><small>${it.kind}</small><i>${it.domain}</i></span>`;
      works.appendChild(c);
    });
  }

  /* ---------- Instagram auto-feed (posts REAIS de @cm.tecnologia) ---------- */
  const igGrid = document.getElementById('igGrid');
  if (igGrid) {
    for (let i = 1; i <= 9; i++) {
      const d = document.createElement('div');
      d.className = 'ig-tile';
      d.innerHTML = `<img src="scenes/ig-${i}.jpg" alt="Publicação de @cm.tecnologia" loading="lazy" onerror="this.closest('.ig-tile').classList.add('noimg')"/><i class="ig-dots"></i>`;
      igGrid.appendChild(d);
    }
  }

  /* ---------- Madalena · WhatsApp chat ---------- */
  const waBody = document.getElementById('wa-body');
  const waForm = document.getElementById('waForm');
  const waText = document.getElementById('waText');
  const waBtn = waForm ? waForm.querySelector('button') : null;
  const waHistory = [];
  let waLeadSent = false, waStarted = false, waBusy = false;

  function waAdd(role, text) {
    if (!waBody) return;
    const b = document.createElement('div');
    b.className = 'bub ' + (role === 'out' ? 'out' : 'in');
    b.textContent = text;
    if (role === 'out') { const s = document.createElement('small'); s.textContent = '✓✓'; b.appendChild(s); }
    waBody.appendChild(b); waBody.scrollTop = waBody.scrollHeight;
  }
  function waTyping() {
    const typ = document.createElement('div');
    typ.className = 'typing'; typ.innerHTML = '<i></i><i></i><i></i>';
    waBody.appendChild(typ); waBody.scrollTop = waBody.scrollHeight;
    return typ;
  }
  async function waSend(text) {
    text = (text || '').trim();
    if (!text || waBusy) return;
    waBusy = true; if (waBtn) waBtn.disabled = true;
    waAdd('out', text); waHistory.push({ role: 'user', text });
    const typ = waTyping();
    try {
      const r = await fetch('/api/madalena', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text, history: waHistory.slice(-10) }) });
      const j = await r.json();
      typ.remove();
      const reply = (j && j.reply) || 'Peço desculpa, pode escrever de novo?';
      waAdd('in', reply); waHistory.push({ role: 'madalena', text: reply });
      if (j && j.lead && (j.lead.contact || j.lead.name) && !waLeadSent) {
        waLeadSent = true;
        fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: 'Madalena (WhatsApp)', name: j.lead.name, contact: j.lead.contact, need: j.lead.need, transcript: waHistory.slice() }) }).catch(() => {});
      }
    } catch (e) { typ.remove(); waAdd('in', 'Estou com um problema de ligação — tente outra vez daqui a pouco. 🙏'); }
    waBusy = false; if (waBtn) waBtn.disabled = false;
  }
  function waStart() {
    if (waStarted || !waBody) return; waStarted = true;
    setTimeout(() => waAdd('in', 'Olá! 👋 Sou a Madalena, da C&M Tecnologia.'), 450);
    setTimeout(() => {
      waAdd('in', 'Conte-me do seu negócio — o que mais o atrapalha no dia a dia?');
      waHistory.push({ role: 'madalena', text: 'Olá! Sou a Madalena, da C&M Tecnologia. Conte-me do seu negócio — o que mais o atrapalha no dia a dia?' });
    }, 1400);
  }
  if (waForm) waForm.addEventListener('submit', (e) => { e.preventDefault(); const t = waText.value; waText.value = ''; waSend(t); });
  observeOnce('#madalena', waStart);

  /* ---------- cookie notice (GDPR) ---------- */
  // Loads Vercel's anonymous, cookieless analytics — but never if the visitor declined.
  let analyticsLoaded = false;
  const loadAnalytics = () => {
    if (analyticsLoaded) return;
    analyticsLoaded = true;
    ['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js'].forEach((src) => {
      const s = document.createElement('script');
      s.defer = true; s.src = src;
      document.head.appendChild(s);
    });
  };
  const cookieBar = document.getElementById('cookieBar');
  let choice = null;
  try { choice = localStorage.getItem('cmtec-cookie'); } catch (e) {}
  // Honour a previous decision; only load stats when not explicitly declined.
  if (choice !== 'decline') loadAnalytics();
  if (cookieBar) {
    if (!choice) cookieBar.hidden = false;
    const closeCookie = (v) => { try { localStorage.setItem('cmtec-cookie', v); } catch (e) {} cookieBar.hidden = true; };
    const ca = document.getElementById('cookieAccept'), cd = document.getElementById('cookieDecline');
    if (ca) ca.addEventListener('click', () => { closeCookie('accept'); loadAnalytics(); });
    if (cd) cd.addEventListener('click', () => closeCookie('decline'));
  }

  /* ---------- Voice · Inês ---------- */
  const voiceBtn = document.getElementById('voiceBtn');
  const wavesEl = document.getElementById('waves');
  const voiceStatus = document.getElementById('voiceStatus');
  const voiceScript = document.getElementById('voiceScript');
  const inesSeq = [
    { who: 'ines', label: 'Inês', m: 'Clínica Sorriso, boa tarde. Fala a Inês — em que posso ajudar?' },
    { who: 'user', label: 'Cliente', m: 'Queria remarcar a minha consulta de amanhã.' },
    { who: 'ines', label: 'Inês', m: 'Com certeza. Tenho sexta às 15h ou sábado às 10h. Qual prefere?' },
    { who: 'user', label: 'Cliente', m: 'Sexta às 15h.' },
    { who: 'ines', label: 'Inês', m: 'Remarcado para sexta às 15h. Envio a confirmação por SMS. Mais alguma coisa?' },
    { who: 'user', label: 'Cliente', m: 'Não, obrigado.' },
    { who: 'ines', label: 'Inês', m: 'De nada! Boa tarde. 💜' },
  ];
  let bars = [];
  if (wavesEl) { for (let i = 0; i < 24; i++) { const b = document.createElement('i'); wavesEl.appendChild(b); bars.push(b); } }
  let voiceOn = false, waveTimer = null, scriptTimers = [];
  function setWaves(active) {
    if (waveTimer) { clearInterval(waveTimer); waveTimer = null; }
    if (active && !reduced) {
      waveTimer = setInterval(() => { bars.forEach((b) => { b.style.height = (8 + Math.random() * 38) + 'px'; }); }, 110);
    } else { bars.forEach((b) => { b.style.height = '8px'; }); }
  }
  function stopVoice() {
    voiceOn = false; setWaves(false);
    scriptTimers.forEach(clearTimeout); scriptTimers = [];
    if (voiceBtn) voiceBtn.classList.remove('live');
    if (voiceStatus) voiceStatus.textContent = 'Toca para simular uma chamada';
  }
  function startVoice() {
    voiceOn = true; if (voiceScript) voiceScript.innerHTML = '';
    if (voiceBtn) voiceBtn.classList.add('live');
    if (voiceStatus) voiceStatus.textContent = '● em chamada com a Inês…';
    setWaves(true);
    let t = 400;
    inesSeq.forEach((line) => {
      scriptTimers.push(setTimeout(() => {
        if (!voiceOn) return;
        const el = document.createElement('div');
        el.className = 'vline ' + line.who;
        el.innerHTML = `<span class="who">${line.label}</span><p>${line.m}</p>`;
        if (voiceScript) { voiceScript.appendChild(el); voiceScript.scrollTop = voiceScript.scrollHeight; }
      }, t));
      t += 1900 + line.m.length * 22;
    });
    scriptTimers.push(setTimeout(() => { if (voiceOn) { setWaves(false); if (voiceStatus) voiceStatus.textContent = 'Chamada terminada · marcação feita ✅'; if (voiceBtn) voiceBtn.classList.remove('live'); voiceOn = false; } }, t + 300));
  }
  const voiceDemo = document.getElementById('voiceDemo');
  if (voiceDemo) voiceDemo.addEventListener('click', (e) => { e.preventDefault(); voiceOn ? stopVoice() : startVoice(); });
  if (voiceBtn) voiceBtn.addEventListener('click', () => {
    // real live call when supported; fall back to the scripted demo otherwise
    if (window.inesLive && window.inesLive.supported) window.inesLive.toggle();
    else { voiceOn ? stopVoice() : startVoice(); }
  });

  /* ---------- CTA orbit ---------- */
  const orbit = document.getElementById('orbit');
  if (orbit && !reduced) {
    const icons = ['💬', '📅', '📊', '⚙️', '📱', '🎯'];
    const rings = [340, 470];
    rings.forEach((d) => { const r = document.createElement('div'); r.className = 'ring'; r.style.width = d + 'px'; r.style.height = d * 0.66 + 'px'; orbit.appendChild(r); });
    const els = icons.map((ic) => { const e = document.createElement('div'); e.className = 'ic'; e.textContent = ic; e.style.left = '62%'; e.style.top = '50%'; e.style.marginLeft = '-26px'; e.style.marginTop = '-26px'; orbit.appendChild(e); return e; });
    let ang = 0;
    const R = 210;
    const tick = () => { ang += 0.0022; els.forEach((e, i) => { const a = ang + (i / els.length) * Math.PI * 2; e.style.transform = `translate(${Math.cos(a) * R}px, ${Math.sin(a) * R * 0.62}px)`; }); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  /* ---------- Premium showcase modal ---------- */
  const MODALS = {
    cronos: { title: 'cronosgame.com.br', type: 'shot', src: 'scenes/cronos-fullpage.jpg', visit: 'https://cronosgame.com.br', hint: 'Loja com pagamentos — toca em ↗ para abrir a loja ao vivo' },
    templates: { title: 'templates.cmtecnologia.pt', type: 'live', src: 'https://templates.cmtecnologia.pt', visit: 'https://templates.cmtecnologia.pt', hint: 'Site real ao vivo — percorre e clica à vontade', wide: true },
    painel: { title: 'painel.cmtecnologia.pt · demo', type: 'shot', src: 'scenes/painel-fullpage.jpg', visit: 'https://painel.cmtecnologia.pt/demo', hint: 'Dashboard real com dados de exemplo — percorre' },
  };
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalShot = document.getElementById('modalShot');
  const modalIframe = document.getElementById('modalIframe');
  const modalVisit = document.getElementById('modalVisit');
  const modalReplay = document.getElementById('modalReplay');
  const modalHint = document.getElementById('modalHint');
  const modalViewport = document.getElementById('modalViewport');
  let scrollTween = null;

  function autoScroll() {
    if (!modalShot || !modalViewport) return;
    if (scrollTween && scrollTween.kill) scrollTween.kill();
    const dist = modalShot.offsetHeight - modalViewport.offsetHeight;
    if (dist <= 10) return;
    if (hasGSAP && !reduced) {
      gsap.set(modalShot, { y: 0 });
      scrollTween = gsap.to(modalShot, { y: -dist, duration: Math.min(16, dist / 80), ease: 'none', delay: 0.7,
        onComplete: () => { gsap.to(modalShot, { y: 0, duration: 2.2, ease: 'power1.inOut', delay: 0.8 }); } });
    } else {
      modalShot.style.transition = 'transform 12s linear'; modalShot.style.transform = 'translateY(-' + dist + 'px)';
    }
  }
  function openModal(key) {
    const cfg = MODALS[key]; if (!cfg || !modal) return;
    modalTitle.textContent = cfg.title;
    modalVisit.href = cfg.visit;
    modalHint.textContent = cfg.hint;
    const card = modal.querySelector('.modal-card');
    if (card) card.classList.toggle('wide', !!cfg.wide);
    if (cfg.type === 'shot') {
      modalIframe.hidden = true; modalIframe.src = '';
      modalShot.style.display = 'block';
      modalShot.onerror = () => { modalHint.textContent = 'Pré-visualização indisponível — abra o site ↗'; };
      // measure AFTER the open transition + layout settle, else offsetHeight is stale (dist≈0)
      const begin = () => setTimeout(() => requestAnimationFrame(autoScroll), 560);
      modalShot.onload = begin;
      modalShot.src = cfg.src;
      if (modalShot.complete && modalShot.naturalHeight) begin();
      modalReplay.style.display = '';
    } else {
      modalShot.style.display = 'none'; modalShot.src = '';
      modalReplay.style.display = 'none';
      modalIframe.hidden = false;
      if (modalViewport) modalViewport.classList.add('loading');
      modalIframe.onload = () => { if (modalViewport) modalViewport.classList.remove('loading'); };
      modalIframe.src = cfg.src;
    }
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop(); document.documentElement.classList.add('lenis-stopped');
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    if (scrollTween && scrollTween.kill) scrollTween.kill();
    setTimeout(() => { modalIframe.src = ''; modalShot.src = ''; }, 350);
    if (lenis) lenis.start(); document.documentElement.classList.remove('lenis-stopped');
  }
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-modal]');
    if (opener) { e.preventDefault(); openModal(opener.dataset.modal); return; }
    if (e.target.closest('[data-close]')) { closeModal(); }
  });
  if (modalReplay) modalReplay.addEventListener('click', autoScroll);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- helpers ---------- */
  function observeOnce(sel, cb) {
    const el = document.querySelector(sel); if (!el) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => { if (en.isIntersecting) { cb(); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(el);
  }

  /* ---------- background music (user gesture; browsers block audio autoplay) ---------- */
  const music = document.getElementById('music');
  const soundBtn = document.getElementById('soundBtn');
  if (music && soundBtn) {
    let musicOn = false; music.volume = 0;
    const fade = (to) => { const s = () => { music.volume += (to - music.volume) * 0.08; if (Math.abs(to - music.volume) > 0.01) requestAnimationFrame(s); else music.volume = to; }; s(); };
    soundBtn.addEventListener('click', () => {
      musicOn = !musicOn; soundBtn.classList.toggle('on', musicOn);
      if (musicOn) { music.play().then(() => fade(0.3)).catch(() => {}); } else { fade(0); setTimeout(() => music.pause(), 700); }
    });
  }

  /* ---------- lead form → compõe WhatsApp ---------- */
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(leadForm);
      const nome = (fd.get('nome') || '').toString().trim();
      const contacto = (fd.get('contacto') || '').toString().trim();
      const msg = (fd.get('msg') || '').toString().trim();
      const text = `Olá! Sou ${nome || '(sem nome)'}. Contacto: ${contacto || '—'}.\n${msg || 'Quero saber mais sobre automação com IA.'}`;
      const note = document.getElementById('formNote');
      if (note) note.textContent = 'A abrir o WhatsApp com o seu pedido…';
      window.open('https://wa.me/351964977047?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  /* ---------- anchor smooth-scroll via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) { e.preventDefault(); lenis ? lenis.scrollTo(target, { offset: 0 }) : target.scrollIntoView({ behavior: 'smooth' }); }
      }
    });
  });
})();
