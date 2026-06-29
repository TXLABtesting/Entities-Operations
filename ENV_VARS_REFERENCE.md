# Environment Variables Reference

## Server Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode (`development`, `staging`, `production`) |
| `PORT` | No | `4000` | Backend server port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `OIDC_ISSUER` | Prod only | — | Workspace ONE OIDC issuer URL |
| `OIDC_AUDIENCE` | Prod only | — | OIDC audience/client ID |
| `FRONTEND_ORIGIN` | No | `http://localhost:3000` | Frontend URL for CORS |
| `BOOTSTRAP_ADMIN_EMAILS` | No | — | Comma-separated emails for auto platform_admin |
| `RUN_MIGRATIONS_ON_STARTUP` | No | `true` | Run DB migrations on server start |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | No | `500` | Max requests per window |
| `LOG_LEVEL` | No | `info` | Pino log level |

## Frontend Variables (Vite)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `/api` | Backend API base URL |
| `VITE_AUTH_ENABLED` | No | `false` | Enable OIDC authentication |
| `VITE_DEMO_AUTH_ENABLED` | No | `false` | Enable demo mode (dev only) |
| `VITE_OIDC_AUTHORITY` | When auth enabled | — | OIDC authority URL |
| `VITE_OIDC_CLIENT_ID` | When auth enabled | — | OIDC client ID |
| `VITE_OIDC_REDIRECT_URI` | When auth enabled | — | Post-login redirect URL |
| `VITE_OIDC_POST_LOGOUT_URI` | When auth enabled | — | Post-logout redirect URL |
| `VITE_OIDC_SCOPE` | No | `openid profile email` | OIDC scopes |
| `VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET` | No | `false` | Allow client_secret in browser (DEMO ONLY) |
| `VITE_OIDC_CLIENT_SECRET` | No | — | Client secret (DEMO ONLY - NEVER in prod) |

## Example .env for Local Development

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://aigp_user:password123@localhost:5432/aigp_db?sslmode=disable
FRONTEND_ORIGIN=http://localhost:3000
BOOTSTRAP_ADMIN_EMAILS=admin@moca.gov.ae
RUN_MIGRATIONS_ON_STARTUP=true
LOG_LEVEL=debug
VITE_AUTH_ENABLED=false
VITE_DEMO_AUTH_ENABLED=true
```

## Example .env for Staging

```env
NODE_ENV=staging
PORT=4000
DATABASE_URL=postgresql://aigp_user:SECURE_PASSWORD@db-host:5432/aigp_stg?sslmode=require
OIDC_ISSUER=https://access.moca.gov.ae/SAAS/auth
OIDC_AUDIENCE=aigp-client-id
FRONTEND_ORIGIN=https://aigp-stg.moca.gov.ae
BOOTSTRAP_ADMIN_EMAILS=admin1@moca.gov.ae,admin2@moca.gov.ae
RUN_MIGRATIONS_ON_STARTUP=true
LOG_LEVEL=info
VITE_AUTH_ENABLED=true
VITE_OIDC_AUTHORITY=https://access.moca.gov.ae/SAAS/auth
VITE_OIDC_CLIENT_ID=aigp-client-id
VITE_OIDC_REDIRECT_URI=https://aigp-stg.moca.gov.ae/callback
VITE_OIDC_POST_LOGOUT_URI=https://aigp-stg.moca.gov.ae
VITE_OIDC_SCOPE=openid profile email
```
