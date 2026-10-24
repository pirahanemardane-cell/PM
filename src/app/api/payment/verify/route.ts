import { NextRequest, NextResponse } from "next/server";
import { verifyAndApplyPayment } from "@/lib/payment/verify";

export const dynamic = "force-dynamic";

/** POST /api/payment/verify — body: { authority, amount, orderId } */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      authority?: string;
      amount?: number;
      orderId?: string;
      provider?: string;
    };
    const result = await verifyAndApplyPayment({
      authority: String(body.authority || ""),
      amount: Number(body.amount),
      orderId: String(body.orderId || ""),
      eventKey: String(body.authority || ""),
      provider: body.provider || "zarinpal",
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/payment/verify]", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
