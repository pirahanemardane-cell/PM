import { createClient } from "@/lib/supabase/server";

/** ثبت نقطهٔ قیمت — خطا نباید جریان اصلی را بشکند */
export async function recordProductPrice(opts: {
  productId: string;
  variantId?: string | null;
  price: number;
  supabase?: Awaited<ReturnType<typeof createClient>>;
}) {
  try {
    const price = Number(opts.price);
    if (!opts.productId || !Number.isFinite(price) || price < 0) return;
    const supabase = opts.supabase ?? (await createClient());
    // فقط اگر آخرین قیمت فرق دارد ثبت کن
    const { data: last } = await supabase
      .from("product_price_history")
      .select("price")
      .eq("product_id", opts.productId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastPrice = last ? Number((last as { price: number }).price) : null;
    if (lastPrice != null && Math.abs(lastPrice - price) < 0.01) return;
    await supabase.from("product_price_history").insert({
      product_id: opts.productId,
      variant_id: opts.variantId ?? null,
      price,
    });
  } catch (e) {
    console.error("[recordProductPrice]", e);
  }
}

export async function getProductPriceHistory(productId: string, limit = 30) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_price_history")
      .select("price, recorded_at")
      .eq("product_id", productId)
      .order("recorded_at", { ascending: true })
      .limit(limit);
    if (error) {
      console.error("[getProductPriceHistory]", error.message);
      return [] as { price: number; recorded_at: string }[];
    }
    return (data ?? []).map((r) => ({
      price: Number((r as { price: number }).price),
      recorded_at: String((r as { recorded_at: string }).recorded_at),
    }));
  } catch {
    return [] as { price: number; recorded_at: string }[];
  }
}
