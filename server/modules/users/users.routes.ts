import { Router, Request, Response } from "express";
import { z } from "zod/v4";
import { authenticate } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAuditLog } from "../../middleware/audit.js";
import { query } from "../../db/pool.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - List users
router.get(
  "/",
  requirePermission("users:view"),
  asyncHandler(async (req: Request, res: Response) => {
    const { search, status, entity_id, page = "1", limit = "50" } = req.query;
    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    let sql = `
      SELECT u.id, u.email, u.display_name, u.username, u.status, u.access_enabled,
             u.entity_id, e.name_ar as entity_name, u.last_login_at, u.created_at,
             COALESCE(json_agg(json_build_object('code', r.code, 'name', r.name)) FILTER (WHERE r.code IS NOT NULL), '[]') as roles
      FROM app_users u
      LEFT JOIN entities e ON e.id = u.entity_id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(u.email ILIKE $${paramIdx} OR u.display_name ILIKE $${paramIdx} OR u.username ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (status) {
      conditions.push(`u.status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }
    if (entity_id) {
      conditions.push(`u.entity_id = $${paramIdx}`);
      params.push(entity_id);
      paramIdx++;
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += ` GROUP BY u.id, e.name_ar ORDER BY u.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(parseInt(limit as string, 10), offset);

    const result = await query(sql, params);

    // Count total
    let countSql = "SELECT COUNT(*) FROM app_users u";
    if (conditions.length > 0) {
      countSql += " WHERE " + conditions.join(" AND ");
    }
    const countResult = await query(countSql, params.slice(0, -2));

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
  })
);

// POST /api/users - Create user manually
const createUserSchema = z.object({
  email: z.email("البريد الإلكتروني غير صحيح"),
  display_name: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  access_enabled: z.boolean().optional(),
});

router.post(
  "/",
  requirePermission("users:create"),
  asyncHandler(async (req: Request, res: Response) => {
    const body = createUserSchema.parse(req.body);

    // Check if user already exists
    const existing = await query("SELECT id FROM app_users WHERE email = $1", [body.email.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw ApiError.conflict("المستخدم موجود بالفعل");
    }

    const result = await query(
      `INSERT INTO app_users (email, display_name, entity_id, status, access_enabled)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [body.email.toLowerCase(), body.display_name || null, body.entity_id || null, body.access_enabled ? "active" : "pending", body.access_enabled || false]
    );

    await writeAuditLog(req, {
      action: "user.created",
      resourceType: "user",
      resourceId: result.rows[0].id,
      metadata: { email: body.email },
    });

    res.status(201).json(result.rows[0]);
  })
);

// GET /api/users/:id - Get user details
router.get(
  "/:id",
  requirePermission("users:view"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(
      `SELECT u.*, e.name_ar as entity_name,
              COALESCE(json_agg(json_build_object('id', r.id, 'code', r.code, 'name', r.name)) FILTER (WHERE r.code IS NOT NULL), '[]') as roles
       FROM app_users u
       LEFT JOIN entities e ON e.id = u.entity_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id, e.name_ar`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound("المستخدم غير موجود");
    }

    res.json(result.rows[0]);
  })
);

// PATCH /api/users/:id - Update user
const updateUserSchema = z.object({
  display_name: z.string().optional(),
  entity_id: z.string().uuid().nullable().optional(),
  status: z.enum(["pending", "active", "disabled"]).optional(),
});

router.patch(
  "/:id",
  requirePermission("users:update"),
  asyncHandler(async (req: Request, res: Response) => {
    const body = updateUserSchema.parse(req.body);
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (body.display_name !== undefined) {
      sets.push(`display_name = $${idx++}`);
      params.push(body.display_name);
    }
    if (body.entity_id !== undefined) {
      sets.push(`entity_id = $${idx++}`);
      params.push(body.entity_id);
    }
    if (body.status !== undefined) {
      sets.push(`status = $${idx++}`);
      params.push(body.status);
    }

    if (sets.length === 0) throw ApiError.badRequest("لا توجد بيانات للتحديث");

    sets.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const result = await query(
      `UPDATE app_users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) throw ApiError.notFound("المستخدم غير موجود");

    await writeAuditLog(req, {
      action: "user.updated",
      resourceType: "user",
      resourceId: req.params.id,
      metadata: body,
    });

    res.json(result.rows[0]);
  })
);

// POST /api/users/:id/enable - Enable user access
router.post(
  "/:id/enable",
  requirePermission("users:enable"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(
      "UPDATE app_users SET access_enabled = TRUE, status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) throw ApiError.notFound("المستخدم غير موجود");

    await writeAuditLog(req, {
      action: "user.enabled",
      resourceType: "user",
      resourceId: req.params.id,
    });

    res.json(result.rows[0]);
  })
);

// POST /api/users/:id/disable - Disable user access
router.post(
  "/:id/disable",
  requirePermission("users:disable"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(
      "UPDATE app_users SET access_enabled = FALSE, status = 'disabled', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) throw ApiError.notFound("المستخدم غير موجود");

    await writeAuditLog(req, {
      action: "user.disabled",
      resourceType: "user",
      resourceId: req.params.id,
    });

    res.json(result.rows[0]);
  })
);

// POST /api/users/:id/roles - Assign role
const assignRoleSchema = z.object({
  role_id: z.string().uuid("معرف الدور غير صحيح"),
  entity_id: z.string().uuid().nullable().optional(),
});

router.post(
  "/:id/roles",
  requirePermission("roles:assign"),
  asyncHandler(async (req: Request, res: Response) => {
    const body = assignRoleSchema.parse(req.body);

    await query(
      "INSERT INTO user_roles (user_id, role_id, entity_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [req.params.id, body.role_id, body.entity_id || null]
    );

    await writeAuditLog(req, {
      action: "role.assigned",
      resourceType: "user",
      resourceId: req.params.id,
      metadata: { role_id: body.role_id },
    });

    res.json({ success: true });
  })
);

// DELETE /api/users/:id/roles/:roleId - Remove role
router.delete(
  "/:id/roles/:roleId",
  requirePermission("roles:assign"),
  asyncHandler(async (req: Request, res: Response) => {
    await query(
      "DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2",
      [req.params.id, req.params.roleId]
    );

    await writeAuditLog(req, {
      action: "role.removed",
      resourceType: "user",
      resourceId: req.params.id,
      metadata: { role_id: req.params.roleId },
    });

    res.json({ success: true });
  })
);

export default router;
