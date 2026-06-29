import dotenv from "dotenv";
dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function optionalInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export const env = {
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  PORT: parseInt(optionalEnv("PORT", "4000"), 10),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  FRONTEND_ORIGIN: optionalEnv("FRONTEND_ORIGIN", "http://localhost:3000"),
  OIDC_ISSUER: optionalEnv("OIDC_ISSUER", ""),
  OIDC_AUDIENCE: optionalEnv("OIDC_AUDIENCE", ""),
  BOOTSTRAP_ADMIN_EMAILS: optionalEnv("BOOTSTRAP_ADMIN_EMAILS", "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  RUN_MIGRATIONS_ON_STARTUP: optionalEnv("RUN_MIGRATIONS_ON_STARTUP", "true") === "true",
  LOG_LEVEL: optionalEnv("LOG_LEVEL", "info"),
  RATE_LIMIT_WINDOW_MS: optionalInt("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  RATE_LIMIT_MAX: optionalInt("RATE_LIMIT_MAX", 500),
};

export type Env = typeof env;

// Validate critical config at startup
export function validateEnv(): void {
  const errors: string[] = [];

  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }

  if (env.NODE_ENV === "production") {
    if (!env.OIDC_ISSUER) {
      errors.push("OIDC_ISSUER is required in production");
    }
    if (!env.OIDC_AUDIENCE) {
      errors.push("OIDC_AUDIENCE is required in production");
    }
    if (!env.FRONTEND_ORIGIN || env.FRONTEND_ORIGIN === "http://localhost:3000") {
      errors.push("FRONTEND_ORIGIN must be set in production");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
}
