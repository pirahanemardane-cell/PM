import { createClient } from "@/lib/supabase/server";

type VariantLike = {
  price?: number | null;
  original_price?: number | null;
  sale_price?: number | null;
  is_active?: boolean | null;
  status?: string | null;
};

/** میانگین قیمت واریانت‌هایی که قیمت معتبر (>0) دارند */
export function averageVariantPrice(
  variants: VariantLike[] | null | undefined,
): number | null {
  const list = Array.isArray(variants) ? variants : [];
  const prices: number[] = [];
  for (const v of list) {
    if (v?.is_active === false) continue;
    const st = String(v?.status ?? "").toLowerCase();
    if (st === "inactive" || st === "disabled") continue;
    const sale = Number(v?.sale_price);
    const base = Number(v?.price);
    const p =
      Number.isFinite(sale) && sale > 0
        ? sale
        : Number.isFinite(base) && base > 0
          ? base
          : NaN;
    if (Number.isFinite(p) && p > 0) prices.push(p);
  }
  if (!prices.length) return null;
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

export async function recordProductPrice(opts: {
  productId: string;
  variantId?: string | null;
  price?: number | null;
  variants?: VariantLike[] | null;
  supabase?: Awaited<ReturnType<typeof createClient>>;
}) {
  try {
    if (!opts.productId) return;
    const supabase = opts.supabase ?? (await createClient());

    let variants = opts.variants;
    if (!variants || !variants.length) {
      const { data } = await supabase
        .from("product_variants")
        .select("id, price, original_price, is_active")
        .eq("product_id", opts.productId);
      variants = (data ?? []) as VariantLike[];
    }

    const avg = averageVariantPrice(variants);
    const fallback = Number(opts.price);
    const price =
      avg != null
        ? avg
        : Number.isFinite(fallback) && fallback > 0
          ? fallback
          : NaN;
    // هرگز صفر یا منفی ثبت نکن
    if (!Number.isFinite(price) || price <= 0) return;

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

export async function getProductPriceHistory(productId: string, limit = 60) {
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
    // نقاط صفر/نامعتبر را حذف کن (داده‌های قدیمی خراب)
    return (data ?? [])
      .map((r) => ({
        price: Number((r as { price: number }).price),
        recorded_at: String((r as { recorded_at: string }).recorded_at),
      }))
      .filter((p) => Number.isFinite(p.price) && p.price > 0);
  } catch {
    return [] as { price: number; recorded_at: string }[];
  }
}
