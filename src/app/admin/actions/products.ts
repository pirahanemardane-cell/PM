"use server";

import { recordProductPrice } from "@/lib/price-history";

import { adminWriteLogAction } from "@/app/admin/actions/logs";

import { requireAdmin } from "@/lib/admin/require-admin";

function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\u0600-\u06FFa-z0-9\-]+/gi, "")
      .replace(/\-+/g, "-")
      .replace(/^\-|\-$/g, "") || `product-${Date.now()}`
  );
}


async function linkVariantImages(
  supabase: any,
  productId: string,
  variants: {
    id?: string | null;
    size?: string | null;
    color_name?: string | null;
    image_url?: string | null;
  }[],
) {
  const { data: allVars, error: listErr } = await supabase
    .from("product_variants")
    .select("id, size, color_name")
    .eq("product_id", productId);
  if (listErr) {
    console.error("[linkVariantImages list]", listErr);
    return;
  }
  const rows = (allVars ?? []) as {
    id: string;
    size: string | null;
    color_name: string | null;
  }[];

  for (const vv of variants) {
    const url = (vv.image_url || "").trim();
    if (!url) continue;

    let vid: string | null = (vv.id || "").trim() || null;
    if (!vid) {
      const size = (vv.size || "").trim() || null;
      const color = (vv.color_name || "").trim() || null;
      const match = rows.find(
        (r) => (r.size || null) === size && (r.color_name || null) === color,
      );
      vid = match?.id ?? null;
    }
    if (!vid) {
      console.warn("[linkVariantImages] no variant", vv.size, vv.color_name, vv.id);
      continue;
    }

    const { data: existing, error: exErr } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .eq("variant_id", vid)
      .limit(1);
    if (exErr) {
      console.error("[linkVariantImages existing]", exErr);
      continue;
    }

    if (existing?.[0]?.id) {
      const { error } = await supabase
        .from("product_images")
        .update({ url, is_primary: false })
        .eq("id", existing[0].id);
      if (error) console.error("[linkVariantImages update]", error);
    } else {
      const { error } = await supabase.from("product_images").insert({
        product_id: productId,
        variant_id: vid,
        url,
        is_primary: false,
        sort_order: 10,
      });
      if (error) console.error("[linkVariantImages insert]", error);
    }
  }
}




export async function adminListProductsAction(
  limit = 100,
  opts?: { q?: string; status?: string },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    let query = gate.supabase
      .from("products")
      .select(
        "id, name, slug, status, is_featured, is_new, is_bestseller, created_at, category:categories(name), brand:brands(name)",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(Math.min(200, Math.max(1, Number(limit) || 100)));

    const status = (opts?.status || "").trim();
    if (status && ["draft", "published", "archived"].includes(status)) {
      query = query.eq("status", status);
    }
    const q = (opts?.q || "").trim();
    if (q) {
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListProducts]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminSetProductFlagsAction(
  id: string,
  patch: Partial<{
    status: "draft" | "published" | "archived";
    is_featured: boolean;
    is_new: boolean;
    is_bestseller: boolean;
  }>,
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase.from("products").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}

export async function adminListCategoriesAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("categories")
      .select("id, name, slug, is_active")
      .order("name");
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch {
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminListBrandsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("brands")
      .select("id, name, slug, is_active")
      .order("name");
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch {
    return { ok: false as const, error: "server", items: [] };
  }
}

type CreateProductInput = {
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
  image_url?: string;
  image_alt?: string;
  variants?: AdminVariantInput[];
};

export type AdminVariantInput = {
  id?: string;
  size?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
  sku?: string | null;
  price: number;
  original_price?: number | null;
  stock_quantity?: number;
  is_active?: boolean;
  image_url?: string | null;
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

    const variantList =
      input.variants && input.variants.length
        ? input.variants
        : [
            {
              sku: input.sku,
              size: input.size,
              color_name: input.color_name,
              color_hex: input.color_hex,
              price,
              original_price: input.original_price,
              stock_quantity: input.stock_quantity,
            },
          ];

    for (const vv of variantList) {
      const vp = Number(vv.price ?? price);
      if (!Number.isFinite(vp) || vp < 0) continue;
      const { error: vErr } = await gate.supabase.from("product_variants").insert({
        product_id: product.id,
        sku: (vv.sku || "").trim() || null,
        size: (vv.size || "").trim() || null,
        color_name: (vv.color_name || "").trim() || null,
        color_hex: (vv.color_hex || "").trim() || null,
        price: vp,
        original_price:
          vv.original_price != null && Number.isFinite(Number(vv.original_price))
            ? Number(vv.original_price)
            : null,
        stock_quantity: Math.max(0, Number(vv.stock_quantity ?? 0) || 0),
        is_active: true,
      });
      if (vErr) throw vErr;
    }

    if (input.variants?.length) {
      try {
        await linkVariantImages(gate.supabase, product.id, input.variants);
      } catch (e) {
        console.error("[linkVariantImages create]", e);
      }
    }

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
    return { ok: false as const, error: "server" };
  }
}


export async function adminGetProductAction(id: string) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { data, error } = await gate.supabase
      .from("products")
      .select(
        `
        id, name, slug, category_id, brand_id,
        short_description, description, status,
        is_featured, is_new, is_bestseller,
        product_variants ( id, sku, price, original_price, stock_quantity, size, color_name, color_hex, is_active ),
        product_images ( id, url, alt_text, is_primary, sort_order, variant_id ),
        product_tag_map ( tag_id )
      `,
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false as const, error: "not_found" };
    return { ok: true as const, product: data };
  } catch (e) {
    console.error("[adminGetProduct]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminUpdateProductAction(
  id: string,
  input: {
    name: string;
    category_id: string;
    brand_id?: string | null;
    short_description?: string | null;
    description?: string | null;
    status?: string;
    is_featured?: boolean;
    is_new?: boolean;
    is_bestseller?: boolean;
    sku?: string | null;
    price?: number;
    original_price?: number | null;
    stock_quantity?: number;
    size?: string | null;
    color_name?: string | null;
    color_hex?: string | null;
    image_url?: string | null;
    image_alt?: string | null;
    tag_ids?: string[];
  },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const name = (input.name || "").trim();
    if (!name || !input.category_id) {
      return { ok: false as const, error: "validation" };
    }
    const price = Number(input.price);
    if (!Number.isFinite(price) || price < 0) {
      return { ok: false as const, error: "price" };
    }

    const { error: pErr } = await gate.supabase
      .from("products")
      .update({
        name,
        category_id: input.category_id,
        brand_id: input.brand_id || null,
        short_description: input.short_description?.trim() || null,
        description: input.description?.trim() || null,
        status: input.status ?? "draft",
        is_featured: !!input.is_featured,
        is_new: !!input.is_new,
        is_bestseller: !!input.is_bestseller,
      })
      .eq("id", id);
    if (pErr) throw pErr;

    const { data: variants } = await gate.supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", id)
      .order("created_at", { ascending: true })
      .limit(1);

    const variantPatch = {
      sku: input.sku?.trim() || null,
      price,
      original_price:
        input.original_price != null && Number.isFinite(Number(input.original_price))
          ? Number(input.original_price)
          : null,
      stock_quantity: Math.max(0, Number(input.stock_quantity ?? 0) || 0),
      size: (input.size || "").trim() || null,
      color_name: (input.color_name || "").trim() || null,
      color_hex: (input.color_hex || "").trim() || null,
      is_active: true,
    };

    if (variants?.[0]?.id) {
      const { error: vErr } = await gate.supabase
        .from("product_variants")
        .update(variantPatch)
        .eq("id", variants[0].id);
      if (vErr) throw vErr;
    } else {
      const { error: vErr } = await gate.supabase.from("product_variants").insert({
        product_id: id,
        ...variantPatch,
      });
      if (vErr) throw vErr;
    }

    if (input.tag_ids) {
      await gate.supabase.from("product_tag_map").delete().eq("product_id", id);
      const tagIds = input.tag_ids.filter(Boolean);
      if (tagIds.length) {
        await gate.supabase.from("product_tag_map").insert(
          tagIds.map((tag_id) => ({ product_id: id, tag_id })),
        );
      }
    }

    const imageUrl = (input.image_url || "").trim();
    if (imageUrl) {
      const { data: imgs } = await gate.supabase
        .from("product_images")
        .select("id")
        .eq("product_id", id)
        .eq("is_primary", true)
        .limit(1);
      if (imgs?.[0]?.id) {
        await gate.supabase
          .from("product_images")
          .update({
            url: imageUrl,
            alt_text: (input.image_alt || name).trim() || null,
          })
          .eq("id", imgs[0].id);
      } else {
        await gate.supabase.from("product_images").insert({
          product_id: id,
          url: imageUrl,
          alt_text: (input.image_alt || name).trim() || null,
          is_primary: true,
          sort_order: 0,
        });
      }
    }

    
    try {
      const { data: vrow } = await gate.supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      await recordProductPrice({
        productId: id,
        variantId: (vrow as { id?: string } | null)?.id ?? null,
        price,
        supabase: gate.supabase,
      });
    } catch {
      /* ignore */
    }

    return { ok: true as const };
  } catch (e) {
    console.error("[adminUpdateProduct]", e);
    return { ok: false as const, error: "server" };
  }
}


export async function adminUpdateProductFlagsAction(
  id: string,
  patch: Partial<{
    status: "draft" | "published" | "archived";
    is_featured: boolean;
    is_new: boolean;
    is_bestseller: boolean;
  }>,
) {
  return adminSetProductFlagsAction(id, patch);
}

/** حذف نرم — فقط deleted_at؛ از لیست ادمین و فروشگاه خارج می‌شود. */
export async function adminSoftDeleteProductAction(id: string) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  if (!id?.trim()) return { ok: false as const, error: "invalid" as const };
  try {
    const { error } = await gate.supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString(), status: "archived" })
      .eq("id", id)
      .is("deleted_at", null);
    if (error) throw error;
    void adminWriteLogAction({
      action: "product_soft_delete",
      entity: "product",
      entity_id: id,
      meta: null,
    });
    return { ok: true as const };
  } catch (e) {
    console.error("[adminSoftDeleteProduct]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/** همگام‌سازی وریانت‌ها: upsert + حذف آن‌هایی که در لیست نیستند */
/** همگام‌سازی وریانت‌ها: upsert + حذف آن‌هایی که در لیست نیستند + تصویر واریانت */
/** همگام‌سازی وریانت‌ها — بدون حذف کور؛ فقط upsert + لینک تصویر */
export async function adminSyncProductVariantsAction(
  productId: string,
  variants: AdminVariantInput[],
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  if (!productId) return { ok: false as const, error: "product_required" };

  try {
    const cleaned = (variants ?? [])
      .map((v) => ({
        id: (v.id || "").trim() || undefined,
        size: (v.size || "").trim() || null,
        color_name: (v.color_name || "").trim() || null,
        color_hex: (v.color_hex || "").trim() || null,
        sku: (v.sku || "").trim() || null,
        price: Number(v.price),
        original_price:
          v.original_price != null && Number.isFinite(Number(v.original_price))
            ? Number(v.original_price)
            : null,
        stock_quantity: Math.max(0, Number(v.stock_quantity ?? 0) || 0),
        is_active: v.is_active !== false,
        image_url: (v.image_url || "").trim() || null,
      }))
      .filter((v) => Number.isFinite(v.price) && v.price >= 0);

    if (!cleaned.length) {
      return { ok: false as const, error: "variants_required" };
    }

    const { data: existingRows, error: listErr } = await gate.supabase
      .from("product_variants")
      .select("id, size, color_name")
      .eq("product_id", productId);
    if (listErr) {
      console.error("[sync list]", listErr);
      return { ok: false as const, error: "server" as const };
    }
    const existing = (existingRows ?? []) as {
      id: string;
      size: string | null;
      color_name: string | null;
    }[];

    const resolved: {
      id: string;
      size: string | null;
      color_name: string | null;
      image_url: string | null;
    }[] = [];

    for (const v of cleaned) {
      const row = {
        product_id: productId,
        size: v.size,
        color_name: v.color_name,
        color_hex: v.color_hex,
        sku: v.sku,
        price: v.price,
        original_price: v.original_price,
        stock_quantity: v.stock_quantity,
        is_active: v.is_active,
      };

      // 1) با id
      let targetId = v.id;
      // 2) fallback: همان size+color
      if (!targetId) {
        const hit = existing.find(
          (e) =>
            (e.size || null) === v.size &&
            (e.color_name || null) === v.color_name,
        );
        targetId = hit?.id;
      }

      if (targetId) {
        const { error } = await gate.supabase
          .from("product_variants")
          .update(row)
          .eq("id", targetId)
          .eq("product_id", productId);
        if (error) {
          console.error("[sync update]", error);
          return {
            ok: false as const,
            error: (error as { message?: string }).message || "server",
          };
        }
        resolved.push({
          id: targetId,
          size: v.size,
          color_name: v.color_name,
          image_url: v.image_url,
        });
      } else {
        const { data: inserted, error } = await gate.supabase
          .from("product_variants")
          .insert(row)
          .select("id")
          .single();
        if (error) {
          console.error("[sync insert]", error);
          return {
            ok: false as const,
            error: (error as { message?: string }).message || "server",
          };
        }
        resolved.push({
          id: inserted.id as string,
          size: v.size,
          color_name: v.color_name,
          image_url: v.image_url,
        });
      }
    }

    // غیرفعال کردن واریانت‌هایی که در فرم نیستند (حذف فیزیکی نمی‌کنیم)
    const keep = new Set(resolved.map((r) => r.id));
    for (const e of existing) {
      if (!keep.has(e.id)) {
        const { error } = await gate.supabase
          .from("product_variants")
          .update({ is_active: false })
          .eq("id", e.id);
        if (error) console.error("[sync deactivate]", error);
      }
    }

    try {
      await linkVariantImages(
        gate.supabase,
        productId,
        resolved.map((r) => ({
          id: r.id,
          size: r.size,
          color_name: r.color_name,
          image_url: r.image_url,
        })),
      );
    } catch (e) {
      console.error("[linkVariantImages sync]", e);
    }

    return { ok: true as const };
  } catch (e) {
    console.error("[adminSyncProductVariants]", e);
    return { ok: false as const, error: "server" as const };
  }
}
