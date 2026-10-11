---
name: review-to-learn
description: Walk an MR/PR (or a local git ref) against pasted AC with the reviewer kept in the loop — guessing before every reveal — so reviewing AI-written code keeps building the reviewer's own ability to write it. Two passes, Requirements axis and Implementation axis. Narrative in Serbian; code, identifiers, commands, and principle names stay untranslated.
disable-model-invocation: true
argument-hint: "<MR/PR link, or git ref/hash/branch/tag> — then paste the AC/task text"
---

# Review to Learn

`code-review` already automates the gate-to-merge verdict well. This skill exists for the opposite reason: the reviewer isn't writing this code, and a review that's just read to them keeps that muscle idle — semantics, naming, control-flow instinct, all the things that atrophy when the only motion left is nodding at someone else's (or an agent's) diff.

So the reviewer answers before you do, every time there's something to retrieve. You're not grading them — a wrong guess is the point firing, not a failure.

Stays in the main conversation rather than parallel sub-agents — the back-and-forth below only works with continuity.

**Language split, applies to every section below:** narrative in Serbian. Code, identifiers, commands, file paths, and principle/pattern names stay untranslated — translating `Feature Envy` or a variable name manufactures confusion nobody asked for.

## 0. The guess-first loop

Governs steps 2 and 3. Before you reveal a verdict, an explanation, or a smell name: show the relevant code/requirement and ask the reviewer's own call first. Wait for their reply — never answer on their behalf, never reveal and ask "does that make sense?" afterward, that's not retrieval.

Skip the loop only where there's genuinely nothing to retrieve — renames, import reshuffles, formatting-only hunks.

When the answer is wrong or partial, don't just correct it: ask one narrower follow-up (point at the specific line, or ask what a specific variable holds at that point) before giving the direct answer. One follow-up, not a cross-examination — give the answer after it regardless of outcome.

Once per review, for the single most non-trivial piece of logic in the diff, raise the stakes: before showing the actual implementation, ask the reviewer to sketch in words (or in code, their call) how *they'd* have written it. Compare their version against the real one together — this is the one moment that exercises production, not just recognition.

## 1. Resolve the diff

Detect the input shape — GitHub PR link, GitLab MR link, or a bare git ref (hash/branch/tag) — and fetch accordingly. See [HOSTS.md](HOSTS.md) for the exact command per shape.

Done when: the diff is non-empty and, for a bare ref, `git rev-parse` resolved it. A bad ref or empty diff fails here, not three steps in.

Also pull the PR/MR title + description if one exists — it sometimes carries the AC already, which saves asking in step 2.

## 2. Requirements axis

The user pastes the AC/task text in the prompt. If it's missing and the PR/MR description from step 1 didn't carry it, ask once before going further.

Restate the AC back in your own words first, one line per requirement, in Serbian — a comprehension check for you before touching the diff, not filler.

Then, per the guess-first loop (step 0): for each requirement, ask the reviewer to call it — ✅ met, ⚠️ partial, or ❌ missing — before you do. Once they've answered, give your own verdict, citing the file/line that earns it, and reconcile any gap between their guess and yours out loud.

Anything implemented that no requirement asked for is scope creep, not a verdict — flag it separately as ➕ **van zahteva** (no guess needed, the reviewer can't predict what wasn't asked for).

Done when: every pasted requirement carries exactly one tag, and the reviewer guessed before each one that wasn't scope creep.

## 3. Implementation axis

Walk the diff file by file, not a wall of hunks at once. Pause after each file for questions before moving to the next.

For each file, in Serbian, per the guess-first loop (step 0):

- Sketch the change — shape-match the sketch to what changed: call-tree, component-tree, file-tree, or pseudocode, `diff`-fenced with `+`/`-`, per the forms in `~/.claude/skills/pr/SKILL.md`'s Summary section. Fall back to a trimmed raw hunk only when no structural shape fits.
- Ask what the reviewer thinks it does and why, before you explain it.
- Ask whether they spot anything worth flagging — good or bad — before you name one yourself.
- **Good code** — name what's worth modeling after and the principle it demonstrates.
- **Bad code / smells** — quote the hunk, name the principle or smell it breaks, sketch what better looks like.

Ground every principle/pattern name against `~/.claude/docs/clean-code.md` and `~/.claude/docs/design-patterns.md` — read them before naming one, don't invent a label that isn't in either.

Done when: every file in the diff has been walked with a guess asked before each reveal, each file carries at least one good-or-bad call-out or an explicit "ništa posebno ovde," and the once-per-review write-it-yourself moment happened on the diff's most non-trivial piece of logic.

## 4. Save the record

Write the full walkthrough (both axes) to `.scratch/reviews/<slug>.md`, `<slug>` = PR/MR number or short commit hash, plus date. Include the reviewer's guesses alongside the reveals, not just the final verdicts — the gap between the two is what's worth rereading later. Same Serbian/English split as the chat output.
