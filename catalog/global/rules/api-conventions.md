# API Conventions

Applies when: creating or modifying controllers, endpoints, request/response types, or auth decorators.

## Controllers

- One controller per domain. No cross-domain logic inside a controller.
- Inherit `ControllerBase`, decorate with `[ApiController]` and `[Route("api/[controller]")]`.
- Constructor-inject only service interfaces (`IXxxService`) — never repositories or DbContext directly.
- Every action must have `CancellationToken cancellationToken = default` as its last parameter.
- All business logic lives in `Application/` services — never in controllers.
- A controller should depend on one service interface. If you find yourself injecting two or more, consider splitting the controller.

## Routing

- Attribute routing on every endpoint. No conventional routing.
- Typed route constraints: `{id:guid}`, `{number:int}`, `{ref:long}`.
- **List endpoints** that accept filter/sort/page use `[HttpPost]` with `[FromBody] GetListRequest`.
- **Single-resource GET** endpoints use `[HttpGet("{id:guid}")]`.

## Auth

- Every endpoint requires `[Authorize]`. No anonymous endpoints except explicit auth endpoints (login, register, token refresh).
- Constrain by role using constants: `[Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Client}")]`.
- Never inline role strings — always use the `UserRoles` constants class.

## Result pattern

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

Never construct `Result<T>` or `PagingResult<T>` inside a controller.

## Pagination requests

```csharp
{
    Number: int,          // 1-based page number
    Size: int,            // page size
    SearchFields,
    SortFields
}
```

Pass to feature requests as `PageNumber: model.Number, PageSize: model.Size`.  
Convert helpers: `model.SearchFields.ConvertToSearchRequest()`, `model.SortFields.ConvertToSortRequest()`.

## Error responses

All errors flow through `ToActionResult()` → `controller.Problem(...)` → RFC 7807 Problem Details.  
Never return raw status codes or custom error objects.  
Do not catch exceptions in controllers — the global exception handler owns that.

## ActionResult → HTTP status mapping

| ActionResult | HTTP |
|---|---|
| `Success` | 200 |
| `NotFound` | 404 |
| `ValidationError` | 400 |
| `Incomplete` | 422 |
| `Unauthorized` | 401 |
| `UnableToPersist` / `UnableToParse` | 500 |
| (default) | 400 |
