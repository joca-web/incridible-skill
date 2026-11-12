<div align="center">

# incridible-skill

**An agent skill for building Awwwards-level websites.**
Art direction, GSAP + ScrollTrigger + Lenis motion, a tested component library, page transitions, WebGL, image-to-code, and QA in a real browser with real input.

![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Agent Skill](https://img.shields.io/badge/agent%20skill-SKILL.md-black)
![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757)
![Node 22+](https://img.shields.io/badge/node-%E2%89%A5%2022-339933)
![Version](https://img.shields.io/badge/version-2.0.0-orange)

[What's new](#whats-new-in-v2) · [Install](#install) · [Usage](#usage) · [Components](#components) · [Tools](#verification-tools) · [Contributing](CONTRIBUTING.md) · [Português](README.pt-BR.md)

</div>

---

Most AI-built sites look generated because every decision was a default: a centered hero, three icon cards, a purple gradient, fade-up on everything. This skill gives a coding agent a repeatable way to do what award-winning studios do instead: start from one idea that belongs to the subject, carry it through type, colour, imagery and motion, then prove the result in a real browser.

It is organised around the Awwwards scoring weights (Design 40%, Usability 30%, Creativity 20%, Content 10%) and the Developer Award criteria (semantics, animations, accessibility, performance, responsiveness, markup).

## What's new in v2

Same name, same plugin, same commands: installing or updating `incridible-skill` gives you version 2. Version 1 is archived, unchanged, in [`versions/v1/`](versions/v1).

- **Animation tested for real.** Every component and both starters were run with real GSAP 3.15 and Lenis 1.3 in Chrome, scrolled with real wheel input (desktop) and touch drags (phone). This found and fixed bugs that v1's stub test missed, including a hero headline that never appeared and reveals that hid themselves again. The lessons are written into the skill.
- **Component library: 24 effects in 16 modules**, switched on by data attributes, each with a static fallback: split-text reveals, text scramble, image trail, stacking cards, Flip filters and list view, draggable inertia slider, SVG line drawing, WebGL image distortion, shader gradient background, cursor-proximity and scroll-driven variable fonts, expanding media, batch reveals, inner and element parallax, custom cursor, magnetic, 3D tilt, velocity marquee, counters, smooth accordion, progress bar, page transitions.
- **Second starter:** a three-page editorial site with branded curtain transitions, next to the original single-page monument starter.
- **Smarter inspector:** real-input scroll pass with frame timing and recorded frames, hover pass, keyboard focus pass, text stuck in masks, fine pointer on desktop and touch on phones, and `--vendor` to test real libraries offline.
- **New tools:** `filmstrip.py` (contact sheet or GIF of the scroll) and `vendor.mjs` (fetch library builds for offline testing).

## Install

Pick one.

### Claude Code plugin (recommended)

Inside Claude Code:

```text
/plugin marketplace add joca-web/incridible-skill
/plugin install incridible-skill@incridible-skill
```

Or from a terminal:

```bash
claude plugin marketplace add joca-web/incridible-skill
claude plugin install incridible-skill@incridible-skill
```

Already installed? Update to the latest version:

```bash
claude plugin marketplace update incridible-skill
claude plugin update incridible-skill@incridible-skill
```

### Skills CLI (any agent that reads `SKILL.md`)

```bash
npx skills add joca-web/incridible-skill
```

### Installer scripts

Windows (PowerShell):

```powershell
git clone https://github.com/joca-web/incridible-skill.git
cd incridible-skill
.\install.ps1             # to $HOME\.claude\skills
.\install.ps1 -Project    # to .\.claude\skills in the current project
```

macOS and Linux:

```bash
git clone https://github.com/joca-web/incridible-skill.git
cd incridible-skill
./install.sh              # to ~/.claude/skills
./install.sh --project    # to ./.claude/skills in the current project
```

Run the installer again to update. Remove with `--uninstall` / `-Uninstall`.

### Manual copy

Copy `skills/incridible-skill` into `~/.claude/skills/` (user-wide) or `<project>/.claude/skills/` (one project).

### Claude app (web, desktop)

Download [`dist/incridible-skill.plugin`](dist/incridible-skill.plugin) and open it in the Claude app to install it as a plugin, or download [`dist/incridible-skill.skill`](dist/incridible-skill.skill) and add it from the Skills section of Claude's settings. Use one of the two, not both. Menu names vary by plan.

## Usage

The skill triggers on its own when you ask for premium, animated or award-style sites. You can also name it.

```text
Build a three-page site for an interior design studio in Porto. Use incridible-skill: editorial
direction, page transitions, a draggable project slider, and verify every page in the browser.
```

```text
Here is a screenshot of the design (ref.png). Recreate it pixel-faithfully, then add the motion it
implies. Use incridible-skill and report the diff numbers.
```

```text
Redesign this landing page so it stops looking AI-generated. Keep the stack and the content.
```

```text
Faça um site nível Awwwards para a minha marca de skate, com preloader, scroll horizontal,
cards empilhados e transição entre páginas.
```

When you are inspired by a live site, the skill studies its technique and structure. It does not copy its photos, logos, text or brand.

## How it works

1. **Inventory and brief.** Eight to twelve specifics only this client has, written as claims with proof.
2. **Direction.** One composition direction, palette, type pair and motion character, fixed as tokens.
3. **Idea and signature moment.** One sentence that fails for the nearest competitor, and one thing the visitor can do.
4. **Foundations.** Fluid type and spacing scales, grid, mobile as its own composition.
5. **Layered build.** Static first, then motion (components plus a custom signature moment), then depth, then polish.
6. **Image to code** when a visual reference exists.
7. **Gate.** Real-browser inspection at 1440, 768 and 390 px with real libraries and real input, a filmstrip to look at, then a look-and-fix loop scored with the Awwwards weights.
8. **Report.** Scores, numbers, placeholders, licences, and what was not verified.

Full details: [`skills/incridible-skill/SKILL.md`](skills/incridible-skill/SKILL.md).

## Components

Copy `assets/components/` into a site, then:

```html
<script type="module">
  import { boot } from './components/index.js';
  boot();   // smooth scroll, transitions and every data-attribute component on the page
</script>
```

```html
<h2 data-reveal-split="lines">Lines slide out of masks</h2>
<div data-stack><article data-stack-card>…</article><article data-stack-card>…</article></div>
<figure data-distort><img src="work.webp" alt="…"></figure>
<section data-shader-bg="#0f0e0d, #ff4d1c, #f2efe9">…</section>
```

The full catalogue, with markup and which components suit which direction, is in [`references/09-components.md`](skills/incridible-skill/references/09-components.md).

## Verification tools

Bundled in `skills/incridible-skill/scripts/`.

| Script | Needs | Does |
|---|---|---|
| `shoot.mjs` | Node 22+, Chrome, Chromium or Edge | Static checks, stepped screenshots, a real wheel or touch scroll pass with frame timing and recorded frames, hover and keyboard passes, reduced motion. Finds text stuck in masks, pages that do not scroll, flat hovers, invisible focus, library warnings, overflow, broken images, LCP, CLS and weight |
| `filmstrip.py` | Python 3, Pillow | Contact sheet (or GIF) of the frames recorded while scrolling |
| `vendor.mjs` | Node 18+ | Downloads GSAP, Lenis and other browser builds so `shoot.mjs --vendor` can test real libraries offline |
| `compare.py` | Python 3, Pillow, numpy | Structural diff between a reference image and a screenshot, with a heat map |
| `img_probe.py` | Python 3, Pillow | Image info, tiles, pixel ruler, palette with contrast, crops |

```bash
python3 -m http.server 4173 --directory my-site &
node skills/incridible-skill/scripts/shoot.mjs http://localhost:4173 --out .incridible/after
python3 skills/incridible-skill/scripts/filmstrip.py .incridible/after --width 1440
```

On Windows use `python` instead of `python3`, and start the server in a separate terminal. `shoot.mjs` exits with code 1 when any FAIL is found, so it can run in CI.

## Repository layout

```text
.claude-plugin/              plugin and marketplace manifests
skills/incridible-skill/
  SKILL.md                   workflow, rules, routing
  references/                9 reference guides (09 is the component catalogue)
  assets/components/         component library
  assets/starters/           monument (single page) and editorial (three pages)
  assets/webgl/              depth-hero.js
  scripts/                   shoot.mjs, filmstrip.py, vendor.mjs, compare.py, img_probe.py
dist/                        incridible-skill.skill and incridible-skill.plugin
versions/v1/                 version 1, archived unchanged (not part of the plugin)
tools/validate.py            repository checks (also run in CI)
install.sh, install.ps1      installers
```

## Scope and honest limits

- All v2 components and both starters were run with real GSAP 3.15.1 and Lenis 1.3.27 (built from its source) in headless Chrome. Frame times there come from software rendering: they are useful to compare runs, not to judge smoothness on a real GPU. Check the editorial home page (shader background plus WebGL images) on a real device.
- `vendor.mjs` was tested by extracting real npm tarballs offline; its download path could not be exercised in the build environment, which had no network.
- `install.ps1` was written for Windows PowerShell but not run (no PowerShell in the build environment); `install.sh` and the plugin install were tested.
- Fonts were blocked during testing, so layouts were checked with fallback fonts; the monument headline now fits whatever font loads.
- The references analysed so far are landonorris.com and tasteskill.dev. `why.zero.university` and `auge-xp.com` could not be opened and have no notes yet.
- A skill raises the floor and gives the agent a process. Awards still depend on the idea, the content and the taste of whoever directs the work.

## Roadmap

- [ ] Teardowns for `why.zero.university` and `auge-xp.com`
- [ ] Optional Three.js scene starter
- [ ] React / Next wrapper for the components
- [ ] Benchmarks against a no-skill baseline with blind comparison

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, and run `python3 tools/validate.py` before opening a PR.

## Credits and disclaimer

- Process ideas (inventory, idea sentence, real-browser inspector, look-and-fix loop) were informed by [Taste Skill](https://www.tasteskill.dev/).
- Craft notes on landonorris.com come from its public markup and public write-ups (Awwwards, DesignRush, Codrops, Syntax). This project is not affiliated with Lando Norris, McLaren, OFF+BRAND, Awwwards or Taste Skill.
- GSAP (GreenSock, free under its standard license), Lenis (MIT), Three.js and Rive belong to their authors and are loaded from CDNs, not bundled here.
- The editorial starter's images are abstract placeholders generated for this project.

## License

[MIT](LICENSE)
