"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

function cleanIds(ids: string[]): string[] {
  return Array.from(new Set((ids || []).map((x) => String(x || "").trim()).filter(Boolean)));
}

/* ───────── Products ───────── */

/** Archive = soft delete (deleted_at + status archived) */
export async function adminArchiveProductsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString(), status: "archived" })
      .in("id", list)
      .is("deleted_at", null);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveProducts]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/** Permanent delete — blocked if order_items reference the product */
export async function adminHardDeleteProductsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { count, error: cErr } = await gate.supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .in("product_id", list);
    if (cErr) throw cErr;
    if ((count ?? 0) > 0) {
      return { ok: false as const, error: "has_orders" as const };
    }

    // children (best-effort; ignore missing tables)
    for (const table of [
      "product_tag_map",
      "product_attribute_values",
      "product_images",
      "stock_alerts",
      "wishlists",
      "cart_items",
      "product_variants",
    ]) {
      await gate.supabase.from(table).delete().in("product_id", list);
    }
    const { error } = await gate.supabase.from("products").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteProducts]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Categories ───────── */

export async function adminArchiveCategoriesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("categories")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveCategories]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteCategoriesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { data: linked, error: linkErr } = await gate.supabase
      .from("products")
      .select("id, deleted_at, status")
      .in("category_id", list);
    if (linkErr) {
      console.error("[adminHardDeleteCategories] link", linkErr);
      return { ok: false as const, error: "server" as const, detail: linkErr.message };
    }
    const rows = linked ?? [];
    const live = rows.filter((r: { deleted_at?: string | null; status?: string | null }) => {
      if (r.deleted_at) return false;
      if (r.status && ["archived", "deleted", "trash"].includes(String(r.status))) return false;
      return true;
    });
    if (live.length > 0) {
      return { ok: false as const, error: "has_products" as const, detail: `live=${live.length}` };
    }

    // محصولات آرشیو را کامل حذف کن (FK + NOT NULL)
    const softIds = rows.map((r: { id: string }) => r.id);
    if (softIds.length > 0) {
      await gate.supabase.from("order_items").delete().in(
        "variant_id",
        (
          await gate.supabase
            .from("product_variants")
            .select("id")
            .in("product_id", softIds)
        ).data?.map((v: { id: string }) => v.id) ?? []
      );
      await gate.supabase.from("cart_items").delete().in(
        "variant_id",
        (
          await gate.supabase
            .from("product_variants")
            .select("id")
            .in("product_id", softIds)
        ).data?.map((v: { id: string }) => v.id) ?? []
      );
      await gate.supabase.from("wishlists").delete().in("product_id", softIds);
      await gate.supabase.from("stock_alerts").delete().in("product_id", softIds);
      await gate.supabase.from("reviews").delete().in("product_id", softIds);
      await gate.supabase.from("product_images").delete().in("product_id", softIds);
      await gate.supabase.from("product_attribute_values").delete().in("product_id", softIds);
      await gate.supabase.from("product_variants").delete().in("product_id", softIds);
      await gate.supabase.from("products").delete().in("id", softIds);
    }

    const { count: childCount } = await gate.supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .in("parent_id", list);
    if ((childCount ?? 0) > 0) {
      return { ok: false as const, error: "has_children" as const };
    }

    const { error } = await gate.supabase.from("categories").delete().in("id", list);
    if (error) {
      console.error("[adminHardDeleteCategories] delete", error);
      if (String(error.code) === "23503" || /foreign key/i.test(error.message ?? "")) {
        return { ok: false as const, error: "has_products" as const, detail: error.message };
      }
      return { ok: false as const, error: "server" as const, detail: error.message };
    }
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteCategories]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Brands ───────── */

export async function adminArchiveBrandsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("brands")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveBrands]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteBrandsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { data: linked, error: linkErr } = await gate.supabase
      .from("products")
      .select("id, deleted_at, status")
      .in("brand_id", list);
    if (linkErr) {
      return { ok: false as const, error: "server" as const, detail: linkErr.message };
    }
    const rows = linked ?? [];
    const isLive = (r: { deleted_at?: string | null; status?: string | null }) => {
      if (r.deleted_at) return false;
      if (r.status && ["archived", "deleted", "trash"].includes(String(r.status))) return false;
      return true;
    };
    const live = rows.filter(isLive);
    if (live.length > 0) {
      return { ok: false as const, error: "has_products" as const, detail: `live=${live.length}` };
    }
    if (rows.length > 0) {
      const { error: upErr } = await gate.supabase
        .from("products")
        .update({ brand_id: null })
        .in("brand_id", list);
      if (upErr) {
        return { ok: false as const, error: "server" as const, detail: upErr.message };
      }
    }
    const { error } = await gate.supabase.from("brands").delete().in("id", list);
    if (error) {
      if (String(error.code) === "23503" || /foreign key/i.test(error.message ?? "")) {
        return { ok: false as const, error: "has_products" as const, detail: error.message };
      }
      return { ok: false as const, error: "server" as const, detail: error.message };
    }
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteBrands]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Product tags ───────── */

export async function adminArchiveProductTagsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("product_tags")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveProductTags]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteProductTagsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    await gate.supabase.from("product_tag_map").delete().in("tag_id", list);
    const { error } = await gate.supabase.from("product_tags").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteProductTags]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Blog posts ───────── */

export async function adminArchiveBlogPostsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("blog_posts")
      .update({ status: "archived" })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveBlogPosts]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteBlogPostsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    await gate.supabase.from("blog_tag_map").delete().in("post_id", list);
    const { error } = await gate.supabase.from("blog_posts").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteBlogPosts]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Blog categories ───────── */

export async function adminArchiveBlogCategoriesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("blog_categories")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveBlogCategories]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteBlogCategoriesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    await gate.supabase.from("blog_posts").update({ category_id: null }).in("category_id", list);
    const { error } = await gate.supabase.from("blog_categories").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteBlogCategories]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Blog tags ───────── */

export async function adminArchiveBlogTagsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("blog_tags")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveBlogTags]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteBlogTagsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    await gate.supabase.from("blog_tag_map").delete().in("tag_id", list);
    const { error } = await gate.supabase.from("blog_tags").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteBlogTags]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Product attributes ───────── */

export async function adminArchiveAttributesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("attributes")
      .update({ is_filterable: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveAttributes]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteAttributesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    await gate.supabase.from("product_attribute_values").delete().in("attribute_id", list);
    await gate.supabase.from("attribute_options").delete().in("attribute_id", list);
    const { error } = await gate.supabase.from("attributes").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteAttributes]", e);
    return { ok: false as const, error: "server" as const };
  }
}
