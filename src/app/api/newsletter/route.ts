import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeIranMobile, isValidIranianPhone } from "@/lib/numbers";
import { beginApiRequest, apiJson } from "@/lib/api-request";

export async function POST(req: Request) {
  const { requestId, log } = beginApiRequest(req);
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const { success, retryAfterSec } = await checkRateLimit({
      identifier: ip,
      type: "contact",
    });

    if (!success) {
      log.warn("[newsletter] rate limited", { ip });
      return apiJson(
        { ok: false as const, error: "too_many_requests", retryAfterSec, requestId },
        {
          status: 429,
          requestId,
          headers: retryAfterSec ? { "Retry-After": String(retryAfterSec) } : {},
        },
      );
    }

    const body = await req.json();
    const raw = String(body.phone || body.mobile || "").trim();
    const phone = normalizeIranMobile(raw);
    if (!phone || !isValidIranianPhone(phone)) {
      return apiJson(
        { ok: false as const, error: "invalid_phone", requestId },
        { status: 400, requestId },
      );
    }

    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, unsubscribed_at")
      .eq("phone", phone)
      .maybeSingle();

    if (existing?.id) {
      if (existing.unsubscribed_at) {
        const { error } = await supabase
          .from("newsletter_subscribers")
          .update({ unsubscribed_at: null, source: "home", ip })
          .eq("id", existing.id);
        if (error) {
          log.error("[newsletter] resubscribe", { message: error.message });
          return apiJson({ ok: false as const, error: "db", requestId }, { status: 500, requestId });
        }
        return apiJson({ ok: true as const, status: "resubscribed", requestId }, { requestId });
      }
      return apiJson({ ok: true as const, status: "already", requestId }, { requestId });
    }

    const { error } = await supabase.from("newsletter_subscribers").insert({
      phone,
      source: "home",
      ip,
    });

    if (error) {
      if (String(error.code) === "23505") {
        return apiJson({ ok: true as const, status: "already", requestId }, { requestId });
      }
      log.error("[newsletter] insert", { message: error.message });
      return apiJson({ ok: false as const, error: "db", requestId }, { status: 500, requestId });
    }

    log.info("[newsletter] created");
    return apiJson({ ok: true as const, status: "created", requestId }, { requestId });
  } catch (e) {
    log.error("[newsletter] server", { err: e instanceof Error ? e.message : "unknown" });
    return apiJson({ ok: false as const, error: "server", requestId }, { status: 500, requestId });
  }
}
