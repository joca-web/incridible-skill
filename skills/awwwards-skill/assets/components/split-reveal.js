/* split-reveal.js: masked line, word or character reveals.
 *   <h2 data-reveal-split>Lines slide up out of masks</h2>
 *   <p data-reveal-split="words" data-stagger="0.04">Words, one after another</p>
 *   <h1 data-reveal-split="chars" data-start="top 95%">Characters</h1>
 *   data-reveal-split="lines|words|chars"  data-stagger  data-duration  data-start (ScrollTrigger start)
 *   data-delay  data-trigger="load" (play on load instead of on scroll)
 * Uses GSAP SplitText when loaded (mask, autoSplit on resize, aria handled), otherwise a word-level fallback.
 * Start states are set by GSAP, never by CSS transforms (GSAP would read a CSS translateY(110%) as pixels
 * and the text would stay stuck inside its mask). CSS hides only `.motion [data-reveal-split]:not(.is-split)`. */
import { $$, canAnimate, usePlugins } from './core.js';

const DEFAULT_STAGGER = { lines: 0.09, words: 0.045, chars: 0.022 };

export function init(root = document) {
  const els = $$('[data-reveal-split]', root);
  if (!els.length) return () => {};
  if (!canAnimate()) { els.forEach((e) => e.classList.add('is-split')); return () => {}; }
  const hasST = usePlugins('ScrollTrigger');
  const hasSplit = usePlugins('SplitText');
  const cleanups = [];

  els.forEach((el) => {
    const type = ['lines', 'words', 'chars'].includes(el.dataset.revealSplit) ? el.dataset.revealSplit : 'lines';
    const stagger = parseFloat(el.dataset.stagger) || DEFAULT_STAGGER[type];
    const duration = parseFloat(el.dataset.duration) || (type === 'chars' ? 0.9 : 1.1);
    const delay = parseFloat(el.dataset.delay) || 0;
    const onLoad = el.dataset.trigger === 'load';

    const play = (targets) => {
      gsap.set(targets, { yPercent: 115 });
      el.classList.add('is-split');
      const vars = { yPercent: 0, duration, delay, ease: 'expo.out', stagger };
      if (hasST && !onLoad) vars.scrollTrigger = { trigger: el, start: el.dataset.start || 'top 88%', once: true };
      return gsap.to(targets, vars);
    };

    if (hasSplit) {
      const split = SplitText.create(el, {
        type: type === 'lines' ? 'lines' : `lines,${type}`,
        mask: 'lines', autoSplit: true, linesClass: 'split-line', wordsClass: 'split-word', charsClass: 'split-char',
        onSplit: (self) => play(self[type]),
      });
      cleanups.push(() => split.revert());
      return;
    }

    // fallback: wrap each word in a mask (keeps inline markup out of the way by only splitting plain text)
    if (el.children.length) { el.classList.add('is-split'); gsap.from(el, { opacity: 0, y: 30, duration, delay, ease: 'expo.out' }); return; }
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    const original = el.innerHTML;
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map((w) => `<span class="split-mask" aria-hidden="true"><span class="split-word">${w.replace(/</g, '&lt;')}</span></span>`).join(' ');
    play($$('.split-word', el));
    cleanups.push(() => { el.innerHTML = original; el.removeAttribute('aria-label'); });
  });

  return () => cleanups.forEach((c) => c());
}
