import { describe, expect, it } from "vitest";
import {
  amountsMatchToman,
  applyFreeShipping,
  clampQuantityToStock,
  computeDiscountAmount,
  computeOrderGrandTotal,
  computeSubtotal,
} from "@/lib/commerce/pricing";

describe("computeSubtotal", () => {
  it("sums lines", () => {
    expect(
      computeSubtotal([
        { price: 100_000, quantity: 2 },
        { price: 50_000, quantity: 1 },
      ]),
    ).toBe(250_000);
  });
});

describe("computeDiscountAmount", () => {
  it("percentage", () => {
    expect(computeDiscountAmount("percentage", 20, 1_000_000)).toBe(200_000);
  });
  it("percentage with max cap", () => {
    expect(computeDiscountAmount("percent", 50, 1_000_000, 100_000)).toBe(100_000);
  });
  it("fixed cannot exceed base", () => {
    expect(computeDiscountAmount("fixed", 500_000, 200_000)).toBe(200_000);
  });
});

describe("applyFreeShipping", () => {
  it("zero when over threshold", () => {
    expect(
      applyFreeShipping(50_000, 1_000_000, { enabled: true, minAmount: 500_000 }),
    ).toBe(0);
  });
  it("keeps fee when under threshold", () => {
    expect(
      applyFreeShipping(50_000, 100_000, { enabled: true, minAmount: 500_000 }),
    ).toBe(50_000);
  });
});

describe("computeOrderGrandTotal", () => {
  it("subtotal - discount + shipping", () => {
    expect(computeOrderGrandTotal(1_000_000, 100_000, 40_000)).toBe(940_000);
  });
});

describe("stock and amount match", () => {
  it("clampQuantityToStock", () => {
    expect(clampQuantityToStock(5, 3)).toBe(3);
    expect(clampQuantityToStock(2, 0)).toBe(0);
  });
  it("amountsMatchToman", () => {
    expect(amountsMatchToman(1000.4, 1000)).toBe(true);
    expect(amountsMatchToman(1000, 999)).toBe(false);
  });
});
