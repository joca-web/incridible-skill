/* stack-cards.js: cards stick and stack; each one shrinks and dims as the next slides over it.
 *   <div data-stack> <article data-stack-card>…</article> <article data-stack-card>…</article> </div>
 *   data-stack-top="12vh" (sticky offset)   data-stack-scale="0.9"
 * The sticky stack is pure CSS (components.css), so it still works without GSAP; GSAP adds the
 * shrink and shade. Shade uses a CSS variable on a pseudo-element, not filter: brightness (cheaper). */
import { $$, canAnimate, usePlugins } from './core.js';

export function init(root = document) {
  const stacks = $$('[data-stack]', root);
  if (!stacks.length) return () => {};
  const triggers = [];
  stacks.forEach((stack) => {
    const cards = $$('[data-stack-card]', stack);
    const top = stack.dataset.stackTop || '12vh';
    stack.style.setProperty('--stack-top', top);
    cards.forEach((c, i) => c.style.setProperty('--i', i));
    if (!canAnimate('ScrollTrigger')) return;
    usePlugins('ScrollTrigger');
    const minScale = parseFloat(stack.dataset.stackScale) || 0.9;
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const depth = cards.length - 1 - i;
      const tw = gsap.to(card, {
        scale: minScale + (1 - minScale) * (1 - depth / cards.length) * 0.5,
        '--shade': 0.55, ease: 'none', transformOrigin: '50% 0%',
        // finish when the next card reaches its own sticky position
        scrollTrigger: { trigger: next, start: 'top bottom', end: () => `top ${parseFloat(getComputedStyle(next).top) || 0}px`, scrub: true, invalidateOnRefresh: true },
      });
      triggers.push(tw);
    });
  });
  return () => triggers.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
}
