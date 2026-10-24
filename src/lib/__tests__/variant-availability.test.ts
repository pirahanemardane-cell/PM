import { describe, expect, it } from "vitest";
import {
  colorAvailable,
  isVariantAvailable,
  sizeAvailable,
  stockOf,
} from "@/lib/variant-availability";

const variants = [
  { id: "1", size: "M", color: "آبی", stock: 2 },
  { id: "2", size: "L", color: "آبی", stock: 0 },
  { id: "3", size: "M", color: "مشکی", stock: 1 },
];

describe("variant availability", () => {
  it("stockOf", () => {
    expect(stockOf({ id: "x", stock_quantity: 4 })).toBe(4);
  });

  it("sizeAvailable respects color", () => {
    expect(sizeAvailable("M", variants, "آبی")).toBe(true);
    expect(sizeAvailable("L", variants, "آبی")).toBe(false);
  });

  it("colorAvailable", () => {
    expect(colorAvailable("آبی", variants)).toBe(true);
    expect(colorAvailable("قرمز", variants)).toBe(false);
  });

  it("isVariantAvailable", () => {
    expect(
      isVariantAvailable(
        [{ color_hex: "1e3a8a", size: "M", stock: 1 }],
        "1e3a8a",
        "M",
      ),
    ).toBe(true);
    expect(
      isVariantAvailable(
        [{ color_hex: "1e3a8a", size: "M", stock: 0 }],
        "1e3a8a",
        "M",
      ),
    ).toBe(false);
  });
});
