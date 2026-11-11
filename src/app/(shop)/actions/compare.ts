"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FACET_SLUGS } from "@/lib/facet-map";

export type CompareAttr = { slug: string; label: string; value: string };

export type CompareProductDTO = {
  id: string;
  title: string;
  slug: string;
  price: number;
  image?: string;
  brand?: string;
  category?: string;
  href: string;
  colors: string[];
  sizes: string[];
  attrs: CompareAttr[];
};

const HIDE_ATTR = new Set(["size", "color", "سایز", "رنگ"]);

export async function getCompareProductsAction(ids: string[]): Promise<{
  ok: boolean;
  items: CompareProductDTO[];
  error?: string;
}> {
  try {
    const clean = [...new Set((ids || []).filter(Boolean))].slice(0, 8);
    if (!clean.length) return { ok: true, items: [] };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        status,
        deleted_at,
        brands(name),
        category:categories(name, slug),
        product_variants(price, is_active, color_name, color_hex, size),
        product_images(url, is_primary, sort_order, variant_id)
      `,
      )
      .in("id", clean)
      .eq("status", "published")
      .is("deleted_at", null);

    if (error) {
      console.error("[getCompareProducts]", error);
      return { ok: false, items: [], error: "db" };
    }

    const { data: pav } = await supabase
      .from("product_attribute_values")
      .select(
        `
        product_id,
        value_text,
        attributes:attribute_id ( name, slug, sort_order ),
        attribute_options:option_id ( value )
      `,
      )
      .in("product_id", clean);

    const attrsByProduct = new Map<string, CompareAttr[]>();
    const facetSet = new Set(DEFAULT_FACET_SLUGS as readonly string[]);
    for (const row of pav ?? []) {
      const pid = (row as { product_id: string }).product_id;
      const attr = (row as any).attributes as {
        name?: string;
        slug?: string;
        sort_order?: number | null;
      } | null;
      const opt = (row as any).attribute_options as { value?: string } | null;
      const slug = (attr?.slug || "").trim().toLowerCase();
      if (!slug || HIDE_ATTR.has(slug)) continue;
      // Prefer core facet attrs; still include other named attrs
      const label = (attr?.name || attr?.slug || "").trim();
      const value = (
        opt?.value ||
        (typeof (row as any).value_text === "string" ? (row as any).value_text : "") ||
        ""
      ).trim();
      if (!label || !value) continue;
      const list = attrsByProduct.get(pid) ?? [];
      if (!list.some((a) => a.slug === slug)) {
        list.push({ slug, label, value });
      }
      attrsByProduct.set(pid, list);
    }

    // Sort attrs: facet order first
    for (const [pid, list] of attrsByProduct) {
      list.sort((a, b) => {
        const ia = DEFAULT_FACET_SLUGS.indexOf(a.slug as (typeof DEFAULT_FACET_SLUGS)[number]);
        const ib = DEFAULT_FACET_SLUGS.indexOf(b.slug as (typeof DEFAULT_FACET_SLUGS)[number]);
        const ra = ia === -1 ? 999 : ia;
        const rb = ib === -1 ? 999 : ib;
        if (ra !== rb) return ra - rb;
        return a.label.localeCompare(b.label, "fa");
      });
      // Prefer showing facet attrs when many exist
      const facets = list.filter((a) => facetSet.has(a.slug));
      attrsByProduct.set(pid, (facets.length ? facets : list).slice(0, 12));
    }

    const byId = new Map<string, CompareProductDTO>();
    for (const p of data ?? []) {
      const row = p as any;
      if (!row.id) continue;
      const variants = (row.product_variants ?? []).filter(
        (v: any) => v.is_active !== false,
      );
      const prices = variants
        .map((v: any) => Number(v.price ?? 0))
        .filter((n: number) => !Number.isNaN(n) && n >= 0);
      const price = prices.length ? Math.min(...prices) : 0;

      const colors: string[] = [];
      const sizes: string[] = [];
      for (const v of variants) {
        const c = String(v.color_name || v.color_hex || "").trim();
        if (c && !colors.includes(c)) colors.push(c);
        const sz = String(v.size || "").trim();
        if (sz && !sizes.includes(sz)) sizes.push(sz);
      }

      const images = (row.product_images ?? [])
        .slice()
        .sort(
          (a: any, b: any) =>
            Number(b.is_primary) - Number(a.is_primary) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
      const image =
        images.find((im: any) => !im.variant_id)?.url ?? images[0]?.url ?? undefined;

      let brand: string | undefined;
      const b = row.brands;
      if (Array.isArray(b)) brand = b[0]?.name;
      else if (b && typeof b === "object") brand = b.name;

      let category: string | undefined;
      const cat = row.category;
      if (Array.isArray(cat)) category = cat[0]?.name;
      else if (cat && typeof cat === "object") category = cat.name;

      const slug = (row.slug || "").trim();
      byId.set(row.id, {
        id: row.id,
        title: (row.name || "محصول").trim(),
        slug,
        price,
        image,
        brand,
        category,
        href: slug ? `/محصولات/${slug}` : `/محصولات/${row.id}`,
        colors,
        sizes,
        attrs: attrsByProduct.get(row.id) ?? [],
      });
    }

    const items = clean
      .map((id) => byId.get(id))
      .filter((x): x is CompareProductDTO => x != null);

    return { ok: true, items };
  } catch (e) {
    console.error("[getCompareProducts]", e);
    return { ok: false, items: [], error: "server" };
  }
}
