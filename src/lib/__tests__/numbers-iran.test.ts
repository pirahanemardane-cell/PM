import { describe, expect, it } from "vitest";
import {
  normalizeIranMobile,
  normalizeIranPostalCode,
  toEnglishDigits,
  toPersianDigits,
} from "@/lib/numbers";

describe("Iran numbers", () => {
  it("mobile formats", () => {
    expect(normalizeIranMobile("09121234567")).toBe("09121234567");
    expect(normalizeIranMobile("۹۱۲۱۲۳۴۵۶۷")).toBe("09121234567");
    expect(normalizeIranMobile("+989121234567")).toBe("09121234567");
    expect(normalizeIranMobile("123")).toBeNull();
  });

  it("postal code 10 digits", () => {
    expect(normalizeIranPostalCode("1234567890")).toBe("1234567890");
    expect(normalizeIranPostalCode("12345")).toBeNull();
  });

  it("digit convert", () => {
    expect(toEnglishDigits("۱۲۳")).toBe("123");
    expect(toPersianDigits(45)).toBe("۴۵");
  });
});
