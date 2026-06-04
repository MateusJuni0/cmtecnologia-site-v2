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
  const frames = Array.from(document.querySelectorAll('.bg .frame'));
  const setActive = (i) => frames.forEach((f, idx) => f.classList.toggle('active', idx === i));
  setActive(0);

  const sections = Array.from(document.querySelectorAll('section.scene'));
  sections.forEach((sec, i) => {
    const idx = parseInt(sec.dataset.scene || i, 10);
    const items = sec.querySelectorAll('.reveal');
    if (hasGSAP) {
      ScrollTrigger.create({
        trigger: sec, start: 'top center', end: 'bottom center',
        onToggle: (self) => { if (self.isActive) setActive(idx); },
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

  /* ---------- works thumbs ---------- */
  const thumbs = document.getElementById('thumbs');
  if (thumbs) {
    [
      { img: 'scenes/cronos-fullpage.jpg', label: 'Cronos', modal: 'cronos' },
      { img: 'scenes/painel-fullpage.jpg', label: 'Painel', modal: 'painel' },
    ].forEach((it) => {
      const d = document.createElement('div');
      d.className = 'thumb'; d.dataset.modal = it.modal;
      d.innerHTML = `<img src="${it.img}" alt="${it.label}" loading="lazy" onerror="this.parentElement.style.display='none'"/><span>${it.label}</span>`;
      thumbs.appendChild(d);
    });
  }

  /* ---------- Madalena · WhatsApp chat ---------- */
  const waBody = document.getElementById('wa-body');
  const waSeq = [
    { t: 'in', m: 'Olá! 👋 Bem-vinda à Clínica Sorriso. Sou a Madalena, a assistente.' },
    { t: 'in', m: 'Em que posso ajudar hoje?' },
    { t: 'out', m: 'Queria saber o preço de um implante.' },
    { t: 'in', m: 'Claro! Um implante unitário fica a partir de 890€, já com TAC e consulta incluídas. 😊' },
    { t: 'in', m: 'Quer que marque uma avaliação gratuita esta semana?' },
    { t: 'out', m: 'Pode ser quinta de manhã?' },
    { t: 'in', m: 'Quinta às 10h00 está livre. Fica reservado em seu nome? ✅' },
    { t: 'out', m: 'Sim, obrigada!' },
    { t: 'in', m: 'Marcado! Envio a confirmação por SMS. Até quinta. 💜' },
  ];
  function playWa() {
    if (!waBody) return;
    waBody.innerHTML = '';
    let i = 0;
    const max = 6;
    const trim = () => { while (waBody.children.length > max) waBody.removeChild(waBody.firstChild); };
    const addBub = (item) => {
      const b = document.createElement('div');
      b.className = 'bub ' + item.t;
      b.innerHTML = item.m + '<small>' + (item.t === 'out' ? '✓✓' : '') + '</small>';
      waBody.appendChild(b); trim();
    };
    const step = () => {
      if (i >= waSeq.length) return;
      const item = waSeq[i];
      if (item.t === 'in') {
        const typ = document.createElement('div');
        typ.className = 'typing'; typ.innerHTML = '<i></i><i></i><i></i>';
        waBody.appendChild(typ); trim();
        setTimeout(() => { typ.remove(); addBub(item); i++; setTimeout(step, 540); }, 950);
      } else {
        addBub(item); i++; setTimeout(step, 1100);
      }
    };
    setTimeout(step, 500);
  }
  observeOnce('#madalena', playWa);

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
  if (voiceBtn) voiceBtn.addEventListener('click', () => { voiceOn ? stopVoice() : startVoice(); });

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
    cronos: { title: 'cronosgame.com.br', type: 'shot', src: 'scenes/cronos-fullpage.jpg', visit: 'https://cronosgame.com.br', hint: 'A percorrer a loja Cronos…' },
    painel: { title: 'painel.cmtecnologia.pt', type: 'shot', src: 'scenes/painel-fullpage.jpg', visit: 'https://painel.cmtecnologia.pt/demo', hint: 'A percorrer o painel boutique…' },
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
    if (cfg.type === 'shot') {
      modalIframe.hidden = true; modalIframe.src = '';
      modalShot.style.display = 'block';
      modalShot.onload = autoScroll;
      modalShot.onerror = () => { modalHint.textContent = 'Pré-visualização indisponível — abra o site ↗'; };
      modalShot.src = cfg.src;
      modalReplay.style.display = '';
    } else {
      modalShot.style.display = 'none'; modalShot.src = '';
      modalIframe.hidden = false; modalIframe.src = cfg.src;
      modalReplay.style.display = 'none';
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
