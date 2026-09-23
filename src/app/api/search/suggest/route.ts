import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { BrandService } from "@/services/brand.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [], brands: [], categories: [] });
  }
  try {
    const productService = new ProductService();
    const categoryService = new CategoryService();
    const brandService = new BrandService();

    const productsResult = await productService.getPublishedProducts({
      page: 1,
      pageSize: 8,
      q,
      sort: "popular",
    });

    const products =
      productsResult.success && productsResult.data
        ? productsResult.data.data.map((p: any) => ({
            name: p.name,
            slug: p.slug,
            brand: p.brand?.name ?? null,
            category: p.category?.name ?? null,
          }))
        : [];

    let categories: { name: string; slug: string }[] = [];
    try {
      const roots = await categoryService.getRoots();
      if (roots.success && roots.data) {
        const ql = q.toLowerCase();
        categories = roots.data
          .filter((c: any) => String(c.name).toLowerCase().includes(ql))
          .slice(0, 4)
          .map((c: any) => ({ name: c.name, slug: c.slug }));
      }
    } catch {}

    let brands: { name: string; slug: string }[] = [];
    try {
      const all = await (brandService as any).getAll?.()
        ?? (brandService as any).list?.()
        ?? null;
      const list = all?.success ? all.data : Array.isArray(all) ? all : [];
      if (Array.isArray(list)) {
        const ql = q.toLowerCase();
        brands = list
          .filter((b: any) => String(b.name).toLowerCase().includes(ql))
          .slice(0, 4)
          .map((b: any) => ({ name: b.name, slug: b.slug }));
      }
    } catch {}

    return NextResponse.json({ products, brands, categories });
  } catch (e) {
    console.error("[suggest]", e);
    return NextResponse.json({ products: [], brands: [], categories: [] });
  }
}
