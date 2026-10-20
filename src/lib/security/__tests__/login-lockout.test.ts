import { describe, it, expect, beforeEach } from "vitest";
import {
  getLoginLockStatus,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/security/login-lockout";

describe("login-lockout", () => {
  const key = "test-user|127.0.0.1";
  beforeEach(async () => {
    await clearLoginFailures(key);
  });

  it("locks after 5 failures", async () => {
    for (let i = 0; i < 4; i++) {
      const r = await recordLoginFailure(key);
      expect(r.locked).toBe(false);
    }
    const fifth = await recordLoginFailure(key);
    expect(fifth.locked).toBe(true);
    const st = await getLoginLockStatus(key);
    expect(st.locked).toBe(true);
  });

  it("clears on success path", async () => {
    await recordLoginFailure(key);
    await clearLoginFailures(key);
    const st = await getLoginLockStatus(key);
    expect(st.locked).toBe(false);
  });
});
