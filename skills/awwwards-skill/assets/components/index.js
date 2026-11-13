/* awwwards components: one call to wire every data-attribute component on a page.
 *
 *   <script defer src="…/gsap.min.js"></script> + ScrollTrigger, and optionally SplitText, Flip,
 *   Draggable, InertiaPlugin, ScrambleTextPlugin, plus lenis.min.js
 *   <script type="module">
 *     import { boot } from './components/index.js';
 *     boot();                      // smooth scroll + transitions + every component found on the page
 *   </script>
 *
 * boot() is safe without any library: it marks <html> with .motion or .no-motion and every component
 * falls back to static content. Import single modules instead when you only need one or two. */
import { canAnimate } from './core.js';
import { initScroll } from './scroll.js';
import { initTransitions } from './page-transition.js';
import * as split from './split-reveal.js';
import * as scramble from './text-scramble.js';
import * as trail from './image-trail.js';
import * as stack from './stack-cards.js';
import * as flip from './flip-filter.js';
import * as drag from './drag-slider.js';
import * as draw from './draw-svg.js';
import * as distort from './webgl-distort.js';
import * as shader from './shader-bg.js';
import * as vtype from './variable-type.js';
import * as expand from './expand-media.js';
import { initCursor, initMagnetic, initTilt, initParallax, initReveal, initInnerParallax, initMarquee, initCounters, initAccordions, initProgress } from './interactions.js';

export function initAll(root = document) {
  // order: pinned sections first, so later triggers measure the page with pin spacing in place
  const fns = [expand.init, stack.init, split.init, scramble.init, draw.init, vtype.init, flip.init, drag.init,
    trail.init, distort.init, shader.init, initReveal, initInnerParallax, initParallax, initMarquee, initCounters, initAccordions, initProgress,
    initMagnetic, initTilt, initCursor];
  const offs = [];
  for (const fn of fns) {
    try { offs.push(fn(root)); } catch (err) { console.warn('component failed, its content stays static:', fn.name || '', err); }
  }
  if (window.ScrollTrigger) { ScrollTrigger.sort(); ScrollTrigger.refresh(); }
  return () => offs.forEach((off) => off && off());
}

export function boot({ smooth = {}, onEnter } = {}) {
  const root = document.documentElement;
  const ok = canAnimate('ScrollTrigger');
  root.classList.toggle('motion', ok);
  root.classList.toggle('no-motion', !ok);
  window.__awwwardsReady = true;
  if (ok) gsap.registerPlugin(ScrollTrigger);
  const lenis = initScroll(smooth);
  const run = () => { const off = initAll(); onEnter && onEnter(); return off; };
  let off = null;
  initTransitions({ onEnter: () => { off = run(); } });
  return { lenis, destroy: () => off && off() };
}
