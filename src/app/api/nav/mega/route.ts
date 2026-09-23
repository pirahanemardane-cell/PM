import { NextResponse } from "next/server";
import { CategoryService } from "@/services/category.service";
import { BrandService } from "@/services/brand.service";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  try {
    const categoryService = new CategoryService();
    const brandService = new BrandService();
    const [catRes, brandRes] = await Promise.all([
      categoryService.getRoots(),
      brandService.getActive(),
    ]);
    const categories =
      catRes.success && catRes.data
        ? catRes.data.map((c) => ({
            name: c.name,
            slug: c.slug,
            href: "/products?category=" + encodeURIComponent(c.slug),
          }))
        : [];
    const brands =
      brandRes.success && brandRes.data
        ? brandRes.data.map((b) => ({
            name: b.name,
            slug: b.slug,
            href: "/brands/" + b.slug,
          }))
        : [];
    return NextResponse.json({ categories, brands });
  } catch (e) {
    console.error("[nav/mega]", e);
    return NextResponse.json({ categories: [], brands: [] });
  }
}
