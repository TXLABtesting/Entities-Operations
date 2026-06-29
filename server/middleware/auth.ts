import { Request, Response, NextFunction } from "express";
import * as jose from "jose";
import { pool, query } from "../db/pool.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  entityId: string | null;
  entityCode: string | null;
  entityNameAr: string | null;
  status: string;
  accessEnabled: boolean;
  roles: string[];
  permissions: string[];
  oidcSub: string;
  oidcOid: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

// OIDC Discovery cache
let jwksClient: jose.JWTVerifyGetKey | null = null;
let discoveryFetchedAt = 0;
const DISCOVERY_CACHE_MS = 60 * 60 * 1000; // 1 hour

async function getJwksClient(): Promise<jose.JWTVerifyGetKey> {
  const now = Date.now();
  if (jwksClient && now - discoveryFetchedAt < DISCOVERY_CACHE_MS) {
    return jwksClient;
  }

  const discoveryUrl = `${env.OIDC_ISSUER}/.well-known/openid-configuration`;
  logger.info({ discoveryUrl }, "Fetching OIDC discovery document");

  const response = await fetch(discoveryUrl);
  if (!response.ok) {
    throw new Error(`OIDC discovery failed: ${response.status} ${response.statusText}`);
  }

  const config = await response.json() as { jwks_uri?: string };
  const jwksUri = config.jwks_uri;
  if (!jwksUri) {
    throw new Error("OIDC discovery document missing jwks_uri");
  }

  logger.info({ jwksUri }, "Creating JWKS client from discovery");
  jwksClient = jose.createRemoteJWKSet(new URL(jwksUri));
  discoveryFetchedAt = now;
  return jwksClient;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(ApiError.unauthorized("رمز المصادقة مفقود"));
    return;
  }

  const token = authHeader.slice(7);

  // Dev mode: accept "demo-token" for local testing when OIDC_ISSUER is not configured
  if (!env.OIDC_ISSUER && env.NODE_ENV === "development" && token === "demo-token") {
    req.user = {
      id: "demo-user-001",
      email: "demo@gov.ae",
      displayName: "Demo User",
      username: "demo",
      entityId: null,
      entityCode: null,
      entityNameAr: null,
      status: "active",
      accessEnabled: true,
      roles: ["platform_admin"],
      permissions: [
        "users:view", "users:create", "users:update", "users:enable", "users:disable",
        "roles:view", "roles:assign",
        "entities:view", "entities:create", "entities:update",
        "workplans:view", "workplans:create", "workplans:update", "workplans:delete",
        "workplans:submit", "workplans:approve", "workplans:reject", "workplans:export",
        "initiatives:view", "initiatives:create", "initiatives:update", "initiatives:delete",
        "prioritization:view", "prioritization:create", "prioritization:update", "prioritization:delete",
        "reports:view", "reports:export", "audit:view", "settings:view", "settings:update",
      ],
      oidcSub: "demo-sub",
      oidcOid: null,
    };
    next();
    return;
  }

  if (!env.OIDC_ISSUER) {
    next(ApiError.internal("OIDC_ISSUER not configured"));
    return;
  }

  try {
    // Validate JWT via OIDC discovery + JWKS
    const jwks = await getJwksClient();
    const verifyOptions: jose.JWTVerifyOptions = {
      issuer: env.OIDC_ISSUER,
    };
    if (env.OIDC_AUDIENCE) {
      verifyOptions.audience = env.OIDC_AUDIENCE;
    }

    const { payload } = await jose.jwtVerify(token, jwks, verifyOptions);

    // Extract identity claims
    const sub = (payload.sub as string) || "";
    const oid = (payload.oid as string) || (payload.object_id as string) || null;
    const email = ((payload.email as string) || (payload.user_name as string) || (payload.preferred_username as string) || (payload.upn as string) || "").toLowerCase();
    const displayName = (payload.name as string) || (payload.display_name as string) || email;

    if (!email) {
      next(ApiError.unauthorized("رمز المصادقة لا يحتوي على بريد إلكتروني"));
      return;
    }

    // Find or create user in database
    let userResult = await query(
      `SELECT u.id, u.entity_id, u.status, u.access_enabled, u.display_name, u.username,
              e.code as entity_code, e.name_ar as entity_name_ar
       FROM app_users u
       LEFT JOIN entities e ON u.entity_id = e.id
       WHERE u.email = $1`,
      [email]
    );

    const isBootstrapAdmin = env.BOOTSTRAP_ADMIN_EMAILS.includes(email);

    if (userResult.rows.length === 0) {
      // User does not exist in app_users
      if (isBootstrapAdmin) {
        // Bootstrap admin: create with full access using transaction
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const insertResult = await client.query(
            `INSERT INTO app_users (email, oidc_sub, oidc_oid, display_name, status, access_enabled, last_login_at)
             VALUES ($1, $2, $3, $4, 'active', TRUE, NOW()) RETURNING id`,
            [email, sub, oid, displayName]
          );
          const userId = insertResult.rows[0].id;

          // Assign platform_admin role
          await client.query(
            `INSERT INTO user_roles (user_id, role_id)
             SELECT $1, id FROM roles WHERE code = 'platform_admin'
             ON CONFLICT DO NOTHING`,
            [userId]
          );

          // Audit the bootstrap
          await client.query(
            `INSERT INTO audit_logs (user_id, action, resource_type, details)
             VALUES ($1, 'bootstrap_admin', 'user', $2)`,
            [userId, JSON.stringify({ email, reason: "BOOTSTRAP_ADMIN_EMAILS" })]
          );

          await client.query("COMMIT");
          logger.info({ email }, "Bootstrap admin created and activated");

          // Re-fetch
          userResult = await query(
            `SELECT u.id, u.entity_id, u.status, u.access_enabled, u.display_name, u.username,
                    e.code as entity_code, e.name_ar as entity_name_ar
             FROM app_users u
             LEFT JOIN entities e ON u.entity_id = e.id
             WHERE u.id = $1`,
            [userId]
          );
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      } else {
        // Regular user: create as pending (not enabled)
        await query(
          `INSERT INTO app_users (email, oidc_sub, oidc_oid, display_name, status, access_enabled)
           VALUES ($1, $2, $3, $4, 'pending', FALSE)`,
          [email, sub, oid, displayName]
        );
        logger.info({ email }, "New pending user created (access not enabled)");
        next(ApiError.forbidden("لم يتم تفعيل الوصول. تم تسجيل دخولك بنجاح، ولكن لم يتم تفعيل حسابك لاستخدام هذا التطبيق بعد. يرجى التواصل مع مسؤول النظام."));
        return;
      }
    } else {
      // User exists - update OIDC claims and last login
      await query(
        `UPDATE app_users SET oidc_sub = COALESCE($1, oidc_sub), oidc_oid = COALESCE($2, oidc_oid),
         display_name = COALESCE(display_name, $3), last_login_at = NOW(), updated_at = NOW()
         WHERE email = $4`,
        [sub || null, oid, displayName, email]
      );

      // Bootstrap admin auto-activation if not enabled
      if (isBootstrapAdmin && !userResult.rows[0].access_enabled) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          await client.query(
            "UPDATE app_users SET status = 'active', access_enabled = TRUE, updated_at = NOW() WHERE email = $1",
            [email]
          );
          // Ensure platform_admin role
          await client.query(
            `INSERT INTO user_roles (user_id, role_id)
             SELECT $1, id FROM roles WHERE code = 'platform_admin'
             ON CONFLICT DO NOTHING`,
            [userResult.rows[0].id]
          );
          await client.query(
            `INSERT INTO audit_logs (user_id, action, resource_type, details)
             VALUES ($1, 'bootstrap_admin_reactivation', 'user', $2)`,
            [userResult.rows[0].id, JSON.stringify({ email })]
          );
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
        userResult.rows[0].status = "active";
        userResult.rows[0].access_enabled = true;
      }
    }

    const user = userResult.rows[0];

    // Check access
    if (!user.access_enabled || user.status === "disabled") {
      next(ApiError.forbidden("لم يتم تفعيل الوصول. تم تسجيل دخولك بنجاح، ولكن لم يتم تفعيل حسابك لاستخدام هذا التطبيق بعد. يرجى التواصل مع مسؤول النظام."));
      return;
    }

    if (user.status === "pending") {
      next(ApiError.forbidden("حسابك قيد الانتظار. يرجى التواصل مع مسؤول النظام."));
      return;
    }

    // Load roles and permissions
    const rolesResult = await query(
      `SELECT r.code FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    const roles = rolesResult.rows.map((r: { code: string }) => r.code);

    const permsResult = await query(
      `SELECT DISTINCT p.code FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    const permissions = permsResult.rows.map((p: { code: string }) => p.code);

    req.user = {
      id: user.id,
      email,
      displayName: user.display_name || displayName,
      username: user.username,
      entityId: user.entity_id,
      entityCode: user.entity_code || null,
      entityNameAr: user.entity_name_ar || null,
      status: user.status,
      accessEnabled: user.access_enabled,
      roles,
      permissions,
      oidcSub: sub,
      oidcOid: oid,
    };

    next();
  } catch (err) {
    if (err instanceof jose.errors.JWTExpired) {
      next(ApiError.unauthorized("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى."));
      return;
    }
    logger.warn({ err }, "Token validation failed");
    next(ApiError.unauthorized("رمز المصادقة غير صالح أو منتهي الصلاحية"));
  }
}

// Optional auth - doesn't fail if no token
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }
  await authenticate(req, res, next);
}
