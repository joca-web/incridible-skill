/* scroll.js: Lenis smooth scroll synced to GSAP's ticker and ScrollTrigger, plus anchor links.
 *   import { initScroll } from './scroll.js'; const lenis = initScroll({ fineOnly: true });
 * Exposes window.lenis (other components read its velocity). On touch devices native momentum
 * scrolling is kept by default, because simulated scrolling feels wrong there. */
import { $$, reduceMotion, finePointer } from './core.js';

export function initScroll({ fineOnly = true, lerp = 0.1, anchorOffset = 0 } = {}) {
  let lenis = null;
  const wantLenis = window.Lenis && !reduceMotion() && (!fineOnly || finePointer());
  if (wantLenis) {
    lenis = new Lenis({ lerp, smoothWheel: true });
    window.lenis = lenis;
    if (window.gsap) {
      if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  if (window.ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });

  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -anchorOffset, duration: 1.3 });
    else target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
    target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
  }));

  // fonts and images move triggers; refresh once layout is final
  const refresh = () => window.ScrollTrigger && ScrollTrigger.refresh();
  if (document.fonts) document.fonts.ready.then(refresh);
  addEventListener('load', refresh, { once: true });
  return lenis;
}
