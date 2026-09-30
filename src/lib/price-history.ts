import { createClient } from "@/lib/supabase/server";

export function averageVariantPrice(
  variants:
    | Array<{ price?: number | null; sale_price?: number | null; status?: string | null }>
    | null
    | undefined,
): number | null {
  const list = Array.isArray(variants) ? variants : [];
  const prices: number[] = [];
  for (const v of list) {
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
  variants?: Array<{
    price?: number | null;
    sale_price?: number | null;
    status?: string | null;
  }> | null;
  supabase?: Awaited<ReturnType<typeof createClient>>;
}) {
  try {
    let price = Number(opts.price);
    if (!Number.isFinite(price) || price <= 0) {
      const avg = averageVariantPrice(opts.variants);
      if (avg == null) return;
      price = avg;
    }
    if (!opts.productId || !Number.isFinite(price) || price < 0) return;
    const supabase = opts.supabase ?? (await createClient());
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
    return (data ?? []).map((r) => ({
      price: Number((r as { price: number }).price),
      recorded_at: String((r as { recorded_at: string }).recorded_at),
    }));
  } catch {
    return [] as { price: number; recorded_at: string }[];
  }
}
