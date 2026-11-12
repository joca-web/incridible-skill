# incridible-skill

An agent skill for building Awwwards-level websites: art direction, GSAP + ScrollTrigger + Lenis motion, WebGL depth-map heroes, custom cursors, pinned and horizontal scroll, preloaders, page transitions and image-to-code, verified in a real browser.

## What is inside

```
skills/incridible-skill/
  SKILL.md                  workflow, rules, routing
  references/               direction, image-to-code, motion, WebGL, type/colour/layout, performance/a11y, teardowns, QA
  assets/starter/           working base site (preloader, Lenis + GSAP, reveals, pinned and horizontal scenes, marquee, cursor)
  assets/webgl/depth-hero.js  dependency-free WebGL depth-parallax hero
  scripts/shoot.mjs         real-browser inspector (Node 22 + Chrome, no installs)
  scripts/compare.py        reference image vs screenshot diff
  scripts/img_probe.py      image info, tiles, ruler, palette, crop
```

## Install

Copy `skills/incridible-skill` into your agent's skills folder (for Claude Code: `~/.claude/skills/` or a project's `.claude/skills/`), or upload `incridible-skill.skill` from the releases/skill package in Claude.

## Notes

- Verified: the inspector, WebGL hero and image scripts were run in headless Chrome. The GSAP/ScrollTrigger/Lenis motion layer was only smoke-tested with stub libraries because the build sandbox had no network, so run the starter once in a normal browser.
- References analysed: landonorris.com and tasteskill.dev. `why.zero.university` and `auge-xp.com` could not be opened when the skill was written and have no notes yet.
- Reference sites are studied for technique and structure. Do not copy their photos, logos, text or brand assets.
