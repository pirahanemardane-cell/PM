"use server";

import { createClient } from "@/lib/supabase/server";

export async function listPublishedPostsAction(limit = 20) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, cover_url, published_at, category:blog_categories(name, slug)",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[listPublishedPosts]", e);
    return { ok: false as const, items: [] };
  }
}

export async function getPublishedPostBySlugAction(slug: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, body, cover_url, published_at, category:blog_categories(name, slug)",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false as const, post: null, error: "not_found" };
    return { ok: true as const, post: data };
  } catch (e) {
    console.error("[getPublishedPost]", e);
    return { ok: false as const, post: null, error: "server" };
  }
}
