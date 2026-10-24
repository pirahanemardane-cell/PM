import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type VitalBody = {
  name?: string;
  value?: number;
  id?: string;
  rating?: string;
  navigationType?: string;
  path?: string;
  delta?: number;
};

/**
 * دریافت Core Web Vitals از مرورگر (LCP/INP/CLS/FCP/TTFB)
 * فقط لاگ ساخت‌یافته — بدون ذخیره PII
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VitalBody;
    const name = String(body.name || "").slice(0, 16);
    const value = Number(body.value);
    if (!name || !Number.isFinite(value)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const path = String(body.path || "").slice(0, 200);
    const rating = String(body.rating || "").slice(0, 16);
    // قابل مشاهده در Vercel Logs / مشاهده محلی
    console.info(
      JSON.stringify({
        type: "web_vital",
        name,
        value: Math.round(value * 100) / 100,
        rating,
        path,
        id: String(body.id || "").slice(0, 64),
        navigationType: String(body.navigationType || "").slice(0, 32),
      }),
    );
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
