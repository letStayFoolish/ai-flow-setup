# .NET / C# Conventions

Applies when: creating or modifying any C# file.

## Project layout (Clean Architecture)

```
<Name>.Api/                  # Controllers, middleware, DI wiring, Program.cs
<Name>.Application/          # Business logic — Services/ and Features/<Domain>/
<Name>.Domain/               # Pure entities, enums, domain methods — zero external deps
<Name>.Contracts/            # Request/response DTOs — no logic
<Name>.Infrastructure.EF/    # DbContext, migrations, Configurations/, repositories
<Name>.Infrastructure.*/     # One project per I/O adapter (S3, email, cache, etc.)
```

Dependency rule: `Api → Application → Domain`. Infrastructure implements Application interfaces; it never imports Application or Api.

## Feature structure

Simple CRUD → `Application/Services/`. Multi-step domain workflows → `Application/Features/<Domain>/<Operation>/`.

```
Application/Features/Order/Create/
└── CreateOrderRequest.cs    // record with inputs
```

## Project responsibilities (never cross)

| Project | Owns |
|---|---|
| `Domain` | Entities, enums, domain methods. Zero NuGet deps. |
| `Application` | Business logic, service interfaces, repository interfaces, response types. |
| `Contracts` | DTOs only — no logic, no domain references. |
| `Infrastructure.EF` | DbContext, migrations, repository implementations, entity configs. |
| `Api` | Controllers, middleware, extension methods, Program.cs. |

## Async

- `CancellationToken cancellationToken = default` on **every** async method signature.
- Propagate `cancellationToken` to every `await` downstream — never discard it.
- `.ConfigureAwait(false)` in all Infrastructure projects. Omit in Api and Application.
- Never use `Task.Result` or `.Wait()` — always `await`.

## Dependency injection

- Register services in extension methods (`IServiceCollection`) — never inline in `Program.cs`.
- Each infrastructure project exposes one `Add*()` extension called from `Program.cs`.
- Inject interfaces, never concrete classes.
- **Never inject `IConfiguration` directly.** Use `IOptions<T>` or `IOptionsSnapshot<T>`.

```csharp
// CORRECT
services.Configure<StorageSettings>(config.GetSection("StorageSettings"));
public MyService(IOptions<StorageSettings> options) { ... }

// WRONG
public MyService(IConfiguration config) { ... }
```

## Logging (Serilog)

Named placeholders only — never positional or string-interpolated:

```csharp
// CORRECT
_logger.LogInformation("Order {OrderId} assigned to {UserId}", order.Id, userId);

// WRONG
_logger.LogInformation($"Order {order.Id} assigned");
_logger.LogInformation("Order {0} assigned", order.Id);
```

Log levels: `Information` for domain events; `Warning` for unexpected but recoverable states; `Error` for exceptions.  
Never log secrets, tokens, passwords, or PII.

## Result pattern

Services return `Result<T>` (single) or `PagingResult<T>` (lists). Never throw for business errors.

```csharp
return new Result<OrderDto>(ActionResult.Success, dto);
return new Result<OrderDto>(ActionResult.NotFound, Message: $"Order '{id}' not found.");
```

## Naming

| Kind | Convention |
|---|---|
| Interfaces | `IXxxService`, `IXxxRepository` |
| Request records | `XxxRequest` (in feature folder) |
| Response DTOs | `XxxDto` (in `Application/Response/`) |
| Settings classes | `XxxSettings` |
| Extension methods | `XxxExtensions` |

## Patterns NOT used — do not introduce

- No AutoMapper — write explicit `.Select(...)` projections
- No MediatR / CQRS pipeline — direct service injection only
- No data annotations on domain entities — Fluent API only
- No stored procedures — EF LINQ only
- No exceptions for business logic — use `Result<T>`
- No `IConfiguration` injection into services
