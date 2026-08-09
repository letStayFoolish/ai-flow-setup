# Security

Applies when: writing auth logic, handling configuration, processing user input, or dealing with sensitive data.

## Authentication & Authorization

- Use **ASP.NET Identity + JWT Bearer** — do not roll custom auth.
- Every endpoint requires `[Authorize]`; anonymous endpoints are the exception, not the default.
- Validate `Issuer`, `Audience`, and `ClockSkew = TimeSpan.Zero` on JWT token validation.
- Use role constants (`UserRoles.Admin`, etc.) — never inline role strings.
- Refresh tokens: store server-side (DB) and in HttpOnly cookies; never in localStorage.

## Secrets & Configuration

- Never hardcode secrets, connection strings, or API keys in source code.
- Never commit `.env`, `appsettings.*.json` with real credentials, or `*.user` files.
- Use **User Secrets** locally (`dotnet user-secrets`), environment variables in CI/staging/production.
- Map config via `IOptions<T>` — never inject `IConfiguration` into services.

```bash
# Set a secret locally (never commit this)
dotnet user-secrets set "JwtSettings:Secret" "<value>"
```

## Input Validation

- Validate all user input at the API boundary — do not trust `[FromBody]` data blindly.
- Use **FluentValidation** for request validation — register validators in DI.
- Return `Result<T>` with `ActionResult.ValidationError` for invalid input — never throw `ArgumentException` from a controller.
- Sanitize all inputs before passing to queries; prefer parameterized EF LINQ over raw SQL.

## Logging & Responses

- Never log secrets, tokens, passwords, PII (emails, names, addresses) even at Debug level.
- Never expose stack traces to the client in production (`ASPNETCORE_ENVIRONMENT != Development`).
- Use `Problem Details` (RFC 7807) for all error responses — `title` and `status` only in production; `detail` and `traceId` only in development.

## Transport

- Always enforce HTTPS redirection (`app.UseHttpsRedirection()`).
- TLS termination is upstream (reverse proxy) — do not add `EXPOSE 443` or manage certs in the app.
- CORS policies: define named policies per environment (`Development`, `Staging`, `Production`); activate via `ASPNETCORE_ENVIRONMENT`.

## Sensitive Routes

Mask sensitive request bodies in logs by registering the type name in `SensitiveRoutesSettings`.  
Example: `SensitiveRoutesSettings:List: ["LoginRequest", "ChangePasswordRequest"]`.
