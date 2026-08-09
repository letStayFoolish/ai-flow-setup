# API Design

Applies when: designing new endpoints, resource shapes, versioning strategy, or response contracts.

## Resource naming

- Use **plural nouns** for collections: `/api/orders`, `/api/customers`.
- Use kebab-case for multi-word segments: `/api/order-items`.
- Do not use verbs in routes — the HTTP method is the verb: `DELETE /api/orders/{id}`, not `/api/orders/{id}/delete`.

## HTTP method semantics

| Method | Use for | Idempotent |
|---|---|---|
| `GET` | Read — no side effects | Yes |
| `POST` | Create or complex queries (list with filters) | No |
| `PUT` | Full replace of a resource | Yes |
| `PATCH` | Partial update | No |
| `DELETE` | Remove | Yes |

List endpoints that need body-based filtering use  `GET` with a query string.

## Response shapes

**Single resource:**
```json
{ "id": "...", "field": "..." }
```

**Paged list:**
```json
{
    "items": [...],
    "totalItems": 100,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
}
```

**Error (RFC 7807 Problem Details):**
```json
{
    "type": "https://tools.ietf.org/html/rfc7807",
    "title": "Validation Error",
    "status": 400,
    "detail": "The 'title' field is required.",
    "traceId": "..."
}
```

## Versioning

- Default: no versioning until a breaking change is required.
- When breaking changes are needed, use **URL path versioning**: `/api/v2/orders`.
- Never remove or rename a field in a response without a version bump.

## Status codes

| Scenario | Code |
|---|---|
| Successful read | 200 |
| Successful create | 201 + `Location` header |
| No content (delete) | 204 |
| Validation failure | 400 |
| Unauthenticated | 401 |
| Insufficient permissions | 403 |
| Resource not found | 404 |
| Business rule violation | 422 |
| Server error | 500 |

## API documentation (Scalar)

- Use `Scalar.AspNetCore` — not Swashbuckle/Swagger.
- Document all endpoints with summary and example request/response shapes.
- Group by domain tag.
- Enable in Development environment only (or behind auth in staging).
