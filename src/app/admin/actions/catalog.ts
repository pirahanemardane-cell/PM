"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ─── Categories ─── */

export async function adminListCategoriesAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("categories")
      .select(
        "id, name, slug, parent_id, sort_order, is_active, created_at",
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListCategories]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminCreateCategoryAction(input: {
  name: string;
  slug?: string;
  sort_order?: number;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const name = (input.name || "").trim();
  if (name.length < 2) return { ok: false as const, error: "bad_name" };
  const slug = (input.slug || slugify(name)).trim();
  if (!slug) return { ok: false as const, error: "bad_slug" };

  try {
    const { data, error } = await gate.supabase
      .from("categories")
      .insert({
        name,
        slug,
        sort_order: input.sort_order ?? 0,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true as const, id: data.id as string };
  } catch (e) {
    console.error("[adminCreateCategory]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminUpdateCategoryAction(
  id: string,
  patch: { name?: string; slug?: string; is_active?: boolean; sort_order?: number },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name.trim();
    if (patch.slug !== undefined) body.slug = patch.slug.trim();
    if (patch.is_active !== undefined) body.is_active = patch.is_active;
    if (patch.sort_order !== undefined) body.sort_order = patch.sort_order;
    if (!Object.keys(body).length) return { ok: true as const };

    const { error } = await gate.supabase
      .from("categories")
      .update(body)
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[adminUpdateCategory]", e);
    return { ok: false as const, error: "server" };
  }
}

/* ─── Brands ─── */

export async function adminListBrandsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("brands")
      .select("id, name, slug, is_active, created_at")
      .order("name", { ascending: true });
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListBrands]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminCreateBrandAction(input: {
  name: string;
  slug?: string;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const name = (input.name || "").trim();
  if (name.length < 2) return { ok: false as const, error: "bad_name" };
  const slug = (input.slug || slugify(name)).trim();
  if (!slug) return { ok: false as const, error: "bad_slug" };

  try {
    const { data, error } = await gate.supabase
      .from("brands")
      .insert({ name, slug, is_active: true })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true as const, id: data.id as string };
  } catch (e) {
    console.error("[adminCreateBrand]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminUpdateBrandAction(
  id: string,
  patch: { name?: string; slug?: string; is_active?: boolean },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name.trim();
    if (patch.slug !== undefined) body.slug = patch.slug.trim();
    if (patch.is_active !== undefined) body.is_active = patch.is_active;
    if (!Object.keys(body).length) return { ok: true as const };

    const { error } = await gate.supabase
      .from("brands")
      .update(body)
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[adminUpdateBrand]", e);
    return { ok: false as const, error: "server" };
  }
}
