# Contributing

The skill is **awwwards-skill** (formerly incridible-skill).

Thanks for helping make this skill better. Issues and pull requests are welcome.

## What helps most

- **Teardowns** of award-winning sites, added to `skills/awwwards-skill/references/07-reference-teardowns.md` using its template. Only verified facts: stack, structure, rhythm, tokens. No copied photos, logos or text.
- **Recipes** that you shipped and measured (a motion pattern, a WebGL effect, an accessibility fix) with working code.
- **Bug reports** from real runs: the prompt you gave, what the agent built, what you expected.
- **Benchmarks**: the same brief with and without the skill, judged blind.

## Ground rules for the skill itself

- Explain why, not only what. Agents follow reasons better than rules in capitals.
- Keep `SKILL.md` under 500 lines. Put detail in `references/` and say when to read each file.
- Every code snippet must be runnable as written. Prefer small, tested snippets over long ones.
- Never add instructions that copy another site's assets, brand or text.
- Content must stay visible when scripts fail or `prefers-reduced-motion` is on.

## Development

```bash
git clone https://github.com/joca-web/incridible-skill.git
cd incridible-skill
python3 tools/validate.py        # frontmatter, paths, manifests, syntax (use `python` on Windows)
```

To try changes locally, run the installer (`./install.sh` or `.\install.ps1`) and start a new agent session.

To test the inspector on the starter:

```bash
python3 -m http.server 4173 --directory skills/awwwards-skill/assets/starters/monument
node skills/awwwards-skill/scripts/shoot.mjs http://localhost:4173 --out .awwwards/test
```

The starter intentionally fails `placeholder-left` until its placeholders are replaced.

## Pull requests

1. Branch from `main`.
2. Run `python3 tools/validate.py`.
3. If you changed `skills/awwwards-skill/`, rebuild `dist/awwwards-skill.skill and dist/awwwards-skill.plugin` (a zip of the skill folder), bump `version` in `.claude-plugin/plugin.json` and add a line to `CHANGELOG.md`. `versions/` is an archive and is not edited.
4. Describe what you tested and what you could not test.
