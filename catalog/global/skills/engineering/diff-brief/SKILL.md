---
name: diff-brief
description: One-page brief on what a change actually does — behaviour deltas anchored to code, test coverage per delta, merge danger. Markdown for the MR, HTML for you. Use when a diff lands that you must understand and own before pushing or approving.
disable-model-invocation: true
argument-hint: "[commit | MR/PR link] [spec path] [--no-open] [--md-only]"
---

# Diff brief

The reader is getting a **generated narrative about code instead of the code** — one step further from ground truth, and a well-formatted narrative is more persuasive than a diff. Every rule here keeps the document anchored to verifiable fact. Drop one for convenience and the tool ships confident-sounding noise.

Two projections of one `data.json`, different density because the audiences differ:

| | `.review/<label>.md` — the team | `.review/<label>.html` — you |
|---|---|---|
| Delta ponašanja | all | all |
| Kako teče | yes | yes |
| Code beside a claim | `file.cs:42` only | hydrated, inline |
| Pokrivenost | uncovered deltas only | full map |
| Pitanja | top 5 | all, rest collapsed |
| Merge Danger | yes | yes |
| Proveri ručno | **no** | yes — this is the exit criterion |
| Nisam utvrdio / Odbačeno | counts | full text |
| length | ~30 lines | as long as it needs |

`Proveri ručno` stays out of the markdown on purpose: what you verified before pushing is your process, not information for the MR.

| flag | effect |
|---|---|
| `--no-open` | do not open the HTML in the browser |
| `--md-only` | skip the HTML entirely |

Human-initiated only. Output feeds `~/.claude/skills/pr/SKILL.md` — one pass over the diff, two readers. Never run both skills over the same diff.

## Using this skill

**When to reach for it.** A diff landed that you must understand and own — yours from an agent, or a colleague's MR. It answers *what actually changed and what do I check*. It is not the gate-to-merge verdict (`code-review`), not a teaching pass (`review-to-learn`), and not the PR body (`pr`). One diff, one skill: if you ran `diff-brief`, feed its output to `pr` rather than running `pr` over the same diff again.

**The exit criterion is not "I read the document".** It is: brief read **and** every `Proveri ručno` step executed. A brief that produces the feeling of understanding without the steps is worse than no brief, because it retires the doubt that was doing the work. Target budget: ~5 minutes to generate, ~10 minutes to read, for an MR of 40 files. Treat those as numbers to measure against, not guarantees.

**Posting to the MR is never automatic.** Step 8 prints the `glab`/`gh` command and stops. Posting leaves your machine and your colleagues see it, so it stays one keystroke away and one decision yours. If after a few weeks you find you run it every single time, that is the evidence that earns automating it — not before.

**The trigger catalogues start out missing, and that is correct.** The skill ships generic, language-agnostic triggers and never creates, requests, or complains about `~/.claude/docs/review-triggers.md` or `docs/agents/review-triggers.md`. The first time something bites you in production, append it to the global one — that file is the only mechanism by which this tool learns from your mistakes instead of someone else's assumptions. Stack-specific knowledge (ORM tracking, DI lifetimes, async pitfalls) belongs there, never in `CHALLENGER.md`, so the skill stays usable on any language.

**Trust is bounded on purpose, and the bound is visible.** There is no Verifier pass: hydration proves the anchors resolve, nothing proves the sentences are true. That is why the hydrated code sits beside every claim and why `Odbačeno` and `Nisam utvrdio` are never hidden. Read the brief as a reading order with evidence attached — not as a verdict. Where a claim matters and its anchor looks thin, open the file.

**First run** appends `.review/` to `.gitignore`. Both projections are regenerable from `data.json`; nothing in `.review/` is worth committing.

## Process

### 1. Resolve the change

No argument → merge-base with the default branch.

```bash
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main)
BASE=$(git merge-base "$DEFAULT" HEAD)
git diff --find-renames "$BASE" --numstat
```

`git diff "$BASE"` (two-dot, no `HEAD`) includes the working tree, so uncommitted work is reviewed as a normal case. A dirty tree (`git status --porcelain`) is recorded for the header, never treated as an error.

Arguments shift only the left side: a commit hash replaces `$BASE`; an MR/PR link goes through [`SOURCES.md`](SOURCES.md); a `.md` path or pasted text is the spec (step 3).

Build the **hunk inventory** now — one `path@@-a,b+c,d` id per hunk — and keep it. Steps 2, 5 and 6 all close against it.

**Done when:** `$BASE` resolves, the label (`<ref>-<timestamp>`) is fixed, and every hunk has an id.

### 2. Bucket every hunk — git decides, never judgement

A hunk is **cosmetic** only when git proves it:

```bash
git diff -w --find-renames "$BASE" --name-only   # files that still differ ignoring whitespace
git diff --find-renames --diff-filter=R "$BASE" --name-status
```

- vanishes under `-w` → whitespace only
- `R100` under `--find-renames` → pure move
- path matches the generated/lock list: `*.lock`, `package-lock.json`, `yarn.lock`, `*.g.cs`, `*.designer.cs`, `*.min.*`, `dist/`, `obj/`, `bin/`, `*.snap`

Everything else goes to **logic** and gets analysed however trivial it looks — a real behaviour change hidden inside a reformatting commit is the exact failure this bucketing exists to catch.

**Done when:** every hunk id sits in exactly one bucket, and the two counts sum to the inventory.

### 3. Load the spec and the trigger catalogues

Spec, in order: a path passed as an argument, text the user pasted, the MR/PR description. Absent → record it; the header then says scope creep cannot be determined. A missing spec never blocks generation.

Trigger catalogues, both optional, both passed to the Challenger as text if present:

```bash
cat ~/.claude/docs/review-triggers.md 2>/dev/null      # yours, travels across projects
cat docs/agents/review-triggers.md 2>/dev/null         # the team's, lives in the repo
```

Neither existing is the normal case. Never create them, never ask for them — a skill with a setup obligation is a skill that goes unused.

**Done when:** the spec text is in hand or its absence recorded, and both catalogue paths have been checked.

### 4. Dispatch Navigator and Challenger — one message, both calls

Two `general-purpose` sub-agents in a **single message**, so they run concurrently and neither pollutes your context with the diff. No size threshold: two parallel calls cost the latency of one, and a second mode is a second thing to maintain.

**Navigator prompt:** `$BASE`, the logic-bucket hunk inventory, the output language note (claims in English), and instructions to read `NAVIGATOR.md` and `CLAIM-SCHEMA.md` at their absolute paths before starting.

**Challenger prompt:** `$BASE`, the logic-bucket hunk inventory, the spec text from step 3, the trigger catalogue text from step 3, and instructions to read `CHALLENGER.md` and `CLAIM-SCHEMA.md` first. It receives **no claims and no narrative** — an agent that sees the rationale confirms it. That is the only defence here against a model explaining its own code to itself, and it is structural, not a prompt rule.

**Done when:** every logic hunk is assigned to a `delta`, `cosmetic` or `unplaced` claim, and every Challenger trigger has been checked against the diff.

### 5. Hydrate the anchors — deterministic, no model

The agents wrote coordinates; this step fetches the text. A quote transcribed by a model is a fabrication surface, so nothing in either document is text a model retyped.

For every anchor, read the cited lines from the worktree and fill `anchors[].code`. For every hunk id, extract its patch with `git diff` and fill `hunks[].patch`.

An anchor whose path or line range does not resolve is a hallucination, not a style slip: set `verdict: "rejected"`, reason `anchor does not resolve`, **no retry**.

There is no Verifier pass in this skill — you are the verifier, and the hydrated code sits beside every claim so you can be. That makes this gate the only automated trust check, so it is never skipped.

**Done when:** every surviving claim carries real code text, and every failed hydration sits in the rejected set with its original text.

### 6. Assemble `data.json`

```json
{ "meta": { ... }, "claims": [ ... ] }
```

`meta` is computed here from the facts of steps 1–5, never authored by a model: `label`, `base`, `head`, `timestamp`, `dirty`, `spec`, `deltas`, `uncovered`, `questions`, `logicFiles`, `cosmeticFiles`, `cosmeticHunks`, `testCommand`, `rejected`, `notExamined`.

```bash
jq -c . data.json | sed 's#</script#<\\/script#g' > data.escaped.json
```

**Done when:** `jq empty` passes and `meta` counters reconcile against the claim array.

### 7. Render both projections

```bash
mkdir -p .review
jq -r -f render-md.jq data.json > ".review/${LABEL}.md"
cat head.html data.escaped.json tail.html > ".review/${LABEL}.html"
```

Both renderers are deterministic and read the same `data.json`. The markdown is never written by hand — that is what keeps the two projections from drifting apart.

Then, unless `--no-open`: `open ".review/${LABEL}.html"`.

On the first run, append `.review/` to `.gitignore` and say so in the reply.

**Done when:** both files exist, and the HTML opened unless suppressed.

### 8. Reply

Print the markdown body in the chat, then the two paths, then the ready paste-back command for the MR — **do not run it**. Posting leaves your machine and is the user's call every time:

```bash
glab mr note <MR_ID> -m "$(cat .review/<label>.md)"     # GitLab
gh pr comment <PR> --body-file .review/<label>.md       # GitHub
```

**Done when:** the user has the markdown, both paths, and the command they can run with one keystroke.

## Testing the renderers

`example-data.json` is a fixture covering every claim type. After editing `head.html`, `tail.html` or `render-md.jq`:

```bash
cd ~/.agents/skills/diff-brief
jq -r -f render-md.jq example-data.json
jq -c . example-data.json | sed 's#</script#<\\/script#g' > /tmp/d.json
cat head.html /tmp/d.json tail.html > /tmp/example.html && open /tmp/example.html
```
