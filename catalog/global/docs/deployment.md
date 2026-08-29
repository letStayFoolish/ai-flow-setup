# Deployment

## Environments

| Name | Purpose | Branch |
|---|---|---|
| `Development` | Local machine | any |
| `Staging` | Pre-production validation | `develop` |
| `Production` | Live | `main` |

`ASPNETCORE_ENVIRONMENT` controls which config and CORS policy is active.

## Local Development

```bash
# 1. Start the database
docker-compose up -d

# 2. Set secrets (once)
cd <Api project>
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=dev_db;Username=postgres;Password=<pw>"
dotnet user-secrets set "JwtSettings:Secret" "<secret>"

# 3. Apply migrations
dotnet ef database update \
  --project <Infra.EF> \
  --startup-project <Api>

# 4. Run
dotnet run                # or
dotnet watch run          # hot reload
```

`docker-compose.yml` starts only the database. The application runs via `dotnet run`.

## Docker Image (multi-stage)

```
Stage 1 — base:    mcr.microsoft.com/dotnet/aspnet:<version>, port 5000
Stage 2 — build:   SDK image, copies .props + .csproj, restores, compiles
Stage 3 — publish: dotnet publish -c Release
Stage 4 — final:   copies publish output, sets ASPNETCORE_URLS=http://0.0.0.0:5000
```

```bash
# Build
docker build -f <Api>/Dockerfile -t <app>:latest .

# Run (pass secrets via env vars, not baked into image)
docker run -p 5000:5000 \
  -e ConnectionStrings__DefaultConnection="..." \
  -e JwtSettings__Secret="..." \
  <app>:latest
```

Config: `__` maps to `:` — `ConnectionStrings__DefaultConnection` → `ConnectionStrings:DefaultConnection`.

## Migration Deployment

```bash
# Generate idempotent SQL
dotnet ef migrations script --idempotent \
  --project <Infra.EF> \
  --startup-project <Api> \
  -o docs/migration.sql

# Review for DROP statements before running
grep -i "DROP" docs/migration.sql
```

**Order of operations:**
1. Back up the production database.
2. Apply migration SQL to staging — verify.
3. Apply migration SQL to production.
4. Deploy new application image.

DB migration always goes **before** the application deploy. Never the reverse.

## Environment Variables

| Variable | Purpose |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | Environment name |
| `ASPNETCORE_URLS` | Bind address (e.g., `http://0.0.0.0:5000`) |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `JwtSettings__Secret` | JWT signing key |

Never bake secrets into the Docker image. Pass at runtime via env vars or a secrets manager (AWS Secrets Manager, Azure Key Vault, etc.).

## CORS

Three named CORS policies (`Development`, `Staging`, `Production`) registered in `Program.cs`. The active policy is chosen by `ASPNETCORE_ENVIRONMENT`.

TLS is terminated upstream (reverse proxy / load balancer). Do not manage TLS inside the container.

## Rollback

1. Re-deploy previous application image tag.
2. If DB migration was destructive (should not happen — see migration rules), restore from backup.
3. Non-destructive migrations are safe to leave in place during rollback.
