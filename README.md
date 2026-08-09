# ai-flow-setup

Pull your Claude Code AI-flow — global `CLAUDE.md`, rules, skills, and
commands — into any machine or project, without a manual copy-paste ritual
and without clobbering work you already have in place.

```bash
npx github:letStayFoolish/ai-flow-setup
```

## What it does

1. **Detects your setup**:
   - Checks whether `~/.claude` already exists (global Claude Code config).
   - Checks the current project for `CLAUDE.md` / `CONTEXT-MAP.md` /
     `CONTEXT.md` to decide if it's **greenfield** (nothing yet) or
     **brownfield** (already has AI-flow files) — and asks you to confirm.
2. **Lets you pick** which rules, skills, and docs to pull, grouped by scope
   (`global` → `~/.claude/...`, `project` → `./...`) and type.
3. **Never silently overwrites.** For any destination file that already
   exists and differs from the incoming version, it shows a unified diff and
   asks:
   - **Keep existing** — do nothing
   - **Overwrite** — replace with the incoming version
   - **Merge** — append only the incoming lines missing from the existing file
   - **Skip** — leave it for later

Files that don't exist yet are created directly; files that are byte-identical
are left alone and reported as unchanged.

## Example

```
$ npx github:letStayFoolish/ai-flow-setup
┌  ai-flow-setup
│
●  Global setup found at /Users/you/.claude
│
◆  Detected a fresh (greenfield) project. Confirm?
│  ● Greenfield — no CLAUDE.md/CONTEXT-MAP.md yet
│
◆  Select what to pull into place (space to toggle, enter to confirm):
│  ◼ [global/rule] clean-code.md
│  ◼ [global/skill] grilling
│  ◻ [project/doc] CLAUDE.md
│
◆  rules/clean-code.md already exists and differs. What do you want to do?
│  ● Merge — append missing incoming lines to existing file
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
