import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details || [],
    });
    return;
  }

  // Log unexpected errors
  logger.error({ err, requestId: req.requestId, path: req.path }, "Unhandled error");

  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "حدث خطأ غير متوقع",
    ...(env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}
