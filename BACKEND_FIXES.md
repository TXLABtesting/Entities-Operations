# AIGP Backend Implementation Fixes

**Date:** 2026-06-29
**Scope:** Backend infrastructure, schema, API routes, and build pipeline fixes

---

## Summary of All Fixes Applied

### Phase 1-3: Build & Infrastructure Fixes

| # | Issue | Fix Applied |
|---|-------|-------------|
| 1 | `tsconfig.server.json` had `paths` alias that doesn't resolve at runtime | Removed `paths` block; imports use relative `.js` extensions |
| 2 | `package.json` scripts missing `mkdir -p` before `copy:migrations` | Added `mkdir -p dist/server/server/db` to `copy:migrations` script |
| 3 | No `dev:server` script for local backend development | Added `"dev:server": "tsx --watch server/index.ts"` |
| 4 | Dockerfile used `node:18-alpine` and wrong `tsconfig.node.json` | Updated to `node:20-alpine`, uses `tsconfig.server.json`, correct output paths |
| 5 | Dockerfile `CMD` path didn't match actual build output | Fixed to `node dist/server/server/index.js` |

### Phase 4: RBAC Route Fix

| # | Issue | Fix Applied |
|---|-------|-------------|
| 6 | `/api/permissions` mounted same router as `/api/roles` → `GET /api/permissions` returned roles | Split into `rolesRouter` and `permissionsRouter` with separate handlers |
| 7 | `GET /api/permissions` was actually `GET /api/permissions/permissions` (double path) | `permissionsRouter` now has `GET /` handler mounted at `/api/permissions` |
| 8 | Added `GET /api/roles/:id` endpoint for single role detail | New route in `rolesRouter` |

### Phase 5-6: Auth Middleware (Already Correct)

| # | Issue | Status |
|---|-------|--------|
| 9 | OIDC discovery via `jose` library with JWKS caching (1hr TTL) | ✅ Already implemented correctly |
| 10 | Bootstrap admin uses transaction (BEGIN/COMMIT/ROLLBACK) | ✅ Already implemented correctly |
| 11 | Dev mode requires `OIDC_ISSUER` empty AND `NODE_ENV=development` | ✅ Already implemented correctly |
| 12 | New users without bootstrap flag get `pending` + `access_enabled=false` | ✅ Already implemented correctly |

### Phase 7: Schema Fixes

| # | Issue | Fix Applied |
|---|-------|-------------|
| 13 | `work_plans` table missing `data JSONB` column used by workplans routes | Added migration `006_add_workplan_data_column.sql` |
| 14 | `audit_logs` table column mismatch (`actor_user_id` vs `user_id`) | Added migration `007_fix_audit_logs_columns.sql` with sync trigger |
| 15 | Auth middleware inserts `(user_id, action, resource_type, details)` but table had `(actor_user_id, ...)` | Trigger syncs `user_id` ↔ `actor_user_id` automatically |

### Phase 8: Workplans Routes Rewrite

| # | Issue | Fix Applied |
|---|-------|-------------|
| 16 | No entity scoping on `GET /api/work-plans` | Added `isGlobalRole()` check; non-global users only see their entity's plans |
| 17 | No transaction on `POST`, `PATCH`, `DELETE` | All mutations wrapped in `BEGIN/COMMIT/ROLLBACK` with `FOR UPDATE` locks |
| 18 | No Zod validation on request bodies | Added `createWorkPlanSchema` and `updateWorkPlanSchema` with Zod |
| 19 | Status transitions not enforced | Added `STATUS_TRANSITIONS` map with strict validation |
| 20 | Review records use correct table name `work_plan_reviews` | Matches migration 003 |
| 21 | Added `POST /api/work-plans/:id/return` endpoint | New route for returning plans for revision |

### Phase 9: Frontend API Client Fixes

| # | Issue | Fix Applied |
|---|-------|-------------|
| 22 | `apiClient` only checked sessionStorage for OIDC token | Added fallback to `localStorage.getItem("demo_token")` for dev mode |
| 23 | Missing `returnWorkPlan` API method | Added `returnWorkPlan: (id, comment) => apiClient.post(...)` |

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `tsconfig.server.json` | Modified | Removed `paths` alias |
| `package.json` | Modified | Added `dev:server`, fixed `copy:migrations` |
| `Dockerfile` | Rewritten | Node 20, correct tsconfig, correct CMD path |
| `server/modules/rbac/rbac.routes.ts` | Rewritten | Split into `rolesRouter` + `permissionsRouter` |
| `server/app.ts` | Modified | Import and mount separate RBAC routers |
| `server/modules/workplans/workplans.routes.ts` | Rewritten | Entity scoping, transactions, Zod, status transitions |
| `server/db/migrations/006_add_workplan_data_column.sql` | New | Adds `data JSONB` to `work_plans` |
| `server/db/migrations/007_fix_audit_logs_columns.sql` | New | Adds `user_id`, `details` columns + sync trigger |
| `client/src/lib/apiClient.ts` | Modified | Demo token fallback, `returnWorkPlan` method |
| `ENV_VARS_REFERENCE.md` | New | Complete env vars documentation |

---

## Validation Results

- **TypeScript**: `npx tsc --noEmit` → 0 errors
- **Production Build**: `pnpm build` → Success (client + server + migrations copied)
- **Server Output**: `dist/server/server/index.js` exists with all modules
- **Migrations**: All 7 migration files present in `dist/server/server/db/migrations/`

---

## Remaining Items (Not in Scope of This Fix)

1. **Frontend AuthContext → /api/auth/me integration**: Currently frontend uses local RBAC from OIDC claims. Full integration requires refactoring `AuthContext.tsx` to call `/api/auth/me` and use backend-derived roles/permissions.
2. **Unit tests**: No test files created yet. Recommend Vitest for both frontend and backend.
3. **CI/CD pipeline**: GitHub Actions workflow not yet created.
4. **Rate limiting per-user**: Current rate limit is IP-based. Consider adding user-based limits for authenticated endpoints.
