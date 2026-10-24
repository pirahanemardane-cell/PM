import { describe, expect, it } from "vitest";
import {
  isCustomerCancellable,
  isReturnAllowedStatus,
  isWithinReturnWindow,
  RETURN_WINDOW_DAYS,
} from "@/lib/business-rules";

describe("business-rules", () => {
  it("customer cancel windows", () => {
    expect(isCustomerCancellable("pending")).toBe(true);
    expect(isCustomerCancellable("paid")).toBe(true);
    expect(isCustomerCancellable("shipped")).toBe(false);
  });

  it("return allowed statuses", () => {
    expect(isReturnAllowedStatus("shipped")).toBe(true);
    expect(isReturnAllowedStatus("pending")).toBe(false);
  });

  it("return window days", () => {
    const now = Date.parse("2026-10-24T12:00:00Z");
    const ok = new Date(now - (RETURN_WINDOW_DAYS - 1) * 86400000).toISOString();
    const late = new Date(now - (RETURN_WINDOW_DAYS + 2) * 86400000).toISOString();
    expect(isWithinReturnWindow(ok, null, now)).toBe(true);
    expect(isWithinReturnWindow(late, null, now)).toBe(false);
  });
});
