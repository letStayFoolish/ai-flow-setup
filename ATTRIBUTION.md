# Attribution

Some entries in `catalog/` are **not original work** — they are reused, largely
as-is (with only minimal, mechanical edits where noted), from other open-source
sources. This file tracks provenance so nothing here is mistaken for original
authorship.

## Skills sourced from `mattpocock/skills`

The following skills under `catalog/global/skills/` originate from
[mattpocock/skills](https://www.skills.sh/mattpocock/skills) by Matt Pocock,
installed originally via `npx skills@latest add mattpocock/skills`, and are
distributed here under that project's MIT license (see
`catalog/global/skills/UPSTREAM-LICENSE-mattpocock-skills.txt`):

| Skill | Notes |
| --- | --- |
| `code-review` | Adapted — structural design lens added to the smell baseline and the Standards sub-agent brief |
| `codebase-design` | Reused as-is |
| `domain-modeling` | Reused as-is |
| `grill-me` | Reused as-is |
| `grill-with-docs` | Reused as-is |
| `grilling` | Reused as-is |
| `handoff` | Reused as-is |
| `implement` | Adapted — pre-implementation structure check added |
| `improve-codebase-architecture` | Reused as-is |
| `prototype` | Reused as-is |
| `research` | Reused as-is |
| `tdd` | Reused as-is |
| `teach` | Reused as-is |
| `to-spec` | Reused as-is |
| `to-tickets` | Reused as-is |
| `wayfinder` | Reused as-is |
| `writing-for-agents` | Reused as-is |
| `wait-what` | Reused as-is |

Each of these skill folders also carries its own `ATTRIBUTION.md`.

Full credit for design and authorship of these skills belongs to Matt Pocock.
If you rely on them heavily, consider going to the source and supporting the
original project directly.

## Sources informing original rules

These entries are **original writing**, but their framing is derived from a
named source and the debt is worth recording:

| Entry | Source |
| --- | --- |
| `catalog/global/rules/design-patterns.md` | Alexander Shvets, *Dive Into Design Patterns* (Refactoring.Guru, 2021), chapters "Software Design Principles" and "Catalog of Design Patterns" — plus the Gang of Four pattern set it documents. The applicability triggers, cost lines, and confusion pairs follow that book's framing; the symptom→pattern table and the anti-trigger list are original. No text is reproduced from the book. |
| `catalog/global/skills/engineering/code-review/` smell baseline | Martin Fowler, *Refactoring*, ch. 3 (as inherited from the upstream skill) |

## How to add a new reused skill

When adding another skill copied (or adapted) from an external source to the
catalog, see `CONTRIBUTING.md` → "Adding a reused (non-original) skill" —
it must get its own `ATTRIBUTION.md` and a row in the table above.
