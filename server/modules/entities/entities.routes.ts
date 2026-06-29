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

// GET /api/entities
router.get(
  "/",
  requirePermission("entities:view"),
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await query("SELECT * FROM entities ORDER BY name_ar, name_en");
    res.json(result.rows);
  })
);

// POST /api/entities
const createEntitySchema = z.object({
  code: z.string().min(1, "الرمز مطلوب"),
  name_en: z.string().min(1, "الاسم بالإنجليزية مطلوب"),
  name_ar: z.string().optional(),
  is_active: z.boolean().optional(),
});

router.post(
  "/",
  requirePermission("entities:create"),
  asyncHandler(async (req: Request, res: Response) => {
    const body = createEntitySchema.parse(req.body);

    const existing = await query("SELECT id FROM entities WHERE code = $1", [body.code]);
    if (existing.rows.length > 0) throw ApiError.conflict("رمز الجهة موجود بالفعل");

    const result = await query(
      "INSERT INTO entities (code, name_en, name_ar, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
      [body.code, body.name_en, body.name_ar || null, body.is_active ?? true]
    );

    await writeAuditLog(req, {
      action: "entity.created",
      resourceType: "entity",
      resourceId: result.rows[0].id,
      metadata: { code: body.code },
    });

    res.status(201).json(result.rows[0]);
  })
);

// PATCH /api/entities/:id
const updateEntitySchema = z.object({
  name_en: z.string().optional(),
  name_ar: z.string().optional(),
  is_active: z.boolean().optional(),
});

router.patch(
  "/:id",
  requirePermission("entities:update"),
  asyncHandler(async (req: Request, res: Response) => {
    const body = updateEntitySchema.parse(req.body);
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (body.name_en !== undefined) { sets.push(`name_en = $${idx++}`); params.push(body.name_en); }
    if (body.name_ar !== undefined) { sets.push(`name_ar = $${idx++}`); params.push(body.name_ar); }
    if (body.is_active !== undefined) { sets.push(`is_active = $${idx++}`); params.push(body.is_active); }

    if (sets.length === 0) throw ApiError.badRequest("لا توجد بيانات للتحديث");

    sets.push("updated_at = NOW()");
    params.push(req.params.id);

    const result = await query(
      `UPDATE entities SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) throw ApiError.notFound("الجهة غير موجودة");

    await writeAuditLog(req, {
      action: "entity.updated",
      resourceType: "entity",
      resourceId: req.params.id,
      metadata: body,
    });

    res.json(result.rows[0]);
  })
);

export default router;
