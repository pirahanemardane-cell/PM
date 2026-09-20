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

export async function adminListProductsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("products")
      .select(
        "id, name, slug, status, is_featured, category_id, brand_id, created_at, categories(name), brands(name)",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListProducts]", e);
    return { ok: false as const, error: "server", items: [] };
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
  /** واریانت اولیه / موجودی */
  price: number;
  original_price?: number | null;
  stock_quantity?: number;
  size?: string;
  color_name?: string;
  color_hex?: string;
  sku?: string;
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

    return { ok: true as const, id: product.id };
  } catch (e) {
    console.error("[adminCreateProduct]", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : "server";
    return { ok: false as const, error: msg };
  }
}

export async function adminSetProductStatusAction(
  id: string,
  status: "draft" | "published" | "archived",
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase
      .from("products")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[adminSetProductStatus]", e);
    return { ok: false as const, error: "server" };
  }
}
