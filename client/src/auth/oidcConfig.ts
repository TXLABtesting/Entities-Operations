/**
 * OIDC Configuration for Workspace ONE / Omnissa Access
 *
 * All configuration is read from environment variables (VITE_* prefix).
 * When VITE_AUTH_ENABLED is "false" or not set, authentication is bypassed entirely.
 *
 * When VITE_AUTH_ENABLED is "true", the following are REQUIRED:
 *   - VITE_OIDC_AUTHORITY
 *   - VITE_OIDC_CLIENT_ID
 *   - VITE_OIDC_REDIRECT_URI
 *   - VITE_OIDC_POST_LOGOUT_REDIRECT_URI
 *
 * If any required value is missing, a configuration error is surfaced instead of
 * silently falling back to demo mode.
 *
 * ─── Demo Client Secret (INSECURE — staging/demo only) ──────────────────────
 * When VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET=true AND VITE_OIDC_CLIENT_SECRET
 * is set, the client_secret is included in the token exchange request.
 *
 * WARNING: This exposes the client secret in the browser bundle.
 * Do NOT use this in production. Prefer Public Client / SPA with PKCE only.
 */

export const authEnabled = import.meta.env.VITE_AUTH_ENABLED === "true";

/**
 * Demo mode is only active when explicitly opted in AND auth is disabled.
 * VITE_DEMO_AUTH_ENABLED=true + VITE_AUTH_ENABLED=false → demo user active
 * VITE_AUTH_ENABLED=true → demo mode is NEVER active regardless of VITE_DEMO_AUTH_ENABLED
 */
export const demoAuthEnabled =
  !authEnabled && import.meta.env.VITE_DEMO_AUTH_ENABLED === "true";

// ─── Insecure Demo Client Secret ──────────────────────────────────────────────

const allowInsecureDemoClientSecret =
  import.meta.env.VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET === "true";

const demoClientSecret = import.meta.env.VITE_OIDC_CLIENT_SECRET || "";

export const insecureDemoClientSecretEnabled =
  allowInsecureDemoClientSecret && demoClientSecret.trim() !== "";

// Log warning when insecure demo client secret is active
if (insecureDemoClientSecretEnabled) {
  console.warn(
    "%c⚠️ WARNING: Insecure demo client secret mode is enabled. " +
      "This exposes the client secret in the browser bundle. " +
      "Do not use this in production.",
    "color: #ff6600; font-weight: bold; font-size: 14px;"
  );
}

// ─── Configuration Validation ────────────────────────────────────────────────

export interface OidcConfigError {
  missing: string[];
  message: string;
}

let _configError: OidcConfigError | null = null;

if (authEnabled) {
  const required: Record<string, string | undefined> = {
    VITE_OIDC_AUTHORITY: import.meta.env.VITE_OIDC_AUTHORITY,
    VITE_OIDC_CLIENT_ID: import.meta.env.VITE_OIDC_CLIENT_ID,
    VITE_OIDC_REDIRECT_URI: import.meta.env.VITE_OIDC_REDIRECT_URI,
    VITE_OIDC_POST_LOGOUT_REDIRECT_URI: import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value || value.trim() === "")
    .map(([key]) => key);

  // If insecure demo secret mode is enabled but secret is missing, add to errors
  if (allowInsecureDemoClientSecret && demoClientSecret.trim() === "") {
    missing.push("VITE_OIDC_CLIENT_SECRET (required when VITE_ALLOW_INSECURE_DEMO_CLIENT_SECRET=true)");
  }

  if (missing.length > 0) {
    _configError = {
      missing,
      message: `OIDC authentication is enabled (VITE_AUTH_ENABLED=true) but the following required environment variables are missing or empty: ${missing.join(", ")}`,
    };
  }
}

export const oidcConfigError = _configError;

// ─── OIDC Configuration Object ───────────────────────────────────────────────

export const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || "",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "",
  redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/callback`,
  post_logout_redirect_uri:
    import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  response_type: "code" as const,
  scope: import.meta.env.VITE_OIDC_SCOPE || "openid profile email",

  // Conditionally include client_secret ONLY in insecure demo mode
  ...(insecureDemoClientSecretEnabled
    ? { client_secret: demoClientSecret }
    : {}),
};
