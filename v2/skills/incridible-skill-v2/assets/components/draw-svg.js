/* draw-svg.js: SVG strokes draw themselves, scrubbed by scroll or played on enter.
 *   <svg data-draw="scrub" viewBox="…"><path d="…" fill="none" stroke="currentColor"/></svg>
 *   <svg data-draw>…</svg>             plays once on enter
 *   data-draw-duration="1.6"  data-draw-start="top 80%"  data-draw-end="bottom 40%"
 * Works on path, line, polyline, polygon, circle, ellipse and rect. Without motion the drawing is
 * simply complete. No plugin needed (DrawSVGPlugin is not required). */
import { $$, canAnimate, usePlugins } from './core.js';

export function init(root = document) {
  const svgs = $$('[data-draw]', root);
  if (!svgs.length || !canAnimate()) return () => {};
  const hasST = usePlugins('ScrollTrigger');
  const tweens = [];
  svgs.forEach((svg) => {
    const shapes = $$('path, line, polyline, polygon, circle, ellipse, rect', svg).filter((s) => typeof s.getTotalLength === 'function');
    shapes.forEach((s) => {
      const len = Math.ceil(s.getTotalLength()) + 1;
      s.style.strokeDasharray = `${len} ${len}`;
      s.style.strokeDashoffset = len;
    });
    const scrub = svg.dataset.draw === 'scrub';
    const vars = { strokeDashoffset: 0, ease: scrub ? 'none' : 'power2.inOut', duration: parseFloat(svg.dataset.drawDuration) || 1.6, stagger: scrub ? 0.1 : 0.15 };
    if (hasST) vars.scrollTrigger = scrub
      ? { trigger: svg, start: svg.dataset.drawStart || 'top 80%', end: svg.dataset.drawEnd || 'bottom 40%', scrub: 0.6 }
      : { trigger: svg, start: svg.dataset.drawStart || 'top 85%', once: true };
    tweens.push(gsap.to(shapes, vars));
  });
  return () => tweens.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.revert(); });
}
