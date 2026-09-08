---
name: setup-agent-skills
description: Scaffold the per-repo files that to-spec, to-tickets, research, wayfinder, and code-review read — where issues/specs live and where domain docs live — and migrate any existing specs, PRDs, issue lists, or research notes into that structure. Use when docs/agents/issue-tracker.md or docs/agents/domain.md is missing and another skill needs it, or the user wants to set up, reconfigure, or migrate a repo's agent-skill scaffolding.
---

Scaffolds the per-repo files that `to-spec`, `to-tickets`, `research`, `wayfinder`, and `code-review` read: where issues and specs live (`docs/agents/issue-tracker.md`) and where domain docs live (`docs/agents/domain.md`). Prompt-driven, not a script — explore, present findings, confirm with the user section by section, then write. The same process handles a greenfield repo (nothing exists yet) and a brownfield one (existing docs need moving into place, including ones a prior `CLAUDE.md`/`AGENTS.md` setup already left behind).

## 1. Explore

Read whatever exists; don't assume.

- `CLAUDE.md` and `AGENTS.md` at the repo root — does either exist, and does either already have an `## Agent skills` section?
- `docs/agents/issue-tracker.md` and `docs/agents/domain.md` — has this skill already run here?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root, and `docs/adr/` / any `src/*/docs/adr/` directories — more than one context or ADR directory is a monorepo signal.
- `.scratch/` — a sign the local-markdown tracker convention is already in use.
- **Stray docs**: specs, PRDs, RFCs, issue/ticket lists, and research notes that exist but sit outside the structure above — loose `*.md` at the repo root or under `docs/`, `specs/`, `tickets/`, `research/`, anything that reads like one of these but isn't already at the path this skill would put it. Note each one's apparent kind (spec/PRD, issue list, research, ADR, glossary) and current path.
- **`@`-references** to any stray doc found above: grep every markdown file in the repo, not just `CLAUDE.md`/`AGENTS.md`, for `@path/to/that/file`. These break silently once the file moves, and step 4 must fix them.

## 2. Present findings and ask

Summarise what's present and missing, then take the sections below in order — one section, one answer, then the next. Lead each with the recommended answer so the user can accept it in a word; give a one-line explainer only when the choice genuinely branches. Skip a section entirely when exploration already settled it.

### Section A — Issue tracker

Recommended: **local markdown** — issues, specs, and research live as files under `.scratch/<feature-slug>/` in this repo. Full convention, to draft into `docs/agents/issue-tracker.md`: [TRACKER-LOCAL.md](TRACKER-LOCAL.md).

Ask instead only if exploration shows a real tracker already in use (`.github/ISSUE_TEMPLATE/`, a Linear/Jira integration, issue numbers in commit messages that resolve on a live tracker, …). Confirm which one, then draft the doc from [TRACKER-EXTERNAL.md](TRACKER-EXTERNAL.md).

### Section B — Domain docs

Default to **single-context**: one `CONTEXT.md` + `docs/adr/` at the repo root. This fits almost every repo; draft it without asking, using this template for `docs/agents/domain.md`:

```md
# Domain docs

Layout: single-context.

- Glossary: `CONTEXT.md` (repo root)
- ADRs: `docs/adr/`

Format, glossary rules, and ADR rules are owned by the `domain-modeling` skill. Read `CONTEXT.md` before writing code that touches this repo's domain language, and respect ADRs in the area you're touching.
```

Offer **multi-context** only when exploration found monorepo signals — a root `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files:

```md
# Domain docs

Layout: multi-context.

- Map: `CONTEXT-MAP.md` (repo root) — lists each context and where it lives
- Per-context glossary: `<context-path>/CONTEXT.md`
- Per-context ADRs: `<context-path>/docs/adr/`

Format, glossary rules, and ADR rules are owned by the `domain-modeling` skill. Read the relevant context's `CONTEXT.md` before writing code that touches it, and respect its ADRs.
```

Confirm which layout applies before writing.

### Section C — Migration (brownfield only)

Skip this section if step 1 found no stray docs.

For each stray doc, propose its new home per [MIGRATION.md](MIGRATION.md) and present the batch as one table: current path → proposed path → kind. Include every `@`-reference that will need updating alongside it. Let the user accept the whole table in one word, or edit individual rows.

## 3. Confirm and edit

Show the user a draft of everything step 4 is about to write or move:

- The `## Agent skills` block (below)
- The contents of `docs/agents/issue-tracker.md` and `docs/agents/domain.md`
- The migration table from Section C, if any

Let them edit before writing.

<agent-skills-block>

```md
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Domain docs

[one-line summary of layout: "single-context" or "multi-context"]. See `docs/agents/domain.md`.
```

</agent-skills-block>

## 4. Write

Pick the file to edit: if `CLAUDE.md` exists, edit it; else if `AGENTS.md` exists, edit it; if neither exists, ask the user which to create — don't pick for them. Never create one when the other already exists; always edit the one that's there. If an `## Agent skills` block already exists, update its contents in place rather than appending a duplicate, and don't touch the surrounding sections.

Then, in order:

1. Write `docs/agents/issue-tracker.md` and `docs/agents/domain.md` from the confirmed drafts.
2. If Section C produced a migration table, execute it: `git mv` each stray doc to its new path (preserving history), splitting any combined issue list into one file per ticket as it lands. Then update every `@`-reference found in step 1 to the new path. Report any reference you couldn't safely resolve (ambiguous relative path, reference inside a generated file) instead of guessing — leaving it stale and flagged beats a wrong rewrite.

## 5. Done

Tell the user setup is complete and which skills now read from these files. They can edit `docs/agents/*.md` directly later; re-running this skill is only needed to switch trackers, change the domain-docs layout, or migrate more stray docs later.
