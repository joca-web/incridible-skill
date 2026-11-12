# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-11-12

Version 2 is a new skill, `incridible-skill-v2`, in `v2/skills/incridible-skill-v2/` and a new plugin
(`incridible-skill-v2@incridible-skill`). Version 1 is unchanged.

### Added
- Component library: 24 effects in 16 ES modules with static fallbacks (split-text reveals, scramble, image trail, stacking cards, Flip filters, draggable inertia slider, SVG drawing, WebGL distortion, shader background, variable-font proximity and scroll axis, expanding media, batch reveal, inner and element parallax, cursor, magnetic, tilt, marquee, counters, accordion, progress, page transitions) and `references/09-components.md`.
- Editorial starter: three pages with branded curtain transitions; abstract placeholder images generated for it.
- `shoot.mjs`: `--vendor` (serve CDN scripts locally), real wheel and touch scroll pass after a fresh reload with frame timing and recorded frames, hover pass, keyboard focus pass, fine pointer on desktop widths, detection of text stuck inside masks, new codes `scroll-stuck`, `no-scroll-motion`, `jank`, `flat-hover`, `focus-invisible`, `focus-offscreen`, `lib-warning`, `vendor-miss`.
- `filmstrip.py` (contact sheet or GIF of the scroll) and `vendor.mjs` (fetch library builds for offline testing).
- "Lessons from real-browser testing" in the motion reference.
- Installers install v2 by default (`--v1` / `-V1` for version 1); validation and CI cover both versions.

### Fixed (found by testing with real GSAP and Lenis)
- Monument starter hero headline stayed hidden inside its mask (CSS `translateY` start state read as pixels by GSAP).
- Monument headline overflowed the viewport when the display font failed to load; `data-fit` now scales it.
- Line-reveal recipe in the motion reference had the same start-state bug.
- Touch scrolling was never exercised (synthetic touch gestures do nothing in headless Chrome); desktop-only code never ran (headless reports no fine pointer).

## [1.0.0] - 2026-11-12

### Added
- `SKILL.md` workflow: inventory, direction, idea sentence, foundations, layered build, gate, report.
- Eight reference guides: direction and concept, image to code, motion system (15 recipes), WebGL and depth, typography/colour/layout, performance and accessibility, reference teardowns, QA checklist.
- Starter site with preloader, Lenis + GSAP, line reveals, pinned and horizontal scenes, marquee, magnetic buttons and custom cursor. Hidden start states exist only when the motion layer runs.
- `depth-hero.js`: dependency-free WebGL depth-parallax hero.
- Tools: `shoot.mjs` (real-browser inspector), `compare.py` (reference diff), `img_probe.py` (info, tiles, ruler, palette, crop).
- Claude Code plugin and marketplace manifests, installers for macOS, Linux and Windows, repository validation script.

### Known limits
- The GSAP, ScrollTrigger and Lenis layer was smoke-tested with stub libraries (no network in the build environment).
- No notes yet for `why.zero.university` and `auge-xp.com`.
