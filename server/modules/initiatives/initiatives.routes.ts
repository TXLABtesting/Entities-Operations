import { Router, Request, Response } from "express";
import { z } from "zod/v4";
import { authenticate } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAuditLog } from "../../middleware/audit.js";
import { query } from "../../db/pool.js";

const router = Router();

router.use(authenticate);

// GET /api/initiatives
router.get(
  "/",
  requirePermission("initiatives:view"),
  asyncHandler(async (req: Request, res: Response) => {
    const { work_plan_id, entity_id, track_id, status } = req.query;
    let sql = `
      SELECT i.*, e.name_ar as entity_name, t.name_ar as track_name
      FROM initiatives i
      LEFT JOIN entities e ON e.id = i.entity_id
      LEFT JOIN tracks t ON t.id = i.track_id
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (work_plan_id) { conditions.push(`i.work_plan_id = $${idx++}`); params.push(work_plan_id); }
    if (entity_id) { conditions.push(`i.entity_id = $${idx++}`); params.push(entity_id); }
    if (track_id) { conditions.push(`i.track_id = $${idx++}`); params.push(track_id); }
    if (status) { conditions.push(`i.status = $${idx++}`); params.push(status); }

    // Entity scoping
    if (!req.user!.roles.includes("platform_admin") && !req.user!.roles.includes("program_admin") && req.user!.entityId) {
      conditions.push(`i.entity_id = $${idx++}`);
      params.push(req.user!.entityId);
    }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY i.created_at DESC";

    const result = await query(sql, params);
    res.json(result.rows);
  })
);

// POST /api/initiatives
const createInitiativeSchema = z.object({
  work_plan_id: z.string().uuid(),
  entity_id: z.string().uuid(),
  track_id: z.string().uuid().optional(),
  name_en: z.string().min(1, "اسم المبادرة مطلوب"),
  name_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  owner: z.string().optional(),
  phase: z.number().int().optional(),
  priority: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  outputs: z.array(z.unknown()).optional(),
  outcomes: z.array(z.unknown()).optional(),
});

router.post(
  "/",
  requirePermission("initiatives:create"),
  asyncHandler(async (req: Request, res: Response) => {
    const body = createInitiativeSchema.parse(req.body);

    const result = await query(
      `INSERT INTO initiatives (work_plan_id, entity_id, track_id, name_en, name_ar, description_en, description_ar,
        owner, phase, status, priority, start_date, end_date, outputs, outcomes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'planned',$10,$11,$12,$13,$14,$15) RETURNING *`,
      [body.work_plan_id, body.entity_id, body.track_id || null, body.name_en, body.name_ar || null,
       body.description_en || null, body.description_ar || null, body.owner || null, body.phase || null,
       body.priority || null, body.start_date || null, body.end_date || null,
       JSON.stringify(body.outputs || []), JSON.stringify(body.outcomes || []), req.user!.id]
    );

    await writeAuditLog(req, { action: "initiative.created", resourceType: "initiative", resourceId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  })
);

// PATCH /api/initiatives/:id
router.patch(
  "/:id",
  requirePermission("initiatives:update"),
  asyncHandler(async (req: Request, res: Response) => {
    const allowedFields = ["name_en", "name_ar", "description_en", "description_ar", "owner", "phase", "status", "priority", "start_date", "end_date", "progress", "outputs", "outcomes"];
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const value = (field === "outputs" || field === "outcomes") ? JSON.stringify(req.body[field]) : req.body[field];
        sets.push(`${field} = $${idx++}`);
        params.push(value);
      }
    }

    if (sets.length === 0) throw ApiError.badRequest("لا توجد بيانات للتحديث");

    sets.push(`updated_by = $${idx++}`);
    params.push(req.user!.id);
    sets.push("updated_at = NOW()");
    params.push(req.params.id);

    const result = await query(
      `UPDATE initiatives SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) throw ApiError.notFound("المبادرة غير موجودة");

    await writeAuditLog(req, { action: "initiative.updated", resourceType: "initiative", resourceId: req.params.id });
    res.json(result.rows[0]);
  })
);

// DELETE /api/initiatives/:id
router.delete(
  "/:id",
  requirePermission("initiatives:delete"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query("DELETE FROM initiatives WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) throw ApiError.notFound("المبادرة غير موجودة");

    await writeAuditLog(req, { action: "initiative.deleted", resourceType: "initiative", resourceId: req.params.id });
    res.json({ success: true });
  })
);

export default router;
