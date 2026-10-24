import { describe, expect, it } from "vitest";
import {
  canAccessOrder,
  canAccessUserOwned,
  isAdminRole,
} from "@/lib/security/access-control";

describe("access-control (IDOR)", () => {
  it("admin can access any order", () => {
    expect(
      canAccessOrder(
        { userId: "a", role: "admin" },
        { user_id: "b", session_id: null },
      ),
    ).toBe(true);
  });

  it("owner can access own order", () => {
    expect(
      canAccessOrder(
        { userId: "u1", role: "customer" },
        { user_id: "u1", session_id: null },
      ),
    ).toBe(true);
  });

  it("other user cannot access order (IDOR)", () => {
    expect(
      canAccessOrder(
        { userId: "u1", role: "customer" },
        { user_id: "u2", session_id: null },
      ),
    ).toBe(false);
  });

  it("guest only with matching session_id", () => {
    expect(
      canAccessOrder(
        { userId: null, sessionId: "s1" },
        { user_id: null, session_id: "s1" },
      ),
    ).toBe(true);
    expect(
      canAccessOrder(
        { userId: null, sessionId: "s1" },
        { user_id: null, session_id: "s2" },
      ),
    ).toBe(false);
  });

  it("user-owned resource", () => {
    expect(canAccessUserOwned({ userId: "u1" }, "u1")).toBe(true);
    expect(canAccessUserOwned({ userId: "u1" }, "u2")).toBe(false);
    expect(isAdminRole("admin")).toBe(true);
  });
});
