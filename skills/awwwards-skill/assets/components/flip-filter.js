/* flip-filter.js: filter and re-layout a grid with GSAP Flip, items glide to their new places.
 *   <div data-flip-filter>
 *     <button data-filter="all" aria-pressed="true">All</button> <button data-filter="print">Print</button>
 *     <button data-layout="list">List view</button>
 *     <ul data-flip-grid> <li data-tags="print web">…</li> … </ul>
 *     <p data-flip-status aria-live="polite"></p>
 *   </div>
 * Without Flip (or with reduced motion) the same filtering happens instantly. */
import { $, $$, reduceMotion, usePlugins } from './core.js';

export function init(root = document) {
  const blocks = $$('[data-flip-filter]', root);
  if (!blocks.length) return () => {};
  const animated = usePlugins('Flip') && !reduceMotion();
  const cleanups = [];

  blocks.forEach((block) => {
    const grid = $('[data-flip-grid]', block);
    const items = $$(':scope > *', grid);
    const status = $('[data-flip-status]', block);
    const filters = $$('[data-filter]', block);
    const layouts = $$('[data-layout]', block);

    const apply = (change) => {
      const state = animated ? Flip.getState(items) : null;
      change();
      const shown = items.filter((i) => !i.classList.contains('is-filtered-out')).length;
      if (status) status.textContent = `${shown} of ${items.length} shown`;
      if (!animated) return;
      Flip.from(state, {
        duration: 0.75, ease: 'power3.inOut', absolute: true, stagger: 0.02, scale: true, nested: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4, ease: 'power2.in' }),
        onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh(),
      });
    };

    const onFilter = (btn) => () => apply(() => {
      const f = btn.dataset.filter;
      filters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      items.forEach((it) => it.classList.toggle('is-filtered-out', f !== 'all' && !(it.dataset.tags || '').split(/\s+/).includes(f)));
    });
    const onLayout = (btn) => () => apply(() => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      grid.classList.toggle('is-' + btn.dataset.layout, on);
    });
    filters.forEach((b) => { const h = onFilter(b); b.addEventListener('click', h); cleanups.push(() => b.removeEventListener('click', h)); });
    layouts.forEach((b) => { if (!b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'false'); const h = onLayout(b); b.addEventListener('click', h); cleanups.push(() => b.removeEventListener('click', h)); });
  });
  return () => cleanups.forEach((c) => c());
}
