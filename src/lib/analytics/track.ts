"use client";

type FunnelEvent =
  | "view_item"
  | "add_to_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "add_payment_info"
  | "purchase"
  | "search";

type TrackPayload = {
  event_name: FunnelEvent;
  product_id?: string;
  variant_id?: string;
  order_id?: string;
  quantity?: number;
  value?: number;
  search_term?: string;
  result_count?: number;
  path?: string;
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "pm_sid";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getDevice(): "mobile" | "desktop" | "tablet" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export async function track(payload: TrackPayload): Promise<void> {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        session_id: getSessionId(),
        device: getDevice(),
        path: payload.path ?? window.location.pathname,
        currency: "IRR",
      }),
      keepalive: true,
    });
  } catch {
    // analytics must never break UX
  }
}
