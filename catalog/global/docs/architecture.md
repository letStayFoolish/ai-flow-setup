# Architecture

Applies when: creating or modifying any C# file, or deciding where new behaviour lives.

## Stack Defaults

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

## Clean Architecture

```
┌──────────────────────────────────────────────┐
│  Api                                          │  HTTP: controllers, middleware, Program.cs
└────────────────────┬─────────────────────────┘
                     │ depends on
┌────────────────────▼─────────────────────────┐
│  Application                                  │  Business logic: Services/ + Features/<Domain>/
│  Defines: IXxxRepository, IXxxService         │
└──────┬───────────────────────────────────────┘
       │ depends on
┌──────▼───────────────────────────────────────┐
│  Domain                                       │  Entities, enums, domain methods
│  (zero external NuGet dependencies)           │
└──────────────────────────────────────────────┘
       ▲ implemented by
┌──────┴───────────────────────────────────────┐
│  Infrastructure.*                             │  EF Core, S3, Email, Cache, etc.
└──────────────────────────────────────────────┘
       ▲ composed by
┌──────┴───────────────────────────────────────┐
│  Contracts                                    │  DTOs — no logic
└──────────────────────────────────────────────┘
```

The dependency rule: source code dependencies point **inward only**. Domain knows nothing about Infrastructure.

## Application layer split

| Sub-folder | Use for |
|---|---|
| `Application/Services/` | Simple CRUD with straightforward mapping |
| `Application/Features/<Domain>/<Op>/` | Multi-step domain workflows, complex orchestration |

Start in `Services/`. Move to `Features/` when a workflow spans multiple steps or aggregates.

## Repository + Unit of Work

- Repository interfaces live in `Application/Repositories/Contracts/`.
- Implementations live in `Infrastructure.EF/Repositories/Implementations/`.
- `IUnitOfWork` aggregates all repositories and exposes `SaveChangesAsync()`.
- Services receive `IUnitOfWork` by DI — never inject `DbContext` directly.

## Key Patterns

| Pattern | Where | Why |
|---|---|---|
| Result<T> | Application → Api | Business errors are values, not exceptions |
| IOptions<T> | Everywhere | Typed config, no IConfiguration leakage |
| Outbox | Infrastructure.Notification | Reliable async messaging without distributed transactions |
| Problem Details | Api | RFC 7807 compliant error responses |
| IEntityTypeConfiguration<T> | Infrastructure.EF | All EF config co-located, no data annotations on domain |

## Middleware Pipeline (standard order)

1. Serilog request logging
2. Global exception handler (returns Problem Details)
3. Status code pages
4. HTTPS redirection
5. CORS
6. Authentication
7. Authorization
8. Custom middleware (e.g., `ExtractUserContextMiddleware`)
9. Controllers / Minimal API routing

## DI Registration pattern

```csharp
// Program.cs — stays clean
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureEF(builder.Configuration);
builder.Services.AddInfrastructureS3(builder.Configuration);

// Each infrastructure project exposes one extension:
public static IServiceCollection AddInfrastructureEF(
    this IServiceCollection services, IConfiguration config) { ... }
```

## Infrastructure Isolation

Each external I/O concern gets its own project:

```
Infrastructure.EF/          # Database (EF Core + PostgreSQL)
Infrastructure.S3/          # Object storage (AWS S3 / MinIO)
Infrastructure.Mail/        # Email abstraction
Infrastructure.SES/         # AWS SES adapter
Infrastructure.Cache/       # Distributed cache (Redis, etc.)
Infrastructure.Notification/ # Outbox background service
```

Each project depends only on `Application` interfaces — swapping adapters requires no changes to `Application` or `Domain`.
