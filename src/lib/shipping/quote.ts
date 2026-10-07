import type { QuoteInput, QuoteResult, ShippingMethodRow } from "./types";
import { tipaxQuote } from "./providers/tipax";
import { snappboxQuote } from "./providers/snappbox";
import { postPishtazQuote } from "./providers/post";
import { alopeykQuote } from "./providers/alopeyk";

export async function getShippingQuote(
  method: ShippingMethodRow,
  input: Omit<QuoteInput, "providerCode" | "apiConfig">,
): Promise<QuoteResult> {
  const pricing = method.pricing_type || "fixed";
  const code = (method.provider_code || "").toLowerCase();
  const apiConfig = (method.api_config || {}) as Record<string, unknown>;

  if (pricing === "fixed") {
    return {
      ok: true,
      fee: Math.max(0, Number(method.fee) || 0),
      currency: "IRR",
      source: "fixed",
    };
  }

  if (pricing === "negotiable") {
    return {
      ok: true,
      fee: 0,
      currency: "IRR",
      source: "negotiable",
      note: "هزینه توافقی — پس از هماهنگی اعلام می‌شود",
    };
  }

  const payload: QuoteInput = {
    providerCode: code,
    apiConfig,
    weightGrams: input.weightGrams,
    destCity: input.destCity,
    destProvince: input.destProvince,
    parcelValueToman: input.parcelValueToman,
    lengthCm: input.lengthCm,
    widthCm: input.widthCm,
    heightCm: input.heightCm,
    ...(input as any),
  };

  if (code === "tipax") return tipaxQuote(payload);
  if (code === "snappbox") return snappboxQuote(payload);
  if (code === "post") return postPishtazQuote(payload);
  if (code === "alopeyk") return alopeykQuote(payload);

  return {
    ok: true,
    fee: Math.max(0, Number(method.fee) || 0),
    currency: "IRR",
    source: "fixed",
    note: "provider ناشناخته — از fee ثابت استفاده شد",
  };
}
