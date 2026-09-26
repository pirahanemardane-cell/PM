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
    // Block only if there is at least one non-deleted product
    // Try deleted_at first; if column missing, fall back to counting all then detach soft ones.
    let liveCount = 0;
    {
      const q = await gate.supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .in("category_id", list)
        .is("deleted_at", null);
      if (!q.error) {
        liveCount = q.count ?? 0;
      } else {
        // no deleted_at — count all products linked
        const q2 = await gate.supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .in("category_id", list);
        if (q2.error) {
          console.error("[adminHardDeleteCategories] products check", q2.error);
          return { ok: false as const, error: "server" as const, detail: q2.error.message };
        }
        liveCount = q2.count ?? 0;
      }
    }

    if (liveCount > 0) {
      // If schema has deleted_at we already excluded soft-deleted.
      // If not, user may have "deleted" via archive only — try detach archived/unpublished.
      const soft = await gate.supabase
        .from("products")
        .update({ category_id: null as unknown as string })
        .in("category_id", list)
        .or("deleted_at.not.is.null,is_published.eq.false,status.eq.archived");
      // ignore soft update errors (columns may not exist)

      // recount strict live
      const again = await gate.supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .in("category_id", list)
        .is("deleted_at", null);
      const again2 = await gate.supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .in("category_id", list);

      const remaining = !again.error ? (again.count ?? 0) : (again2.count ?? 0);
      if (remaining > 0) {
        return { ok: false as const, error: "has_products" as const };
      }
    }

    // Always detach any leftover soft rows before hard delete (clears FK)
    await gate.supabase
      .from("products")
      .update({ category_id: null as unknown as string })
      .in("category_id", list);

    const { count: childCount, error: childErr } = await gate.supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .in("parent_id", list);
    if (!childErr && (childCount ?? 0) > 0) {
      return { ok: false as const, error: "has_children" as const };
    }

    const { error } = await gate.supabase.from("categories").delete().in("id", list);
    if (error) {
      console.error("[adminHardDeleteCategories] delete", error);
      if (String(error.code) === "23503" || /foreign key/i.test(error.message)) {
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
    let liveCount = 0;
    {
      const q = await gate.supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .in("brand_id", list)
        .is("deleted_at", null);
      if (!q.error) {
        liveCount = q.count ?? 0;
      } else {
        const q2 = await gate.supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .in("brand_id", list);
        if (q2.error) {
          return { ok: false as const, error: "server" as const, detail: q2.error.message };
        }
        liveCount = q2.count ?? 0;
      }
    }
    if (liveCount > 0) {
      await gate.supabase
        .from("products")
        .update({ brand_id: null as unknown as string })
        .in("brand_id", list)
        .or("deleted_at.not.is.null,is_published.eq.false,status.eq.archived");
      const again = await gate.supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .in("brand_id", list)
        .is("deleted_at", null);
      const again2 = await gate.supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .in("brand_id", list);
      const remaining = !again.error ? (again.count ?? 0) : (again2.count ?? 0);
      if (remaining > 0) {
        return { ok: false as const, error: "has_products" as const };
      }
    }
    await gate.supabase
      .from("products")
      .update({ brand_id: null as unknown as string })
      .in("brand_id", list);

    const { error } = await gate.supabase.from("brands").delete().in("id", list);
    if (error) {
      if (String(error.code) === "23503" || /foreign key/i.test(error.message)) {
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
