import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware that checks if the authenticated user has ANY of the required permissions.
 * platform_admin bypasses all permission checks.
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    // platform_admin has all permissions
    if (req.user.roles.includes("platform_admin")) {
      next();
      return;
    }

    const hasPermission = requiredPermissions.some((p) => req.user!.permissions.includes(p));
    if (!hasPermission) {
      next(ApiError.forbidden("غير مصرح بالوصول. لا تملك الصلاحية المطلوبة لتنفيذ هذا الإجراء."));
      return;
    }

    next();
  };
}

/**
 * Middleware that checks if the user has the required role.
 */
export function requireRole(...requiredRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    const hasRole = requiredRoles.some((r) => req.user!.roles.includes(r));
    if (!hasRole) {
      next(ApiError.forbidden("غير مصرح بالوصول. لا تملك الدور المطلوب لتنفيذ هذا الإجراء."));
      return;
    }

    next();
  };
}

/**
 * Entity scoping middleware: ensures user can only access data from their own entity.
 * Global roles (platform_admin, program_admin) bypass this check.
 */
export function requireEntityScope(entityIdParam: string = "entityId") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    // Global admins bypass entity scoping
    const globalRoles = ["platform_admin", "program_admin"];
    if (req.user.roles.some((r) => globalRoles.includes(r))) {
      next();
      return;
    }

    // Get the requested entity ID from params, body, or query
    const requestedEntityId = req.params[entityIdParam] || req.body?.entity_id || req.query?.entity_id;

    if (requestedEntityId && req.user.entityId && requestedEntityId !== req.user.entityId) {
      next(ApiError.forbidden("لا يمكنك الوصول إلى بيانات جهة أخرى"));
      return;
    }

    next();
  };
}
