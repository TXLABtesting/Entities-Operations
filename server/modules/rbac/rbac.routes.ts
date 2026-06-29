import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { query } from "../../db/pool.js";

// Roles router - mounted at /api/roles
export const rolesRouter = Router();
rolesRouter.use(authenticate);

// GET /api/roles - List all roles with their permissions
rolesRouter.get(
  "/",
  requirePermission("roles:view"),
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await query(`
      SELECT r.id, r.code, r.name, r.description, r.is_system,
             COALESCE(json_agg(json_build_object('id', p.id, 'code', p.code, 'description', p.description))
               FILTER (WHERE p.code IS NOT NULL), '[]') as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      GROUP BY r.id
      ORDER BY r.created_at
    `);
    res.json(result.rows);
  })
);

// GET /api/roles/:id - Get single role
rolesRouter.get(
  "/:id",
  requirePermission("roles:view"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(`
      SELECT r.id, r.code, r.name, r.description, r.is_system,
             COALESCE(json_agg(json_build_object('id', p.id, 'code', p.code, 'description', p.description))
               FILTER (WHERE p.code IS NOT NULL), '[]') as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE r.id = $1
      GROUP BY r.id
    `, [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: "الدور غير موجود" });
      return;
    }
    res.json(result.rows[0]);
  })
);

// Permissions router - mounted at /api/permissions
export const permissionsRouter = Router();
permissionsRouter.use(authenticate);

// GET /api/permissions - List all permissions
permissionsRouter.get(
  "/",
  requirePermission("roles:view"),
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await query("SELECT * FROM permissions ORDER BY code");
    res.json(result.rows);
  })
);

// Default export for backward compatibility
export default rolesRouter;
