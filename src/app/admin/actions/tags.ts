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
      .replace(/^\-|\-$/g, "") || `tag-${Date.now()}`
  );
}

/* ── product tags ── */

export async function adminListProductTagsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("product_tags")
      .select("id, name, slug, is_active, created_at")
      .order("name");
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListProductTags]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminCreateProductTagAction(input: {
  name: string;
  slug?: string;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const name = (input.name || "").trim();
  if (!name) return { ok: false as const, error: "name_required" };
  const slug = (input.slug || "").trim() || slugify(name);
  try {
    const { data, error } = await gate.supabase
      .from("product_tags")
      .insert({ name, slug })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true as const, id: data.id };
  } catch (e) {
    console.error("[adminCreateProductTag]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminToggleProductTagAction(id: string, is_active: boolean) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase
      .from("product_tags")
      .update({ is_active })
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}

/* ── blog tags ── */

export async function adminListBlogTagsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("blog_tags")
      .select("id, name, slug, is_active, created_at")
      .order("name");
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListBlogTags]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminCreateBlogTagAction(input: {
  name: string;
  slug?: string;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const name = (input.name || "").trim();
  if (!name) return { ok: false as const, error: "name_required" };
  const slug = (input.slug || "").trim() || slugify(name);
  try {
    const { data, error } = await gate.supabase
      .from("blog_tags")
      .insert({ name, slug })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true as const, id: data.id };
  } catch (e) {
    console.error("[adminCreateBlogTag]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminToggleBlogTagAction(id: string, is_active: boolean) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase
      .from("blog_tags")
      .update({ is_active })
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}
