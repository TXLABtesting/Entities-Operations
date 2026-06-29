/**
 * Content Security Policy (CSP) Configuration
 * OWASP CSP Cheat Sheet
 * SOC 2 - Network Security Controls
 * 
 * Provides defense against:
 * - Cross-Site Scripting (XSS)
 * - Clickjacking
 * - Data injection attacks
 * - Mixed content
 */

export interface CSPDirectives {
  "default-src": string[];
  "script-src": string[];
  "style-src": string[];
  "img-src": string[];
  "font-src": string[];
  "connect-src": string[];
  "frame-src": string[];
  "object-src": string[];
  "base-uri": string[];
  "form-action": string[];
  "frame-ancestors": string[];
}

/**
 * Generate CSP meta tag content
 */
export function generateCSPContent(): string {
  const directives: CSPDirectives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"], // Required for Vite HMR in dev
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "connect-src": ["'self'", "https:", "wss:"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Security headers to be set via meta tags (for static deployment)
 * For server-side deployment, these should be HTTP headers
 */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

/**
 * Apply security meta tags to document head
 * Call this once during app initialization
 */
export function applySecurityHeaders(): void {
  // CSP
  const cspMeta = document.createElement("meta");
  cspMeta.httpEquiv = "Content-Security-Policy";
  cspMeta.content = generateCSPContent();
  document.head.appendChild(cspMeta);

  // X-Content-Type-Options
  const xctMeta = document.createElement("meta");
  xctMeta.httpEquiv = "X-Content-Type-Options";
  xctMeta.content = "nosniff";
  document.head.appendChild(xctMeta);

  // X-Frame-Options (Clickjacking protection)
  const xfoMeta = document.createElement("meta");
  xfoMeta.httpEquiv = "X-Frame-Options";
  xfoMeta.content = "DENY";
  document.head.appendChild(xfoMeta);

  // Referrer Policy
  const rpMeta = document.createElement("meta");
  rpMeta.name = "referrer";
  rpMeta.content = "strict-origin-when-cross-origin";
  document.head.appendChild(rpMeta);
}

/**
 * Subresource Integrity (SRI) hash generator
 * Use for external script/style tags
 */
export async function generateSRIHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-384", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
  return `sha384-${hashBase64}`;
}
