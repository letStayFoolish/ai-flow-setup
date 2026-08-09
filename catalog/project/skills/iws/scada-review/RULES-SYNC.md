# Rules sync

Disclosed from [`SKILL.md`](SKILL.md). Read the Setup section there first. Goal: pull real reviewer comments off recent GitLab MRs and propose additions to [`RULES.md`](RULES.md) — never write to it without confirmation.

## 1. Find the cursor

Read the `<!-- sync-cursor: ... -->` line at the top of `RULES.md`. `none` means full backfill; otherwise it's an ISO date — only fetch MRs updated after it.

## 2. Fetch recent MRs and their comments

```bash
curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "$API/merge_requests?state=merged&updated_after=$CURSOR&per_page=50&order_by=updated_at" \
  | jq '[.[] | {iid, title, updated_at}]'
```

For each MR, fetch its notes, keeping only comments from the team's two authoritative reviewers (`robert.sabo0`, `mapatovic`) — comments from anyone else (the author replying, other collaborators) aren't reviewer-pattern signal:

```bash
curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$IID/notes?per_page=100" \
  | jq '[.[] | select(.system == false) | select(.author.username == "robert.sabo0" or .author.username == "mapatovic") | {author: .author.username, body}]'
```

**Done when:** you have every `robert.sabo0`/`mapatovic` comment from every MR updated since the cursor.

## 3. Extract candidate patterns

A comment is a candidate only if it states a **general rule**, not a one-off fact about that MR's specific code. Test: strip the variable/method names — does a coherent instruction survive? "Zašto je `orderId` string ovde" fails the test (specific). "Zašto radimo N+1 fetch iz baze" passes (general — it's already in RULES.md §1).

For each candidate, check whether it's already covered by an existing RULES.md entry (same category, same underlying rule) — if so, it's evidence for an existing rule, not a new one. Only genuinely uncovered patterns become new entries. A pattern needs **two or more independent occurrences** (different MRs, or the same reviewer repeating it) before it's proposed — a single comment is noise, not a pattern.

**Done when:** every comment since the cursor has been classified as (a) matches an existing rule, (b) one-off/not a pattern, or (c) new candidate with ≥2 occurrences.

## 4. Draft the diff

For each new candidate, draft a `RULES.md` entry in the existing format (heading, quoted excerpts, **Pravilo:**) under the right numbered section (§1–§7), and a row for §8's priority table. Don't touch existing entries unless a new occurrence contradicts one — flag contradictions explicitly rather than silently overwriting.

## 5. Present and confirm

Show the user: MRs scanned, comments classified, and the proposed `RULES.md` diff (new sections + priority table rows). Ask for confirmation before writing anything.

**Done when:** the user has explicitly approved, rejected, or edited each proposed entry — never write on an assumed yes.

## 6. Apply

On approval: edit `RULES.md` with the confirmed entries, update the `<!-- sync-cursor: ... -->` line to today's date (ISO `YYYY-MM-DD`), and append a row to §10's sync log (date, MRs scanned, rules added/changed).
