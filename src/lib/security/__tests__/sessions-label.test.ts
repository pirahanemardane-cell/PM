import { describe, it, expect } from "vitest";

function sessionLabelFromUa(ua: string): string {
  if (/Mobile|Android|iPhone/i.test(ua)) return "موبایل";
  if (/Mac/i.test(ua)) return "مک";
  if (/Windows/i.test(ua)) return "ویندوز";
  return "دستگاه";
}

describe("session label from user-agent", () => {
  it("detects mobile", () => {
    expect(sessionLabelFromUa("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe(
      "موبایل"
    );
    expect(sessionLabelFromUa("Mozilla/5.0 (Linux; Android 14)")).toBe("موبایل");
  });

  it("detects Mac", () => {
    expect(
      sessionLabelFromUa(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15"
      )
    ).toBe("مک");
  });

  it("detects Windows", () => {
    expect(
      sessionLabelFromUa(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
      )
    ).toBe("ویندوز");
  });

  it("fallback", () => {
    expect(sessionLabelFromUa("UnknownAgent/1.0")).toBe("دستگاه");
  });
});
