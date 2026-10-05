import { CatalogRealtimeRefresh } from "@/components/shop/catalog-realtime-refresh";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryService } from "@/services/category.service";
import { ProductService } from "@/services/product.service";
import { AttributeService } from "@/services/attribute.service";
import { ColorRepository } from "@/repositories/color.repository";
import { SizeRepository } from "@/repositories/size.repository";
import { ProductInfiniteList } from "@/components/product/product-infinite-list";
import { ProductFiltersSidebar } from "@/components/product/product-filters-sidebar";
import { ProductFiltersMobile } from "@/components/product/product-filters-mobile";
import { facetSlugsForCategory } from "@/lib/facet-map";
import { toPersianDigits } from "@/lib/numbers";
import { JsonLd } from "@/components/seo/json-ld";
import { collectionPageSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { applySeoTemplate } from "@/lib/seo/template";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function decodeSlug(raw: string): string {
  let s = raw;
  for (let i = 0; i < 3; i++) {
    try {
      const d = decodeURIComponent(s);
      if (d === s) break;
      s = d;
    } catch {
      break;
    }
  }
  return s;
}

const FACET_KEYS = [
  "fabric",
  "pattern",
  "season",
  "collar",
  "collar-type",
  "sleeve",
  "sleeve-type",
  "button-type",
  "fit",
  "thickness",
  "closure",
  "pocket",
  "occasion",
  "origin",
  "tie-width",
  "tie-length",
  "bow-tie-type",
  "cufflink-material",
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);
  const categoryService = new CategoryService();
  const result = await categoryService.getBySlug(slug);
  if (!result.success || !result.data) {
    return { title: "دسته‌بندی" };
  }
  const d = result.data as {
    name: string;
    description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    robots_index?: boolean | null;
  };
  const title = applySeoTemplate(d.meta_title, { name: d.name }) || d.name;
  const description =
    applySeoTemplate(d.meta_description, {
      name: d.name,
      description: d.description || undefined,
    }) ||
    d.description ||
    `محصولات دسته ${d.name}`;
  return {
    title,
    description,
    robots: d.robots_index === false ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryListingPage({
  params,
  searchParams,
}: Props) {
  const slug = decodeSlug((await params).slug);
  const sp = await searchParams;

  const categoryService = new CategoryService();
  const productService = new ProductService();

  const catResult = await categoryService.getBySlug(slug);
  if (!catResult.success || !catResult.data) notFound();

  const category = catResult.data;

  const rootsResult = await categoryService.getRoots();
  const categories = rootsResult.success
    ? rootsResult.data.map((c) => ({ name: c.name, slug: c.slug }))
    : [];

  const brandSlug = typeof sp.brand === "string" ? sp.brand : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sort =
    typeof sp.sort === "string"
      ? (sp.sort as "newest" | "price_asc" | "price_desc" | "popular")
      : "newest";
  const featured = sp.featured === "1" ? true : undefined;
  const minPrice =
    typeof sp.minPrice === "string" && sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice =
    typeof sp.maxPrice === "string" && sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const colorSlug =
    typeof sp.color === "string" && sp.color ? sp.color : undefined;
  const sizeSlug = typeof sp.size === "string" && sp.size ? sp.size : undefined;

  const attrs: Record<string, string> = {};
  for (const key of FACET_KEYS) {
    const v = sp[key];
    if (typeof v === "string" && v) attrs[key] = v;
  }

  const attributeService = new AttributeService();
  const facetsResult = await attributeService.getFilterableFacets();
  const allFacets = facetsResult.success ? facetsResult.data : [];
  const allowed = new Set(facetSlugsForCategory(slug));
  const facets = allFacets.filter((f) => allowed.has(f.slug));

  const colorAttr = allFacets.find((f) => f.slug === "color");
  const sizeAttr = allFacets.find((f) => f.slug === "size");
  type Chip = { id: string; name: string; slug: string; hex?: string | null };
  let colors: Chip[] = (colorAttr?.options ?? []).map((o) => ({
    id: o.id,
    name: o.value,
    slug: o.slug || o.value,
    hex: (o as { hex?: string | null }).hex ?? null,
  }));
  let sizes: Chip[] = (sizeAttr?.options ?? []).map((o) => ({
    id: o.id,
    name: o.value,
    slug: o.slug || o.value,
  }));
  const colorRepo = new ColorRepository();
  const sizeRepo = new SizeRepository();
  if (!colors.length || !sizes.length) {
    const [legacyColors, legacySizes] = await Promise.all([
      colorRepo.findAllActive().catch(() => [] as Awaited<ReturnType<ColorRepository["findAllActive"]>>),
      sizeRepo.findAllActive().catch(() => [] as Awaited<ReturnType<SizeRepository["findAllActive"]>>),
    ]);
    if (!colors.length) {
      colors = legacyColors.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        hex:
          (c as { hex_code?: string | null }).hex_code ??
          (c as { hex?: string | null }).hex ??
          null,
      }));
    }
    if (!sizes.length) {
      sizes = legacySizes.map((s) => ({ id: s.id, name: s.name, slug: s.slug }));
    }
  }
  const colorOpt = colorSlug
    ? colors.find((c) => c.slug === colorSlug || c.name === colorSlug)
    : undefined;
  const sizeOpt = sizeSlug
    ? sizes.find((s) => s.slug === sizeSlug || s.name === sizeSlug)
    : undefined;
  const colorValue = colorOpt?.name;
  const sizeValue = sizeOpt?.name;
  let colorId: string | undefined;
  let sizeId: string | undefined;
  if (colorSlug && !colorAttr) {
    const c = await colorRepo.findBySlug(colorSlug).catch(() => null);
    colorId = c?.id;
  }
  if (sizeSlug && !sizeAttr) {
    const s = await sizeRepo.findBySlug(sizeSlug).catch(() => null);
    sizeId = s?.id;
  }

  const result = await productService.getPublishedProducts({
    page: 1,
    pageSize: 12,
    categorySlug: slug,
    brandSlug,
    q,
    sort,
    featured,
    attrs: Object.keys(attrs).length ? attrs : undefined,
    minPrice: minPrice && !Number.isNaN(minPrice) ? minPrice : undefined,
    maxPrice: maxPrice && !Number.isNaN(maxPrice) ? maxPrice : undefined,
    colorId,
    sizeId,
    sizeValue,
    colorValue,
  });

  if (!result.success || !result.data) {
    return (
      <>
        <CatalogRealtimeRefresh />
        <main className="w-full max-w-none mx-auto px-4 py-12">
          <p className="text-destructive text-center">{result.error ?? "خطا"}</p>
        </main>
      </>
    );
  }

  const { data: products, total, page, totalPages } = result.data;
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir").replace(
    /\/$/,
    "",
  );

  return (
    <main className="w-full max-w-none mx-auto px-4 py-8 md:py-12">
      <JsonLd
        data={[
          collectionPageSchema({
            name: category.name,
            description: category.description,
            url: `/${encodeURIComponent(slug)}`,
          }),
          breadcrumbSchema([
            { name: "خانه", url: siteBase + "/" },
            { name: "فروشگاه", url: siteBase + "/products" },
            {
              name: category.name,
              url: siteBase + "/" + encodeURIComponent(slug),
            },
          ]),
        ]}
      />
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl text-primary">{category.name}</h1>
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
        categorySlug={slug}
        brandSlug={brandSlug}
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
            categorySlug={slug}
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
            categorySlug={slug}
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

      {category.description ? (
        <section className="border-border mt-12 border-t pt-8">
          <h2 className="mb-3 text-lg font-semibold text-primary">درباره {category.name}</h2>
          <div className="text-muted-foreground prose prose-sm max-w-none leading-7 whitespace-pre-line">
            {category.description}
          </div>
        </section>
      ) : null}
    </main>
  );
}
