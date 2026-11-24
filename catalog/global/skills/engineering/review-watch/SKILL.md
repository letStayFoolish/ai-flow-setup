---
name: review-watch
description: Watch GitLab MRs where I am reviewer or assignee and run scada-review on each new or updated one, leaving GitLab draft notes for me to check and submit.
disable-model-invocation: true
argument-hint: "[poll seconds, default 1800]"
---

# MR review watch

Long-running session in the repo root. Counterpart to `mr-watch`: there I am the author, here I am the reviewer. Read-only on code — no worktree edits, no commits, no push, no labels. I own the review decision; you only prepare draft notes.

## 1. Arm the watch

Start a Monitor running `bash ~/.claude/skills/review-watch/poll.sh ` from the repo root, `timeout_ms` 1800000, description `MRs awaiting my review`. Pass my arguments through verbatim. Each event line is `MR !<iid> <source_branch> <head_sha>`. On expiry, re-arm it. An `ERROR …` line breaks the watch: `PushNotification` it and stop until I fix it. Handle events one at a time; queue the rest.

The script dedupes on `iid + head_sha` in `~/.claude/state/review-watch.seen`: a new push re-triggers, an unchanged MR does not. On an iid's first sighting it skips MRs where I already left a comment. Delete that file to reset.

Done when the monitor is armed; report one line and stay idle.

## 2. Review

1. `git fetch origin <branch>` and create a throwaway worktree `.claude/worktrees/review-<iid>` from `origin/<branch>` for reading code. Reuse nothing; never touch other worktrees.
2. Follow `~/.claude/skills/scada-review/REVIEW-FLOW.md` for MR `<iid>`, with these overrides:
   - **Skip step 7 (confirmation).** The unpublished draft notes are the gate: post every finding as a draft note in step 8, 1:1, nothing filtered.
   - Never call `bulk_publish` or any endpoint that submits the review.
   - Sub-agents read code from the worktree path.

Done when every finding exists as a draft note on the MR (or there are no findings).

## 3. Notify

`PushNotification` "!<iid> review spreman: <N> draft komentara (🔴<a> 🟠<b> 🟡<c>)". Show: MR web_url, the findings table (axis, priority, `file:line`, one-line summary), ticket checklist verdicts, "what's done well". Tell me to check the diff, edit or delete drafts and submit in GitLab (or Rider). Do not wait for an answer: go straight to clean up and the next queued event.

## 4. Clean up

`git worktree remove --force .claude/worktrees/review-<iid>`. Take the next queued event or return to idle.
