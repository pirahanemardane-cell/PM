import { describe, expect, it } from "vitest";
import {
  applyFreeShipping,
  clampQuantityToStock,
  computeDiscountAmount,
  computeOrderGrandTotal,
  computeSubtotal,
} from "@/lib/commerce/pricing";
import {
  isCustomerCancellable,
  isReturnAllowedStatus,
  isWithinReturnWindow,
} from "@/lib/business-rules";
import { normalizeIranMobile, normalizeIranPostalCode } from "@/lib/numbers";

describe("integration checkout pipeline", () => {
  it("guest checkout numbers totals free ship", () => {
    const lines = [
      { price: 800_000, quantity: clampQuantityToStock(2, 5) },
      { price: 200_000, quantity: clampQuantityToStock(1, 1) },
    ];
    const subtotal = computeSubtotal(lines);
    expect(subtotal).toBe(1_800_000);

    const discount = computeDiscountAmount("percentage", 10, subtotal, 150_000);
    expect(discount).toBe(150_000);

    const after = subtotal - discount;
    const ship = applyFreeShipping(45_000, after, {
      enabled: true,
      minAmount: 1_000_000,
    });
    expect(ship).toBe(0);

    const total = computeOrderGrandTotal(subtotal, discount, ship);
    expect(total).toBe(1_650_000);

    expect(normalizeIranMobile("09121234567")).toBeTruthy();
    expect(normalizeIranPostalCode("1234567890")).toBeTruthy();
  });

  it("order lifecycle rules after purchase", () => {
    expect(isCustomerCancellable("paid")).toBe(true);
    expect(isCustomerCancellable("shipped")).toBe(false);
    expect(isReturnAllowedStatus("delivered")).toBe(true);
    const shippedAt = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(isWithinReturnWindow(shippedAt, null)).toBe(true);
  });

  it("stock blocks oversell in pipeline", () => {
    expect(clampQuantityToStock(10, 2)).toBe(2);
    const sub = computeSubtotal([
      { price: 100_000, quantity: clampQuantityToStock(10, 2) },
    ]);
    expect(sub).toBe(200_000);
  });
});
