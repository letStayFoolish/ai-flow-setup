# Claude Code — Global Preferences

## Personal Preferences

- Be extremely concise. Sacrifice grammar when it improves brevity. Skip obvious explanations; assume I know the language and standard programming concepts.
- Keep conversations, explanations, and non-shared documents in Serbian, preserving common technical terms in English. Write all shared artifacts (PRDs, RFCs, ADRs, specs, MRs, etc.) in English.
- Always show the full file path in code references (`src/Api/Endpoints/OrdersEndpoint.cs:42`)
- When suggesting refactors, explain the trade-off, not just the benefit
- I work on macOS (Rider IDE), run WSL when on Windows — use Unix commands in Bash
- When writing C#, prefer primary constructors and file-scoped namespaces
- Never add XML doc comments, docstrings, or inline comments unless the logic is non-obvious
- Do not add error handling for scenarios that cannot happen — trust the framework

## Stack Defaults (C# / .NET)

All projects are ASP.NET Core Web APIs on .NET 9+ unless a project's own CLAUDE.md says otherwise.

| Concern | Default choice |
| --- | --- |
| Language | C# / .NET 9 |
| ORM | Entity Framework Core + Npgsql |
| Auth | ASP.NET Identity + JWT Bearer |
| Logging | Serilog (Console + File sinks) |
| API docs | Scalar (not Swagger/Swashbuckle) |
| Testing | xUnit + FluentAssertions + Testcontainers |
| Mocking | NSubstitute |

Package versions centrally managed via `Directory.Packages.props`.

## Architecture Defaults

- **Clean Architecture**: `Api → Application → Domain ← Infrastructure`
- **Result pattern** — services return `Result<T>`, never throw for business errors
- **Repository + Unit of Work** — interfaces in `Application/`, implementations in `Infrastructure.EF/`
- **IOptions<T>** — never inject `IConfiguration` directly into services
- **No AutoMapper** — explicit `.Select(...)` projections
- **No MediatR** — direct service injection; keeps stack traces readable
- **No data annotations on entities** — Fluent API only in `Infrastructure.EF/Configurations/`

## C# Style

- File-scoped namespaces (`namespace Foo.Bar;`)
- Primary constructors where they reduce noise
- `record` for DTOs and command/query objects
- `sealed` on classes that are not designed for inheritance
- `CancellationToken cancellationToken = default` on every async method, propagated everywhere
- `.ConfigureAwait(false)` in Infrastructure projects; omit in Api/Application

## Common Commands

```bash
dotnet build <Solution>.sln          # build
dotnet test <Tests>/                 # run tests
dotnet format <Solution>.sln         # format
dotnet ef migrations add <Name> \
  --project <Infra.EF> \
  --startup-project <Api>            # add migration
dotnet ef database update \
  --project <Infra.EF> \
  --startup-project <Api>            # apply migrations
```

## Rules Index

| Rule file | When it applies |
| --- | --- |
| `rules/dotnet-conventions.md` | Any C# file — project layout, DI, async, logging |
| `rules/ef-core.md` | LINQ queries, repositories, entity configs, migrations |
| `rules/api-conventions.md` | Controllers, endpoints, request/response types, auth |
| `rules/api-design.md` | Designing new endpoints or resource shapes |
| `rules/code-style.md` | C# naming, formatting, language feature usage |
| `rules/testing.md` | Any test file or test project |
| `rules/security.md` | Auth, secrets, input validation, sensitive data |
| `rules/git-workflow.md` | Branches, commits, merge checklist |
| `rules/clean-code.md` | Any code change — YAGNI, KISS, SRP, DRY, coupling/cohesion |
| `rules/design-patterns.md` | Designing a module, choosing where behaviour lives, reviewing new abstractions |

## Docs Index

| Doc file | Contents |
| --- | --- |
| `docs/architecture.md` | Layer boundaries, key patterns, DI wiring |
| `docs/coding-standards.md` | C# style guide and naming reference |
| `docs/testing-strategy.md` | What to test, how, coverage targets |
| `docs/api-guidelines.md` | REST conventions, versioning, pagination, errors |
| `docs/deployment.md` | Environments, deploy process, rollback |

## Tool Preferences

- Use `Read` not `cat` / `head` / `tail`
- Use `Grep` not `rg` / `grep`
- Use `Edit` not `sed` / `awk`
- Reserve `Bash` for commands that require shell execution
