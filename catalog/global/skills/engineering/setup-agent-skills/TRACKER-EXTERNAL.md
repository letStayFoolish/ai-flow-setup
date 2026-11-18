# Issue tracker: external

Confirm with the user which tracker (GitHub Issues, Linear, Jira, …) and fill in every `<...>` below before writing — an unresolved placeholder in `docs/agents/issue-tracker.md` is worse than asking one more question.

## Template

```md
# Issue tracker: <tracker name>

Issues, specs, and tickets for this repo live on <tracker name>.

## Conventions

- Where a feature's spec/PRD lives: <e.g. the body of the parent issue>
- Ticket-numbering or naming convention this repo uses on the tracker, if any

## When a skill says "publish to the issue tracker"

<the CLI/API call or manual step, e.g. `gh issue create --title ... --label ready-for-agent`>

## When a skill says "fetch the relevant ticket"

<the CLI/API call, e.g. `gh issue view <n> --comments`, or the MCP tool name>

```
