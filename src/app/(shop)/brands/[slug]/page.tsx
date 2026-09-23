import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrandService } from "@/services/brand.service";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { AttributeService } from "@/services/attribute.service";
import { ColorRepository } from "@/repositories/color.repository";
import { SizeRepository } from "@/repositories/size.repository";
import { ProductInfiniteList } from "@/components/product/product-infinite-list";
import { ProductFiltersSidebar } from "@/components/product/product-filters-sidebar";
import { ProductFiltersMobile } from "@/components/product/product-filters-mobile";
import { facetSlugsForCategory } from "@/lib/facet-map";
import { toPersianDigits } from "@/lib/numbers";

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

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brandService = new BrandService();
  const result = await brandService.getBySlug(slug);
  if (!result.success || !result.data) {
    return { title: "برند" };
  }
  return {
    title: result.data.name,
    description: result.data.description ?? `محصولات برند ${result.data.name}`,
  };
}

export default async function BrandListingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const brandService = new BrandService();
  const productService = new ProductService();
  const categoryService = new CategoryService();
  const attributeService = new AttributeService();

  const brandResult = await brandService.getBySlug(slug);
  if (!brandResult.success || !brandResult.data) notFound();
  const brand = brandResult.data;

  const categorySlug =
    typeof sp.category === "string" ? sp.category : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sort =
    typeof sp.sort === "string"
      ? (sp.sort as "newest" | "price_asc" | "price_desc" | "popular")
      : "newest";
  const featured = sp.featured === "1" ? true : undefined;
  const minPrice =
    typeof sp.minPrice === "string" && sp.minPrice
      ? Number(sp.minPrice)
      : undefined;
  const maxPrice =
    typeof sp.maxPrice === "string" && sp.maxPrice
      ? Number(sp.maxPrice)
      : undefined;
  const colorSlug =
    typeof sp.color === "string" && sp.color ? sp.color : undefined;
  const sizeSlug =
    typeof sp.size === "string" && sp.size ? sp.size : undefined;

  const attrs: Record<string, string> = {};
  for (const key of FACET_KEYS) {
    const v = sp[key];
    if (typeof v === "string" && v) attrs[key] = v;
  }

  const rootsResult = await categoryService.getRoots();
  const categories = rootsResult.success
    ? rootsResult.data.map((c) => ({ name: c.name, slug: c.slug }))
    : [];

  const facetsResult = await attributeService.getFilterableFacets();
  const allFacets = facetsResult.success ? facetsResult.data : [];
  const allowed = new Set(facetSlugsForCategory(categorySlug));
  const facets = allFacets.filter((f) => allowed.has(f.slug));

  const colorRepo = new ColorRepository();
  const sizeRepo = new SizeRepository();
  const [colors, sizes] = await Promise.all([
    colorRepo
      .findAllActive()
      .catch(() => [] as Awaited<ReturnType<ColorRepository["findAllActive"]>>),
    sizeRepo
      .findAllActive()
      .catch(() => [] as Awaited<ReturnType<SizeRepository["findAllActive"]>>),
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

  const result = await productService.getPublishedProducts({
    page: 1,
    pageSize: 12,
    brandSlug: slug,
    categorySlug,
    q,
    sort,
    featured,
    attrs: Object.keys(attrs).length ? attrs : undefined,
    minPrice: minPrice && !Number.isNaN(minPrice) ? minPrice : undefined,
    maxPrice: maxPrice && !Number.isNaN(maxPrice) ? maxPrice : undefined,
    colorId,
    sizeId,
  });

  if (!result.success || !result.data) {
    return (
      <main className="container mx-auto px-4 py-12">
        <p className="text-destructive text-center">
          {result.error ?? "خطا"}
        </p>
      </main>
    );
  }

  const { data: products, total, page, totalPages } = result.data;
  const attrsProp = Object.keys(attrs).length ? attrs : undefined;

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">{brand.name}</h1>
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
        brandSlug={slug}
        q={q}
        sort={sort}
        featured={featured}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        <Suspense
          fallback={
            <aside className="border-border bg-card hidden w-64 shrink-0 rounded-xl border p-4 lg:block" />
          }
        >
          <ProductFiltersSidebar
            colors={colors}
            sizes={sizes}
            colorSlug={colorSlug}
            sizeSlug={sizeSlug}
            facets={facets}
            current={attrs}
            categories={categories}
            categorySlug={categorySlug}
            brandSlug={slug}
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
            brandSlug={slug}
            q={q}
            sort={sort}
            featured={featured}
            attrs={attrsProp}
            minPrice={
              minPrice && !Number.isNaN(minPrice) ? minPrice : undefined
            }
            maxPrice={
              maxPrice && !Number.isNaN(maxPrice) ? maxPrice : undefined
            }
          />
        </div>
      </div>

      {brand.description ? (
        <section className="border-border mt-12 border-t pt-8">
          <h2 className="mb-3 text-lg font-semibold">درباره {brand.name}</h2>
          <div className="text-muted-foreground prose prose-sm max-w-none leading-7 whitespace-pre-line">
            {brand.description}
          </div>
        </section>
      ) : null}
    </main>
  );
}
