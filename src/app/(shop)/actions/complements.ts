"use server";

import { createClient } from "@/lib/supabase/server";

export type ComplementDTO = {
  id: string;
  label: string | null;
  is_bundle: boolean;
  bundle_price: number | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image?: string | null;
  };
};

export async function listProductComplementsAction(productId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_complements")
      .select(
        "id, label, is_bundle, bundle_price, sort_order, complement:products!product_complements_complement_product_id_fkey(id, name, slug, status)",
      )
      .eq("product_id", productId)
      .order("sort_order")
      .limit(12);
    if (error) throw error;

    const items: ComplementDTO[] = [];
    for (const row of data ?? []) {
      const c = (row as any).complement;
      if (!c || c.status !== "published") continue;
      let price = Number((row as any).bundle_price ?? 0);
      if (!price) {
        const { data: vars } = await supabase
          .from("product_variants")
          .select("price")
          .eq("product_id", c.id)
          .eq("is_active", true)
          .order("price", { ascending: true })
          .limit(1);
        price = Number(vars?.[0]?.price ?? 0);
      }
      items.push({
        id: (row as any).id,
        label: (row as any).label,
        is_bundle: !!(row as any).is_bundle,
        bundle_price: (row as any).bundle_price,
        product: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          price,
          image: null,
        },
      });
    }
    return { ok: true as const, items };
  } catch (e) {
    console.error("[listProductComplements]", e);
    return { ok: false as const, items: [] as ComplementDTO[] };
  }
}
