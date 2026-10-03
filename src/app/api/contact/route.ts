import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit بر اساس IP
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
        { error: "too_many_requests", retryAfterSec },
        {
          status: 429,
          headers: retryAfterSec
            ? { "Retry-After": String(retryAfterSec) }
            : undefined,
        }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 120);
    const company = String(body.company || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().slice(0, 200);
    const message = String(body.message || "").trim().slice(0, 4000);

    if (!name || !email || !message) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      company: company || null,
      email,
      message,
      status: "new",
    });

    if (error) {
      console.error("contact_messages insert", error);
      return NextResponse.json({ error: "db" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
