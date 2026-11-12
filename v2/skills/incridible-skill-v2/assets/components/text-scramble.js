/* text-scramble.js: decode-style text, on enter or on hover.
 *   <span data-scramble>Available for work</span>             scrambles when it enters the viewport
 *   <a data-scramble="hover" href="/work">Work</a>             scrambles on hover and focus (pointer and keyboard)
 *   data-chars="01"  data-duration="0.9"
 * Best on monospace or uppercase labels, so the width does not jitter. Uses ScrambleTextPlugin when
 * loaded, otherwise its own loop. Screen readers get the real text through aria-label. */
import { $$, reduceMotion, onEnter } from './core.js';

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>';

function ownScramble(el, text, duration, chars) {
  const start = performance.now();
  cancelAnimationFrame(el._scr);
  const frame = (t) => {
    const p = Math.min(1, (t - start) / (duration * 1000));
    const fixed = Math.floor(p * text.length);
    let out = text.slice(0, fixed);
    for (let i = fixed; i < text.length; i++) out += /\s/.test(text[i]) ? text[i] : chars[(Math.random() * chars.length) | 0];
    el.textContent = out;
    if (p < 1) el._scr = requestAnimationFrame(frame); else el.textContent = text;
  };
  el._scr = requestAnimationFrame(frame);
}

export function init(root = document) {
  const els = $$('[data-scramble]', root);
  if (!els.length || reduceMotion()) return () => {};
  const usePlugin = !!(window.gsap && window.ScrambleTextPlugin);
  if (usePlugin) gsap.registerPlugin(ScrambleTextPlugin);
  const cleanups = [];

  els.forEach((el) => {
    // scramble the deepest text-only element so links keep their own markup
    const target = el.children.length === 1 && !el.children[0].children.length ? el.children[0] : el;
    const text = target.textContent;
    const duration = parseFloat(el.dataset.duration) || 0.9;
    const chars = el.dataset.chars || POOL;
    if (!el.hasAttribute('aria-label') && !/^(A|BUTTON)$/.test(el.tagName)) el.setAttribute('aria-label', text.trim());
    const run = () => {
      if (usePlugin) gsap.to(target, { duration, overwrite: true, scrambleText: { text, chars: chars === POOL ? 'upperCase' : chars, speed: 0.6 } });
      else ownScramble(target, text, duration, chars);
    };
    if (el.dataset.scramble === 'hover') {
      el.addEventListener('pointerenter', run); el.addEventListener('focus', run);
      cleanups.push(() => { el.removeEventListener('pointerenter', run); el.removeEventListener('focus', run); });
    } else {
      cleanups.push(onEnter(el, run));
    }
  });
  return () => cleanups.forEach((c) => c());
}
