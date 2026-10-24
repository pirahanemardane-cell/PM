import { describe, expect, it } from "vitest";
import { getShippingQuote } from "@/lib/shipping/quote";
import type { ShippingMethodRow } from "@/lib/shipping/types";

describe("getShippingQuote fixed and negotiable", () => {
  it("fixed fee", async () => {
    const method = {
      id: "1",
      name: "پست",
      provider_code: "post",
      pricing_type: "fixed",
      fee: 45000,
      is_active: true,
      api_config: {},
    } as unknown as ShippingMethodRow;
    const r = await getShippingQuote(method, {
      weightGrams: 400,
      destCity: "تهران",
      destProvince: "تهران",
      parcelValueToman: 500000,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.fee).toBe(45000);
  });

  it("negotiable is zero with note", async () => {
    const method = {
      id: "2",
      name: "توافقی",
      provider_code: "custom",
      pricing_type: "negotiable",
      fee: 0,
      is_active: true,
      api_config: {},
    } as unknown as ShippingMethodRow;
    const r = await getShippingQuote(method, {
      weightGrams: 400,
      destCity: "تهران",
      destProvince: "تهران",
      parcelValueToman: 100000,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fee).toBe(0);
      expect(r.source).toBe("negotiable");
    }
  });
});
