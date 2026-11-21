---
name: verify-change
description: Verify a pushed MR/PR — spec met, ticket requirements resolved, and the change exercised live through its UI or its API.
disable-model-invocation: true
argument-hint: "[MR/PR link | iid | branch] — default: the MR/PR of the current branch"
---

# Verify change

A change is **verified** when it passes three **gates** against exactly the commit that was pushed:

1. **Spec** — the spec/PRD the work came from is met.
2. **Ticket** — every requirement of the task is resolved.
3. **Live QA** — the change was exercised in a running app: through the UI when it has one, through its API otherwise.

Each gate ends in a verdict backed by evidence. Reading code proves gates 1–2; only execution proves gate 3. Report in Serbian, technical terms and identifiers in English, every code reference as a full repo path with a line.

## 1. Resolve the pushed change

- GitHub → `gh pr view <arg> --json number,title,body,baseRefName,headRefName,headRefOid`.
- GitLab → `glab mr view <arg> --output json` (`sha`, `diff_refs.base_sha`, `source_branch`).
- No argument → the MR/PR of the current branch.

`git fetch`, then check out the PR head. The local `HEAD` must equal the remote head sha and the working tree must be clean: you verify what reviewers will merge. A mismatch stops the run — tell the developer which side is ahead.

**Done when:** `$BASE` (merge-base) and `$HEAD` (= remote head sha) resolve, and you hold the changed-file list from `git diff --name-only $BASE...$HEAD`.

## 2. Collect the requirements

- **Ticket** — key from the branch name, MR/PR title or description. Jira via Atlassian MCP; GitHub/GitLab issues via `docs/agents/issue-tracker.md`. Take its acceptance criteria; a ticket without explicit criteria gets them derived from its text, each marked _inferred_.
- **Spec** — the PRD linked from the ticket or MR/PR, or the spec under the location `docs/agents/issue-tracker.md` names.

Number every item and keep the source line it came from. A source you cannot find: ask the developer once; still none → that gate is `SKIPPED — nema izvora`. When ticket and spec are one document, run them as one gate and say so.

**Done when:** each available source is a numbered list, every item quoting its source line.

## 3. Gates 1–2 — static check

Send one message with one `review-spec` Agent call per source, in the background. Each prompt carries `git diff $BASE...$HEAD`, `git log $BASE..$HEAD --oneline`, the numbered list, and the brief:

> For every numbered item give one verdict — MET / PARTIAL / MISSING / WRONG — with `path:line` evidence, read end to end through the code, not from commit messages. Then list behaviour no item asked for (scope creep). Mark items whose truth only shows at runtime as `RUNTIME`. Under 400 words.

**Done when:** every item on every list has a verdict.

## 4. Pick the QA surface

- **UI** — a screen in this repo shows or drives the changed behaviour: frontend files changed, or a server change whose effect surfaces in an existing screen.
- **API** — server code with no screen in this repo that reaches it.

A diff can carry both; test each part on its own surface.

**Done when:** every changed screen and every added or changed endpoint is listed under its surface.

## 5. Gate 3 — live QA

Dispatch the `qa` agent with: MR/PR, `$BASE`, `$HEAD`, both requirement lists, the surface lists from step 4, and every PARTIAL / WRONG / `RUNTIME` item from step 3 as a case to probe. Add this bar to its prompt:

- **UI surface** — drive every UI-facing requirement in the browser (claude-in-chrome): the happy path, then empty, error and validation states. Capture a screenshot per case; read the console and failed network requests for each screen.
- **API surface** — call every added or changed endpoint against the running app. Tool, first that exists: the repo's Postman collection via `newman`, `.http` files, Swagger UI in the browser, `curl` built from the OpenAPI doc. Per endpoint: one happy-path call, one negative call (validation or auth), and for writes a follow-up read (GET or DB query) proving persistence. Evidence per call: method + path, payload, status, body excerpt.
- **Auth** — dev credentials from local config. None found → the case is BLOCKED and the developer is asked; shared/stage credentials stay untouched.
- A case counts only when executed against the running app; anything else is NOT RUN.

**Done when:** every requirement and every listed screen/endpoint has a QA row: PASS / FAIL / BLOCKED / NOT RUN.

## 6. Verdict

**VERIFIED** only when gates 1–2 are all MET (or explicitly SKIPPED) and gate 3 is all PASS. Anything else is **NOT VERIFIED**. Write the full report (template below) to `.scratch/verify/<ticket-or-short-sha>.md` either way: it is the evidence trail and the fixer's work order.

Sort every non-passing item into one class:

- **broken** — the code is wrong or incomplete: MISSING, PARTIAL, WRONG, FAIL.
- **gap** — the code cannot settle it: BLOCKED, NOT RUN, a requirement the spec leaves ambiguous, scope creep.

**Done when:** the report is saved and every non-passing item carries its class.

## 7a. NOT VERIFIED → fix loop

Hand the **broken** items to an `implementer` Agent. Pass pointers only: the report path as its ticket, the spec and ticket, the branch. Brief: fix exactly the broken items, each pinned by a red test first; local commits only.

Then rerun only the failed items through their own gate (step 3 or 5) on the new local `HEAD`, and update the report. Two fix rounds at most; whatever still fails after that goes to the developer.

Work beyond the broken items (a new ticket, a developer request mid-verify) gets its own Fix-rounds row and runs gate 3 like any change; the report's `$HEAD` and verdict always track the latest commit. Before the developer pushes, check the MR/PR body still describes the full scope; if not, offer `/pr`.

**Done when:** every broken item is MET/PASS, or two rounds ran. Tell the developer: what was fixed (commits), what still fails, every **gap** item with the question it needs answered, and that the fix commits are local, waiting for their push.

## 7b. VERIFIED → QA brief

The developer does manual QA next. Hand them a **brief** in the chat, under 15 lines:

- what the change does for the user, one sentence;
- how to run it: start command, URL or endpoint, test data or credentials used;
- where to look: screens or endpoints, in the order worth checking;
- the _Za ručnu proveru_ items from the report;
- the report path, for the evidence.

**Done when:** the brief is in the chat and points to the saved report.

## Report template

```markdown
# Verify: <ticket key> — <MR/PR title>
`$HEAD` <short sha> · base <short sha> · surface: UI | API | UI+API

**Verdict: VERIFIED | NOT VERIFIED** — <one line: what blocks, or "sve tri kapije prolaze">

## Gate 1 — Spec
| # | Zahtev (citat) | Verdict | Dokaz |

## Gate 2 — Ticket
| # | Acceptance criterion (citat) | Verdict | Dokaz |

## Gate 3 — Live QA
| # | Case | Surface | Result | Dokaz |

## Scope creep
## Za ručnu proveru
Cases left to the developer's judgement (visual/UX, anything not tool-drivable).

## Fix rounds
| Round | Item | Class | Commit | Result after rerun |
```

The report is complete when every item from step 2 and every screen/endpoint from step 4 appears with a verdict and evidence. It stays local; the developer decides what goes on the MR/PR.
