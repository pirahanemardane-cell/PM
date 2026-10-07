import type { QuoteInput, QuoteResult } from "../types";

/**
 * اسکلت Pricing تیپاکس — طبق document.tipaxapi.org
 * POST {base}/api/OM/v4/Pricing
 * تا وقتی api_key و contract_code نباشد → خطا با پیام واضح
 */
export async function tipaxQuote(input: QuoteInput): Promise<QuoteResult> {
  const cfg = input.apiConfig || {};
  const baseUrl = String(cfg.base_url || "https://omapi.tipax.ir").replace(/\/$/, "");
  const apiKey = String(cfg.api_key || "").trim();
  const contractCode = String(cfg.contract_code || "").trim();

  if (!apiKey || !contractCode) {
    return {
      ok: false,
      error: "tipax_not_configured",
      fee: 0,
    };
  }

  try {
    const res = await fetch(`${baseUrl}/api/OM/v4/Pricing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contractCode,
        weight: Math.max(0.1, input.weightGrams / 1000),
        // شهر مقصد — در فاز کامل با cityId تیپاکس map می‌شود
        destinationCityName: input.destCity || "",
        packageValue: (input.parcelValueToman || 0) * 10, // تومان → ریال تقریبی
        length: input.lengthCm || 20,
        width: input.widthCm || 15,
        height: input.heightCm || 10,
      }),
      // timeout تقریبی
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return { ok: false, error: `tipax_http_${res.status}`, fee: 0 };
    }

    const data = (await res.json()) as Record<string, unknown>;
    // فیلدهای رایج در پاسخ تیپاکس
    const raw =
      Number(data.finalPrice ?? data.finalAmount ?? data.shippingCost ?? data.price ?? 0) || 0;
    // اگر ریال بود به تومان تبدیل (حدس: اعداد خیلی بزرگ)
    const feeToman = raw > 500_000 ? Math.round(raw / 10) : Math.round(raw);

    if (feeToman <= 0) {
      return { ok: false, error: "tipax_empty_price", fee: 0 };
    }

    return { ok: true, fee: feeToman, currency: "IRR", source: "api" };
  } catch (e) {
    console.error("[tipaxQuote]", e);
    return { ok: false, error: "tipax_network", fee: 0 };
  }
}
