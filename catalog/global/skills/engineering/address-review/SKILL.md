---
name: address-review
description: Triage a reviewer's comments on my MR, plan and apply the accepted changes, and leave a Serbian draft reply on every thread for me to submit.
disable-model-invocation: true
argument-hint: "[MR link or iid] [gitlab username of reviewer]"
---

# Address review

Work through the review on my MR in three gated phases: **triage → plan approval → implement + draft replies**. Every reviewer thread ends with exactly one draft reply. I submit the review myself; your output stays in draft.

**Reply language:** every draft note is in Serbian, technical terms (`class`, `endpoint`, `null`, identifiers, paths) untranslated. Tone: collegial and to the point.

## 1. Collect threads

- MR: from the argument (link or iid); otherwise the MR of the current branch (`glab mr view --output json`).
- Threads: `glab api --paginate projects/:fullpath/merge_requests/<iid>/discussions`.
- Keep a thread when it is unresolved and resolvable, and — if a username was given — at least one note in it is by that user. No username → every thread with a note by someone other than the MR author.
- Existing drafts: `glab api projects/:fullpath/merge_requests/<iid>/draft_notes`. A thread that already has my draft reply is skipped and listed as such.

Done when you have the list of threads with id, author, file:line (from `position`, or "general"), and full note text including follow-ups.

## 2. Triage — analysis only, the working tree stays untouched

For each thread, read the code at the referenced position plus its callers/tests as needed, and verify the reviewer's claim against the code rather than taking it on trust. Give each thread a **verdict**:

- `menjamo` — the claim holds; state the concrete change.
- `ne menjamo` — the claim is wrong, out of scope, or a trade-off we keep; state the reason with evidence (file:line, convention, ticket scope). An out-of-scope smell becomes a proposed follow-up ticket.
- `pitanje` — the comment is ambiguous or a question; draft the clarifying question or the answer.

Done when every thread has a verdict backed by evidence you actually read — no verdict rests on the comment text alone.

Present the plan to me as a table: `#`, reviewer, file:line, comment summary, verdict, change / reason. Then **stop and wait for my approval**. I may flip verdicts; the approved table is the contract for step 3.

## 3. Implement and draft replies

1. Apply the `menjamo` changes, one thread at a time, following repo conventions. Run the build and the affected tests; report failures with output.
2. Write each reply body to a file in the scratchpad, then post it as a draft reply to its thread:

   ```bash
   glab api --method POST projects/:fullpath/merge_requests/<iid>/draft_notes \
     -f in_reply_to_discussion_id=<discussion_id> -F note=@<reply-file>.md
   ```

   Reply content by verdict:
   - `menjamo` — what changed and where (`path/File.cs:42`, new name, approach). Briefly why, if the fix differs from what the reviewer proposed.
   - `ne menjamo` — the reasoning and evidence from triage; mention the follow-up ticket if proposed.
   - `pitanje` — the answer or the clarifying question.

3. Draft notes only: publishing is mine (`bulk_publish` and plain `notes`/`discussions` POSTs stay unused).

Done when re-fetching `draft_notes` shows one new draft per approved thread, matched by `discussion_id`. Finish with a summary: files changed, build/test result, draft count, skipped threads, and proposed follow-up tickets.
