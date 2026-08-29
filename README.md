# ai-flow-setup

Pull your Claude Code AI-flow — global `CLAUDE.md`, rules, skills, and
commands — into any machine or project, without a manual copy-paste ritual
and without clobbering work you already have in place.

```bash
# Browse the catalog interactively
npx github:letStayFoolish/ai-flow-setup

# Or install specific skills/rules/docs directly by name — no prompts
npx github:letStayFoolish/ai-flow-setup grilling code-review
```

## What it does

1. **No args** → lets you pick which rules, skills, and docs to pull from an
   interactive multiselect, grouped by scope (`global` → `~/.claude/...`,
   `project` → `./...`) and type.
2. **Args given** → installs exactly those catalog entries by name, no
   prompts. A name is either a skill's name (`grilling`), a rule/doc's
   filename without extension (`clean-code`), or — if that's ambiguous
   across scopes — the entry's full id as reported in the error (e.g.
   `global:CLAUDE.md`).
3. **Never silently overwrites.** For any destination file that already
   exists and differs from the incoming version, it shows a unified diff and
   asks:
   - **Keep existing** — do nothing
   - **Overwrite** — replace with the incoming version
   - **Merge** — append only the incoming lines missing from the existing file
   - **Skip** — leave it for later

Files that don't exist yet are created directly; files that are byte-identical
are left alone and reported as unchanged.

Global skills install by copying into `~/.claude/skills` by default. Pass
`--mode symlink-global` (symlink to a centrally-updatable copy) or
`--mode project-local` (install into `./.claude/skills` instead) to change
that.

## Example

```
$ npx github:letStayFoolish/ai-flow-setup grilling
┌  ai-flow-setup
│
●  Global setup found at /Users/you/.claude
│
◆  created /Users/you/.claude/skills/grilling/SKILL.md
│
└  Done.
```

## Learn the flow

[`docs/ai-coding-guide.pdf`](./docs/ai-coding-guide.pdf) walks through the
7-step AI-coding flow these skills and rules are built around, and how to use
them day to day. Read it before your first `npx github:letStayFoolish/ai-flow-setup`
run if the skill names above don't mean anything yet.

## Catalog contents

See `catalog/global/` (installs under `~/.claude/`) and `catalog/project/`
(installs into the current project). Some skills are reused from
[mattpocock/skills](https://www.skills.sh/mattpocock/skills) rather than
original to this repo — see [`ATTRIBUTION.md`](./ATTRIBUTION.md) for the
full list and license.

## Contributing / maintaining the catalog

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for how to add, remove, or update
a skill or `.md` file, and how the `catalog:build` step ties it all together.

## License

MIT for this repo's own code and content. Reused third-party skills keep
their original license — see [`ATTRIBUTION.md`](./ATTRIBUTION.md).
