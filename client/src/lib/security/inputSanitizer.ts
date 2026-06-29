/**
 * Input Sanitizer & Validator
 * OWASP Input Validation Cheat Sheet
 * OWASP XSS Prevention Cheat Sheet
 * 
 * Provides:
 * - HTML entity encoding
 * - Script injection prevention
 * - SQL injection pattern detection
 * - Input length enforcement
 * - Email/phone validation
 * - File upload validation
 */

import DOMPurify from "dompurify";

// ─── XSS Prevention ─────────────────────────────────────────────────────────

/**
 * Sanitize HTML content - removes all dangerous tags/attributes
 * Use for any user-generated content that will be rendered as HTML
 */
export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize with limited HTML allowed (for rich text fields)
 */
export function sanitizeRichText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "br", "p", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

/**
 * Encode HTML entities to prevent XSS in text content
 */
export function encodeHTMLEntities(input: string): string {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize text input - strips dangerous characters while preserving Arabic text
 */
export function sanitizeTextInput(input: string, maxLength = 500): string {
  if (!input || typeof input !== "string") return "";

  // Trim and enforce max length
  let sanitized = input.trim().substring(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove control characters (except newline, tab)
  sanitized = sanitized.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Detect and block script injection attempts
  if (detectXSSPattern(sanitized)) {
    logSecurityEvent("xss_attempt_blocked", { input: sanitized.substring(0, 50) });
    // Remove the dangerous content
    sanitized = sanitized.replace(/<[^>]*script[^>]*>/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");
    sanitized = sanitized.replace(/data:\s*text\/html/gi, "");
  }

  return sanitized;
}

// ─── Pattern Detection ───────────────────────────────────────────────────────

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']/i,
  /data:\s*text\/html/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg[\s>].*?on\w+/i,
  /expression\s*\(/i,
  /url\s*\(\s*["']?\s*javascript/i,
  /<img[^>]+onerror/i,
  /document\.(cookie|domain|write)/i,
  /window\.(location|open)/i,
  /eval\s*\(/i,
  /setTimeout\s*\(\s*["']/i,
  /setInterval\s*\(\s*["']/i,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b.*\b(FROM|INTO|TABLE|WHERE|SET)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /('\s*(OR|AND)\s*'?\s*\d+\s*=\s*\d+)/i,
  /(;\s*(DROP|DELETE|UPDATE|INSERT)\s)/i,
  /(\bUNION\b.*\bSELECT\b)/i,
];

/**
 * Detect XSS patterns in input
 */
export function detectXSSPattern(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Detect SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// ─── Input Validation ────────────────────────────────────────────────────────

/**
 * Validate email format (RFC 5322 simplified)
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: "البريد الإلكتروني مطلوب" };
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: "صيغة البريد الإلكتروني غير صحيحة" };
  }
  
  if (email.length > 254) {
    return { valid: false, error: "البريد الإلكتروني طويل جداً" };
  }

  return { valid: true };
}

/**
 * Validate UAE phone number
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) return { valid: false, error: "رقم الهاتف مطلوب" };
  
  // Remove spaces, dashes, and + prefix
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  
  // UAE phone patterns
  const uaePatterns = [
    /^971[0-9]{8,9}$/,    // International format
    /^0[0-9]{8,9}$/,      // Local format
    /^[0-9]{9,10}$/,      // Without prefix
  ];

  if (!uaePatterns.some(p => p.test(cleaned))) {
    return { valid: false, error: "صيغة رقم الهاتف غير صحيحة" };
  }

  return { valid: true };
}

/**
 * Validate text field with configurable rules
 */
export function validateTextField(
  value: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    fieldName?: string;
  } = {}
): { valid: boolean; error?: string } {
  const { required = false, minLength = 0, maxLength = 1000, pattern, fieldName = "الحقل" } = options;

  if (!value || value.trim().length === 0) {
    if (required) return { valid: false, error: `${fieldName} مطلوب` };
    return { valid: true };
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} يجب أن يكون ${minLength} أحرف على الأقل` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} يجب ألا يتجاوز ${maxLength} حرف` };
  }

  if (pattern && !pattern.test(trimmed)) {
    return { valid: false, error: `${fieldName} يحتوي على أحرف غير مسموحة` };
  }

  if (detectXSSPattern(trimmed)) {
    return { valid: false, error: `${fieldName} يحتوي على محتوى غير مسموح` };
  }

  return { valid: true };
}

// ─── File Upload Validation ──────────────────────────────────────────────────

const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  document: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"],
  data: [".csv", ".json", ".xml"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: { allowedTypes?: string[]; maxSize?: number } = {}
): { valid: boolean; error?: string } {
  const { allowedTypes = [...ALLOWED_FILE_TYPES.document, ...ALLOWED_FILE_TYPES.image], maxSize = MAX_FILE_SIZE } = options;

  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: `حجم الملف يتجاوز الحد المسموح (${Math.round(maxSize / 1024 / 1024)}MB)` };
  }

  // Check file extension
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!allowedTypes.includes(ext)) {
    return { valid: false, error: `نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(", ")}` };
  }

  // Check for double extensions (e.g., file.pdf.exe)
  const parts = file.name.split(".");
  if (parts.length > 2) {
    const suspiciousExts = [".exe", ".bat", ".cmd", ".ps1", ".sh", ".js", ".vbs"];
    if (parts.some(p => suspiciousExts.includes("." + p.toLowerCase()))) {
      return { valid: false, error: "الملف يحتوي على امتداد مشبوه" };
    }
  }

  // Check MIME type consistency
  const mimeTypeMap: Record<string, string[]> = {
    ".pdf": ["application/pdf"],
    ".doc": ["application/msword"],
    ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ".xls": ["application/vnd.ms-excel"],
    ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".png": ["image/png"],
  };

  if (mimeTypeMap[ext] && !mimeTypeMap[ext].includes(file.type)) {
    return { valid: false, error: "نوع الملف لا يتطابق مع المحتوى" };
  }

  return { valid: true };
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Client-side rate limiting (defense in depth)
 */
export function checkRateLimit(action: string, maxAttempts = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(action);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(action, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    logSecurityEvent("rate_limit_exceeded", { action, count: entry.count });
    return false;
  }

  entry.count++;
  return true;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function logSecurityEvent(type: string, details: Record<string, unknown>): void {
  // Import dynamically to avoid circular dependency
  try {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      details,
    };
    const logs = JSON.parse(localStorage.getItem("security_events_quick") || "[]");
    logs.push(event);
    if (logs.length > 100) logs.splice(0, logs.length - 100);
    localStorage.setItem("security_events_quick", JSON.stringify(logs));
  } catch {
    // Silent fail for logging
  }
}
