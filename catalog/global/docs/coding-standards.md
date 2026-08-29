# C# Coding Standards

Applies when: writing or reviewing any C# file.

## Language Version & Features

Target the latest stable C# version available with your .NET SDK.

Embrace modern C#:
- File-scoped namespaces everywhere (`namespace Foo.Bar;`)
- Primary constructors for service classes
- `record` for DTOs, commands, query objects
- Pattern matching over `is`/`as` casts
- `required` modifier on DTO properties
- Global usings in `GlobalUsings.cs` for framework-wide types

## Naming Reference

| Kind | Style | Example |
|---|---|---|
| Namespace | PascalCase | `Acme.Orders.Application` |
| Class / Record / Struct | PascalCase | `OrderService` |
| Interface | `I` + PascalCase | `IOrderService` |
| Method | PascalCase | `GetOrderByIdAsync` |
| Async method | PascalCase + `Async` | `CreateOrderAsync` |
| Property | PascalCase | `TotalAmount` |
| Private field | `_camelCase` | `_unitOfWork` |
| Local variable | camelCase | `orderDto` |
| Const / static readonly | PascalCase | `MaxPageSize` |
| Generic type param | `T`, `TEntity`, `TResult` | |
| Enum | PascalCase (type + values) | `OrderStatus.Pending` |

## File Conventions

- One public type per file.
- File name = type name (no suffixes like `_impl`).
- Order within a class:
  1. `const` / `static readonly` fields
  2. Private instance fields
  3. Constructor(s)
  4. Public properties
  5. Public methods (alphabetical within grouping)
  6. Private / protected methods

## Async Rules

- Every method touching I/O must be `async Task` or `async Task<T>`.
- Method name ends in `Async`.
- `CancellationToken cancellationToken = default` is always the last parameter.
- Propagate the token to every `await` — never drop it silently.
- `.ConfigureAwait(false)` in Infrastructure projects; omit elsewhere.
- Never block on async code: no `.Result`, no `.Wait()`.

## Dependency Injection

- Always inject interfaces, never concrete types.
- Services: `AddScoped<IXxxService, XxxService>()`.
- Repositories: `AddScoped<IXxxRepository, XxxRepository>()`.
- Infrastructure adapters: registered in their own `Add*()` extension methods.
- Never use `ServiceLocator` or manually resolve from `IServiceProvider` in business code.

## Error Handling

- **Business errors** → `Result<T>` return values. Never `throw`.
- **Infrastructure errors** (DB timeout, network failure) → let exceptions propagate to the global handler.
- **Validation errors** → FluentValidation + return `ActionResult.ValidationError`.
- Never catch `Exception` broadly in service code. Catch specific types only when you can meaningfully recover.

## Immutability Preferences

- DTOs and request types: use `record` with `init` setters.
- Domain entities: expose state via methods (status transitions), not public setters.
- Prefer `IReadOnlyList<T>` / `IReadOnlyCollection<T>` for returned collections.

## Configuration & Settings

```csharp
// appsettings.json
{
    "JwtSettings": { "Secret": "", "ExpiresInMinutes": 60 }
}

// Settings class
public class JwtSettings
{
    public required string Secret { get; init; }
    public int ExpiresInMinutes { get; init; }
}

// Registration
services.Configure<JwtSettings>(config.GetSection("JwtSettings"));

// Usage
public class TokenService(IOptions<JwtSettings> options) { ... }
```

## What to Avoid

| Avoid | Use instead |
|---|---|
| AutoMapper | Explicit `.Select(...)` projections |
| MediatR pipeline | Direct service injection |
| Data annotations on entities | Fluent API in `IEntityTypeConfiguration<T>` |
| `IConfiguration` in services | `IOptions<T>` |
| Stored procedures | EF LINQ |
| Business exceptions | `Result<T>` |
| `#region` | Smaller, focused classes |
| String magic values | Constants or enums |

## What NOT to Add

- No XML doc comments (`///`) unless generating a public NuGet package.
- No inline comments explaining *what* the code does — only *why*, when the reason is non-obvious.
- No trailing whitespace or unnecessary blank lines.
- No `using` aliases for types that are already unambiguous.

## Formatting

- Enforce via `.editorconfig` and `dotnet format` — do not manually reformat code.
- Run `dotnet format <Solution>.sln` before committing.
- 4-space indentation (no tabs).
- Opening braces on the same line for lambdas and local functions; new line for type and method declarations.

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
