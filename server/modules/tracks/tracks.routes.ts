import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { query } from "../../db/pool.js";

const router = Router();

router.use(authenticate);

// GET /api/tracks
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await query("SELECT * FROM tracks WHERE is_active = TRUE ORDER BY sort_order");
    res.json(result.rows);
  })
);

export default router;
