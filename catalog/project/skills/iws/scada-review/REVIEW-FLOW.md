# Review flow

Disclosed from [`SKILL.md`](SKILL.md). Read the Setup, Standards sources, and Diff scope sections there first.

## 1. Resolve the MR

Accept an MR number or a full GitLab URL; if neither was passed, ask for one.

```bash
curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID" | jq '{title, description, source_branch, target_branch, author: .author.name, state}'
```

**Done when:** you have title, description, branches, author, state.

## 2. Fetch the ticket

Extract the Jira ID from the MR title (`IWS-\d+`). If none is found, tell the user and ask whether to proceed without ticket context — don't silently skip.

```bash
curl -sf -u "$JIRA_EMAIL:$JIRA_TOKEN" "$JIRA_URL/rest/api/3/issue/$JIRA_ID" | jq -r '.fields.description.content[]?.content[]?.text // empty'
```

Turn the ticket description into an explicit checklist of what was asked — each item will need a verdict in step 5.

**Done when:** you have a checklist of concrete, individually-verifiable asks (not a paragraph summary).

## 3. Fetch the diff and build the line map

```bash
curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID/changes" | jq '.changes[] | {new_path, diff}'
```

For each file's unified diff, track which output lines are `+` (added), `-` (removed), or context, and the running `new_line` number (reset at each `@@ -a,b +c,d @@` hunk header to `c`, incrementing on every non-`-` line). Only `+` lines and touched context are in scope per the Diff scope rule in `SKILL.md`.

**Done when:** every changed file has a line map from diff position → new file line number.

## 4. Fetch existing comments (avoid duplicates)

```bash
curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID/notes?per_page=100" | jq '[.[] | select(.system == false)]'
```

**Done when:** you know which findings, if any, are already posted.

## 5. Analyze

Walk the diff file by file. For every changed hunk:

- Check it against `RULES.md` (§1–§7) in priority order (§8's table) — this is the team's real, enforced convention set.
- Check it against the standards sources rung above RULES.md for anything RULES.md doesn't cover, including [`DOTNET-BEST-PRACTICES.md`](DOTNET-BEST-PRACTICES.md) for modern-language/SOLID/system-design gaps.
- Mark any pre-existing violation the diff merely touches (doesn't introduce) as a **carry-over** — not blocking, propose the better shape.
- Cross off checklist items from step 2 as you find evidence they're satisfied; anything left unchecked after the full diff is a spec gap, not a style note.

A finding needs: file, `new_line`, category (from RULES.md §1–§7, or "spec gap" for unmet ticket items), priority (🔴🟠🟡🟢 per RULES.md §8, spec gaps default 🔴), the comment text, and whether it's a carry-over.

**Done when:** every changed file has been walked, every checklist item from step 2 has a yes/no verdict with evidence (file:line or "not found in diff"), and no finding lacks a file:line.

## 6. Present and confirm

Show findings grouped by priority, ticket checklist with verdicts, and a "what's done well" section. Ask: "Šta da pošaljem? Sve nalaze, samo kritične/visoke, ili odaberi brojeve?" **Never post anything before this confirmation.**

## 7. Post inline comments

```bash
VERSIONS=$(curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID/versions")
BASE=$(echo "$VERSIONS" | jq -r '.[0].base_commit_sha')
START=$(echo "$VERSIONS" | jq -r '.[0].start_commit_sha')
HEAD=$(echo "$VERSIONS" | jq -r '.[0].head_commit_sha')

curl -sf -X POST -H "PRIVATE-TOKEN: $GITLAB_TOKEN" -H "Content-Type: application/json" \
  "$API/merge_requests/$MR_ID/discussions" \
  -d "{\"body\": \"$BODY\", \"position\": {\"base_sha\": \"$BASE\", \"start_sha\": \"$START\", \"head_sha\": \"$HEAD\", \"position_type\": \"text\", \"new_path\": \"$FILE\", \"new_line\": $LINE, \"old_path\": \"$FILE\"}}"
```

Skip any finding that duplicates an existing comment from step 4. Sleep ~300ms between posts (rate limiting).

**Done when:** every confirmed finding has either been posted or explicitly skipped as a duplicate.

## 8. Offer draft

If any 🔴 or 🟠 finding was posted, offer to mark the MR as draft (`PUT` with `{"title": "Draft: <original title>"}` if the `draft` field isn't supported by this GitLab version).
