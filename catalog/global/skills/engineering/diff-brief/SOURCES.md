# Sources

Disclosed from [`SKILL.md`](SKILL.md) step 1, for the case where the argument is an MR or PR link instead of a git ref. Plain git needs nothing from this file.

The goal in every branch is the same three things: `$BASE`, the hunk inventory, and the spec candidate (the description). Once you have them, step 2 continues identically.

## GitLab

```bash
API="https://$HOST/api/v4/projects/$(printf '%s' "$PROJECT_PATH" | jq -sRr @uri)"

curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID" \
  | jq '{title, description, source_branch, target_branch, state}'

curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID/versions" \
  | jq -r '.[0] | .base_commit_sha'          # this is $BASE
```

The description is the spec candidate for step 3. Fetch the diff locally once `$BASE` is known (`git fetch origin "$SOURCE_BRANCH"`), so anchors hydrate against real files rather than against API text.

If the branch is not available locally, fall back to the API diff:

```bash
curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID/changes" \
  | jq '.changes[] | {new_path, diff}'
```

and build the hunk inventory from each file's `@@` headers. In this mode anchors hydrate from the fetched blobs, not from the worktree.

## GitHub

```bash
gh pr view "$PR" --json title,body,baseRefName,headRefName,state
BASE=$(git merge-base "origin/$(gh pr view "$PR" --json baseRefName -q .baseRefName)" "$HEAD_SHA")
gh pr diff "$PR" --patch
```

`body` is the spec candidate.

## Plain git

Covered inline in `SKILL.md` step 1. A commit hash, tag, branch name or `HEAD~5` passed as an argument replaces `$BASE` directly; verify it with `git rev-parse` before going further, so a bad ref fails here rather than inside a sub-agent.
