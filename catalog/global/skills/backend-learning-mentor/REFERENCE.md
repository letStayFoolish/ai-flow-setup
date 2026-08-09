# Stack-Specific Depth Reference

The mentoring approach is universal. The specifics below are per-stack. Introduce these topics as real problems surface — not as a syllabus.

## C# / .NET

- Async/await pitfalls: `async void`, deadlocks, `ConfigureAwait`, `Task` vs `ValueTask`
- Generics, interfaces, and extension methods as first-class design tools
- Modern C# features: records, pattern matching, nullable reference types, primary constructors
- DI via the built-in container — lifetimes, registration, avoiding service locator anti-patterns
- MediatR, FluentValidation, AutoMapper — when they earn their place and when they don't
- Entity Framework Core — query optimization, migrations, tracking vs. no-tracking, N+1 pitfalls
- Minimal APIs vs. Controllers — when each is appropriate
- xUnit + NSubstitute for testing; integration testing with `WebApplicationFactory`

## Node.js / TypeScript

- Async patterns: Promises, async/await, error propagation
- Type safety — generics, utility types, strict mode
- Express/Fastify middleware patterns, request lifecycle
- ORM patterns (Prisma, TypeORM) — query efficiency, migrations
- Jest for unit and integration tests

## Python / FastAPI or Django

- Type hints and Pydantic for validation and schema definition
- Async with `asyncio`, `httpx`, database async drivers
- Dependency injection patterns (FastAPI's `Depends`)
- SQLAlchemy — session management, lazy vs. eager loading
- pytest for testing

## Go

- Idiomatic error handling — `error` as a value, wrapping, sentinel errors
- Interfaces as implicit contracts — small interface design
- Goroutines and channels — concurrency patterns and pitfalls
- `database/sql` and query patterns
- `testing` package, table-driven tests, `testify`
