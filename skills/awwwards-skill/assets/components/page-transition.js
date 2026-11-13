/* page-transition.js: branded transitions between pages of a multi-page site.
 *   <div class="curtain" aria-hidden="true"><span class="curtain__label"></span></div>
 *   <html data-transition="curtain">   (default) a curtain wipes up with the destination's name
 *   <html data-transition="view">      native cross-document View Transitions where supported
 *                                      (CSS: @view-transition { navigation: auto; }), curtain elsewhere
 *   <a href="/work" data-transition-label="Work">   label shown on the curtain (defaults to link text)
 *   <a data-no-transition>              opt out for one link
 * Put this in <head> so the arriving page starts covered, with no flash:
 *   <script>try{sessionStorage.getItem('pt')&&document.documentElement.classList.add('pt-enter')}catch(e){}</script>
 * components.css has a CSS failsafe that lifts the curtain after 3 s if scripts never run. */
import { $, reduceMotion } from './core.js';

const KEY = 'pt';

export function initTransitions({ onEnter } = {}) {
  const root = document.documentElement;
  const curtain = $('.curtain');
  const label = curtain && $('.curtain__label', curtain);
  const native = root.dataset.transition === 'view' && 'onpagereveal' in window;
  const can = !!(window.gsap && curtain) && !reduceMotion() && !native;
  let leaving = false;

  // arriving
  const arrived = (() => { try { const v = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); return v; } catch { return null; } })();
  if (can && arrived) {
    if (label) label.textContent = arrived === '1' ? '' : arrived;
    gsap.set(curtain, { scaleY: 1, transformOrigin: '50% 0%' });
    root.classList.remove('pt-enter');
    gsap.timeline({ delay: 0.15 })
      .to(label, { yPercent: -120, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0)
      .to(curtain, { scaleY: 0, duration: 0.9, ease: 'expo.inOut' }, 0.15)
      .add(() => onEnter && onEnter(), 0.45);
  } else {
    root.classList.remove('pt-enter');
    if (onEnter) onEnter();
  }

  if (!can) return () => {};

  const click = (e) => {
    const a = e.target.closest('a[href]');
    if (!a || leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // same page or #hash
    e.preventDefault();
    leaving = true;
    const name = a.dataset.transitionLabel || a.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) || '1';
    if (label) { label.textContent = name; gsap.set(label, { yPercent: 120, opacity: 0 }); }
    window.lenis && window.lenis.stop();
    gsap.timeline({ onComplete: () => { try { sessionStorage.setItem(KEY, name); } catch {} location.href = url.href; } })
      .set(curtain, { transformOrigin: '50% 100%' })
      .fromTo(curtain, { scaleY: 0 }, { scaleY: 1, duration: 0.75, ease: 'expo.inOut' })
      .to(label, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0.35);
  };
  document.addEventListener('click', click);

  // back/forward cache: the page comes back still covered, so lift the curtain
  const show = (e) => { if (e.persisted) { leaving = false; gsap.set(curtain, { scaleY: 0 }); window.lenis && window.lenis.start(); } };
  addEventListener('pageshow', show);
  return () => { document.removeEventListener('click', click); removeEventListener('pageshow', show); };
}
