import type { QuoteInput, QuoteResult } from "../types";

/**
 * اسکلت Pricing اسنپ باکس — طبق api-docs.snapp-box.com
 * نیاز به API Key + Client-Id + مختصات مبدا/مقصد
 * فعلاً بدون lat/lng واقعی فقط وضعیت پیکربندی را برمی‌گرداند
 */
export async function snappboxQuote(input: QuoteInput): Promise<QuoteResult> {
  const cfg = input.apiConfig || {};
  const baseUrl = String(cfg.base_url || "https://b2b.snapp-box.com").replace(/\/$/, "");
  const apiKey = String(cfg.api_key || "").trim();
  const clientId = String(cfg.client_id || "").trim();
  const originLat = cfg.origin_lat;
  const originLng = cfg.origin_lng;

  if (!apiKey || !clientId) {
    return { ok: false, error: "snappbox_not_configured", fee: 0 };
  }

  if (originLat == null || originLng == null) {
    return {
      ok: false,
      error: "snappbox_missing_origin_coords",
      fee: 0,
    };
  }

  try {
    // مسیر دقیق بسته به نسخه API سازمانی ممکن است متفاوت باشد
    const res = await fetch(`${baseUrl}/api/v1/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Client-Id": clientId,
      },
      body: JSON.stringify({
        origin: { lat: Number(originLat), lng: Number(originLng) },
        // مقصد در فاز کامل از geocode آدرس مشتری می‌آید
        destinationCity: input.destCity || "",
        vehicleType: "bike",
        weightKg: Math.max(0.1, input.weightGrams / 1000),
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return { ok: false, error: `snappbox_http_${res.status}`, fee: 0 };
    }

    const data = (await res.json()) as Record<string, unknown>;
    const raw = Number(data.price ?? data.finalPrice ?? data.fare ?? 0) || 0;
    const feeToman = raw > 500_000 ? Math.round(raw / 10) : Math.round(raw);

    if (feeToman <= 0) {
      return { ok: false, error: "snappbox_empty_price", fee: 0 };
    }

    return { ok: true, fee: feeToman, currency: "IRR", source: "api" };
  } catch (e) {
    console.error("[snappboxQuote]", e);
    return { ok: false, error: "snappbox_network", fee: 0 };
  }
}
