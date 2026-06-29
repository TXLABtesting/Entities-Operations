import { Router, Request, Response } from "express";
import { z } from "zod/v4";
import { authenticate } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAuditLog } from "../../middleware/audit.js";
import { pool, query } from "../../db/pool.js";

const router = Router();

router.use(authenticate);

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "returned"],
  under_review: ["approved", "rejected", "returned"],
  returned: ["draft", "submitted"],
  rejected: ["draft"],
  approved: [],
};

// Helper: check if user has global access (bypasses entity scoping)
function isGlobalRole(user: Request["user"]): boolean {
  if (!user) return false;
  return user.roles.some((r) => ["platform_admin", "program_admin", "reviewer"].includes(r));
}

// GET /api/work-plans - List work plans (entity-scoped)
router.get(
  "/",
  requirePermission("workplans:view"),
  asyncHandler(async (req: Request, res: Response) => {
    const { entity_id, track_id, status, year, page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * pageLimit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Entity scoping for non-global roles
    if (!isGlobalRole(req.user)) {
      if (req.user!.entityId) {
        conditions.push(`wp.entity_id = $${idx++}`);
        params.push(req.user!.entityId);
      } else {
        // No entity assigned - only see own plans
        conditions.push(`wp.created_by = $${idx++}`);
        params.push(req.user!.id);
      }
    } else if (entity_id) {
      conditions.push(`wp.entity_id = $${idx++}`);
      params.push(entity_id);
    }

    if (track_id) { conditions.push(`wp.track_id = $${idx++}`); params.push(track_id); }
    if (status) { conditions.push(`wp.status = $${idx++}`); params.push(status); }
    if (year) { conditions.push(`wp.year = $${idx++}`); params.push(parseInt(year as string, 10)); }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) FROM work_plans wp ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Fetch with pagination
    const dataParams = [...params, pageLimit, offset];
    const result = await query(
      `SELECT wp.*, e.name_ar as entity_name, t.name_ar as track_name,
              creator.display_name as creator_name
       FROM work_plans wp
       LEFT JOIN entities e ON e.id = wp.entity_id
       LEFT JOIN tracks t ON t.id = wp.track_id
       LEFT JOIN app_users creator ON creator.id = wp.created_by
       ${whereClause}
       ORDER BY wp.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      dataParams
    );

    res.json({
      data: result.rows,
      pagination: { page: pageNum, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) },
    });
  })
);

// POST /api/work-plans - Create (with transaction)
const createWorkPlanSchema = z.object({
  entity_id: z.string().uuid(),
  track_id: z.string().uuid(),
  title_en: z.string().min(1, "العنوان مطلوب"),
  title_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  year: z.number().int().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

router.post(
  "/",
  requirePermission("workplans:create"),
  asyncHandler(async (req: Request, res: Response) => {
    const body = createWorkPlanSchema.parse(req.body);

    // Entity scoping: non-global users can only create for their own entity
    if (!isGlobalRole(req.user) && req.user!.entityId && body.entity_id !== req.user!.entityId) {
      throw ApiError.forbidden("لا يمكنك إنشاء خطة عمل لجهة أخرى");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO work_plans (entity_id, track_id, title_en, title_ar, description_en, description_ar, status, year, data, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9, $9) RETURNING *`,
        [body.entity_id, body.track_id, body.title_en, body.title_ar || null,
         body.description_en || null, body.description_ar || null,
         body.year || new Date().getFullYear(), JSON.stringify(body.data || {}), req.user!.id]
      );

      await client.query("COMMIT");

      await writeAuditLog(req, {
        action: "workplan.created",
        resourceType: "work_plan",
        resourceId: result.rows[0].id,
        metadata: { title: body.title_en },
      });

      res.status(201).json({ data: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

// GET /api/work-plans/:id
router.get(
  "/:id",
  requirePermission("workplans:view"),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(
      `SELECT wp.*, e.name_ar as entity_name, t.name_ar as track_name,
              creator.display_name as creator_name
       FROM work_plans wp
       LEFT JOIN entities e ON e.id = wp.entity_id
       LEFT JOIN tracks t ON t.id = wp.track_id
       LEFT JOIN app_users creator ON creator.id = wp.created_by
       WHERE wp.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw ApiError.notFound("خطة العمل غير موجودة");

    const wp = result.rows[0];

    // Entity scoping check
    if (!isGlobalRole(req.user) && req.user!.entityId && wp.entity_id !== req.user!.entityId) {
      throw ApiError.forbidden("لا يمكنك الوصول إلى خطة عمل جهة أخرى");
    }

    res.json({ data: wp });
  })
);

// PATCH /api/work-plans/:id - Update (with transaction + entity scoping)
const updateWorkPlanSchema = z.object({
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  year: z.number().int().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

router.patch(
  "/:id",
  requirePermission("workplans:update"),
  asyncHandler(async (req: Request, res: Response) => {
    const body = updateWorkPlanSchema.parse(req.body);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Lock the row
      const existing = await client.query(
        "SELECT * FROM work_plans WHERE id = $1 FOR UPDATE",
        [req.params.id]
      );
      if (existing.rows.length === 0) {
        await client.query("ROLLBACK");
        throw ApiError.notFound("خطة العمل غير موجودة");
      }

      const wp = existing.rows[0];

      // Entity scoping
      if (!isGlobalRole(req.user) && req.user!.entityId && wp.entity_id !== req.user!.entityId) {
        await client.query("ROLLBACK");
        throw ApiError.forbidden("لا يمكنك تعديل خطة عمل جهة أخرى");
      }

      // Only draft/returned plans can be edited
      if (!["draft", "returned"].includes(wp.status)) {
        await client.query("ROLLBACK");
        throw ApiError.badRequest("لا يمكن تعديل خطة العمل في حالتها الحالية. يمكن تعديل المسودات والمُعادة فقط.");
      }

      const sets: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (body.title_en !== undefined) { sets.push(`title_en = $${idx++}`); params.push(body.title_en); }
      if (body.title_ar !== undefined) { sets.push(`title_ar = $${idx++}`); params.push(body.title_ar); }
      if (body.description_en !== undefined) { sets.push(`description_en = $${idx++}`); params.push(body.description_en); }
      if (body.description_ar !== undefined) { sets.push(`description_ar = $${idx++}`); params.push(body.description_ar); }
      if (body.year !== undefined) { sets.push(`year = $${idx++}`); params.push(body.year); }
      if (body.data !== undefined) { sets.push(`data = $${idx++}`); params.push(JSON.stringify(body.data)); }

      if (sets.length === 0) {
        await client.query("ROLLBACK");
        throw ApiError.badRequest("لا توجد بيانات للتحديث");
      }

      sets.push(`updated_by = $${idx++}`);
      params.push(req.user!.id);
      sets.push("updated_at = NOW()");
      params.push(req.params.id);

      const result = await client.query(
        `UPDATE work_plans SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
        params
      );

      await client.query("COMMIT");

      await writeAuditLog(req, {
        action: "workplan.updated",
        resourceType: "work_plan",
        resourceId: req.params.id,
        metadata: { changes: Object.keys(body).filter(k => (body as Record<string, unknown>)[k] !== undefined) },
      });

      res.json({ data: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

// DELETE /api/work-plans/:id (only drafts)
router.delete(
  "/:id",
  requirePermission("workplans:delete"),
  asyncHandler(async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        "SELECT * FROM work_plans WHERE id = $1 FOR UPDATE",
        [req.params.id]
      );
      if (existing.rows.length === 0) {
        await client.query("ROLLBACK");
        throw ApiError.notFound("خطة العمل غير موجودة");
      }

      const wp = existing.rows[0];

      // Entity scoping
      if (!isGlobalRole(req.user) && req.user!.entityId && wp.entity_id !== req.user!.entityId) {
        await client.query("ROLLBACK");
        throw ApiError.forbidden("لا يمكنك حذف خطة عمل جهة أخرى");
      }

      if (wp.status !== "draft") {
        await client.query("ROLLBACK");
        throw ApiError.badRequest("لا يمكن حذف خطة عمل تم تقديمها. يمكن حذف المسودات فقط.");
      }

      await client.query("DELETE FROM work_plans WHERE id = $1", [req.params.id]);
      await client.query("COMMIT");

      await writeAuditLog(req, {
        action: "workplan.deleted",
        resourceType: "work_plan",
        resourceId: req.params.id,
        metadata: { title: wp.title_en },
      });

      res.json({ message: "تم حذف خطة العمل بنجاح" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

// POST /api/work-plans/:id/submit
router.post(
  "/:id/submit",
  requirePermission("workplans:submit"),
  asyncHandler(async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        "SELECT * FROM work_plans WHERE id = $1 FOR UPDATE",
        [req.params.id]
      );
      if (existing.rows.length === 0) {
        await client.query("ROLLBACK");
        throw ApiError.notFound("خطة العمل غير موجودة");
      }

      const wp = existing.rows[0];
      const allowed = STATUS_TRANSITIONS[wp.status] || [];
      if (!allowed.includes("submitted")) {
        await client.query("ROLLBACK");
        throw ApiError.badRequest(`لا يمكن تقديم خطة العمل من حالة "${wp.status}"`);
      }

      const result = await client.query(
        `UPDATE work_plans SET status = 'submitted', submitted_by = $1, submitted_at = NOW(), updated_at = NOW(), updated_by = $1
         WHERE id = $2 RETURNING *`,
        [req.user!.id, req.params.id]
      );

      await client.query("COMMIT");

      await writeAuditLog(req, {
        action: "workplan.submitted",
        resourceType: "work_plan",
        resourceId: req.params.id,
        metadata: { previousStatus: wp.status },
      });

      res.json({ data: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

// POST /api/work-plans/:id/approve
router.post(
  "/:id/approve",
  requirePermission("workplans:approve"),
  asyncHandler(async (req: Request, res: Response) => {
    const { comment } = req.body || {};

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        "SELECT * FROM work_plans WHERE id = $1 FOR UPDATE",
        [req.params.id]
      );
      if (existing.rows.length === 0) {
        await client.query("ROLLBACK");
        throw ApiError.notFound("خطة العمل غير موجودة");
      }

      const wp = existing.rows[0];
      const allowed = STATUS_TRANSITIONS[wp.status] || [];
      if (!allowed.includes("approved")) {
        await client.query("ROLLBACK");
        throw ApiError.badRequest(`لا يمكن اعتماد خطة العمل من حالة "${wp.status}"`);
      }

      const result = await client.query(
        `UPDATE work_plans SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW(), updated_by = $1
         WHERE id = $2 RETURNING *`,
        [req.user!.id, req.params.id]
      );

      // Add review record
      await client.query(
        `INSERT INTO work_plan_reviews (work_plan_id, reviewer_id, decision, comment)
         VALUES ($1, $2, 'approved', $3)`,
        [req.params.id, req.user!.id, comment || null]
      );

      await client.query("COMMIT");

      await writeAuditLog(req, {
        action: "workplan.approved",
        resourceType: "work_plan",
        resourceId: req.params.id,
        metadata: { previousStatus: wp.status, comment },
      });

      res.json({ data: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

// POST /api/work-plans/:id/reject
router.post(
  "/:id/reject",
  requirePermission("workplans:reject"),
  asyncHandler(async (req: Request, res: Response) => {
    const { comment } = req.body || {};
    if (!comment) throw ApiError.badRequest("يجب إضافة سبب الرفض");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        "SELECT * FROM work_plans WHERE id = $1 FOR UPDATE",
        [req.params.id]
      );
      if (existing.rows.length === 0) {
        await client.query("ROLLBACK");
        throw ApiError.notFound("خطة العمل غير موجودة");
      }

      const wp = existing.rows[0];
      const allowed = STATUS_TRANSITIONS[wp.status] || [];
      if (!allowed.includes("rejected")) {
        await client.query("ROLLBACK");
        throw ApiError.badRequest(`لا يمكن رفض خطة العمل من حالة "${wp.status}"`);
      }

      const result = await client.query(
        `UPDATE work_plans SET status = 'rejected', updated_at = NOW(), updated_by = $1
         WHERE id = $2 RETURNING *`,
        [req.user!.id, req.params.id]
      );

      await client.query(
        `INSERT INTO work_plan_reviews (work_plan_id, reviewer_id, decision, comment)
         VALUES ($1, $2, 'rejected', $3)`,
        [req.params.id, req.user!.id, comment]
      );

      await client.query("COMMIT");

      await writeAuditLog(req, {
        action: "workplan.rejected",
        resourceType: "work_plan",
        resourceId: req.params.id,
        metadata: { previousStatus: wp.status, comment },
      });

      res.json({ data: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

// POST /api/work-plans/:id/return - Return for revision
router.post(
  "/:id/return",
  requirePermission("workplans:reject"),
  asyncHandler(async (req: Request, res: Response) => {
    const { comment } = req.body || {};
    if (!comment) throw ApiError.badRequest("يجب إضافة سبب الإعادة");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        "SELECT * FROM work_plans WHERE id = $1 FOR UPDATE",
        [req.params.id]
      );
      if (existing.rows.length === 0) {
        await client.query("ROLLBACK");
        throw ApiError.notFound("خطة العمل غير موجودة");
      }

      const wp = existing.rows[0];
      const allowed = STATUS_TRANSITIONS[wp.status] || [];
      if (!allowed.includes("returned")) {
        await client.query("ROLLBACK");
        throw ApiError.badRequest(`لا يمكن إعادة خطة العمل من حالة "${wp.status}"`);
      }

      const result = await client.query(
        `UPDATE work_plans SET status = 'returned', updated_at = NOW(), updated_by = $1
         WHERE id = $2 RETURNING *`,
        [req.user!.id, req.params.id]
      );

      await client.query(
        `INSERT INTO work_plan_reviews (work_plan_id, reviewer_id, decision, comment)
         VALUES ($1, $2, 'returned', $3)`,
        [req.params.id, req.user!.id, comment]
      );

      await client.query("COMMIT");

      await writeAuditLog(req, {
        action: "workplan.returned",
        resourceType: "work_plan",
        resourceId: req.params.id,
        metadata: { previousStatus: wp.status, comment },
      });

      res.json({ data: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

export default router;
