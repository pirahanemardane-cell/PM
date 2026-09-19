import type { Metadata } from "next";
import { ProductService } from "@/services/product.service";
import { ProductInfiniteList } from "@/components/product/product-infinite-list";
import { CategoryService } from "@/services/category.service";
import { AttributeService } from "@/services/attribute.service";
import { ColorRepository } from "@/repositories/color.repository";
import { SizeRepository } from "@/repositories/size.repository";
import { ProductFiltersSidebar } from "@/components/product/product-filters-sidebar";
import { ProductFiltersMobile } from "@/components/product/product-filters-mobile";
import { facetSlugsForCategory } from "@/lib/facet-map";
import { toPersianDigits } from "@/lib/numbers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "محصولات",
  description: "لیست محصولات فروشگاه تخصصی پیراهن مردانه",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const service = new ProductService();
  const categoryService = new CategoryService();
  const rootsResult = await categoryService.getRoots();
  const categories = rootsResult.success
    ? rootsResult.data.map((c) => ({ name: c.name, slug: c.slug }))
    : [];

  const categorySlug =
    typeof params.category === "string" ? params.category : undefined;
  const brandSlug =
    typeof params.brand === "string" ? params.brand : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const sort =
    typeof params.sort === "string"
      ? (params.sort as "newest" | "price_asc" | "price_desc" | "popular")
      : "newest";
  const featured = params.featured === "1" ? true : undefined;
  const minPrice =
    typeof params.minPrice === "string" && params.minPrice
      ? Number(params.minPrice)
      : undefined;
  const maxPrice =
    typeof params.maxPrice === "string" && params.maxPrice
      ? Number(params.maxPrice)
      : undefined;

  const colorSlug =
    typeof params.color === "string" && params.color ? params.color : undefined;
  const sizeSlug =
    typeof params.size === "string" && params.size ? params.size : undefined;

  const FACET_KEYS = [
    "fabric",
    "pattern",
    "season",
    "collar-type",
    "sleeve-type",
    "button-type",
    "fit",
    "tie-width",
    "tie-length",
    "bow-tie-type",
    "cufflink-material",
  ] as const;

  const attrs: Record<string, string> = {};
  for (const key of FACET_KEYS) {
    const v = params[key];
    if (typeof v === "string" && v) attrs[key] = v;
  }

  const attributeService = new AttributeService();
  const facetsResult = await attributeService.getFilterableFacets();
  const allFacets = facetsResult.success ? facetsResult.data : [];
  const allowed = new Set(facetSlugsForCategory(categorySlug));
  const facets = allFacets.filter((f) => allowed.has(f.slug));

  
  const colorRepo = new ColorRepository();
  const sizeRepo = new SizeRepository();
  const [colors, sizes] = await Promise.all([
    colorRepo.findAllActive().catch(() => [] as Awaited<ReturnType<ColorRepository["findAllActive"]>>),
    sizeRepo.findAllActive().catch(() => [] as Awaited<ReturnType<SizeRepository["findAllActive"]>>),
  ]);
  let colorId: string | undefined;
  let sizeId: string | undefined;
  if (colorSlug) {
    const c = await colorRepo.findBySlug(colorSlug).catch(() => null);
    colorId = c?.id;
  }
  if (sizeSlug) {
    const s = await sizeRepo.findBySlug(sizeSlug).catch(() => null);
    sizeId = s?.id;
  }

  const result = await service.getPublishedProducts({
    page: 1,
    pageSize: 12,
    categorySlug,
    brandSlug,
    q,
    sort,
    featured,
    attrs: Object.keys(attrs).length ? attrs : undefined,
    minPrice: minPrice && !Number.isNaN(minPrice) ? minPrice : undefined,
    colorId,
    sizeId,
    maxPrice: maxPrice && !Number.isNaN(maxPrice) ? maxPrice : undefined,
  });

  if (!result.success) {
    return (
      <main className="container mx-auto px-4 py-12">
        <p className="text-destructive text-center">{result.error}</p>
      </main>
    );
  }

  const { data: products, total, page, totalPages } = result.data;

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-iranyekan-heavy">محصولات</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {toPersianDigits(String(total))} محصول
        </p>
      </div>
<ProductFiltersMobile
          colors={colors}
          sizes={sizes}
          colorSlug={colorSlug}
          sizeSlug={sizeSlug}
        facets={facets}
        current={attrs}
        categories={categories}
        categorySlug={categorySlug}
        brandSlug={brandSlug}
        q={q}
        sort={sort}
        featured={featured}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        <Suspense fallback={<aside className="border-border bg-card hidden w-64 shrink-0 rounded-xl border p-4 lg:block" />}>
        <ProductFiltersSidebar
          colors={colors}
          sizes={sizes}
          colorSlug={colorSlug}
          sizeSlug={sizeSlug}
          facets={facets}
          current={attrs}
          categories={categories}
          categorySlug={categorySlug}
          brandSlug={brandSlug}
          q={q}
          sort={sort}
          featured={featured}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
        </Suspense>
        <div className="min-w-0 flex-1">
          <ProductInfiniteList
            colorId={colorId}
            sizeId={sizeId}
            initialProducts={products}
            initialPage={page}
            initialHasMore={page < totalPages}
            categorySlug={categorySlug}
            brandSlug={brandSlug}
            q={q}
            sort={sort}
            featured={featured}
            attrs={Object.keys(attrs).length ? attrs : undefined}
            minPrice={minPrice && !Number.isNaN(minPrice) ? minPrice : undefined}
            maxPrice={maxPrice && !Number.isNaN(maxPrice) ? maxPrice : undefined}
          />
        </div>
      </div>
    </main>
  );
}
