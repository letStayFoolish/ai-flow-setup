# Migration

How to move a brownfield repo's existing docs into the structure this skill just scaffolded.

## Mapping rules

Match the stray doc's kind, not its current name or location:

- **Spec, PRD, or RFC for a single feature** → `.scratch/<feature-slug>/spec.md`. Derive `<feature-slug>` from the doc's title or filename.
- **A list of issues/tickets in one file** → split into one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered `01` in the order they appear (or in dependency order if the doc states blocking). Never leave them combined.
- **A single-ticket doc already isolated** → same path, just renumbered/slugged to fit alongside its siblings.
- **Research notes** → `.scratch/<feature-slug>/research.md` if tied to a feature already being migrated, else `.scratch/research/<slug>.md`.
- **ADRs** → `docs/adr/<NNNN>-<slug>.md` (or the per-context `docs/adr/` under `CONTEXT-MAP.md`, if multi-context). Renumber to continue the existing sequence; don't collide with numbers already in use.
- **Domain glossary content** (a "terminology," "definitions," or "glossary" doc) → merge into `CONTEXT.md` rather than just moving the file. This skill only scaffolds the location; merging glossary content is the `domain-modeling` skill's job — hand off to it rather than pasting the file in verbatim.

When a doc doesn't fit any rule above, ask the user for its new home rather than guessing.

## Updating `@`-references

After a move, every `@old/path/to/file.md` found in step 1 must become `@new/path/to/file.md` — a stale `@`-reference stops resolving silently, and the agent loses that context with no error to signal it.

1. For each moved file, grep the whole repo for its old path — any markdown file can carry an `@`-reference, not just `CLAUDE.md`/`AGENTS.md`.
2. Replace the path in place, preserving the surrounding text.
3. If a match is ambiguous (a relative `@`-reference whose base directory isn't obvious, or the same filename used by more than one moved doc), stop and ask rather than guessing — a wrong rewrite is worse than a stale reference, which at least fails visibly.
