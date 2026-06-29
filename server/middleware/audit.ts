import { Request } from "express";
import { query } from "../db/pool.js";
import { logger } from "../config/logger.js";

export interface AuditEntry {
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(req: Request, entry: AuditEntry): Promise<void> {
  try {
    const userId = req.user?.id || null;
    const ip = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers["user-agent"] || null;

    await query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        entry.action,
        entry.resourceType || null,
        entry.resourceId || null,
        ip,
        userAgent,
        JSON.stringify(entry.metadata || {}),
      ]
    );
  } catch (err) {
    logger.error({ err, entry }, "Failed to write audit log");
  }
}
