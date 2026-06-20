/**
 * Validates environment at API startup. Fails fast in production when secrets are weak or missing.
 */
import { env } from "./env";

const WEAK_PATTERNS = ["change-me", "dev-jwt-secret", "your-domain", "password123"];

function isWeak(value: string): boolean {
  const lower = value.toLowerCase();
  return WEAK_PATTERNS.some((p) => lower.includes(p)) || value.length < 16;
}

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) return;

  const errors: string[] = [];

  if (!process.env.JWT_SECRET || isWeak(env.jwtSecret)) {
    errors.push("JWT_SECRET must be set to a strong random value (min 16 chars)");
  }
  if (!process.env.JWT_REFRESH_SECRET || isWeak(env.jwtRefreshSecret)) {
    errors.push("JWT_REFRESH_SECRET must be set to a strong random value (min 16 chars)");
  }
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required in production");
  }
  if (!process.env.REDIS_URL) {
    errors.push("REDIS_URL is required in production");
  }
  if (env.webUrl.startsWith("http://") && !env.webUrl.includes("localhost")) {
    errors.push("WEB_URL should use HTTPS in production");
  }

  if (errors.length > 0) {
    console.error("[env] Production configuration errors:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
}
