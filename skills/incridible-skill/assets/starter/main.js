/* incridible-skill starter: motion layer.
 * Order of safety: no libs or reduced motion -> static page. Any error -> static page.
 * Hidden start states exist in CSS only under html.motion, so a failure can never leave content invisible. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasLibs = !!(window.gsap && window.ScrollTrigger);

  let lenis = null;

  /* ---------- works with or without motion ---------- */
  function initMenu() {
    const btn = $('.nav__btn'), menu = $('#menu');
    if (!btn || !menu) return;
    const set = (open) => {
      menu.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      $('.nav__btn-text', btn).textContent = open ? 'Close' : 'Menu';
      if (open) { menu.removeAttribute('inert'); lenis && lenis.stop(); (menu.querySelector('a') || btn).focus({ preventScroll: true }); }
      else { menu.setAttribute('inert', ''); lenis && lenis.start(); btn.focus({ preventScroll: true }); }
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) set(false); });
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); const t = id.length > 1 && $(id);
      if (menu.classList.contains('is-open')) set(false);
      if (!t) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(t, { duration: 1.4 }) : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }));
  }

  function initPairsTap() {
    $$('.pair').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
      if (!finePointer) el.addEventListener('click', () => el.classList.toggle('is-on'));
    });
  }

  function showStatic() {
    window.__incridibleReady = true;
    root.classList.remove('motion');
    root.classList.add('no-motion');
    const l = $('.loader'); l && l.remove();
  }

  if (!hasLibs || reduce) { showStatic(); initMenu(); initPairsTap(); return; }

  /* ---------- motion layer ---------- */
  root.classList.add('motion');
  let done = false;
  const failsafe = setTimeout(() => { if (!done) { console.warn('motion init incomplete: showing static page'); showStatic(); } }, 7000);

  try { initMotion(); done = true; window.__incridibleReady = true; clearTimeout(failsafe); }
  catch (err) { console.warn('motion init failed, showing static page:', err); clearTimeout(failsafe); showStatic(); }

  function initMotion() {
    gsap.registerPlugin(ScrollTrigger);
    history.scrollRestoration = 'manual';
    scrollTo(0, 0);

    // Smooth scroll on fine pointers only; native momentum is better on touch.
    if (finePointer && window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    initMenu();
    initPairsTap();

    /* split text: wrap each visual line in a mask. Reverted after the reveal so resizes stay correct. */
    function splitLines(el) {
      const text = el.textContent.trim().replace(/\s+/g, ' ');
      const original = el.innerHTML;
      el.textContent = '';
      const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text; el.appendChild(sr);
      const holder = document.createElement('span'); holder.setAttribute('aria-hidden', 'true'); holder.style.display = 'block'; el.appendChild(holder);
      const words = text.split(' ').map((w) => { const s = document.createElement('span'); s.style.display = 'inline-block'; s.textContent = w; holder.appendChild(s); holder.appendChild(document.createTextNode(' ')); return s; });
      const lines = []; let top = null, cur = null;
      words.forEach((w) => { const t = w.offsetTop; if (top === null || Math.abs(t - top) > 3) { top = t; cur = []; lines.push(cur); } cur.push(w.textContent); });
      holder.textContent = '';
      const inners = lines.map((ws) => {
        const l = document.createElement('span'); l.className = 'line';
        const i = document.createElement('span'); i.className = 'line__inner'; i.textContent = ws.join(' ');
        l.appendChild(i); holder.appendChild(l); return i;
      });
      el.classList.add('is-split');
      return { inners, revert: () => { el.innerHTML = original; el.classList.add('is-split'); } };
    }

    const afterFonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const splits = [];
    afterFonts.then(() => {
      $$('[data-split]').forEach((el) => splits.push({ el, ...splitLines(el) }));
      ScrollTrigger.refresh();
    });

    /* ---------- loader and hero entrance ---------- */
    const loader = $('.loader'), count = $('.loader__count');
    const n = { v: 0 };
    const loaded = Promise.race([
      Promise.all([afterFonts, new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })))]),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
    const loaderDone = new Promise((res) => {
      gsap.timeline({ onComplete: res })
        .to(n, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(n.v); } })
        .to(loader, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, '+=0.1');
    });
    Promise.all([loaded, loaderDone]).then(() => { loader.remove(); heroIn(); });

    function heroIn() {
      const hero = splits.find((s) => s.el.closest('.hero'));
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      if (hero) tl.to(hero.inners, { yPercent: 0, duration: 1.3, stagger: 0.09 }, 0);
      tl.to('.hero__subject', { opacity: 1, duration: 1.4 }, 0.15)
        .from('.hero__subject', { yPercent: 8, scale: 1.04, duration: 1.6 }, 0.15)
        .to('.hero__meta', { opacity: 1, duration: 1 }, 0.7);
      ScrollTrigger.refresh();
    }

    /* ---------- hero scrub: depth between layers ---------- */
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__bg', { yPercent: 10, ease: 'none' }, 0)
      .to('.hero__title', { yPercent: -16, scale: 1.06, ease: 'none' }, 0)
      .to('.hero__subject', { yPercent: 6, ease: 'none' }, 0);

    /* ---------- scroll-triggered line reveals (revert after, so layout stays honest) ---------- */
    afterFonts.then(() => {
      splits.filter((s) => !s.el.closest('.hero')).forEach((s) => {
        gsap.to(s.inners, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09,
          scrollTrigger: { trigger: s.el, start: 'top 88%', once: true },
          onComplete: () => s.revert() });
      });
    });

    /* ---------- generic reveals ---------- */
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1 }),
    });

    /* ---------- word-by-word fill ---------- */
    $$('[data-fill]').forEach((el) => {
      const html = el.innerHTML;
      el.innerHTML = html.replace(/(<[^>]+>)|([^<\s]+)/g, (m, tag, word) => (tag ? tag : `<span class="w">${word}</span>`));
      const words = $$('.w', el);
      gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 48%', scrub: true } });
    });

    /* ---------- clip-path image reveals with inner parallax ---------- */
    $$('.media').forEach((m) => {
      gsap.to(m, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'expo.inOut',
        scrollTrigger: { trigger: m, start: 'top 85%', once: true } });
    });

    /* ---------- horizontal gallery (desktop) ---------- */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const track = $('.hscroll__track'), wrap = $('.hscroll');
      if (!track || !wrap) return;
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, { x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1 } });
    });

    /* ---------- colour chapters ---------- */
    $$('[data-bg]').forEach((sec) => {
      const go = () => gsap.to(document.body, { backgroundColor: sec.dataset.bg, color: sec.dataset.ink, duration: 0.7, ease: 'power2.out', overwrite: true });
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onEnter: go, onEnterBack: go });
    });

    /* ---------- count-up ---------- */
    $$('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count); const o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, { v: target, duration: 1.6, ease: 'power3.out', snap: { v: 1 }, onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString(); },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });

    /* ---------- progress bar ---------- */
    gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

    /* ---------- marquee, velocity-aware ---------- */
    $$('[data-marquee]').forEach((el) => {
      const inner = el.firstElementChild; let x = 0, dir = 1, visible = true;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el);
      if (lenis) lenis.on('scroll', ({ direction }) => { dir = direction || 1; });
      gsap.ticker.add((t, dt) => {
        if (!visible) return;
        const boost = lenis ? Math.min(Math.abs(lenis.velocity || 0), 20) * 0.15 : 0;
        x -= dir * (dt / 16.67) * 1.1 * (1 + boost);
        const w = inner.scrollWidth / 2;
        if (x <= -w) x += w; if (x > 0) x -= w;
        gsap.set(inner, { x });
      });
    });

    /* ---------- pointer-only: magnetic buttons and custom cursor ---------- */
    if (finePointer) {
      $$('[data-magnetic]').forEach((el) => {
        const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
        const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - (r.left + r.width / 2)) * 0.35); qy((e.clientY - (r.top + r.height / 2)) * 0.35); });
        el.addEventListener('pointerleave', () => { qx(0); qy(0); });
      });
      const cur = $('.cursor'), label = $('.cursor__label');
      if (cur) {
        const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3.out' });
        const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3.out' });
        addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
        $$('[data-cursor]').forEach((el) => {
          el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; gsap.to(cur, { scale: 6, duration: 0.4, ease: 'power3.out' }); gsap.to(label, { opacity: 1, scale: 0.9, duration: 0.3 }); });
          el.addEventListener('pointerleave', () => { gsap.to(cur, { scale: 1, duration: 0.4, ease: 'power3.out' }); gsap.to(label, { opacity: 0, duration: 0.2 }); });
        });
      }
    }

    /* ---------- refresh when layout can still change ---------- */
    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
