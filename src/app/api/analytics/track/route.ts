import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = new Set([
  "view_item",
  "add_to_cart",
  "view_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "search",
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.event_name || !ALLOWED.has(String(body.event_name))) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // جدول تازه است؛ تا gen type دوباره ساخته شود با any امن می‌نویسیم
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("analytics_events")
      .insert({
        event_name: body.event_name,
        session_id: body.session_id ?? null,
        user_id: user?.id ?? null,
        product_id: body.product_id ?? null,
        variant_id: body.variant_id ?? null,
        order_id: body.order_id ?? null,
        quantity: body.quantity ?? null,
        value: body.value ?? null,
        currency: body.currency ?? "IRR",
        search_term: body.search_term ?? null,
        result_count: body.result_count ?? null,
        path: body.path ?? null,
        device: body.device ?? null,
      });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
