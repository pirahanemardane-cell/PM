import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeIranMobile, isValidIranianPhone } from "@/lib/numbers";

export async function POST(req: Request) {
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
      return NextResponse.json(
        { ok: false as const, error: "too_many_requests", retryAfterSec },
        {
          status: 429,
          headers: retryAfterSec
            ? { "Retry-After": String(retryAfterSec) }
            : undefined,
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const raw = String((body as { phone?: string }).phone || "").trim();
    const phone = normalizeIranMobile(raw) || raw;

    if (!isValidIranianPhone(phone)) {
      return NextResponse.json(
        { ok: false as const, error: "invalid_phone" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // اگر قبلاً عضو بوده و لغو کرده → دوباره فعال کن
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
          console.error("[newsletter resubscribe]", error);
          return NextResponse.json(
            { ok: false as const, error: "db" },
            { status: 500 },
          );
        }
        return NextResponse.json({ ok: true as const, status: "resubscribed" });
      }
      return NextResponse.json({ ok: true as const, status: "already" });
    }

    const { error } = await supabase.from("newsletter_subscribers").insert({
      phone,
      source: "home",
      ip,
    });

    if (error) {
      // race روی unique
      if (String(error.code) === "23505") {
        return NextResponse.json({ ok: true as const, status: "already" });
      }
      console.error("[newsletter insert]", error);
      return NextResponse.json(
        { ok: false as const, error: "db" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true as const, status: "created" });
  } catch (e) {
    console.error("[newsletter]", e);
    return NextResponse.json(
      { ok: false as const, error: "server" },
      { status: 500 },
    );
  }
}
