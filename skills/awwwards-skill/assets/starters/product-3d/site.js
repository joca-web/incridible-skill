/* product-3d starter: components for motion, stage.js for the 3D objects.
 * Copy the skill's assets/components/ here as components/ and assets/three/ as three/. */
import { boot } from './components/index.js';
import { initStages } from './three/stage.js';

boot({ smooth: { fineOnly: true } });
initStages();

// diagonal wipe: the dark chapter's slanted top edge flattens as it scrolls in (jjettas.com style)
if (window.gsap && window.ScrollTrigger && document.documentElement.classList.contains('motion')) {
  document.querySelectorAll('[data-diagonal]').forEach((el) => {
    gsap.fromTo(el, { clipPath: 'polygon(0% 18%, 100% 0%, 100% 100%, 0% 100%)' }, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: true } });
  });
}
