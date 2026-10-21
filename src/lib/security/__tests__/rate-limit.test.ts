import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, rateLimitCleanup } from "@/lib/security/rate-limit";

describe("checkRateLimit (memory fallback)", () => {
  beforeEach(() => {
    rateLimitCleanup();
  });

  it("auth: allows under limit then blocks", async () => {
    const id = `auth-test-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const r = await checkRateLimit({ identifier: id, type: "auth" });
      expect(r.success).toBe(true);
    }
    const blocked = await checkRateLimit({ identifier: id, type: "auth" });
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("contact: blocks after 5 in window", async () => {
    const id = `contact-test-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const r = await checkRateLimit({ identifier: id, type: "contact" });
      expect(r.success).toBe(true);
    }
    const blocked = await checkRateLimit({ identifier: id, type: "contact" });
    expect(blocked.success).toBe(false);
  });

  it("api: higher limit than auth", async () => {
    const id = `api-test-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      const r = await checkRateLimit({ identifier: id, type: "api" });
      expect(r.success).toBe(true);
    }
  });
});
