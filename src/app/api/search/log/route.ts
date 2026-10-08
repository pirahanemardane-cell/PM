import { NextRequest, NextResponse } from "next/server";
import { logSearchQuery } from "@/lib/search/log";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || "").trim();
    const resultCount = Number(body.resultCount ?? 0);
    const source = String(body.source || "client");
    if (query.length < 2) {
      return NextResponse.json({ ok: true });
    }
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {}
    await logSearchQuery({ query, resultCount, userId, source });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[search/log]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
