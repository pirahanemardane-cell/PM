import { NextRequest, NextResponse } from "next/server";
import { processAbandonedCarts } from "@/lib/abandoned-cart/process";
import { assertCronBearer } from "@/lib/security/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!assertCronBearer(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await processAbandonedCarts();
    return NextResponse.json({ ...result, ts: new Date().toISOString() });
  } catch (e) {
    console.error("[cron/abandoned-carts]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "server" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
