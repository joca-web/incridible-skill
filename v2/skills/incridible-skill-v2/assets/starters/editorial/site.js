/* Editorial starter: one module boots every page.
 * Copy the skill's assets/components/ folder next to this file as components/ (see README in the skill).
 * Pages are plain HTML; behaviour comes from data attributes, so adding a section never needs new JS. */
import { boot } from './components/index.js';

boot({
  smooth: { fineOnly: true, anchorOffset: 80 },
  onEnter() {
    // page-specific entrance hooks go here (they run after the curtain lifts)
  },
});
