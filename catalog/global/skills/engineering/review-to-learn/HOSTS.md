# Diff sources

Three input shapes; detect by shape before dispatching, never ask the user which one it is.

## GitHub PR link

`https://github.com/<owner>/<repo>/pull/<n>`

`gh` takes the URL directly — no manual parsing of owner/repo/number:

```
gh pr view <url> --json title,body,commits
gh pr diff <url>
```

## GitLab MR link

`https://gitlab.<host>/<namespace>/<project>/-/merge_requests/<iid>`

No `glab` on this machine. Parse `<namespace>/<project>` and `<iid>` from the URL, then hit the REST API with the project path URL-encoded (slashes → `%2F`):

```
curl -sH "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.<host>/api/v4/projects/<namespace%2Fproject>/merge_requests/<iid>"
curl -sH "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.<host>/api/v4/projects/<namespace%2Fproject>/merge_requests/<iid>/changes"
```

`$GITLAB_TOKEN` must already be exported in the shell. If it isn't set, ask the user to export it — never ask them to paste the raw token into the conversation, and never echo its value back in chat or in the saved review file.

## Bare git ref (hash, branch, or tag)

No link at all — just a ref:

```
git rev-parse <ref>          # fails fast on a bad ref
git diff <ref>...HEAD
git log <ref>..HEAD --oneline
```

Diffs everything from `<ref>` forward to `HEAD` (three-dot, against the merge-base) — the same fixed-point mechanic `code-review` uses.
