import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { BrandService } from "@/services/brand.service";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [], brands: [], categories: [], posts: [] });
  }
  const ql = q.toLowerCase();
  try {
    const productService = new ProductService();
    const categoryService = new CategoryService();
    const brandService = new BrandService();

    const [productsResult, roots, brandRes] = await Promise.all([
      productService.getPublishedProducts({ page: 1, pageSize: 8, q, sort: "popular" }),
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
            .filter((c: any) => String(c.name).toLowerCase().includes(ql))
            .slice(0, 4)
            .map((c: any) => ({ name: c.name, slug: c.slug }))
        : [];

    const brands =
      brandRes.success && brandRes.data
        ? brandRes.data
            .filter((b: any) => String(b.name).toLowerCase().includes(ql))
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

    return NextResponse.json({ products, brands, categories, posts });
  } catch (e) {
    console.error("[suggest]", e);
    return NextResponse.json({ products: [], brands: [], categories: [], posts: [] });
  }
}
