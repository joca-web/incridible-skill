/* expand-media.js: a small framed image grows to fill the screen while the headline splits apart.
 *   <section data-expand data-length="160%">
 *     <h2><span data-expand-left>Into</span> <span data-expand-right>the work</span></h2>
 *     <div data-expand-media><img src="…" alt="…"></div>
 *   </section>
 * Pinned and scrubbed with ScrollTrigger. Without motion the image is simply shown full width and the
 * headline sits above it. On narrow screens the pin is shorter. */
import { $, $$, canAnimate, usePlugins } from './core.js';

export function init(root = document) {
  const sections = $$('[data-expand]', root);
  if (!sections.length || !canAnimate('ScrollTrigger')) return () => {};
  usePlugins('ScrollTrigger');
  const mm = gsap.matchMedia();
  sections.forEach((sec) => {
    const media = $('[data-expand-media]', sec);
    if (!media) return;
    sec.classList.add('is-expand');
    mm.add({ narrow: '(max-width: 767px)', wide: '(min-width: 768px)' }, (ctx) => {
      const narrow = ctx.conditions.narrow;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: 'top top', invalidateOnRefresh: true, end: '+=' + (narrow ? '90%' : sec.dataset.length || '160%'), pin: true, scrub: 0.6, anticipatePin: 1 },
      });
      tl.fromTo(media, { clipPath: narrow ? 'inset(22% 12% 22% 12% round 18px)' : 'inset(30% 34% 30% 34% round 24px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' }, 0)
        .fromTo($('img', media), { scale: 1.35 }, { scale: 1, ease: 'none' }, 0)
        // the words part and leave through the edges; they never fade, so the heading is never invisible
        .to($('[data-expand-left]', sec), { x: () => -innerWidth * 0.6, ease: 'none' }, 0)
        .to($('[data-expand-right]', sec), { x: () => innerWidth * 0.6, ease: 'none' }, 0);
    });
  });
  return () => { mm.revert(); sections.forEach((s) => s.classList.remove('is-expand')); };
}
