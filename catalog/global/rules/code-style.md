# C# Code Style

Applies when: writing or reviewing any C# code.

## Language features

- **File-scoped namespaces** — always: `namespace Foo.Bar;`
- **Primary constructors** — prefer when the body only assigns fields:
  ```csharp
  public class OrderService(IUnitOfWork unitOfWork, ILogger<OrderService> logger) : IOrderService { }
  ```
- **`record`** for DTOs, command/query objects, and value types.
- **`sealed`** on classes not designed for inheritance.
- **Pattern matching** over chains of `is`/`as` casts.
- **`var`** when the type is obvious from the right side; explicit type when it adds clarity.
- **Null-forgiving `!`** only when you are certain the value cannot be null and the compiler cannot infer it.

## Naming

| Element | Convention | Example |
|---|---|---|
| Classes / Records | `PascalCase` | `OrderService` |
| Interfaces | `IPascalCase` | `IOrderService` |
| Methods | `PascalCase` | `GetOrderAsync` |
| Properties | `PascalCase` | `TotalAmount` |
| Private fields | `_camelCase` | `_unitOfWork` |
| Local variables | `camelCase` | `orderDto` |
| Constants | `PascalCase` | `MaxPageSize` |
| Enum values | `PascalCase` | `ActionResult.NotFound` |
| Generic type params | `T`, `TResult`, `TRequest` | |

## File organization

- One public type per file. File name matches type name exactly.
- Order within a file: fields → constructor → public properties → public methods → private methods.
- Interfaces live in their own files alongside their implementations (not in a separate `Interfaces/` folder unless the project has many).

## What not to add

- No XML doc comments (`///`) unless generating a public NuGet package.
- No inline comments explaining what the code does — only why when the reason is non-obvious.
- No `#region` blocks.
- No trailing whitespace or unnecessary blank lines.
- No `using` aliases for types that are already unambiguous.

## Formatting

- Enforce via `.editorconfig` and `dotnet format` — do not manually reformat code.
- Run `dotnet format <Solution>.sln` before committing.
- 4-space indentation (no tabs).
- Opening braces on the same line for lambdas and local functions; new line for type and method declarations.

## Async method names

Suffix with `Async` for all methods that return `Task` or `ValueTask`:  
`GetOrderAsync`, `CreateOrderAsync`, `DeleteOrderAsync`.
