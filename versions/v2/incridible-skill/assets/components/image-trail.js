/* image-trail.js: images spawn under the cursor and fade out, a staple of portfolio heroes.
 *   <section data-image-trail="img/a.webp, img/b.webp, img/c.webp" data-threshold="90"> ...content... </section>
 * Decorative: images get alt="" and pointer-events: none. Fine pointer only, off under reduced motion.
 * The section needs position: relative and overflow: hidden (components.css sets both). */
import { $$, canAnimate, finePointer } from './core.js';

export function init(root = document) {
  const zones = $$('[data-image-trail]', root);
  if (!zones.length || !canAnimate() || !finePointer()) return () => {};
  const cleanups = [];

  zones.forEach((zone) => {
    const srcs = zone.dataset.imageTrail.split(',').map((s) => s.trim()).filter(Boolean);
    if (!srcs.length) return;
    srcs.forEach((s) => { const i = new Image(); i.src = s; });       // warm the cache
    const threshold = parseFloat(zone.dataset.threshold) || 90;
    const size = zone.dataset.size || 'clamp(140px, 16vw, 260px)';
    let last = null, idx = 0, z = 1, live = 0;

    const move = (e) => {
      const r = zone.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (last && Math.hypot(x - last.x, y - last.y) < threshold) return;
      const dir = last ? Math.atan2(y - last.y, x - last.x) : 0;
      last = { x, y };
      if (live > 14) return;
      const img = document.createElement('img');
      img.src = srcs[idx++ % srcs.length]; img.alt = ''; img.className = 'trail-img'; img.decoding = 'async';
      img.style.width = size; img.style.zIndex = ++z;
      zone.appendChild(img); live++;
      gsap.set(img, { x, y, xPercent: -50, yPercent: -50, rotate: gsap.utils.random(-8, 8) });
      gsap.timeline({ onComplete: () => { img.remove(); live--; } })
        .fromTo(img, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'expo.out' })
        .to(img, { x: x + Math.cos(dir) * 40, y: y + Math.sin(dir) * 40 + 30, scale: 0.75, opacity: 0, duration: 0.7, ease: 'power2.in' }, 0.55);
    };
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerleave', () => (last = null));
    cleanups.push(() => zone.removeEventListener('pointermove', move));
  });
  return () => cleanups.forEach((c) => c());
}
