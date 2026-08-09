# Git Workflow

Applies when: creating branches, writing commit messages, staging changes, or opening pull/merge requests.

## Branch naming

```
feature/<short-kebab-desc>    # new functionality
fix/<short-kebab-desc>        # bug fix
refactor/<short-kebab-desc>   # no behaviour change
chore/<short-kebab-desc>      # deps, config, tooling
docs/<short-kebab-desc>       # documentation only
```

Examples:
```
feature/order-status-notifications
fix/pagination-off-by-one
refactor/extract-order-query-builder
chore/bump-efcore-to-9-1
docs/document-outbox-retry
```

Branch off `develop` (or `main` when no `develop` exists) for all feature/fix work.

## Commit messages

Format: `type: short imperative description` (≤ 72 chars on the subject line).

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.

```
feat: add bid deadline validation to order creation
fix: return 404 when customer not found in order handler
refactor: replace Include with Select in order list query
chore: centralise package versions in Directory.Packages.props
docs: document outbox retry behaviour
test: add integration tests for order status transitions
```

Rules:
- Imperative mood — "add", not "added" or "adds".
- No period at the end of the subject line.
- If context is needed, leave a blank line then a body paragraph.
- Never mention file names in the subject — describe the *behaviour* change.

## What to stage

- Stage only files relevant to the current change.
- Never stage: `.env`, `appsettings.*.json` with real credentials, `*.user`, `bin/`, `obj/`.
- Always stage migration files (`*_MigrationName.cs` + `*ModelSnapshot.cs`) together with the entity/config change that caused them.

## Pull / merge request checklist

1. `dotnet build <Solution>.sln` passes with no errors or new warnings.
2. EF query rules followed: `AsNoTracking`, `Select`, no in-memory filtering.
3. Migration is non-destructive (no `DROP` in generated SQL).
4. No secrets or credentials in any staged file.
5. Branch is up to date with the base branch.
6. Tests pass (if test projects exist).

## What NOT to do

- Do not commit directly to `main` or `develop`.
- Do not force-push to `main` or `develop`.
- Do not use `--no-verify` to bypass hooks.
- Do not amend commits already pushed to the remote.
- Do not bundle unrelated changes in one commit.
