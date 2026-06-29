# AIGP Backend - Technical Documentation

## Overview

Full-stack backend implementation for the AIGP Work Plan Portal. Built with Express.js, TypeScript, PostgreSQL, and RBAC (Role-Based Access Control).

---

## Architecture

```
server/
├── config/
│   ├── env.ts          # Environment variable validation (Zod)
│   ├── cors.ts         # CORS configuration
│   └── logger.ts       # Pino structured logger
├── db/
│   ├── pool.ts         # PostgreSQL connection pool (pg)
│   ├── migrate.ts      # Migration runner with advisory lock
│   └── migrations/
│       ├── 001_core_schema.sql       # entities, app_users, roles, permissions, user_roles, role_permissions
│       ├── 002_business_schema.sql   # tracks, work_plans, initiatives, process_prioritizations
│       ├── 003_reviews_audit.sql     # work_plan_reviews, comments, audit_logs
│       ├── 004_seed_rbac.sql         # Seed roles + permissions + role-permission matrix
│       └── 005_seed_tracks.sql       # Seed default tracks
├── middleware/
│   ├── requestId.ts         # X-Request-ID injection
│   ├── errorHandler.ts      # Centralized error handler
│   ├── auth.ts              # JWT/OIDC token validation + user lookup/creation
│   ├── requirePermission.ts # Permission/role enforcement
│   └── audit.ts             # Audit log writer
├── modules/
│   ├── auth/auth.routes.ts
│   ├── users/users.routes.ts
│   ├── rbac/rbac.routes.ts
│   ├── entities/entities.routes.ts
│   ├── tracks/tracks.routes.ts
│   ├── workplans/workplans.routes.ts
│   ├── initiatives/initiatives.routes.ts
│   ├── prioritization/prioritization.routes.ts
│   └── audit/audit.routes.ts
├── utils/
│   ├── ApiError.ts      # Custom error class with HTTP codes
│   └── asyncHandler.ts  # Async route wrapper
├── app.ts               # Express app factory
└── index.ts             # Entry point (startup sequence)
```

---

## API Endpoints

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness check |
| GET | `/api/ready` | Readiness check (DB + migrations) |

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/me` | Bearer | Get current user info, roles, permissions |

### Users
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/users` | `users:view` | List users (paginated, filterable) |
| POST | `/api/users` | `users:create` | Create user manually |
| GET | `/api/users/:id` | `users:view` | Get user details |
| PATCH | `/api/users/:id` | `users:update` | Update user |
| POST | `/api/users/:id/enable` | `users:enable` | Enable user access |
| POST | `/api/users/:id/disable` | `users:disable` | Disable user access |
| POST | `/api/users/:id/roles` | `roles:assign` | Assign role to user |
| DELETE | `/api/users/:id/roles/:roleId` | `roles:assign` | Remove role from user |

### Roles & Permissions
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/roles` | `roles:view` | List roles with permissions |
| GET | `/api/permissions` | `roles:view` | List all permissions |

### Entities
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/entities` | `entities:view` | List entities |
| POST | `/api/entities` | `entities:create` | Create entity |
| PATCH | `/api/entities/:id` | `entities:update` | Update entity |

### Tracks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tracks` | Bearer | List active tracks |

### Work Plans
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/work-plans` | `workplans:view` | List work plans (entity-scoped) |
| POST | `/api/work-plans` | `workplans:create` | Create work plan |
| GET | `/api/work-plans/:id` | `workplans:view` | Get work plan |
| PATCH | `/api/work-plans/:id` | `workplans:update` | Update work plan |
| DELETE | `/api/work-plans/:id` | `workplans:delete` | Delete work plan |
| POST | `/api/work-plans/:id/submit` | `workplans:submit` | Submit for review |
| POST | `/api/work-plans/:id/approve` | `workplans:approve` | Approve work plan |
| POST | `/api/work-plans/:id/reject` | `workplans:reject` | Reject work plan |

### Initiatives
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/initiatives` | `initiatives:view` | List initiatives |
| POST | `/api/initiatives` | `initiatives:create` | Create initiative |
| PATCH | `/api/initiatives/:id` | `initiatives:update` | Update initiative |
| DELETE | `/api/initiatives/:id` | `initiatives:delete` | Delete initiative |

### Prioritization
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/prioritization` | `prioritization:view` | List prioritizations |
| POST | `/api/prioritization` | `prioritization:create` | Create prioritization |
| PATCH | `/api/prioritization/:id` | `prioritization:update` | Update prioritization |
| DELETE | `/api/prioritization/:id` | `prioritization:delete` | Delete prioritization |

### Audit Logs
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/audit-logs` | `audit:view` | List audit logs (paginated) |

---

## RBAC Model

### Roles (Seeded)
| Code | Name | Description |
|------|------|-------------|
| `platform_admin` | مدير النظام | Full access to all resources |
| `program_admin` | مدير البرنامج | Cross-entity program management |
| `entity_admin` | مدير الجهة | Entity-scoped administration |
| `entity_editor` | محرر الجهة | Create/edit within entity |
| `entity_viewer` | مشاهد الجهة | Read-only entity access |
| `reviewer` | مراجع | Review and approve work plans |

### Permission Matrix
- `platform_admin`: ALL permissions
- `program_admin`: users:view, entities:view/create/update, workplans:*, initiatives:*, prioritization:*, audit:view
- `entity_admin`: users:view, workplans:view/create/update/submit, initiatives:*, prioritization:*
- `entity_editor`: workplans:view/create/update, initiatives:view/create/update, prioritization:view/create/update
- `entity_viewer`: workplans:view, initiatives:view, prioritization:view
- `reviewer`: workplans:view/approve/reject

---

## Authentication Flow

1. Frontend sends Bearer token (from Workspace ONE OIDC) with every API request
2. `auth.ts` middleware validates JWT signature via JWKS endpoint
3. Extracts email from token claims
4. Looks up or creates user in `app_users` table
5. Bootstrap admin emails (from `BOOTSTRAP_ADMIN_EMAILS` env) are auto-activated with `platform_admin` role
6. Non-bootstrap users are created as `pending` / `access_enabled=false`
7. Loads user roles and permissions from DB
8. Attaches `req.user` with full context

---

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OIDC_ISSUER` | Workspace ONE issuer URL |
| `BOOTSTRAP_ADMIN_EMAILS` | Comma-separated admin emails |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4000 | Server port |
| `NODE_ENV` | development | Environment |
| `OIDC_AUDIENCE` | - | Expected token audience |
| `CORS_ORIGINS` | * | Allowed CORS origins |
| `RUN_MIGRATIONS_ON_STARTUP` | true | Auto-run migrations |
| `LOG_LEVEL` | info | Pino log level |

---

## Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Workspace ONE Access tenant (OIDC)

### Steps
```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables
cp .env.example .env
# Edit .env with your values

# 3. Start (migrations run automatically)
pnpm start:server
# Or for development:
pnpm dev:server
```

### Docker (recommended for staging/production)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build:server
EXPOSE 4000
CMD ["node", "dist/server/index.js"]
```

---

## Frontend Admin UI

Admin panel available at `/admin` with the following pages:
- `/admin/users` - User management (enable/disable, assign roles)
- `/admin/entities` - Entity CRUD
- `/admin/roles` - View roles and permissions
- `/admin/audit` - Audit log viewer

All admin pages are Arabic-first (RTL) and require authentication.

---

## Security Features

- JWT validation via JWKS (RS256)
- Rate limiting (500 req / 15 min per IP)
- Helmet security headers
- CORS whitelist
- Request ID tracing
- Audit logging for all mutations
- Advisory lock for migration safety
- Parameterized queries (SQL injection prevention)
- Fail-closed auth (no default roles)
