# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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
