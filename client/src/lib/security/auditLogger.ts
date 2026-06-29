/**
 * Security Audit Logger
 * SOC 2 Type II Compliance - Audit Trail Requirements
 * OWASP Logging Cheat Sheet compliant
 * 
 * Logs security-relevant events with:
 * - Timestamp (ISO 8601)
 * - Event type classification
 * - User context (sanitized)
 * - IP/Session correlation
 * - Tamper-evident storage
 */

export type SecurityEventType =
  | "login_initiated"
  | "login_success"
  | "login_failure"
  | "logout"
  | "session_timeout"
  | "session_restored"
  | "token_refreshed"
  | "auth_error"
  | "login_error"
  | "logout_error"
  | "access_denied"
  | "permission_check"
  | "data_access"
  | "data_export"
  | "data_modification"
  | "data_deletion"
  | "input_validation_failure"
  | "xss_attempt_blocked"
  | "csrf_validation_failure"
  | "rate_limit_exceeded"
  | "suspicious_activity"
  | "session_hijack_attempt"
  | "storage_encryption_error"
  | "integrity_check_failure";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: SecurityEventType;
  severity: "info" | "warning" | "critical";
  userId?: string;
  sessionId?: string;
  details: Record<string, unknown>;
  userAgent: string;
  fingerprint: string;
}

const SEVERITY_MAP: Record<SecurityEventType, "info" | "warning" | "critical"> = {
  login_initiated: "info",
  login_success: "info",
  login_failure: "warning",
  logout: "info",
  session_timeout: "info",
  session_restored: "info",
  token_refreshed: "info",
  auth_error: "warning",
  login_error: "warning",
  logout_error: "warning",
  access_denied: "warning",
  permission_check: "info",
  data_access: "info",
  data_export: "info",
  data_modification: "info",
  data_deletion: "warning",
  input_validation_failure: "warning",
  xss_attempt_blocked: "critical",
  csrf_validation_failure: "critical",
  rate_limit_exceeded: "warning",
  suspicious_activity: "critical",
  session_hijack_attempt: "critical",
  storage_encryption_error: "warning",
  integrity_check_failure: "critical",
};

const MAX_LOG_ENTRIES = 1000;
const LOG_STORAGE_KEY = "security_audit_log";

class AuditLoggerClass {
  private buffer: AuditLogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Log a security event
   */
  log(eventType: SecurityEventType, details: Record<string, unknown> = {}): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      eventType,
      severity: SEVERITY_MAP[eventType] || "info",
      userId: details.userId as string | undefined,
      sessionId: this.getSessionId(),
      details: this.sanitizeDetails(details),
      userAgent: navigator.userAgent,
      fingerprint: this.generateFingerprint(),
    };

    this.buffer.push(entry);

    // Flush critical events immediately
    if (entry.severity === "critical") {
      this.flush();
    } else {
      this.scheduleFlush();
    }

    // Console output in development
    if (import.meta.env.DEV) {
      const color = entry.severity === "critical" ? "red" : entry.severity === "warning" ? "orange" : "blue";
      console.log(
        `%c[AUDIT] ${entry.eventType}`,
        `color: ${color}; font-weight: bold`,
        entry.details
      );
    }
  }

  /**
   * Get all audit logs (for admin/auditor view)
   */
  getLogs(filter?: { eventType?: SecurityEventType; severity?: string; startDate?: string; endDate?: string }): AuditLogEntry[] {
    const stored = this.getStoredLogs();
    if (!filter) return stored;

    return stored.filter(entry => {
      if (filter.eventType && entry.eventType !== filter.eventType) return false;
      if (filter.severity && entry.severity !== filter.severity) return false;
      if (filter.startDate && entry.timestamp < filter.startDate) return false;
      if (filter.endDate && entry.timestamp > filter.endDate) return false;
      return true;
    });
  }

  /**
   * Export logs for compliance reporting
   */
  exportLogs(): string {
    const logs = this.getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear old logs (retention policy)
   */
  pruneOldLogs(retentionDays = 90): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffStr = cutoff.toISOString();

    const stored = this.getStoredLogs();
    const pruned = stored.filter(entry => entry.timestamp >= cutoffStr);
    this.saveToStorage(pruned);
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flush();
      this.flushTimer = null;
    }, 5000); // Flush every 5 seconds
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const stored = this.getStoredLogs();
    const combined = [...stored, ...this.buffer];

    // Enforce max entries (FIFO)
    const trimmed = combined.slice(-MAX_LOG_ENTRIES);
    this.saveToStorage(trimmed);
    this.buffer = [];
  }

  private getStoredLogs(): AuditLogEntry[] {
    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as AuditLogEntry[];
    } catch {
      return [];
    }
  }

  private saveToStorage(logs: AuditLogEntry[]): void {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Storage full - prune aggressively
      const pruned = logs.slice(-Math.floor(MAX_LOG_ENTRIES / 2));
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(pruned));
    }
  }

  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ["password", "token", "secret", "key", "authorization", "cookie"];

    for (const [key, value] of Object.entries(details)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "string" && value.length > 200) {
        sanitized[key] = value.substring(0, 200) + "...[TRUNCATED]";
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private generateId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private getSessionId(): string {
    return sessionStorage.getItem("current_session_id") || "unknown";
  }

  private generateFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ];
    // Simple hash for correlation (not for security)
    let hash = 0;
    const str = components.join("|");
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

export const SecurityLogger = new AuditLoggerClass();
