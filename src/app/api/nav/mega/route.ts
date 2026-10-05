import { NextResponse } from "next/server";
import { CategoryRepository } from "@/repositories/category.repository";
import { BrandService } from "@/services/brand.service";

export const dynamic = "force-dynamic";
export const revalidate = 30;

type NavCat = {
  name: string;
  slug: string;
  href: string;
  children: { name: string; slug: string; href: string }[];
};

export async function GET() {
  try {
    const repo = new CategoryRepository();
    const brandService = new BrandService();

    const [allCats, brandRes] = await Promise.all([
      repo.findAllActive(),
      brandService.getActive(),
    ]);

    const sorted = [...(allCats ?? [])].sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        String(a.name).localeCompare(String(b.name), "fa"),
    );

    const roots = sorted.filter((c) => !c.parent_id);
    const categories: NavCat[] = roots.map((r) => ({
      name: r.name,
      slug: r.slug,
      href: "/" + encodeURIComponent(r.slug),
      children: sorted
        .filter((c) => c.parent_id === r.id)
        .map((c) => ({
          name: c.name,
          slug: c.slug,
          href: "/" + encodeURIComponent(c.slug),
        })),
    }));

    const brands =
      brandRes.success && brandRes.data
        ? brandRes.data.map((b) => ({
            name: b.name,
            slug: b.slug,
            href: "/brands/" + encodeURIComponent(b.slug),
          }))
        : [];

    return NextResponse.json(
      { categories, brands },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (e) {
    console.error("[nav/mega]", e);
    return NextResponse.json(
      { categories: [], brands: [] },
      { headers: { "Cache-Control": "public, s-maxage=15" } },
    );
  }
}
