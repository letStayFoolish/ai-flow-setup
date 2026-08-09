# Testing Standards

Applies when: writing tests or setting up test projects.

## Project structure

```
<Name>.Tests.Integration/    # integration tests against real infrastructure
<Name>.Tests.Unit/           # pure unit tests for domain logic only
```

Add both to the solution `.sln` and reference `Directory.Packages.props` for version management.

Required packages: `xunit`, `FluentAssertions`, `Testcontainers.PostgreSql` (integration), `NSubstitute` (unit mocks).

## Integration tests

- Use a **real PostgreSQL** instance (Testcontainers) — never mock the database.
- Each test class gets its own DB schema or uses transactions rolled back after each test.
- Test through the **service layer** (`IXxxService`) — not through controllers.
- Apply migrations at test startup: `await dbContext.Database.MigrateAsync()`.
- Always pass `CancellationToken.None` or a real token — never omit it.
- Start the Testcontainers fixture once per test collection (`IClassFixture<PostgreSqlFixture>`).

## Unit tests

- Unit-test only pure domain logic in the `Domain` project: entity factory methods, calculations, status transitions, validation rules.
- Do not unit-test services that depend on EF Core — that is the integration test's job.
- No mocking of `DbContext`, `IUnitOfWork`, or repositories.

## Naming

```
MethodName_StateUnderTest_ExpectedBehavior

// examples:
CreateOrder_WithMissingCustomerId_ReturnsValidationError
OrderStatus_WhenShipped_CannotTransitionToProcessing
GetOrders_WithPageSize10_ReturnsTenItems
```

## Assertions

Use `FluentAssertions` — not raw `Assert.*`:

```csharp
result.ActionResult.Should().Be(ActionResult.Success);
result.Value.Should().NotBeNull();
result.Value!.Title.Should().Be("Expected Title");
items.Should().HaveCount(3);
items.Should().ContainSingle(x => x.Id == expectedId);
```

## What NOT to do

- Do not mock `DbContext` or `IUnitOfWork` — mock/prod divergence has caused production incidents.
- Do not use `[Theory]` inline data for tests that require DB state — write separate `[Fact]` methods.
- Do not test infrastructure adapters (S3, SES, MinIO) as unit tests — those are contract/integration tests.
- Do not use `Thread.Sleep` in tests — use proper async patterns.
- Do not rely on test execution order.
