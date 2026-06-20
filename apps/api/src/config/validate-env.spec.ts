import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("validateEnv", () => {
  const originalEnv = { ...process.env };
  let exitCode: number | null = null;

  beforeEach(() => {
    vi.resetModules();
    exitCode = null;
    process.env = { ...originalEnv };
    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("allows dev defaults when NODE_ENV is not production", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.JWT_SECRET;
    const { validateEnv } = await import("./validate-env");
    expect(() => validateEnv()).not.toThrow();
  });

  it("exits when JWT_SECRET is weak in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "dev-jwt-secret-change-me";
    process.env.JWT_REFRESH_SECRET = "a-very-strong-refresh-secret-key";
    process.env.DATABASE_URL = "postgresql://localhost/db";
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.WEB_URL = "https://example.com";

    const { validateEnv } = await import("./validate-env");
    expect(() => validateEnv()).toThrow("process.exit");
    expect(exitCode).toBe(1);
  });

  it("passes with strong secrets in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "super-long-random-production-secret";
    process.env.JWT_REFRESH_SECRET = "another-super-long-refresh-secret";
    process.env.DATABASE_URL = "postgresql://localhost/db";
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.WEB_URL = "https://example.com";

    const { validateEnv } = await import("./validate-env");
    expect(() => validateEnv()).not.toThrow();
  });
});
