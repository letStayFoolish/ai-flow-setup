# Review flow

Disclosed from [`SKILL.md`](SKILL.md). Read the Setup, The three axes, and Diff scope sections there first.

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

## 5. Spawn all three axis sub-agents in parallel

Send **one message with three `Agent` tool calls** — Standards, Best Practices, Spec — using the `general-purpose` subagent for each. They must not share context; each gets only what its prompt carries.

Every prompt carries: the diff (from step 3, with new_line numbers already mapped), the Diff scope rule (findings must trace to a touched line; pre-existing issues merely touched are carry-overs, not blocking), and the finding format each must return — `file`, `new_line`, category, priority (🔴🟠🟡🟢), comment text, carry-over flag (yes/no).

**Standards sub-agent prompt** — include:
- The full diff, mapped to `new_line`.
- The complete text of `RULES.md` §1–§8 (priority table), and the generic `~/.claude/rules/*.md` files listed in SKILL.md's Standards row, and the repo-root `CLAUDE.md`.
- Brief: "Check every changed hunk against RULES.md §1–§7 first (priority per §8's table), then against the generic rules files and CLAUDE.md for anything RULES.md doesn't cover. RULES.md always wins on conflict. Mark violations the diff merely touches (doesn't introduce) as carry-over. Return one finding per line using the format above. Under 400 words."

**Best Practices sub-agent prompt** — include:
- The full diff, mapped to `new_line`.
- The complete text of `DOTNET-BEST-PRACTICES.md`.
- Brief: "Check every changed hunk against DOTNET-BEST-PRACTICES.md — modern C#/.NET, EF Core, SOLID, design-pattern practice. Run this independent of any repo-specific convention; if a best practice looks like it conflicts with something repo-specific, still report it and note the possible conflict rather than silently dropping it. Mark violations the diff merely touches as carry-over. Return one finding per line using the format above. Under 400 words."

**Spec sub-agent prompt** — include:
- The full diff, mapped to `new_line`.
- The Jira ticket checklist built in step 2.
- Brief: "Cross off each checklist item as you find evidence in the diff it's satisfied (file:line). Report: (a) checklist items with no evidence in the diff — spec gap, priority 🔴 unless the ticket marks it optional; (b) diff behaviour not asked for by any checklist item — scope creep; (c) checklist items that look addressed but where the implementation looks wrong. Return one finding per line using the format above, category always 'spec gap' or 'scope creep'. Under 400 words."

**Done when:** all three sub-agents have returned.

## 6. Aggregate

Merge the three finding lists. Do not rerank across axes — a Standards 🟡 and a Spec 🔴 both stay at their own priority; only sort within an axis.

Two dedup passes, in order:

1. **Cross-axis** — Standards and Best Practices run blind to each other, so the same hunk can surface twice (e.g. both flag a missing `AsNoTracking`). Same file + same line + same underlying point → merge into one finding, keep the higher priority, note both axes in its tag (`Standards + Best Practices`).
2. **Against existing comments** — drop anything that duplicates a note already on the MR from step 4.

**Done when:** one combined, de-duplicated finding list exists, each finding tagged with its originating axis (or axes, if merged).

## 7. Present and confirm

Show findings grouped by axis, then by priority within axis; ticket checklist with verdicts; and a "what's done well" section. Ask: "Šta da pošaljem? Sve nalaze, samo kritične/visoke, ili odaberi brojeve?" **Never post anything before this confirmation.**

## 8. Post inline comments

```bash
VERSIONS=$(curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID/versions")
BASE=$(echo "$VERSIONS" | jq -r '.[0].base_commit_sha')
START=$(echo "$VERSIONS" | jq -r '.[0].start_commit_sha')
HEAD=$(echo "$VERSIONS" | jq -r '.[0].head_commit_sha')

curl -sf -X POST -H "PRIVATE-TOKEN: $GITLAB_TOKEN" -H "Content-Type: application/json" \
  "$API/merge_requests/$MR_ID/discussions" \
  -d "{\"body\": \"$BODY\", \"position\": {\"base_sha\": \"$BASE\", \"start_sha\": \"$START\", \"head_sha\": \"$HEAD\", \"position_type\": \"text\", \"new_path\": \"$FILE\", \"new_line\": $LINE, \"old_path\": \"$FILE\"}}"
```

Duplicates against step 4's existing comments were already dropped in step 6 — nothing further to skip here. Sleep ~300ms between posts (rate limiting).

**Done when:** every confirmed finding has been posted.

## 9. Offer draft

If any 🔴 or 🟠 finding was posted, offer to mark the MR as draft (`PUT` with `{"title": "Draft: <original title>"}` if the `draft` field isn't supported by this GitLab version).
