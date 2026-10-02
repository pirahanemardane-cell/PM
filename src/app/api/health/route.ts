import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let supabase: "ok" | "error" | "skip" = "skip";

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const res = await fetch(`${url}/rest/v1/`, {
        method: "HEAD",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      supabase = res.ok || res.status === 404 || res.status === 200 ? "ok" : "error";
    }
  } catch {
    supabase = "error";
  }

  const body = {
    ok: supabase !== "error",
    service: "pirahanmardane",
    ts: new Date().toISOString(),
    latencyMs: Date.now() - started,
    checks: {
      app: "ok",
      supabase,
      rateLimitConfigured: Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
      ),
    },
  };

  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
