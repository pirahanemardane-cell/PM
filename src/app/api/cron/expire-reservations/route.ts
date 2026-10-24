import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  return q === secret;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("release_expired_stock_reservations");
    if (error) {
      console.error("[cron/expire-reservations]", error.message);
      return NextResponse.json(
        { ok: false, error: error.message, latencyMs: Date.now() - started },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      released: Number(data ?? 0),
      latencyMs: Date.now() - started,
    });
  } catch (e) {
    console.error("[cron/expire-reservations]", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "server",
        latencyMs: Date.now() - started,
      },
      { status: 500 },
    );
  }
}
