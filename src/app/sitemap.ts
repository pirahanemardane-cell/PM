import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { isSiteIndexable, SITE_URL } from "@/lib/seo/indexing";
import { isBlockedBrand } from "@/lib/brands/blocked";
import {
  FA_STATIC_SITEMAP_PATHS,
  blogPostHref,
  brandOrCategoryHref,
  productHref,
} from "@/lib/seo/fa-routes";

/**
 * تولید sitemap آماده است.
 * تا noindex: خروجی خالی (ایندکس نمی‌شود).
 * بعد از ALLOW_INDEX=true: صفحات استاتیک + محصولات + دسته‌ها + برندها + بلاگ.
 * مسیرهای صفحهٔ استاتیک و پیشوند لیست‌ها فارسی‌canonical هستند؛ اسلاگ موجودیت‌ها انگلیسی می‌مانند.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteIndexable()) {
    return [];
  }

  const now = new Date();

  const entries: MetadataRoute.Sitemap = FA_STATIC_SITEMAP_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/محصولات" ? 0.9 : 0.6,
  }));

  try {
    const supabase = createServiceClient();

    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "published")
      .is("deleted_at", null)
      .not("slug", "is", null)
      .limit(5000);

    for (const p of products ?? []) {
      const slug = (p as { slug?: string }).slug;
      if (!slug) continue;
      entries.push({
        url: `${SITE_URL}${productHref(slug)}`,
        lastModified: (p as { updated_at?: string }).updated_at
          ? new Date(String((p as { updated_at: string }).updated_at))
          : now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true)
      .limit(500);

    for (const c of categories ?? []) {
      const slug = (c as { slug?: string }).slug;
      if (!slug) continue;
      entries.push({
        url: `${SITE_URL}${brandOrCategoryHref(slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    const { data: brands } = await supabase
      .from("brands")
      .select("slug, name, updated_at")
      .eq("is_active", true)
      .limit(500);

    for (const b of brands ?? []) {
      const slug = (b as { slug?: string }).slug;
      const name = (b as { name?: string }).name;
      if (!slug || isBlockedBrand({ slug, name })) continue;
      entries.push({
        url: `${SITE_URL}${brandOrCategoryHref(slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    try {
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("slug, updated_at, published_at")
        .eq("status", "published")
        .limit(1000);
      for (const post of posts ?? []) {
        const slug = (post as { slug?: string }).slug;
        if (!slug) continue;
        entries.push({
          url: `${SITE_URL}${blogPostHref(slug)}`,
          lastModified: (post as { updated_at?: string }).updated_at
            ? new Date(String((post as { updated_at: string }).updated_at))
            : now,
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    } catch {
      // جدول بلاگ ممکن است نباشد
    }
  } catch (e) {
    console.error("[sitemap]", e);
  }

  return entries;
}
