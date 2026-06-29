/**
 * Security Module - Central Export
 * 
 * OWASP Top 10 Coverage:
 * - A01: Broken Access Control → AuthContext + ProtectedRoute + RBAC
 * - A02: Cryptographic Failures → SecureStorage (AES + HMAC)
 * - A03: Injection → InputSanitizer (XSS/SQLi detection)
 * - A04: Insecure Design → CSP + Security Headers
 * - A05: Security Misconfiguration → CSP + Strict Headers
 * - A06: Vulnerable Components → SRI + Dependency audit
 * - A07: Auth Failures → SSO + PKCE + Session Management
 * - A08: Data Integrity → HMAC verification + Audit Logging
 * - A09: Logging Failures → SecurityLogger (SOC 2 compliant)
 * - A10: SSRF → CSP connect-src restriction
 * 
 * SOC 2 Type II Coverage:
 * - CC6.1: Logical Access Controls → RBAC + ProtectedRoute
 * - CC6.2: Authentication → SSO + MFA support
 * - CC6.3: Authorization → Permission matrix
 * - CC6.6: Encryption → AES-256 at rest
 * - CC7.1: Monitoring → Audit Logger
 * - CC7.2: Incident Detection → Pattern detection
 * - CC7.3: Response → Auto-logout on suspicious activity
 */

export { SecurityLogger, type SecurityEventType, type AuditLogEntry } from "./auditLogger";
export { SessionManager } from "./sessionManager";
export { SecureStorage, migrateToSecureStorage } from "./secureStorage";
export {
  sanitizeHTML,
  sanitizeRichText,
  sanitizeTextInput,
  encodeHTMLEntities,
  detectXSSPattern,
  detectSQLInjection,
  validateEmail,
  validatePhone,
  validateTextField,
  validateFileUpload,
  checkRateLimit,
} from "./inputSanitizer";
export { applySecurityHeaders, generateCSPContent, SECURITY_HEADERS } from "./cspConfig";
