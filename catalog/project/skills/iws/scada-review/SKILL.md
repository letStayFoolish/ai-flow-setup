---
name: scada-review
description: Personal GitLab MR review for inViewWebScada, scoped to the diff. Run `review <mr>` to check a merge request against RULES.md and its Jira ticket; run `sync-rules` to pull new reviewer comments off GitLab and propose additions to RULES.md.
disable-model-invocation: true
---

# scada-review

Personal reviewer for `inViewWebScada` GitLab MRs. Two branches — pick one from the argument:

- `sync-rules` → follow [`RULES-SYNC.md`](RULES-SYNC.md)
- anything else (MR number or URL, or nothing) → follow [`REVIEW-FLOW.md`](REVIEW-FLOW.md)

Both branches read [`RULES.md`](RULES.md) — the living reference of this team's real review patterns, seeded from `robert.sabo0`'s GitLab comments, extended by `sync-rules` which also mines comments from `mapatovic`. Edit only this `RULES.md`.

## Setup (both branches)

Credentials are edited in exactly one place — the `env` block of `~/.claude/settings.local.json`.

If any var is still empty after this, stop and tell the user which one — don't guess or fall back to a hardcoded value. To rotate a token: edit only `~/.claude/settings.local.json`, nothing else — the regeneration above picks it up automatically next run.

All GitLab calls: `curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/..."`. All Jira calls: `curl -sf -u "$JIRA_EMAIL:$JIRA_TOKEN" "$JIRA_URL/rest/api/3/issue/<ID>"`. Pipe every response through `jq` — never eyeball raw JSON.

## Standards sources, in override order

When two sources disagree, the **later one wins**:

1. `~/.claude/rules/dotnet-conventions.md`, `ef-core.md`, `api-conventions.md`, `api-design.md`, `code-style.md`, `clean-code.md`, `design-patterns.md`, `testing.md`, `security.md`, `git-workflow.md` — generic C#/.NET baseline. `design-patterns.md` is the stack-agnostic structural reference (symptom→pattern table, per-pattern costs, confusion pairs, anti-triggers) — open it only when a finding is genuinely structural, not on every diff.
2. [`DOTNET-BEST-PRACTICES.md`](DOTNET-BEST-PRACTICES.md) — modern C#/.NET/EF Core/SOLID/system-design guidance not already in rung 1. Use it to catch things rung 1 doesn't mention; it never overrides rung 1 or RULES.md.
3. `CLAUDE.md` at the repo root — repo-specific architecture (Kafka topics, Redis layout, custom IoC, monolith vs microservices). Find the root with `git rev-parse --show-toplevel` from inside the working tree — never hardcode a machine-specific path, since this skill runs from different checkouts on different machines.
4. [`RULES.md`](RULES.md) — this team's actual enforced conventions, mined from real review comments. Where it contradicts a lower rung (e.g. `DateTime.Now` over `UtcNow`), RULES.md wins — it reflects what this codebase actually does, not generic advice.

## Diff scope

Every finding must trace to a line the MR actually touches (a `+` line, or a `-`/context line the diff hunk includes). Pre-existing violations sitting outside the diff are never findings — call them a **carry-over**: name the pattern once, propose the better shape, and mark it explicitly non-blocking. Never ask the author to fix code the ticket didn't send them into.
