import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir").replace(
  /\/$/,
  "",
);

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/categories",
    "/brands",
    "/blog",
    "/faq",
    "/contact",
    "/about",
    "/returns",
    "/terms",
    "/privacy",
    "/shipping",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.6,
  }));

  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    const [{ data: products }, { data: categories }, { data: brands }, { data: posts }] =
      await Promise.all([
        supabase
          .from("products")
          .select("slug, updated_at, published_at, robots_index")
          .eq("status", "published")
          .is("deleted_at", null)
          .or(`published_at.is.null,published_at.lte.${now}`)
          .limit(5000),
        supabase
          .from("categories")
          .select("slug, updated_at, created_at, robots_index")
          .eq("is_active", true)
          .limit(1000),
        supabase
          .from("brands")
          .select("slug, updated_at, created_at, robots_index")
          .eq("is_active", true)
          .limit(1000),
        supabase
          .from("blog_posts")
          .select("slug, updated_at, published_at, robots_index")
          .eq("status", "published")
          .limit(2000),
      ]);

    const productEntries: MetadataRoute.Sitemap = (products ?? []).filter((p) => (p as { robots_index?: boolean }).robots_index !== false).map((p) => ({
      url: `${siteUrl}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).filter((c) => (c as { robots_index?: boolean }).robots_index !== false).map((c) => ({
      url: `${siteUrl}/categories/${c.slug}`,
      lastModified: c.updated_at
        ? new Date(c.updated_at)
        : c.created_at
          ? new Date(c.created_at)
          : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const brandEntries: MetadataRoute.Sitemap = (brands ?? []).filter((b) => (b as { robots_index?: boolean }).robots_index !== false).map((b) => ({
      url: `${siteUrl}/brands/${b.slug}`,
      lastModified: b.updated_at
        ? new Date(b.updated_at)
        : b.created_at
          ? new Date(b.created_at)
          : undefined,
      changeFrequency: "weekly",
      priority: 0.65,
    }));

    const postEntries: MetadataRoute.Sitemap = (posts ?? []).filter((post) => (post as { robots_index?: boolean }).robots_index !== false).map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updated_at
        ? new Date(post.updated_at)
        : post.published_at
          ? new Date(post.published_at)
          : undefined,
      changeFrequency: "monthly",
      priority: 0.55,
    }));

    return [
      ...staticRoutes,
      ...productEntries,
      ...categoryEntries,
      ...brandEntries,
      ...postEntries,
    ];
  } catch (e) {
    console.error("[sitemap]", e);
    return staticRoutes;
  }
}
