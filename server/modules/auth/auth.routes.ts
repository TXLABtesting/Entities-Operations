import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

// GET /api/auth/me - Get current user info with roles and permissions
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      id: req.user!.id,
      email: req.user!.email,
      displayName: req.user!.displayName,
      username: req.user!.username,
      entityId: req.user!.entityId,
      entityCode: req.user!.entityCode || null,
      entityNameAr: req.user!.entityNameAr || null,
      status: req.user!.status,
      accessEnabled: req.user!.accessEnabled,
      roles: req.user!.roles,
      permissions: req.user!.permissions,
    });
  })
);

// GET /api/auth/health - Public health check (no auth required)
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
