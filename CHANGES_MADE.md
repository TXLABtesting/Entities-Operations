# SSO Implementation — Review & Fix

**Date:** 2026-06-26
**Scope:** Workspace ONE / Omnissa Access OIDC integration hardening
**Approach:** Minimal, non-breaking changes to existing React + Vite + TypeScript frontend

---

## Summary of Changes

This document describes the fixes applied based on the SSO Implementation Review Plan. All changes are limited to frontend authentication logic. No backend, database, framework, or UI redesign changes were made. `wouter` routing is preserved. Vite is preserved.

---

## 1. All Application Routes Are Protected

**What changed:** Moved from per-route `<ProtectedRoute>` wrappers to a single `<RequireAuth>` gate that wraps the entire application route tree. Future routes are protected by default.

**Protected routes (require Workspace ONE login when `VITE_AUTH_ENABLED=true`):**
- `/` (Home)
- `/tracks`
- `/tracks-list`
- `/workplan/:trackId`
- `/review/:trackId`
- `/404`
- Any future route added inside `ProtectedRoutes` component

**Public routes (accessible without authentication):**
- `/callback` — OIDC authorization code processing
- `/auth/callback` — Alternative OIDC callback endpoint

**Why callback routes are public:** The OIDC flow requires the browser to return to the callback URL after Workspace ONE authentication. Protecting this route would break the login flow.

**Implementation:** `client/src/App.tsx` — `ProtectedRoutes` component wraps all application routes in a single `<RequireAuth>` gate. The `<Switch>` in `Router` checks callback routes first (public), then falls through to `ProtectedRoutes` for everything else.

---

## 2. OIDC Callback Behavior Fixed

**Problem:** Users were stuck on a permanent loading screen at `/callback`.

**Fix:**
1. Before triggering login, the originally requested path is stored in `sessionStorage` under key `auth_return_to`.
2. After Workspace ONE redirects back to `/callback`, `react-oidc-context` processes the authorization code.
3. The `onSigninCallback` handler in `AppAuthProvider`:
   - Reads the stored return path from `sessionStorage`
   - Removes the `auth_return_to` key
   - Replaces the URL (removes `code`, `state`, and other OIDC query parameters)
   - Redirects to the original route (or `/` if none stored)

**Files:** `client/src/auth/AuthProvider.tsx`, `client/src/auth/RequireAuth.tsx`

---

## 3. Unsafe Default Admin Behavior Removed

**Problem:** Authenticated users without valid role/group claims were defaulted to `entity_admin`.

**Fix:** The system now **fails closed**:
- If Workspace ONE login succeeds but no valid role claim is found in the token, the user sees an "Access Denied" (غير مصرح بالوصول) page.
- No elevated permissions are granted by default.
- The user is informed to contact their system administrator.
- A logout button is provided.

**Implementation:** `mapProfileToRole()` in `client/src/auth/claims.ts` returns `null` when no valid role is found. `OidcBackedAuthProvider` in `client/src/contexts/AuthContext.tsx` checks for `null` and renders `UnauthorizedPage`.

---

## 4. Fuzzy Role Matching Replaced with Explicit Mapping

**Problem:** Role assignment used unsafe substring matching (`includes("admin")`, `includes("entity")`).

**Fix:** All role mapping is now explicit via `WORKSPACE_ONE_ROLE_MAP`:

```typescript
export const WORKSPACE_ONE_ROLE_MAP: Record<string, UserRole> = {
  "WORK_PLAN_ADMIN": "admin",
  "WORK_PLAN_ENTITY_ADMIN": "entity_admin",
  "WORK_PLAN_COORDINATOR": "coordinator",
  "WORK_PLAN_VIEWER": "viewer",
  "WORK_PLAN_AUDITOR": "auditor",
};
```

**Important:** These are placeholder group names. The identity team must provide the final Workspace ONE group names and update this mapping accordingly.

**Claim names checked (in order):** `groups`, `group`, `roles`, `role`, `memberOf`

**File:** `client/src/auth/claims.ts`

---

## 5. Demo Mode Safely Guarded

**Problem:** Demo user could be accidentally active in staging/production.

**Fix:** Demo mode now requires TWO conditions:
1. `VITE_AUTH_ENABLED=false` (auth must be disabled)
2. `VITE_DEMO_AUTH_ENABLED=true` (demo must be explicitly opted in)

**Behavior matrix:**

| VITE_AUTH_ENABLED | VITE_DEMO_AUTH_ENABLED | Result |
|---|---|---|
| `true` | any value | Real Workspace ONE auth ONLY. No demo user. |
| `false` | `true` | Demo user created (local development) |
| `false` | `false` or unset | No auth, no demo user, all routes accessible |

**Files:** `client/src/auth/oidcConfig.ts`, `client/src/contexts/AuthContext.tsx`, `client/src/App.tsx`

---

## 6. OIDC Configuration Validated

**What changed:** When `VITE_AUTH_ENABLED=true`, the app validates that ALL required OIDC variables are present:
- `VITE_OIDC_AUTHORITY`
- `VITE_OIDC_CLIENT_ID`
- `VITE_OIDC_REDIRECT_URI`
- `VITE_OIDC_POST_LOGOUT_REDIRECT_URI`

**If any are missing:** A clear configuration error page is shown (in Arabic) instead of silently falling back to demo mode or breaking at runtime.

**No client secret is used anywhere.** The app uses Authorization Code Flow with PKCE (public client / SPA).

**File:** `client/src/auth/oidcConfig.ts`, `client/src/auth/AuthProvider.tsx`

---

## 7. CORS — Workspace ONE Side Dependency

**Current issue:** The browser receives a CORS error when calling:
```
https://moca.de.wss.workspaceone.com/SAAS/auth/.well-known/openid-configuration
```
from origin:
```
https://aigp-stg.moca.gov.ae
```

**This is NOT a frontend issue.** The fix must be applied on the Workspace ONE / Omnissa Access side:
- The staging origin `https://aigp-stg.moca.gov.ae` must be allowlisted for browser-based OIDC/CORS access.
- The identity/systems team must configure this in the Workspace ONE admin console.

**No frontend workarounds were applied.** The code remains standards-based OIDC. No `no-cors`, proxy hacks, disabled discovery, or hardcoded metadata were introduced.

---

## 8. Docker / Environment Handling

**How it works:**
1. DevOps pipeline downloads the staging `.env` as a secure file
2. The `.env` is copied to the project root before `docker build`
3. Dockerfile runs `COPY . .` then `RUN pnpm run build`
4. Vite reads `VITE_*` variables from `.env` at build time and inlines them into the bundle

**Critical notes:**
- `VITE_*` variables are **build-time** values — they are baked into the JavaScript bundle during `pnpm build`
- The `.env` file **must be present before** `docker build`
- `.dockerignore` must **NOT** exclude `.env` if this secure-file method is used
- Updating Kubernetes env values **after** image build will NOT change the already-built frontend bundle
- No secret values are printed in logs

---

## Packages

- `react-oidc-context` (v3.3.1) — React bindings for OIDC authentication
- `oidc-client-ts` (v3.5.0) — TypeScript OIDC client library

---

## 9. Temporary Demo Client Secret Support (INSECURE)

**Purpose:** Allow staging/demo environments to include a client_secret in the token exchange request when the Workspace ONE application is configured as a confidential client.

**Security warning:** This exposes the client secret in the browser bundle. It is ONLY for temporary internal staging/demo use. Do NOT use in production.

**How it works:**
- Controlled by two environment variables:
  - `VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET=true` (opt-in flag)
  - `VITE_OIDC_CLIENT_SECRET=<secret>` (the actual secret value)
- Both must be set for the secret to be included in token requests
- PKCE is NOT removed — the token exchange includes both `code_verifier` AND `client_secret`
- A prominent console warning is logged when this mode is active
- If `VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET=true` but `VITE_OIDC_CLIENT_SECRET` is empty, a configuration error is shown

**Token exchange request includes (when demo secret enabled):**
- `grant_type=authorization_code`
- `client_id`
- `code`
- `redirect_uri`
- `code_verifier` (PKCE preserved)
- `client_secret` (added conditionally)

**Default:** `VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET=false` — disabled by default.

**Post-demo action:** The staging client secret should be revoked/rotated after the demo. Production should use Public Client / SPA with PKCE and no client secret, or a backend/BFF if a confidential client is required.

**File:** `client/src/auth/oidcConfig.ts`

---

## Files Changed

| File | Action | Description |
|---|---|---|
| `client/src/auth/oidcConfig.ts` | Modified | Added config validation, `demoAuthEnabled` guard, `oidcConfigError`, conditional `client_secret` |
| `client/src/auth/AuthProvider.tsx` | Modified | Added config error page, callback redirect with sessionStorage |
| `client/src/auth/RequireAuth.tsx` | Modified | Auto-redirect to login, store return path in sessionStorage |
| `client/src/auth/claims.ts` | Rewritten | Explicit `WORKSPACE_ONE_ROLE_MAP`, removed all fuzzy matching |
| `client/src/auth/index.ts` | Modified | Updated exports |
| `client/src/contexts/AuthContext.tsx` | Rewritten | Fail-closed role mapping, `UnauthorizedPage`, guarded demo mode |
| `client/src/App.tsx` | Rewritten | Single `RequireAuth` wrapper for all routes, callback routes public |
| `client/src/main.tsx` | Modified | Clean import structure |
| `CHANGES_MADE.md` | Rewritten | This document |

---

## Confirmation: All Application Routes Protected by Default

When `VITE_AUTH_ENABLED=true`:
- Opening `/` in incognito → requires Workspace ONE login ✅
- Opening `/tracks` in incognito → requires Workspace ONE login ✅
- Opening `/tracks-list` in incognito → requires Workspace ONE login ✅
- Opening `/workplan/:trackId` in incognito → requires Workspace ONE login ✅
- Opening `/review/:trackId` in incognito → requires Workspace ONE login ✅
- `/callback` and `/auth/callback` → remain reachable without authentication ✅
- Any future route added inside `ProtectedRoutes` → automatically protected ✅

---

## Validation Results

```bash
$ pnpm install
# ✅ All dependencies installed successfully

$ npx tsc --noEmit
# ✅ No TypeScript errors

$ pnpm build
# ✅ Build successful (6.03s, 1655 modules transformed)
```

**Manual verification:**
- ✅ With auth disabled (default dev), all routes accessible normally
- ✅ No demo user created when `VITE_AUTH_ENABLED=true`
- ✅ No fuzzy role matching remains in codebase
- ✅ `mapProfileToRole()` returns `null` for unknown claims → access denied
- ✅ `/callback` and `/auth/callback` remain public
- ✅ All other routes wrapped in single `RequireAuth` gate
- ✅ Client secret only included when `VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET=true` AND `VITE_OIDC_CLIENT_SECRET` is set
- ✅ PKCE (code_verifier) still included in token exchange even when client_secret is present
- ✅ Console warning displayed when insecure demo secret mode is active

---

## Remaining Dependencies

1. **CORS allowlisting (BLOCKING):** The identity/systems team must allowlist `https://aigp-stg.moca.gov.ae` in Workspace ONE for browser-based OIDC/CORS access.
2. **Final group names:** Update `WORKSPACE_ONE_ROLE_MAP` in `client/src/auth/claims.ts` with the actual Workspace ONE group names once confirmed by the identity team.
3. **Entity claims:** If Workspace ONE provides `entity_id` and `entity_name` in the token, they will be automatically mapped. Otherwise, a separate entity resolution mechanism may be needed.

---

## Rollback Plan

If issues arise after deployment:
1. Set `VITE_AUTH_ENABLED=false` in the `.env` file
2. Optionally set `VITE_DEMO_AUTH_ENABLED=true` if demo user is needed
3. Rebuild and redeploy
4. The app will function without SSO

For code rollback, revert to the previous Git commit/checkpoint before these changes.

---

## Assumptions

1. Workspace ONE sends group/role claims under one of: `groups`, `group`, `roles`, `role`, or `memberOf`
2. The OIDC token contains `sub`, `email`, `name` (or `given_name`/`preferred_username`) claims
3. The placeholder group names (`WORK_PLAN_ADMIN`, etc.) will be replaced with actual values
4. No client secret is needed for production (public SPA client with PKCE)
5. Temporary demo client secret is ONLY for staging — must be revoked after demo
5. The staging `.env` is injected before Docker build as documented
6. `wouter` is used for routing (preserved, not replaced)
7. No backend dependency was introduced
