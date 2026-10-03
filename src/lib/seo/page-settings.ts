import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { applySeoTemplate } from "@/lib/seo/template";

export async function metadataFromSeoPage(
  page_key: "shop_plp" | "blog_plp",
  fallback: { title: string; description: string },
): Promise<Metadata> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("seo_page_settings")
      .select("meta_title, meta_description, og_title, og_description, og_image_url, robots_index, robots_follow, canonical_url, title")
      .eq("page_key", page_key)
      .maybeSingle();
    if (!data) {
      return { title: fallback.title, description: fallback.description };
    }
    const ctx = { name: data.title || fallback.title, title: data.title || fallback.title };
    const title = applySeoTemplate(data.meta_title, ctx) || data.title || fallback.title;
    const description =
      applySeoTemplate(data.meta_description, ctx) || fallback.description;
    return {
      title,
      description,
      alternates: data.canonical_url ? { canonical: data.canonical_url } : undefined,
      robots: {
        index: data.robots_index !== false,
        follow: data.robots_follow !== false,
      },
      openGraph: {
        title: data.og_title || title,
        description: data.og_description || description,
        images: data.og_image_url ? [{ url: data.og_image_url }] : undefined,
      },
    };
  } catch {
    return { title: fallback.title, description: fallback.description };
  }
}
