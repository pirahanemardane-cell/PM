import { NextRequest, NextResponse } from "next/server";
import { processPendingJobs } from "@/lib/queue/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  return q === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await processPendingJobs(15);
    return NextResponse.json({ ok: true, ...result, ts: new Date().toISOString() });
  } catch (e) {
    console.error("[cron/jobs]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "server" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
