# API Guidelines

Applies when: creating or modifying controllers, endpoints, request/response types, or designing new resource shapes.

## Controllers

- One controller per domain. No cross-domain logic inside a controller.
- Inherit `ControllerBase`, decorate with `[ApiController]` and `[Route("api/[controller]")]`.
- Constructor-inject only service interfaces (`IXxxService`) — never repositories or DbContext directly.
- Every action must have `CancellationToken cancellationToken = default` as its last parameter.
- All business logic lives in `Application/` services — never in controllers.
- A controller should depend on one service interface. If you find yourself injecting two or more, consider splitting the controller.
- **List endpoints** that accept filter/sort/page use `[HttpPost]` with `[FromBody] GetListRequest`.
- **Single-resource GET** endpoints use `[HttpGet("{id:guid}")]`.

## REST Conventions

### Resource naming
- Plural nouns: `/api/orders`, `/api/customers`
- Kebab-case for multi-word: `/api/order-items`
- Hierarchy for sub-resources: `/api/orders/{orderId}/items`
- No verbs in routes

### HTTP methods
- `GET` — read, no side effects
- `POST /api/resources` — create; also used for list queries that need a request body
- `PUT /api/resources/{id}` — full replace
- `PATCH /api/resources/{id}` — partial update
- `DELETE /api/resources/{id}` — remove

### Route constraints
Always use typed constraints: `{id:guid}`, `{number:int}`, `{ref:long}`.

## Request / Response Shapes

### Pagination request (POST body)
```json
{
    "number": 1,
    "size": 20,
    "searchFields": [...],
    "sortFields": [...]
}
```

### Pagination response
```json
{
    "items": [...],
    "totalItems": 100,
    "pageNumber": 1,
    "pageSize": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
}
```

### Single resource response
Return the resource directly — no wrapper:
```json
{ "id": "...", "status": "Pending", "total": 150.00 }
```

### Error response (RFC 7807)
```json
{
    "type": "https://tools.ietf.org/html/rfc7807",
    "title": "Validation Error",
    "status": 400,
    "detail": "The 'customerId' field is required.",
    "traceId": "00-abc..."
}
```

## Authentication

- All endpoints: `[Authorize]` unless explicitly anonymous (auth endpoints).
- Header: `Authorization: Bearer <token>`
- JWT claims carry user identity and roles.
- Constrain by role using constants, never inline strings: `[Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Client}")]`.

## Result Pattern in Controllers

Services return `Result<T>` or `PagingResult<T>`. Controllers never inspect `.ActionResult` directly — call the extension:

```csharp
// Simple result
return this.ToActionResult(result);

// Result with projected body
return this.ToActionResult(result, dto => new { OrderDetails = dto });

// Paging result (always project — never return PagingResult directly)
return this.ToActionResult(pagingResult, r => new
{
    Items = r.Values,
    TotalItems = r.TotalItems,
    PageNumber = r.PageNumber,
    PageSize = r.PageSize,
    TotalPages = r.TotalPages,
    HasNextPage = r.HasNextPage,
    HasPreviousPage = r.HasPreviousPage
});
```

Never construct `Result<T>` or `PagingResult<T>` inside a controller. All errors flow through `ToActionResult()` → `controller.Problem(...)` → RFC 7807 Problem Details. Do not catch exceptions in controllers — the global exception handler owns that.

### ActionResult → HTTP status mapping

| ActionResult | HTTP |
|---|---|
| `Success` | 200 |
| `NotFound` | 404 |
| `ValidationError` | 400 |
| `Incomplete` | 422 |
| `Unauthorized` | 401 |
| `UnableToPersist` / `UnableToParse` | 500 |
| (default) | 400 |

## Status Codes

| Scenario | Code |
|---|---|
| OK | 200 |
| Created | 201 + `Location: /api/orders/{id}` |
| No content | 204 |
| Bad request / validation | 400 |
| Unauthenticated | 401 |
| Forbidden | 403 |
| Not found | 404 |
| Conflict | 409 |
| Business rule violation | 422 |
| Server error | 500 |

## Versioning

- No versioning until a breaking change is required.
- When needed: URL path versioning (`/api/v2/orders`).
- Never remove or rename response fields without a version increment.
- Additive changes (new optional fields) are non-breaking.

## OpenAPI / Scalar

- Use `Scalar.AspNetCore` — not Swashbuckle.
- Register in development (and optionally staging behind auth).
- Group endpoints by domain tag.
- Document all parameters, required fields, and example responses.

## Performance

- Paginate all list endpoints — no unbounded queries.
- Default page size: 10–20; max page size: 50–100 (configurable via `PaginationOptions`).
- Set query timeouts via EF command timeout configuration.
- Log slow queries (> 800 ms) as warnings.

## Caching

- Cache read-heavy endpoints at the service layer using `IMemoryCache` or `IDistributedCache`.
- Sliding expiration for item-level cache; absolute expiration as upper bound.
- Invalidate on write: `_cache.Remove(cacheKey)` after any mutation.
- Never cache auth tokens or user-specific sensitive data.
