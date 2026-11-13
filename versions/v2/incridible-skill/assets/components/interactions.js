/* interactions.js: the small pointer and scroll touches that make a page feel made.
 *   [data-cursor="View"]      custom cursor grows and shows a label over this element
 *   [data-magnetic]           element leans toward the pointer (data-magnetic="0.4" for strength)
 *   [data-tilt]               3D tilt with a moving glare (data-tilt="10" max degrees)
 *   [data-reveal]             enters when scrolled into view, in batches (data-reveal="up|fade|scale")
 *   [data-inner-parallax]     the image drifts inside its frame (data-inner-parallax="8" = percent)
 *   [data-speed="0.85"]       parallax: below 1 lags behind the scroll, above 1 runs ahead
 *   [data-marquee]            endless row that speeds up and flips with scroll direction; first child is the
 *                             row, its content must be duplicated once (second copy aria-hidden)
 *   [data-count="48"]         number counts up on enter (data-decimals, data-suffix)
 *   <details data-accordion>  smooth open and close, native semantics kept
 *   .progress-bar > i         page scroll progress
 * Pointer effects are fine-pointer only; everything is off under reduced motion except the accordion,
 * which then opens instantly. */
import { $, $$, canAnimate, finePointer, reduceMotion, usePlugins, onEnter, visibilityGate, scrollVelocity } from './core.js';

export function initCursor(root = document) {
  if (!finePointer() || !canAnimate()) return () => {};
  let cur = $('.cursor');
  if (!cur) { cur = document.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = '<span class="cursor__label"></span>'; document.body.appendChild(cur); }
  document.documentElement.classList.add('has-cursor');
  const label = $('.cursor__label', cur);
  const x = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3.out' });
  const move = (e) => { x(e.clientX); y(e.clientY); };
  addEventListener('pointermove', move, { passive: true });
  const over = (e) => {
    const t = e.target.closest('[data-cursor], a, button, input, textarea, select, [contenteditable]');
    if (!t) { gsap.to(cur, { scale: 1, duration: 0.35 }); gsap.to(label, { opacity: 0, duration: 0.2 }); cur.dataset.state = ''; return; }
    if (t.matches('input, textarea, select, [contenteditable]')) { gsap.to(cur, { scale: 0, duration: 0.25 }); cur.dataset.state = 'text'; return; }
    const text = t.dataset.cursor;
    cur.dataset.state = text ? 'label' : 'link';
    label.textContent = text || '';
    gsap.to(cur, { scale: text ? 6 : 2.4, duration: 0.4, ease: 'power3.out' });
    gsap.to(label, { opacity: text ? 1 : 0, duration: 0.25 });
  };
  document.addEventListener('pointerover', over);
  const down = () => gsap.to(cur, { scale: '-=0.6', duration: 0.15 });
  const up = (e) => over(e);
  addEventListener('pointerdown', down); addEventListener('pointerup', up);
  return () => { removeEventListener('pointermove', move); document.removeEventListener('pointerover', over); removeEventListener('pointerdown', down); removeEventListener('pointerup', up); document.documentElement.classList.remove('has-cursor'); };
}

export function initMagnetic(root = document) {
  if (!finePointer() || !canAnimate()) return () => {};
  const offs = $$('[data-magnetic]', root).map((el) => {
    const k = parseFloat(el.dataset.magnetic) || 0.35;
    const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const mv = (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * k); qy((e.clientY - r.top - r.height / 2) * k); };
    const lv = () => { qx(0); qy(0); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv);
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); gsap.set(el, { clearProps: 'transform' }); };
  });
  return () => offs.forEach((f) => f());
}

export function initTilt(root = document) {
  if (!finePointer() || !canAnimate()) return () => {};
  const offs = $$('[data-tilt]', root).map((el) => {
    const max = parseFloat(el.dataset.tilt) || 10;
    gsap.set(el, { transformPerspective: 900, transformStyle: 'preserve-3d' });
    let glare = $('.tilt__glare', el);
    if (!glare) { glare = document.createElement('span'); glare.className = 'tilt__glare'; glare.setAttribute('aria-hidden', 'true'); el.appendChild(glare); }
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const mv = (e) => {
      const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 2 * max); rx(-(py - 0.5) * 2 * max);
      el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%'); el.style.setProperty('--glare', '1');
    };
    const lv = () => { rx(0); ry(0); el.style.setProperty('--glare', '0'); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv);
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); };
  });
  return () => offs.forEach((f) => f());
}

export function initReveal(root = document) {
  const els = $$('[data-reveal]', root);
  if (!els.length || !canAnimate('ScrollTrigger')) return () => {};
  usePlugins('ScrollTrigger');
  const from = { up: { y: 48 }, fade: {}, scale: { scale: 0.92 } };
  els.forEach((el) => gsap.set(el, { opacity: 0, ...(from[el.dataset.reveal] || from.up) }));
  const triggers = ScrollTrigger.batch(els, {
    start: 'top 90%', once: true,
    onEnter: (batch) => {
      // mark first: clearing the inline opacity would otherwise let the CSS start state hide it again
      batch.forEach((el) => el.classList.add('is-revealed'));
      gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true,
        clearProps: 'opacity,transform' });   // hand the element back clean, so Flip, tilt or hover can transform it later
    },
  });
  return () => { triggers.forEach((t) => t.kill()); els.forEach((el) => el.classList.add('is-revealed')); gsap.set(els, { clearProps: 'opacity,transform' }); };
}

export function initInnerParallax(root = document) {
  const figs = $$('[data-inner-parallax]', root);
  if (!figs.length || !canAnimate('ScrollTrigger')) return () => {};
  usePlugins('ScrollTrigger');
  const tws = figs.map((fig) => {
    const img = $('img, video, picture', fig); if (!img) return null;
    const amt = parseFloat(fig.dataset.innerParallax) || 8;
    fig.classList.add('has-inner-parallax');
    return gsap.fromTo(img, { yPercent: -amt }, { yPercent: amt, ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  }).filter(Boolean);
  return () => tws.forEach((t) => { t.scrollTrigger.kill(); t.revert(); });
}

export function initParallax(root = document) {
  const els = $$('[data-speed]', root);
  if (!els.length || !canAnimate('ScrollTrigger')) return () => {};
  usePlugins('ScrollTrigger');
  const tws = els.map((el) => {
    const k = 1 - (parseFloat(el.dataset.speed) || 1);
    return gsap.fromTo(el, { y: () => -k * innerHeight * 0.5 }, { y: () => k * innerHeight * 0.5, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
  return () => tws.forEach((t) => { t.scrollTrigger.kill(); t.revert(); });
}

export function initMarquee(root = document) {
  const els = $$('[data-marquee]', root);
  if (!els.length || !canAnimate()) return () => {};
  const offs = els.map((el) => {
    const row = el.firstElementChild; let x = 0, dir = 1, on = true;
    const base = parseFloat(el.dataset.marquee) || 1;
    const gate = visibilityGate(el, (v) => (on = v));
    let lastY = scrollY;
    const fn = (t, dt) => {
      if (!on) return;
      const v = scrollVelocity(); if (Math.abs(v) > 0.5) dir = Math.sign(v);
      if (!window.lenis) { const d = scrollY - lastY; if (d) dir = Math.sign(d); lastY = scrollY; }
      x -= dir * base * (dt / 16.67) * (1 + Math.min(Math.abs(v), 30) * 0.12);
      const w = row.scrollWidth / 2;
      if (x <= -w) x += w; if (x > 0) x -= w;
      gsap.set(row, { x });
    };
    gsap.ticker.add(fn);
    return () => { gsap.ticker.remove(fn); gate(); gsap.set(row, { clearProps: 'transform' }); };
  });
  return () => offs.forEach((f) => f());
}

export function initCounters(root = document) {
  const els = $$('[data-count]', root);
  if (!els.length || !canAnimate()) return () => {};
  const offs = els.map((el) => {
    const target = parseFloat(el.dataset.count); const dec = parseInt(el.dataset.decimals || '0', 10); const suf = el.dataset.suffix || '';
    const fmt = (v) => v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
    el.textContent = fmt(0);
    return onEnter(el, () => { const o = { v: 0 }; gsap.to(o, { v: target, duration: 1.6, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) }); });
  });
  return () => offs.forEach((f) => f());
}

export function initAccordions(root = document) {
  const items = $$('details[data-accordion]', root);
  if (!items.length || !window.gsap) return () => {};
  const offs = items.map((d) => {
    const summary = $('summary', d); const body = $(':scope > :not(summary)', d);
    if (!summary || !body) return () => {};
    const click = (e) => {
      if (reduceMotion()) return;              // native toggle
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, opacity: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'all' }); window.ScrollTrigger && ScrollTrigger.refresh(); } });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.55, ease: 'power3.out', onComplete: () => { gsap.set(body, { clearProps: 'all' }); window.ScrollTrigger && ScrollTrigger.refresh(); } });
      }
    };
    summary.addEventListener('click', click);
    return () => summary.removeEventListener('click', click);
  });
  return () => offs.forEach((f) => f());
}

export function initProgress() {
  const bar = $('.progress-bar i');
  if (!bar || !canAnimate('ScrollTrigger')) return () => {};
  usePlugins('ScrollTrigger');
  const tw = gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });
  return () => { tw.scrollTrigger.kill(); tw.kill(); };
}
