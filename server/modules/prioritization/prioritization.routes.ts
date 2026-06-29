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

// GET /api/prioritization
router.get(
  "/",
  requirePermission("prioritization:view"),
  asyncHandler(async (req: Request, res: Response) => {
    const { entity_id, work_plan_id, priority_level } = req.query;
    let sql = `
      SELECT pp.*, e.name_ar as entity_name
      FROM process_prioritizations pp
      LEFT JOIN entities e ON e.id = pp.entity_id
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (entity_id) { conditions.push(`pp.entity_id = $${idx++}`); params.push(entity_id); }
    if (work_plan_id) { conditions.push(`pp.work_plan_id = $${idx++}`); params.push(work_plan_id); }
    if (priority_level) { conditions.push(`pp.priority_level = $${idx++}`); params.push(priority_level); }

    // Entity scoping
    if (!req.user!.roles.includes("platform_admin") && !req.user!.roles.includes("program_admin") && req.user!.entityId) {
      conditions.push(`pp.entity_id = $${idx++}`);
      params.push(req.user!.entityId);
    }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY pp.total_score DESC NULLS LAST";

    const result = await query(sql, params);
    res.json(result.rows);
  })
);

// POST /api/prioritization
const createPrioritizationSchema = z.object({
  entity_id: z.string().uuid(),
  work_plan_id: z.string().uuid().optional(),
  process_name: z.string().min(1, "اسم العملية مطلوب"),
  owner: z.string().optional(),
  volume_text: z.string().optional(),
  ai_type: z.string().optional(),
  value_area: z.string().optional(),
  volume_score: z.number().int().optional(),
  effort_score: z.number().int().optional(),
  impact_score: z.number().int().optional(),
  data_score: z.number().int().optional(),
  api_score: z.number().int().optional(),
  risk_score: z.number().int().optional(),
  total_score: z.number().int().optional(),
  priority_level: z.string().optional(),
  opportunities: z.string().optional(),
  challenges: z.string().optional(),
  difficulties: z.string().optional(),
  notes: z.string().optional(),
  linked_initiative_id: z.string().uuid().optional(),
});

router.post(
  "/",
  requirePermission("prioritization:create"),
  asyncHandler(async (req: Request, res: Response) => {
    const body = createPrioritizationSchema.parse(req.body);

    const result = await query(
      `INSERT INTO process_prioritizations (entity_id, work_plan_id, process_name, owner, volume_text, ai_type, value_area,
        volume_score, effort_score, impact_score, data_score, api_score, risk_score, total_score, priority_level,
        opportunities, challenges, difficulties, notes, linked_initiative_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [body.entity_id, body.work_plan_id || null, body.process_name, body.owner || null,
       body.volume_text || null, body.ai_type || null, body.value_area || null,
       body.volume_score ?? null, body.effort_score ?? null, body.impact_score ?? null,
       body.data_score ?? null, body.api_score ?? null, body.risk_score ?? null,
       body.total_score ?? null, body.priority_level || null,
       body.opportunities || null, body.challenges || null, body.difficulties || null,
       body.notes || null, body.linked_initiative_id || null, req.user!.id]
    );

    await writeAuditLog(req, { action: "prioritization.created", resourceType: "prioritization", resourceId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  })
);

// PATCH /api/prioritization/:id
router.patch(
  "/:id",
  requirePermission("prioritization:update"),
  asyncHandler(async (req: Request, res: Response) => {
    const allowedFields = ["process_name", "owner", "volume_text", "ai_type", "value_area",
      "volume_score", "effort_score", "impact_score", "data_score", "api_score", "risk_score",
      "total_score", "priority_level", "opportunities", "challenges", "difficulties", "notes", "linked_initiative_id"];
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = $${idx++}`);
        params.push(req.body[field]);
      }
    }

    if (sets.length === 0) throw ApiError.badRequest("لا توجد بيانات للتحديث");

    sets.push(`updated_by = $${idx++}`);
    params.push(req.user!.id);
    sets.push("updated_at = NOW()");
    params.push(req.params.id);

    const result = await query(
      `UPDATE process_prioritizations SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) throw ApiError.notFound("العملية غير موجودة");

    await writeAuditLog(req, { action: "prioritization.updated", resourceType: "prioritization", resourceId: req.params.id });
    res.json(result.rows[0]);
  })
);

// DELETE /api/prioritization/:id
router.delete(
  "/:id",
  requirePermission("prioritization:delete"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query("DELETE FROM process_prioritizations WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) throw ApiError.notFound("العملية غير موجودة");

    await writeAuditLog(req, { action: "prioritization.deleted", resourceType: "prioritization", resourceId: req.params.id });
    res.json({ success: true });
  })
);

export default router;
