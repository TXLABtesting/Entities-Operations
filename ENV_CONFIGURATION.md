# Environment Variables Configuration

> **WARNING:** All `VITE_*` variables are exposed in the browser bundle. DO NOT place client secrets, admin secrets, API keys, or Workspace ONE admin credentials in these variables.

## Authentication (Workspace ONE / Omnissa Access SSO)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_AUTH_ENABLED` | Yes | Set to `"true"` to enable OIDC authentication | `false` |
| `VITE_OIDC_AUTHORITY` | When auth enabled | OIDC Authority / Issuer URL (Workspace ONE Access tenant URL) | — |
| `VITE_OIDC_CLIENT_ID` | When auth enabled | OIDC Client ID (registered in Workspace ONE as a public SPA client) | — |
| `VITE_OIDC_REDIRECT_URI` | When auth enabled | Redirect URI after successful login | `{origin}/callback` |
| `VITE_OIDC_POST_LOGOUT_REDIRECT_URI` | When auth enabled | Redirect URI after logout | `{origin}` |
| `VITE_OIDC_SCOPE` | No | OIDC Scopes (space-separated) | `openid profile email` |
| `VITE_DEMO_AUTH_ENABLED` | No | Set to `"true"` to enable demo user (ONLY works when `VITE_AUTH_ENABLED=false`) | `false` |
| `VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET` | No | Set to `"true"` to include client_secret in token exchange (INSECURE — staging/demo only) | `false` |
| `VITE_OIDC_CLIENT_SECRET` | When demo secret enabled | The client secret value (EXPOSED in browser bundle — do NOT use in production) | — |

## Configuration Validation

When `VITE_AUTH_ENABLED=true`, the application validates that all required OIDC variables are present. If any are missing or empty, a configuration error page is displayed instead of silently falling back to demo mode.

## Behavior Matrix

| VITE_AUTH_ENABLED | VITE_DEMO_AUTH_ENABLED | Result |
|---|---|---|
| `true` | any value | Real Workspace ONE auth ONLY. No demo user possible. |
| `false` | `true` | Demo user auto-created (local development) |
| `false` | `false` or unset | No auth enforced, no demo user, all routes accessible |

## Example `.env` file for staging (public client, no secret)

```env
# All VITE_* variables are exposed in the browser bundle.
# DO NOT place secrets here unless using temporary demo mode.

VITE_AUTH_ENABLED=true
VITE_OIDC_AUTHORITY=https://moca.de.wss.workspaceone.com/SAAS/auth
VITE_OIDC_CLIENT_ID=work-plan-portal
VITE_OIDC_REDIRECT_URI=https://aigp-stg.moca.gov.ae/callback
VITE_OIDC_POST_LOGOUT_REDIRECT_URI=https://aigp-stg.moca.gov.ae/
VITE_OIDC_SCOPE=openid profile email
```

## Example `.env` file for staging (with temporary demo client secret)

```env
# WARNING:
# VITE_OIDC_CLIENT_SECRET is only for temporary internal demo use.
# It will be exposed in the browser bundle.
# Do not use this in production.
# Prefer Public Client / SPA with PKCE and no client secret for production.

VITE_AUTH_ENABLED=true
VITE_OIDC_AUTHORITY=https://moca.de.wss.workspaceone.com/SAAS/auth
VITE_OIDC_CLIENT_ID=work-plan-portal
VITE_OIDC_REDIRECT_URI=https://aigp-stg.moca.gov.ae/callback
VITE_OIDC_POST_LOGOUT_REDIRECT_URI=https://aigp-stg.moca.gov.ae/
VITE_OIDC_SCOPE=openid profile email
VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET=true
VITE_OIDC_CLIENT_SECRET=your-staging-client-secret-here
```

## Example `.env` file for local development (with demo user)

```env
VITE_AUTH_ENABLED=false
VITE_DEMO_AUTH_ENABLED=true
```

## Example `.env` file for local development (no auth, no demo)

```env
VITE_AUTH_ENABLED=false
```

## Docker / Build-Time Notes

- `VITE_*` variables are **build-time** values baked into the JavaScript bundle during `pnpm build`
- The `.env` file must be present **before** `docker build`
- `.dockerignore` must NOT exclude `.env` if using the secure-file pipeline method
- Updating Kubernetes env values after image build will NOT change the already-built frontend bundle
- No secret values are printed in logs

## Demo Client Secret Security Notes

- The `VITE_OIDC_CLIENT_SECRET` is **exposed in the browser bundle** when `VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET=true`
- This is acceptable ONLY for internal staging/demo environments
- The staging secret should be **revoked/rotated** after the demo period
- For production: use Public Client / SPA with PKCE only (no client secret), or implement a backend/BFF if a confidential client is required
- PKCE is NOT removed when client_secret is included — both are sent in the token exchange
- A prominent console warning is displayed when this mode is active
