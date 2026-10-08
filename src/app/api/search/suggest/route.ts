import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { BrandService } from "@/services/brand.service";
import { createClient } from "@/lib/supabase/server";
import { expandTypoVariants, normalizeSearchQuery } from "@/lib/search/normalize";
import { logSearchQuery } from "@/lib/search/log";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const qRaw = (req.nextUrl.searchParams.get("q") || "").trim();
  const q = normalizeSearchQuery(qRaw);
  const variants = expandTypoVariants(q);
  if (q.length < 2) {
    return NextResponse.json({ products: [], brands: [], categories: [], posts: [] });
  }
  const ql = q.toLowerCase();
  try {
    const productService = new ProductService();
    const categoryService = new CategoryService();
    const brandService = new BrandService();

    const [productsResult, roots, brandRes] = await Promise.all([
      productService.getPublishedProducts({ page: 1, pageSize: 8, q: variants[0] || q, sort: "popular" }),
      categoryService.getRoots(),
      brandService.getActive(),
    ]);

    const products =
      productsResult.success && productsResult.data
        ? productsResult.data.data.map((p: any) => ({
            name: p.name,
            slug: p.slug,
            brand: p.brand?.name ?? null,
            category: p.category?.name ?? null,
          }))
        : [];

    const categories =
      roots.success && roots.data
        ? roots.data
            .filter((c: any) => variants.some((v) => String(c.name).toLowerCase().includes(v.toLowerCase())) || String(c.name).toLowerCase().includes(ql))
            .slice(0, 4)
            .map((c: any) => ({ name: c.name, slug: c.slug }))
        : [];

    const brands =
      brandRes.success && brandRes.data
        ? brandRes.data
            .filter((b: any) => variants.some((v) => String(b.name).toLowerCase().includes(v.toLowerCase())) || String(b.name).toLowerCase().includes(ql))
            .slice(0, 4)
            .map((b: any) => ({ name: b.name, slug: b.slug }))
        : [];

    let posts: { title: string; slug: string }[] = [];
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("blog_posts")
        .select("title, slug")
        .eq("status", "published")
        .ilike("title", "%" + q + "%")
        .limit(4);
      posts = (data ?? []).map((p: any) => ({ title: p.title, slug: p.slug }));
    } catch {}

    const total =
      products.length + brands.length + categories.length + posts.length;
    void logSearchQuery({
      query: q,
      resultCount: total,
      source: "suggest",
    });
    return NextResponse.json({ products, brands, categories, posts });
  } catch (e) {
    console.error("[suggest]", e);
    return NextResponse.json({ products: [], brands: [], categories: [], posts: [] });
  }
}
