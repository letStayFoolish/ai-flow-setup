# EF Core — 10 Mistakes Reference

For each mistake: grep pattern to find it, what EF Core does at runtime (explain this to the user before asking for the fix), and the Socratic prompt to open the teaching conversation.

---

## Mistake 1 — N+1 Queries

**Grep for:**
```
# Terminal call without Include or Select, followed by loop
grep -rn "ToListAsync\|ToList()" --include="*.cs" | grep -v "\.Select\|\.Include"
# Then look for navigation property access inside foreach/for loops near those ToList calls
grep -n "foreach\|for (" --include="*.cs" -rn -A 5 | grep "\."
```
Also look for: `ToListAsync()` as the only call on `context.SomeDbSet` with no chain before it.

**Runtime consequence:**  
EF Core fires one SELECT to load the list. Then, every time your loop touches a navigation property (e.g. `order.Customer.Name`), EF Core fires a *separate* SELECT to load that related row. 100 orders = 101 queries. 1,000 orders = 1,001 queries. The count scales linearly with the table size, not with your code.

**Socratic prompt:**  
*"If this list endpoint is called with 500 rows in Orders, how many SQL queries does EF Core fire? What would you see in the query log?"*

**Correct patterns:**  
Option A — eager load: `.Include(o => o.Customer)`  
Option B — project: `.Select(o => new { o.Id, CustomerName = o.Customer.Name })`  
Projection is preferred because it also fixes Mistake 2.

---

## Mistake 2 — Returning Full Entities Instead of Projections

**Grep for:**
```
grep -rn "\.ToListAsync\|\.ToList()\|\.FirstOrDefaultAsync\|\.SingleOrDefaultAsync" --include="*.cs" \
  | grep -v "\.Select("
```
Also look for controller actions or service methods that return `List<SomeEntity>` or `SomeEntity` directly.

**Runtime consequence:**  
EF Core generates `SELECT *` — every column, including large text blobs and columns the client never uses. All columns are deserialized into tracked entity objects. Change detection snapshots every property. Then the serializer converts all of it to JSON. A 20-column table with 5,000 rows sends ~70% more bytes than a 3-column projection of the same data.

**Socratic prompt:**  
*"Look at the DTO this endpoint returns vs the entity it loads. Which columns does the client actually use? What is the database sending that gets thrown away?"*

**Correct pattern:**  
```csharp
.Select(p => new ProductListItem { Id = p.Id, Name = p.Name, Price = p.Price })
.ToListAsync(ct)
```

---

## Mistake 3 — Missing AsNoTracking on Read-Only Queries

**Grep for:**
```
grep -rn "\.ToListAsync\|\.FirstOrDefaultAsync\|\.SingleOrDefaultAsync\|\.ToList()" \
  --include="*.cs" | grep -v "AsNoTracking\|AsTracking"
```
Cross-reference with methods that never call `SaveChangesAsync` — those are pure reads.

**Runtime consequence:**  
Every loaded entity enters the `ChangeTracker`. EF Core snapshots every property value to detect future changes. On a read-only endpoint that never calls `SaveChanges()`, this is 100% overhead: extra memory, extra CPU for snapshot diffing on every entity, slower GC. Benchmarks on 10,000-row reads show 20–40% slower execution vs the same query with `AsNoTracking()`.

**Socratic prompt:**  
*"This query loads data and returns it — it never calls SaveChanges. What is EF Core doing in the background for every entity it loads? Is any of that work useful here?"*

**Correct pattern:**  
Add `.AsNoTracking()` to every read-only query. Or set globally and opt in to tracking only on write paths:
```csharp
options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
// then on write paths:
.AsTracking()
```

---

## Mistake 4 — Lazy Loading Enabled in Production

**Grep for:**
```
grep -rn "UseLazyLoadingProxies" --include="*.cs"
grep -rn "virtual " --include="*.cs" | grep -v "override\|abstract"  # virtual nav props = lazy loading candidate
```

**Runtime consequence:**  
Any code that reads a navigation property — including the JSON serializer, a mapping library, even a logger calling `ToString()` — fires a synchronous database query. These queries are invisible in your code; they appear in the query log as unexplained SELECTs from inside `System.Text.Json`. The N+1 pattern from Mistake 1 happens automatically and non-deterministically, triggered by things you don't control.

**Socratic prompt:**  
*"If lazy loading is on and you serialize an `Order` object with a `Customer` navigation property to JSON, when does the database query for Customer fire? Can you see that query in the code?"*

**Correct pattern:**  
Remove `UseLazyLoadingProxies()`. Use `.Include()` for eager loading or `.Select()` for projections — both are explicit and visible in the code.

---

## Mistake 5 — Cartesian Explosion from Multiple Includes

**Grep for:**
```
grep -rn "\.Include(" --include="*.cs" -A 1 | grep -c "Include"
# Manually look for files with 2+ chained .Include() calls without .AsSplitQuery()
grep -rn "\.Include(" --include="*.cs" | awk -F: '{print $1}' | sort | uniq -c | sort -rn
grep -rn "\.Include(.*\.Include(" --include="*.cs"
grep -rn "Include(" --include="*.cs" -A 3 | grep -v "AsSplitQuery"
```
Flag any query with 2+ `.Include()` calls and no `.AsSplitQuery()`.

**Runtime consequence:**  
EF Core generates LEFT JOINs. With two collection navigations (e.g. `Projects` and `Employees`), the result set is `count(Projects) × count(Employees)` rows *per parent*. A department with 20 projects and 30 employees returns 600 rows from the database — EF Core de-duplicates client-side, but all 600 rows crossed the wire. With 50 departments: 30,000 rows for what is logically 1,000 entities.

**Socratic prompt:**  
*"If a Department has 20 Projects and 30 Employees, how many rows does this query return from the database? Draw it out. What does EF Core do with the extra rows?"*

**Correct pattern:**  
```csharp
.AsSplitQuery()
.Include(d => d.Projects)
.Include(d => d.Employees)
```
Use `AsSplitQuery` when 2+ collection navigations are included and the cross-product multiplier exceeds ~10x the parent count. Single-collection includes are fine without it.

---

## Mistake 6 — Filtering After Materialization

**Grep for:**
```
# Pattern: (await ...ToListAsync()).Where(
grep -rn "(await.*ToListAsync\(\))\s*\." --include="*.cs"
grep -rn "ToListAsync\(\)\)" --include="*.cs"
# Also: .ToList() followed by .Where( on next line
grep -n "\.ToList()" --include="*.cs" -rn -A 2 | grep "\.Where("
grep -n "\.ToListAsync(" --include="*.cs" -rn -A 2 | grep "\.Where(\|\.OrderBy(\|\.Skip(\|\.Take("
```

**Runtime consequence:**  
`IQueryable<T>` builds a SQL expression tree — it doesn't execute until a terminal operator (`.ToListAsync()`, `.FirstAsync()`, etc.). Wrapping `ToListAsync()` in parentheses and chaining `.Where()` after it means the filter runs on `IEnumerable<T>` *in memory*, after EF Core already loaded the entire table. 100,000 rows loaded, 12 kept. The remaining 99,988 rows crossed the network for nothing.

**Socratic prompt:**  
*"What is the difference between `IQueryable<T>` and `IEnumerable<T>`? When you write `.Where()` on each one, where does the filtering actually happen?"*

**Correct pattern:**  
All `.Where()`, `.OrderBy()`, `.Skip()`, `.Take()`, `.Select()` must come **before** the terminal operator. The terminal is always the last call in the chain.

---

## Mistake 7 — Loading Entities to Update or Delete in Bulk

**Grep for:**
```
# ToListAsync followed by foreach with property assignment followed by SaveChangesAsync
grep -rn "ToListAsync" --include="*.cs" -A 15 | grep -B 5 "SaveChangesAsync"
grep -rn "foreach" --include="*.cs" -B 5 | grep "ToListAsync"
# Look for foreach loops that set properties on entities
grep -rn "foreach.*var " --include="*.cs" -A 5 | grep "\. = "
```

**Runtime consequence:**  
EF Core loads every column of every matching row into memory as tracked entities. For 10,000 rows that means 10,000 SELECT'd rows, 10,000 tracked instances with property snapshots, change detection across all of them, and then up to 10,000 individual UPDATE statements (batched by EF Core, but still 10,000 statements). All to set one boolean column. `ExecuteUpdateAsync` does this in a single `UPDATE … WHERE` statement — no rows loaded, no change tracking, no round trips per row. Benchmarks: 300–500x faster on 10,000-row updates.

**Socratic prompt:**  
*"If you need to archive 10,000 orders by setting `IsArchived = true`, how many SQL statements does this foreach loop generate? What work is being done by C# that SQL could do in a single statement?"*

**Correct pattern:**  
```csharp
await context.Orders
    .Where(o => o.CreatedAt < DateTime.UtcNow.AddYears(-1))
    .ExecuteUpdateAsync(s => s.SetProperty(o => o.IsArchived, true), ct);
```
Caveat: `ExecuteUpdate`/`ExecuteDelete` bypass change tracking, so EF interceptors and audit-trail hooks in `SaveChanges` do not fire. If those matter, document the trade-off explicitly.

---

## Mistake 8 — No Pagination on List Endpoints

**Grep for:**
```
# ToListAsync without Skip/Take anywhere in the chain
grep -rn "ToListAsync" --include="*.cs" -B 20 | grep -v "Skip\|Take\|Page"
# Or: look for controller/endpoint methods that return List<T> without pagination parameters
grep -rn "public.*List<\|IEnumerable<" --include="*.cs" | grep -v "page\|skip\|take\|Page\|Skip\|Take"
```

**Runtime consequence:**  
In development with 50 rows: 4ms. In production after an import job runs: 200,000 rows, the endpoint loads the full table into memory and serializes it to JSON. Every call. Users see a 12-second timeout. APM screams. Adding pagination after the fact requires a breaking API change.

**Socratic prompt:**  
*"This endpoint has no `Skip`/`Take`. What happens when the table grows from 50 rows to 200,000? Who controls how many rows come back right now?"*

**Correct pattern:**  
Always paginate from day one — even when the table is small.
```csharp
var page = Math.Max(1, pageNumber);
var size = Math.Clamp(pageSize, 1, 100);  // cap server-side, never trust the client

var items = await query
    .Skip((page - 1) * size)
    .Take(size)
    .ToListAsync(ct);
```
For tables > 1M rows: keyset pagination (`WHERE id > lastSeenId ORDER BY id`) scales constantly; offset pagination slows as page number grows.

---

## Mistake 9 — Missing Indexes on Filtered or Joined Columns

**Grep for:**
```
# Entity configuration files — look for HasIndex calls
grep -rn "HasIndex" --include="*.cs"
# Cross-reference: entities used in Where clauses that lack HasIndex
grep -rn "\.Where(.*=>" --include="*.cs" | grep -oP '\w+\.\w+' | sort | uniq
# Entity classes without Index attributes
grep -rn "\[Index" --include="*.cs"
```
Manually: find columns that appear in `.Where()`, `.OrderBy()`, or join conditions across hot-path queries, then check whether their `IEntityTypeConfiguration` has a corresponding `HasIndex`.

**Runtime consequence:**  
Without an index, every `WHERE sku = @p0` is a full table scan — the database reads every row to find matches. With 10,000 rows in dev: ~2ms. With 10,000,000 rows in production: 8 seconds. The LINQ query is identical; only the data volume changed.

**Socratic prompt:**  
*"Which columns does this query filter or join on? Now look at the entity configuration — do those columns have an index? What does the database have to do to find matching rows without one?"*

**Correct pattern (Fluent API):**
```csharp
builder.HasIndex(p => p.Sku).IsUnique();
builder.HasIndex(p => p.CategoryId);
builder.HasIndex(p => new { p.CategoryId, p.CreatedAt });  // composite for multi-column filters
```
Rule: index columns that appear in `WHERE`, `JOIN`, or `ORDER BY` on hot-path queries with high cardinality (many distinct values). Do not index every column — writes pay the cost.

---

## Mistake 10 — No Compiled Queries on Hot Paths

**Grep for:**
```
# Look for simple by-ID lookups or other repeated single-entity queries on hot endpoints
grep -rn "FirstOrDefaultAsync\|SingleOrDefaultAsync" --include="*.cs"
grep -rn "EF\.CompileAsyncQuery\|CompileQuery" --include="*.cs"
```
Context matters: only flag this after the endpoint is confirmed as high-RPS (thousands of requests/second). It is not a general-purpose fix.

**Runtime consequence:**  
Every LINQ query execution walks the expression tree and translates it to SQL. For most queries this is a few microseconds — irrelevant. On a `/products/{id}` endpoint serving 5,000 requests/second, that translation happens 5,000 times per second for the same SQL. Compiled queries translate once and reuse the delegate. Benchmarks: 30–60% faster on single-row primary-key lookups.

**Socratic prompt:**  
*"What work does EF Core do every single time this LINQ expression runs? If this endpoint fires 5,000 times per second, how often is that work repeated? Is the output ever different?"*

**Correct pattern:**
```csharp
private static readonly Func<AppDbContext, Guid, CancellationToken, Task<Product?>> GetById =
    EF.CompileAsyncQuery((AppDbContext db, Guid id, CancellationToken ct) =>
        db.Products.AsNoTracking().FirstOrDefault(p => p.Id == id));
```
**When to apply:** profile first. Compile only the hot 5% of endpoints, not every query.

---

## Quick Decision Matrix

| Symptom | First fix | Then |
|---|---|---|
| Big payloads, full entities returned | Projection via `.Select()` | `AsNoTracking()` |
| 50+ SQL queries per request | `.Include()` or projection | Check for lazy loading |
| Single query returns 30,000 rows for 50 parents | `.AsSplitQuery()` | Or project specific columns |
| Bulk update/delete is slow | `ExecuteUpdateAsync` / `ExecuteDeleteAsync` | — |
| List endpoint times out under load | Pagination | `AsNoTracking()` + projection |
| `WHERE` query is slow at scale | Index the filtered column | `EXPLAIN ANALYZE` to verify |
| High-RPS endpoint (1000s req/s) | `EF.CompileAsyncQuery` | `HybridCache` for stable reads |

**The 80% solution:** fix Mistakes 2 (projection), 3 (AsNoTracking), and 8 (pagination) on every list endpoint. That alone turns most slow APIs into fast ones.
