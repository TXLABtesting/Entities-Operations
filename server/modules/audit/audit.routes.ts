import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { query } from "../../db/pool.js";

const router = Router();

router.use(authenticate);

// GET /api/audit-logs
router.get(
  "/",
  requirePermission("audit:view"),
  asyncHandler(async (req: Request, res: Response) => {
    const { action, resource_type, resource_id, actor_user_id, page = "1", limit = "50" } = req.query;
    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    let sql = `
      SELECT al.*, u.display_name as actor_name, u.email as actor_email
      FROM audit_logs al
      LEFT JOIN app_users u ON u.id = al.actor_user_id
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (action) { conditions.push(`al.action = $${idx++}`); params.push(action); }
    if (resource_type) { conditions.push(`al.resource_type = $${idx++}`); params.push(resource_type); }
    if (resource_id) { conditions.push(`al.resource_id = $${idx++}`); params.push(resource_id); }
    if (actor_user_id) { conditions.push(`al.actor_user_id = $${idx++}`); params.push(actor_user_id); }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += ` ORDER BY al.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit as string, 10), offset);

    const result = await query(sql, params);

    // Count
    let countSql = "SELECT COUNT(*) FROM audit_logs al";
    if (conditions.length > 0) countSql += " WHERE " + conditions.slice(0, -2).map((c, i) => c.replace(`$${i + 1}`, `$${i + 1}`)).join(" AND ");
    // Simplified count
    const countResult = await query("SELECT COUNT(*) FROM audit_logs", []);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
  })
);

export default router;
