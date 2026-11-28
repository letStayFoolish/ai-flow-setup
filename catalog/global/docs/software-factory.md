# Software Factory — Glossary & Rules

Personal working model. Promote to `vendor/claude-shared/docs/` once proven.

## Terms

- **Software Factory** — way of working where the developer designs and maintains the production line (skills, rules, tests) instead of hand-producing each part. Not a platform.
- **Line** — one spec going from approved PRD to integration branch; one `implement-spec` run. Multiple Lines run concurrently, each on its own integration branch and worktrees.
- **Station** — a standardized step, embodied as a skill (`grilling`, `to-spec`, `to-tickets`, `implement-spec`, `tdd`, `scada-review`, `pr`).
- **Automated Check** — feedback the agent uses to verify itself without a human (red/green tests, build, `code-review`).
- **Human Gate** — a point where work stops until the developer decides: PRD approved, ticket breakdown approved, QA, review, push + MR.
- **Control Room** — optional single view of all Lines' state.
- **Factory host** — the Ubuntu work PC; Lines run there (full TDD possible). Mac is a console via Remote Control.

## Rules

- **Entry triage** — every task is sized before its first Station. **S**: one layer or a bug with a known cause, no schema change, no open domain question → `implement` (`tdd` → `code-review` → `pr`), no spec. **M**: one vertical slice, decisions mostly settled → short grilling, spec, one ticket. **L**: several slices, a schema change across layers, or open domain questions → full Line. `spec-writer` sizes it; the developer can overrule.
- **Schema ownership** — every ticket carries `Schema: yes|no`. Schema tickets form one `blocked by` chain and never run in parallel; each adds exactly one migration. Parallel migrations collide in the model snapshot.
- **Integration gate** — after the last merge, before the MR: full verify, migrations applied/rolled back/re-applied on a disposable local DB, `code-review` against the spec, `qa` pre-check against the spec's acceptance criteria. At most two fix rounds; then the Line stops.
- **QA pre-check before human review** — the developer reviews an MR that already runs. The `qa` pre-check doesn't replace the developer's QA Human Gate; it shortens it.
- **WIP limit** — max 2 active Lines and max 2 finished Lines waiting for QA/review; no new Line starts while the QA queue is full. Raise only after measuring.
- **Unattended ambiguity** — implementation detail: record under `Assumptions:` in the ticket and continue. Contradiction with PRD or domain: stop the Line and ask via Remote Control.
- **Unattended permissions** — local commits and merges into the integration branch allowed. No `git push`, no MR, no shared resources (stage DB, Kafka, Redis). Enforced via permission allowlist, not prompt.
- **Feedback into stations** — fix the code; if a finding recurs (2+ times), also fix the Station (skill, `REVIEW-RULES.md`, `CLAUDE.md`, coding standards).
- QA and code review stay human and serial — they are how the developer understands what was generated.
- **Control Room** — none for now: Remote Control session list + `git worktree list`. Revisit when moving to the team.
- **Cross-Line conflicts** — no upfront check; resolved at merge into `develop`. Tasks rarely overlap.
- **QA environment** — one monolith at a time, run from the Line's worktree (ports are fixed in tracked config). Watch for test projects binding fixed ports during parallel Lines.

## Pilot (2–3 weeks)

Per Line log: review/QA findings (and how many became Station changes), MR returned by team review (y/n), nights spent waiting on the developer.
Stop signal: returned MRs rise, or the developer no longer understands code they ship.

## Team rollout

After the pilot: share terms, rules, and skill changes via `vendor/claude-shared`; each member runs their own factory host.
Open: the developer leans long-term toward one shared factory host for the team — not decided, revisit after pilot.

## Log

Rows live in `~/.claude/factory-log.md`, outside this catalog-managed file. `implement-spec` appends a row per Line, `review-responder` one per MR returned by a reviewer; the developer fills `MR returned` and nights waiting. Header:

| Date | Line (Jira) | Size | Findings → Station that missed it | Fix rounds | → Station changes | MR returned | Nights waiting |
|---|---|---|---|---|---|---|---|

Review the log at the end of the pilot and whenever a Station is changed.
