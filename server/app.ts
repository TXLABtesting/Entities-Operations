import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { corsOptions } from "./config/cors.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./config/logger.js";

// Route imports
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import { rolesRouter, permissionsRouter } from "./modules/rbac/rbac.routes.js";
import entitiesRoutes from "./modules/entities/entities.routes.js";
import tracksRoutes from "./modules/tracks/tracks.routes.js";
import workplansRoutes from "./modules/workplans/workplans.routes.js";
import initiativesRoutes from "./modules/initiatives/initiatives.routes.js";
import prioritizationRoutes from "./modules/prioritization/prioritization.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";

export const appState = { migrationsCompleted: false };

export function createApp() {
  const app = express();

  // Security
  app.use(helmet({
    contentSecurityPolicy: false, // Let frontend handle CSP
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors(corsOptions));

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: "RATE_LIMITED", message: "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً." },
  });
  app.use("/api/", apiLimiter);

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request ID
  app.use(requestId);

  // Request logging
  app.use((req, _res, next) => {
    logger.info({ method: req.method, path: req.path, requestId: req.requestId }, "Incoming request");
    next();
  });

  // Health endpoints
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/ready", async (_req, res) => {
    if (!appState.migrationsCompleted) {
      res.status(503).json({ status: "not_ready", reason: "migrations_pending" });
      return;
    }
    try {
      const { pool } = await import("./db/pool.js");
      await pool.query("SELECT 1");
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "not_ready", reason: "database_unreachable" });
    }
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/roles", rolesRouter);
  app.use("/api/permissions", permissionsRouter);
  app.use("/api/entities", entitiesRoutes);
  app.use("/api/tracks", tracksRoutes);
  app.use("/api/work-plans", workplansRoutes);
  app.use("/api/initiatives", initiativesRoutes);
  app.use("/api/prioritization", prioritizationRoutes);
  app.use("/api/audit-logs", auditRoutes);

  // 404 for unknown API routes
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ code: "NOT_FOUND", message: "المسار غير موجود" });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}


