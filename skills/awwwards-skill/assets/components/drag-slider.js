/* drag-slider.js: a draggable, throwable horizontal slider with snapping, progress and keys.
 *   <div data-drag-slider aria-label="Selected work" tabindex="0">
 *     <div data-track> <figure>…</figure> <figure>…</figure> … </div>
 *     <div data-progress><i></i></div>
 *   </div>
 * Default (CSS) is a native scroll-snap row, which is what touch devices keep. On a fine pointer with
 * GSAP Draggable (+ InertiaPlugin for throwing) it becomes drag-to-move with snap to slides. */
import { $, $$, canAnimate, finePointer, usePlugins, clamp } from './core.js';

export function init(root = document) {
  const sliders = $$('[data-drag-slider]', root);
  if (!sliders.length || !finePointer() || !canAnimate('Draggable')) return () => {};
  const inertia = usePlugins('Draggable', 'InertiaPlugin');
  usePlugins('Draggable');
  const cleanups = [];

  sliders.forEach((vp) => {
    const track = $('[data-track]', vp);
    const bar = $('[data-progress] i', vp);
    const slides = $$(':scope > *', track);
    vp.classList.add('is-draggable');
    const maxX = () => Math.min(0, vp.clientWidth - track.scrollWidth);
    const snaps = () => slides.map((s) => clamp(-s.offsetLeft + slides[0].offsetLeft, maxX(), 0));
    const progress = () => { if (bar) gsap.set(bar, { scaleX: maxX() ? gsap.getProperty(track, 'x') / maxX() : 0 }); };

    const [d] = Draggable.create(track, {
      type: 'x', inertia, edgeResistance: 0.85, dragClickables: true, zIndexBoost: false,
      bounds: { minX: maxX(), maxX: 0 },
      snap: inertia ? { x: (v) => gsap.utils.snap(snaps(), v) } : undefined,
      onPress() { vp.classList.add('is-grabbing'); },
      onRelease() { vp.classList.remove('is-grabbing'); },
      onDrag: progress, onThrowUpdate: progress,
    });
    // a drag should not fire the click on a link inside a slide
    const blockClick = (e) => { if (d.isDragging || Math.abs(d.x - d.startX) > 6) { e.preventDefault(); e.stopPropagation(); } };
    track.addEventListener('click', blockClick, true);

    const go = (dir) => {
      const xs = snaps(); const cur = gsap.getProperty(track, 'x');
      let i = xs.findIndex((x) => x <= cur + 1); if (i < 0) i = xs.length - 1;
      const to = xs[clamp(i + dir, 0, xs.length - 1)];
      gsap.to(track, { x: to, duration: 0.8, ease: 'power3.out', onUpdate: () => { d.update(); progress(); } });
    };
    const key = (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } };
    vp.addEventListener('keydown', key);
    const onResize = () => { d.applyBounds({ minX: maxX(), maxX: 0 }); progress(); };
    addEventListener('resize', onResize);
    cleanups.push(() => { d.kill(); vp.classList.remove('is-draggable'); gsap.set(track, { clearProps: 'transform' }); track.removeEventListener('click', blockClick, true); vp.removeEventListener('keydown', key); removeEventListener('resize', onResize); });
  });
  return () => cleanups.forEach((c) => c());
}
