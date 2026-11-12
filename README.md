<div align="center">

# incridible-skill

**An agent skill for building Awwwards-level websites.**
Art direction, GSAP + ScrollTrigger + Lenis motion, WebGL depth heroes, image-to-code, and real-browser QA.

![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Agent Skill](https://img.shields.io/badge/agent%20skill-SKILL.md-black)
![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757)
![Node 22+](https://img.shields.io/badge/node-%E2%89%A5%2022-339933)
![Version](https://img.shields.io/badge/version-1.0.0-orange)

[Install](#install) · [Usage](#usage) · [How it works](#how-it-works) · [Tools](#verification-tools) · [Contributing](CONTRIBUTING.md) · [Português](README.pt-BR.md)

</div>

---

Most AI-built sites look generated because every decision was a default: a centered hero, three icon cards, a purple gradient, fade-up on everything. This skill gives a coding agent a repeatable way to do what award-winning studios do instead: start from one idea that belongs to the subject, carry it through type, colour, imagery and motion, then prove the result in a real browser.

It is organised around the Awwwards scoring weights (Design 40%, Usability 30%, Creativity 20%, Content 10%) and the Developer Award criteria (semantics, animations, accessibility, performance, responsiveness, markup).

## What you get

| Area | Included |
|---|---|
| **Workflow** | Inventory, direction, idea sentence, foundations, layered build (static, motion, depth, polish), gate, report |
| **Art direction** | 12 composition directions, anti-generic checklist, idea test, copy rules |
| **Motion** | 15 recipes: preloader, line reveals, pinned scenes, horizontal scroll, clip-path reveals, colour chapters, marquee, magnetic buttons, custom cursor, hover masks, page transitions |
| **Depth** | Dependency-free WebGL depth-map hero, text-behind-subject sandwich, gooey cursor blobs, Three.js, video and Rive notes |
| **Image to code** | Probe, tile, ruler, palette, crop, then a diff loop with measurable targets |
| **Quality gates** | Real-browser inspector, reduced-motion and blocked-CDN passes, accessibility and performance budgets |
| **Starter site** | Working base with preloader, Lenis + GSAP, reveals, pinned and horizontal scenes, marquee, cursor |

## Install

Pick one. All methods install the same skill.

### Claude Code plugin (recommended)

Inside Claude Code:

```text
/plugin marketplace add jocaaurudo67-design/incridible-skill
/plugin install incridible-skill@incridible-skill
```

Or from a terminal:

```bash
claude plugin marketplace add jocaaurudo67-design/incridible-skill
claude plugin install incridible-skill@incridible-skill
```

Plugin skills are namespaced, so you can also call it explicitly with `/incridible-skill:incridible-skill`.

### Skills CLI (any agent that reads `SKILL.md`)

```bash
npx skills add jocaaurudo67-design/incridible-skill
```

### Installer scripts

macOS and Linux:

```bash
git clone https://github.com/jocaaurudo67-design/incridible-skill.git
cd incridible-skill
./install.sh              # to ~/.claude/skills
./install.sh --project    # to ./.claude/skills in the current project
```

Windows (PowerShell):

```powershell
git clone https://github.com/jocaaurudo67-design/incridible-skill.git
cd incridible-skill
.\install.ps1             # to $HOME\.claude\skills
.\install.ps1 -Project    # to .\.claude\skills in the current project
```

Remove it with `./install.sh --uninstall` or `.\install.ps1 -Uninstall`.

### Manual copy

Copy the folder `skills/incridible-skill` into `~/.claude/skills/` (user-wide) or `<project>/.claude/skills/` (one project).

### Claude app (web, desktop)

Download [`dist/incridible-skill.skill`](dist/incridible-skill.skill) and add it from the Skills section of Claude's settings. Menu names vary by plan.

## Usage

The skill triggers on its own when you ask for premium, animated or award-style sites. You can also name it.

```text
Build a one-page site for a specialty coffee roaster in Leipzig. Use incridible-skill:
dark room direction, GSAP scroll scenes, a signature interaction, and verify in the browser.
```

```text
Here is a screenshot of the design (ref.png). Recreate it pixel-faithfully, then add the
motion it implies. Use incridible-skill and report the diff numbers.
```

```text
Redesign this landing page so it stops looking AI-generated. Keep the stack and the content.
```

```text
Faça um site nível Awwwards para a minha marca de skate, com preloader, scroll horizontal e
hero com profundidade.
```

When you are inspired by a live site, the skill studies its technique and structure. It does not copy its photos, logos, text or brand.

## How it works

1. **Inventory and brief.** Eight to twelve specifics only this client has, written as claims with proof.
2. **Direction.** One composition direction, palette, type pair and motion character, fixed as tokens.
3. **Idea and signature moment.** One sentence that fails for the nearest competitor, and one thing the visitor can do.
4. **Foundations.** Fluid type and spacing scales, grid, responsive plan (mobile as its own composition).
5. **Layered build.** Static first, then motion, then depth, then polish.
6. **Image to code** when a visual reference exists.
7. **Gate.** Real-browser inspection at 1440, 768 and 390 px, then a look-and-fix loop scored with the Awwwards weights.
8. **Report.** Scores, numbers, what is placeholder, licences, and what was not verified.

Full details live in [`skills/incridible-skill/SKILL.md`](skills/incridible-skill/SKILL.md).

## Verification tools

Bundled in `skills/incridible-skill/scripts/`. They need no installs beyond what is listed.

| Script | Needs | Does |
|---|---|---|
| `shoot.mjs` | Node 22+, Chrome, Chromium or Edge | Opens the page at three widths, scrolls it, saves frames, and reports moving elements, content stuck hidden, reduced-motion failures, console errors, broken images, overflow, headings, alt text, tap targets, LCP, CLS and weight |
| `compare.py` | Python 3, Pillow, numpy | Structural diff between a reference image and a screenshot, with a heat map and the worst regions |
| `img_probe.py` | Python 3, Pillow | Image info, tiles, pixel ruler, palette with contrast ratios, crops |

```bash
python3 -m http.server 4173 --directory my-site &
node skills/incridible-skill/scripts/shoot.mjs http://localhost:4173 --out .incridible/after
```

On Windows use `python` instead of `python3`. `shoot.mjs` exits with code 1 when any FAIL is found, so it can run in CI.

## Repository layout

```text
.claude-plugin/            plugin and marketplace manifests
skills/incridible-skill/
  SKILL.md                 workflow, rules, routing
  references/              8 reference guides
  assets/starter/          working base site
  assets/webgl/            depth-hero.js
  scripts/                 shoot.mjs, compare.py, img_probe.py
dist/incridible-skill.skill   packaged skill
tools/validate.py          repository checks (also run in CI)
install.sh, install.ps1    installers
```

## Scope and honest limits

- The inspector, the WebGL hero and the image scripts were run in headless Chrome. The GSAP, ScrollTrigger and Lenis motion layer was smoke-tested with stub libraries because the build environment had no network, so open the starter once in a normal browser to see the animations.
- WebGL was checked in software rendering. Smoothness on a real GPU is not measured.
- The references analysed so far are landonorris.com and tasteskill.dev. `why.zero.university` and `auge-xp.com` could not be opened when the skill was written and have no notes yet (see [Roadmap](#roadmap)).
- A skill raises the floor and gives the agent a process. Awards still depend on the idea, the content and the taste of whoever directs the work.

## Roadmap

- [ ] Teardowns for `why.zero.university` and `auge-xp.com`
- [ ] Optional Three.js scene starter
- [ ] More starter directions (colour chapters, pinned poster)
- [ ] Benchmarks against a no-skill baseline with blind comparison

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, and run `python3 tools/validate.py` before opening a PR.

## Credits and disclaimer

- Process ideas (inventory, idea sentence, real-browser inspector, look-and-fix loop) were informed by [Taste Skill](https://www.tasteskill.dev/).
- Craft notes on landonorris.com come from its public markup and public write-ups (Awwwards, DesignRush, Codrops, Syntax). This project is not affiliated with Lando Norris, McLaren, OFF+BRAND, Awwwards or Taste Skill.
- GSAP, ScrollTrigger, Lenis, Three.js and Rive belong to their respective authors and are not bundled here.

## License

[MIT](LICENSE)
