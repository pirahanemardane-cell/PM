"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\u0600-\u06FFa-z0-9\-]+/gi, "")
      .replace(/\-+/g, "-")
      .replace(/^\-|\-$/g, "") || `p-${Date.now()}`
  );
}

export async function adminListProductsAction(limit = 80) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("products")
      .select(
        `
        id, name, slug, status, is_featured, is_new, is_bestseller, created_at,
        brand:brands(name),
        category:categories(name)
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListProducts]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminUpdateProductFlagsAction(
  id: string,
  flags: {
    status?: string;
    is_featured?: boolean;
    is_new?: boolean;
    is_bestseller?: boolean;
  },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const patch: Record<string, unknown> = {};
    if (flags.status !== undefined) patch.status = flags.status;
    if (flags.is_featured !== undefined) patch.is_featured = flags.is_featured;
    if (flags.is_new !== undefined) patch.is_new = flags.is_new;
    if (flags.is_bestseller !== undefined) patch.is_bestseller = flags.is_bestseller;
    if (!Object.keys(patch).length) return { ok: true as const };
    const { error } = await gate.supabase.from("products").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[adminUpdateProductFlags]", e);
    return { ok: false as const, error: "server" };
  }
}

export type CreateProductInput = {
  name: string;
  slug?: string;
  category_id: string;
  brand_id?: string | null;
  short_description?: string;
  description?: string;
  status?: "draft" | "published" | "archived";
  is_featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  price: number;
  original_price?: number | null;
  stock_quantity?: number;
  size?: string;
  color_name?: string;
  color_hex?: string;
  sku?: string;
  tag_ids?: string[];
  /** آدرس تصویر اصلی (فقط ادمین) */
  image_url?: string;
  image_alt?: string;
};

export async function adminCreateProductAction(input: CreateProductInput) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const name = (input.name || "").trim();
  if (!name) return { ok: false as const, error: "name_required" };
  if (!input.category_id) return { ok: false as const, error: "category_required" };
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0)
    return { ok: false as const, error: "price_invalid" };

  const slug = (input.slug || "").trim() || slugify(name);

  try {
    const { data: product, error: pErr } = await gate.supabase
      .from("products")
      .insert({
        name,
        slug,
        category_id: input.category_id,
        brand_id: input.brand_id || null,
        short_description: input.short_description?.trim() || null,
        description: input.description?.trim() || null,
        status: input.status ?? "draft",
        is_featured: !!input.is_featured,
        is_new: !!input.is_new,
        is_bestseller: !!input.is_bestseller,
      })
      .select("id")
      .single();
    if (pErr) throw pErr;

    const { error: vErr } = await gate.supabase.from("product_variants").insert({
      product_id: product.id,
      sku: input.sku?.trim() || null,
      size: input.size?.trim() || null,
      color_name: input.color_name?.trim() || null,
      color_hex: input.color_hex?.trim() || null,
      price,
      original_price:
        input.original_price != null && Number.isFinite(Number(input.original_price))
          ? Number(input.original_price)
          : null,
      stock_quantity: Math.max(0, Number(input.stock_quantity ?? 0) || 0),
      is_active: true,
    });
    if (vErr) throw vErr;

    const tagIds = (input.tag_ids ?? []).filter(Boolean);
    if (tagIds.length) {
      const rows = tagIds.map((tag_id) => ({
        product_id: product.id,
        tag_id,
      }));
      const { error: tErr } = await gate.supabase.from("product_tag_map").insert(rows);
      if (tErr) console.error("[product_tag_map]", tErr);
    }


    const imageUrl = (input.image_url || "").trim();
    if (imageUrl) {
      const { error: imgErr } = await gate.supabase.from("product_images").insert({
        product_id: product.id,
        url: imageUrl,
        alt_text: (input.image_alt || name).trim() || null,
        is_primary: true,
        sort_order: 0,
      });
      if (imgErr) console.error("[product_images]", imgErr);
    }

    return { ok: true as const, id: product.id as string };
  } catch (e) {
    console.error("[adminCreateProduct]", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : "server";
    return { ok: false as const, error: msg };
  }
}
