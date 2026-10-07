import type { QuoteInput, QuoteResult } from "../types";

/**
 * الوپیک — طبق docs.alopeyk.com و SDK رسمی
 * POST {base}/orders/price/calc
 * Auth: Bearer TOKEN
 * قیمت پاسخ به تومان است.
 */
export async function alopeykQuote(input: QuoteInput): Promise<QuoteResult> {
  const cfg = input.apiConfig || {};
  const baseUrl = String(
    cfg.base_url || "https://api.alopeyk.com/api/v2",
  ).replace(/\/$/, "");
  const token = String(cfg.api_token || cfg.api_key || "").trim();
  const originLat = cfg.origin_lat;
  const originLng = cfg.origin_lng;
  const transportType = String(cfg.transport_type || "motor_taxi");
  const city = String(cfg.city || "tehran");

  if (!token) {
    return { ok: false, error: "alopeyk_not_configured", fee: 0 };
  }
  if (originLat == null || originLng == null) {
    return { ok: false, error: "alopeyk_missing_origin_coords", fee: 0 };
  }

  // مختصات مقصد — در فاز چک‌اوت از geocode آدرس می‌آید
  const destLat = (input as any).destLat ?? cfg.dest_lat;
  const destLng = (input as any).destLng ?? cfg.dest_lng;
  if (destLat == null || destLng == null) {
    return {
      ok: false,
      error: "alopeyk_missing_dest_coords",
      fee: 0,
    };
  }

  try {
    const body = {
      transport_type: transportType,
      has_return: false,
      cashed: false,
      addresses: [
        {
          type: "origin",
          lat: Number(originLat),
          lng: Number(originLng),
          city,
        },
        {
          type: "destination",
          lat: Number(destLat),
          lng: Number(destLng),
          city: String((input as any).destCity || city).toLowerCase(),
        },
      ],
    };

    const res = await fetch(`${baseUrl}/orders/price/calc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return { ok: false, error: `alopeyk_http_${res.status}`, fee: 0 };
    }

    const data = (await res.json()) as {
      status?: string;
      object?: { price?: number };
    };

    if (data.status !== "success" || data.object?.price == null) {
      return { ok: false, error: "alopeyk_empty_price", fee: 0 };
    }

    // طبق مستندات SDK: قیمت به تومان
    const feeToman = Math.round(Number(data.object.price) || 0);
    if (feeToman <= 0) {
      return { ok: false, error: "alopeyk_empty_price", fee: 0 };
    }

    return {
      ok: true,
      fee: feeToman,
      currency: "IRR",
      source: "api",
    };
  } catch (e) {
    console.error("[alopeykQuote]", e);
    return { ok: false, error: "alopeyk_network", fee: 0 };
  }
}
