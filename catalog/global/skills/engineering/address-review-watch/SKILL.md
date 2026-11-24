---
name: address-review-watch
description: Watch my open GitLab MRs for the `agent-ready` label and run address-review on each one, gated by my plan approval and push approval.
disable-model-invocation: true
argument-hint: "[label, default agent-ready] [poll seconds, default 1800]"
---

# address-review-watch

Long-running session in the repo root. I put the `agent-ready` label on an MR of mine when its review comments are ready for you. Each MR goes through four gates: **pick up → plan approval → diff approval → push**. You own the label and the worktree; I own the approvals, the push decision, and publishing the draft replies.

Label lifecycle: `agent-ready` (mine) → `agent-working` (yours, at pickup) → removed after push. I re-add `agent-ready` for the next review round.

## 1. Arm the watch

Start a Monitor running `bash ~/.claude/skills/address-review-watch/poll.sh $ARGUMENTS` from the repo root, `timeout_ms` 1800000, description `agent-ready MRs`. Pass my arguments through verbatim; with none, the script's defaults apply (`agent-ready`, 1800s). Each event line is `MR !<iid> <source_branch>`. On expiry, re-arm it. An `ERROR …` line ends or breaks the watch: `PushNotification` it and stop until I fix it. On an event, pick up that MR; while one MR is in flight, queue new events and take them in order once it is pushed or dropped.

Done when the monitor is armed; report one line and stay idle.

## 2. Pick up

1. `glab mr update <iid> --unlabel agent-ready --label agent-working`.
2. Worktree at `.claude/worktrees/mr-<iid>`:
   - `git fetch origin <branch>`.
   - Branch already checked out in another worktree (`git worktree list`) and clean → use that worktree. Dirty → `PushNotification` "!<iid>: grana <branch> zauzeta u <path>, preskačem", label back to `agent-ready`, next event.
   - Otherwise `git worktree add -B <branch> .claude/worktrees/mr-<iid> origin/<branch>`.
3. Spawn the `review-responder` agent with: MR iid, the worktree's absolute path as the only place to read and change code, no reviewer filter.

Done when review-responder returns its verdict table.

## 3. Plan gate

`PushNotification` "!<iid>: plan spreman — <N> threadova (<x> menjamo / <y> ne menjamo / <z> pitanje)". Show the table verbatim and wait. I approve, flip verdicts, or say drop (→ step 6 without pushing). Resume the same agent via SendMessage with the approved table.

Done when review-responder returns its final summary.

## 4. Diff gate

`PushNotification` "!<iid> gotovo: build <ok|FAIL>, testovi <ok|FAIL>, <N> draftova". Show:
- the agent summary (files, build/test output on failure, skipped threads, follow-up tickets);
- `git -C <worktree> status --short` and `git -C <worktree> diff --stat`;
- the worktree path, so I can open it in Rider.

Wait. I ask for changes (resume the agent with them, stay in this step) or say push.

## 5. Push

1. In the worktree: commit with the `granular-commits` skill, one commit per review concern, message referencing the ticket key from the branch name.
2. `git -C <worktree> push origin <branch>` — permission prompt is the final gate.
3. `glab mr update <iid> --unlabel agent-working`.
4. Remind me: "Objavi draftove: <MR web_url>" — publishing the drafts sends the reviewer the replies.

Done when the push succeeded and the label is gone.

## 6. Clean up

Remove a worktree this skill created (`git worktree remove .claude/worktrees/mr-<iid>`); leave a reused one in place. On drop, also `glab mr update <iid> --unlabel agent-working` and discard the worktree's changes. Take the next queued event or return to idle.
