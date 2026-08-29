# Testing Strategy

Applies when: writing tests or setting up test projects.

## Project Setup

```
<Name>.Tests.Integration/    # integration tests against real infrastructure
<Name>.Tests.Unit/           # pure unit tests for domain logic only
```

Add both to the solution `.sln` and reference `Directory.Packages.props` for version management.

Required packages: `xunit`, `FluentAssertions`, `Testcontainers.PostgreSql` (integration), `NSubstitute` (unit mocks).

## Philosophy

- Test behaviour, not implementation.
- Integration tests are the primary safety net for persistence and service logic.
- Unit tests cover pure domain logic — anything without I/O.
- Never mock the database: mock/prod divergence has caused production incidents.

## Test Project Structure

```
<Name>.Tests.Integration/
├── Fixtures/
│   └── PostgreSqlFixture.cs      # Testcontainers DB lifecycle
├── Helpers/
│   └── DbSeeder.cs               # Seed helpers for test data
└── <Domain>/
    └── <Feature>Tests.cs         # e.g., OrderServiceTests.cs

<Name>.Tests.Unit/
└── Domain/
    └── <EntityName>Tests.cs      # e.g., OrderTests.cs
```

## Integration Tests

**Target:** Service layer (`IXxxService`) against a real PostgreSQL database.

**Setup:**
```csharp
public class PostgreSqlFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder().Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        // apply migrations
        using var scope = /* build service provider */;
        await scope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>()
            .Database.MigrateAsync();
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();
}
```

**Pattern:**
```csharp
[Collection("Integration")]
public class OrderServiceTests(PostgreSqlFixture fixture) : IClassFixture<PostgreSqlFixture>
{
    [Fact]
    public async Task CreateOrder_WithValidRequest_ReturnsSuccess()
    {
        // Arrange
        var service = BuildService(fixture.ConnectionString);
        var request = new CreateOrderRequest(...);

        // Act
        var result = await service.CreateAsync(request, CancellationToken.None);

        // Assert
        result.ActionResult.Should().Be(ActionResult.Success);
        result.Value.Should().NotBeNull();
    }
}
```

## Unit Tests

**Target:** Domain entities, factory methods, status transitions, calculations.

```csharp
public class OrderTests
{
    [Fact]
    public void Create_WithValidInputs_ShouldReturnOrder()
    {
        var order = Order.Create("customer-1", 150.00m);

        order.Should().NotBeNull();
        order.Status.Should().Be(OrderStatus.Pending);
        order.Total.Should().Be(150.00m);
    }

    [Fact]
    public void Ship_WhenAlreadyShipped_ShouldThrow()
    {
        var order = Order.Create("customer-1", 150.00m);
        order.Ship();

        var act = () => order.Ship();
        act.Should().Throw<InvalidOperationException>();
    }
}
```

## Coverage Targets

| Layer | Type | Target |
|---|---|---|
| Domain | Unit | 90%+ of domain methods |
| Application Services | Integration | All service methods |
| Infrastructure | (via integration) | Covered by service tests |
| Controllers | (optional) | Only if complex mapping logic |

## Test Data

- Use builder pattern or factory methods for test entities.
- Keep test data minimal — only what the test needs.
- Clean up after each test (transaction rollback or container per test class).
- Do not share mutable state between tests.

## Naming Convention

```
MethodName_StateUnderTest_ExpectedBehavior

GetOrderById_WithNonExistentId_ReturnsNotFound
CreateOrder_WhenCustomerDoesNotExist_ReturnsValidationError
Order_WhenShipped_StatusChangesToShipped
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
