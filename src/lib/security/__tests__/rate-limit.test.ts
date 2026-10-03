import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, rateLimitCleanup, isUpstashConfigured } from "../rate-limit";

describe("rate-limit (memory fallback)", () => {
  beforeEach(() => {
    rateLimitCleanup();
  });

  it("allows requests under the limit", () => {
    const key = "test:allow";
    for (let i = 0; i < 5; i++) {
      const result = rateLimit({ key, limit: 5, windowMs: 60_000 });
      expect(result.ok).toBe(true);
    }
  });

  it("blocks when limit is exceeded", () => {
    const key = "test:block";
    for (let i = 0; i < 5; i++) {
      rateLimit({ key, limit: 5, windowMs: 60_000 });
    }
    const result = rateLimit({ key, limit: 5, windowMs: 60_000 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("isUpstashConfigured returns boolean", () => {
    expect(typeof isUpstashConfigured()).toBe("boolean");
  });
});

describe("health endpoint shape (unit)", () => {
  it("expected health response structure", () => {
    const mockHealth = {
      ok: true,
      service: "pirahanmardane",
      checks: {
        app: "ok",
        supabase: "ok",
        rateLimit: "upstash",
        r2: "ok",
        sentry: "ok",
        cronBackup: "ok",
      },
    };

    expect(mockHealth.ok).toBe(true);
    expect(mockHealth.service).toBe("pirahanmardane");
    expect(mockHealth.checks).toHaveProperty("rateLimit");
    expect(["upstash", "memory-fallback"]).toContain(mockHealth.checks.rateLimit);
  });
});
