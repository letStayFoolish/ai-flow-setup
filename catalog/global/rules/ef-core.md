# EF Core Rules

Applies when: writing or reviewing any LINQ query, repository method, entity configuration, or migration.

## Mandatory query rules — no exceptions

Every read-only query must satisfy all five:

1. **`AsNoTracking()`** — on every read query without exception.
2. **`.Select(...)` before `.ToListAsync()`** — project to DTO or anonymous type; never materialize full entities when a subset suffices.
3. **No `Include()` when `.Select()` covers the needed columns** — use `Include` only when the full navigation object is genuinely needed downstream.
4. **Filter and sort in-database** — no post-materialization `.Where()`/`.OrderBy()` in-memory.
5. **`.AsSplitQuery()`** when joining collection navigations to avoid Cartesian explosion.

```csharp
// CORRECT
var result = await _db.Orders
    .AsNoTracking()
    .Where(o => o.CustomerId == customerId)
    .OrderBy(o => o.CreatedAt)
    .Select(o => new OrderSummary { Id = o.Id, Total = o.Total })
    .ToListAsync(cancellationToken);

// WRONG — tracked, full entity, sorted in-memory
var result = (await _db.Orders.Include(o => o.Customer).ToListAsync())
    .Where(o => o.CustomerId == customerId)
    .OrderBy(o => o.CreatedAt)
    .ToList();
```

## Repository pattern

- Interfaces in `Application/Repositories/Contracts/IXxxRepository.cs`
- Implementations in `Infrastructure.EF/Repositories/Implementations/XxxRepository.cs`
- Repositories return `IQueryable<T>` from `Get()` methods — the service applies `.AsNoTracking()`, `.Where()`, `.Select()`, and materializes.
- Never call `SaveChangesAsync()` inside a repository — always call `_unitOfWork.SaveChangesAsync(cancellationToken)` in the service after all mutations.
- `UnitOfWork` aggregates all repositories; services receive `IUnitOfWork` by DI.

## Entity configuration

- All configuration in `Infrastructure.EF/Configurations/` — one file per entity implementing `IEntityTypeConfiguration<T>`.
- No data annotations on domain entities.
- `DeleteBehavior.NoAction` on every foreign key — no cascading deletes.
- `ValueGeneratedOnAdd` on all primary keys.
- Use `EFCore.NamingConventions` for automatic snake_case column naming — do not add manual `HasColumnName()` overrides unless strictly necessary.

## Mutations

```csharp
await _db.AddAsync(entity, cancellationToken);          // insert
_db.Set<T>().Remove(entity);                            // delete (sync — EF tracks the removal)
// commit:
await _unitOfWork.SaveChangesAsync(cancellationToken);
```

## Performance

Queries taking longer than **800 ms** must be investigated and optimized before merging.

## Migrations

```bash
# Add
dotnet ef migrations add <Name> \
  --project <Infra.EF.csproj folder> \
  --startup-project <Api.csproj folder>

# Apply locally
dotnet ef database update \
  --project <Infra.EF.csproj folder> \
  --startup-project <Api.csproj folder>

# Generate idempotent SQL (staging/prod)
dotnet ef migrations script --idempotent \
  --project <Infra.EF.csproj folder> \
  --startup-project <Api.csproj folder> \
  -o docs/migration.sql
```

Migration rules:
- Migrations must be **non-destructive** — no `DROP TABLE`, `DROP COLUMN`, or destructive `ALTER`.
- Review the idempotent SQL script for `DROP` statements before applying anywhere.
- Apply to staging before production. Back up the production DB before any migration.
- Deploy DB migration **before** deploying new application code.
