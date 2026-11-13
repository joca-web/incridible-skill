/* variable-type.js: variable-font typography that reacts.
 *   <h2 data-proximity data-weight="200,900" data-radius="260">Hover near me</h2>
 *      each letter thickens as the pointer comes close (fine pointer only)
 *   <h2 data-scroll-axis="wght" data-from="150" data-to="900">Weight follows scroll</h2>
 *      any axis (wght, wdth, opsz, slnt) scrubbed by scroll position
 * Needs a variable font with those axes (e.g. Inter Tight, Archivo, Fraunces, Bricolage Grotesque).
 * The words stay real text: letters are wrapped in aria-hidden spans with an aria-label on the parent. */
import { $$, canAnimate, finePointer, reduceMotion, usePlugins, clamp } from './core.js';

function wrapChars(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text.trim().replace(/\s+/g, ' '));
  el.innerHTML = text.split(/(\s+)/).map((part) => /^\s+$/.test(part) ? part
    : `<span class="vt-word" aria-hidden="true">${[...part].map((c) => `<span class="vt-char">${c.replace(/</g, '&lt;')}</span>`).join('')}</span>`).join('');
  return $$('.vt-char', el);
}

export function init(root = document) {
  const cleanups = [];

  const prox = $$('[data-proximity]', root);
  if (prox.length && finePointer() && !reduceMotion()) {
    prox.forEach((el) => {
      const [lo, hi] = (el.dataset.weight || '200,900').split(',').map(Number);
      const radius = parseFloat(el.dataset.radius) || 260;
      const original = el.innerHTML;
      const chars = wrapChars(el);
      let centers = [], mx = -1e4, my = -1e4, raf = 0;
      const measure = () => { centers = chars.map((c) => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2 + scrollX, r.top + r.height / 2 + scrollY]; }); };
      const cur = chars.map(() => lo);
      const frame = () => {
        raf = 0; let moving = false;
        chars.forEach((c, i) => {
          const d = Math.hypot(centers[i][0] - mx, centers[i][1] - my);
          const target = lo + (hi - lo) * Math.pow(clamp(1 - d / radius, 0, 1), 1.6);
          cur[i] += (target - cur[i]) * 0.18;
          if (Math.abs(target - cur[i]) > 0.5) moving = true;
          c.style.fontVariationSettings = `"wght" ${cur[i].toFixed(1)}`;
        });
        if (moving) raf = requestAnimationFrame(frame);
      };
      const move = (e) => { mx = e.pageX; my = e.pageY; if (!raf) raf = requestAnimationFrame(frame); };
      measure();
      chars.forEach((c) => (c.style.fontVariationSettings = `"wght" ${lo}`));
      addEventListener('pointermove', move, { passive: true });
      addEventListener('resize', measure);
      if (document.fonts) document.fonts.ready.then(measure);
      cleanups.push(() => { removeEventListener('pointermove', move); removeEventListener('resize', measure); cancelAnimationFrame(raf); el.innerHTML = original; el.removeAttribute('aria-label'); });
    });
  }

  const axes = $$('[data-scroll-axis]', root);
  if (axes.length && canAnimate('ScrollTrigger')) {
    usePlugins('ScrollTrigger');
    axes.forEach((el) => {
      const axis = el.dataset.scrollAxis || 'wght';
      const from = parseFloat(el.dataset.from ?? 200), to = parseFloat(el.dataset.to ?? 900);
      const state = { v: from };
      const apply = () => (el.style.fontVariationSettings = `"${axis}" ${state.v.toFixed(1)}`);
      apply();
      const tw = gsap.to(state, { v: to, ease: 'none', onUpdate: apply,
        scrollTrigger: { trigger: el, start: el.dataset.start || 'top 90%', end: el.dataset.end || 'bottom 30%', scrub: 0.5 } });
      cleanups.push(() => { tw.scrollTrigger.kill(); tw.kill(); el.style.fontVariationSettings = ''; });
    });
  }
  return () => cleanups.forEach((c) => c());
}
