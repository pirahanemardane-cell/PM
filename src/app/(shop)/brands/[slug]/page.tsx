import { CatalogRealtimeRefresh } from "@/components/shop/catalog-realtime-refresh";
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
import { JsonLd } from "@/components/seo/json-ld";
import { brandPageSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { applySeoTemplate } from "@/lib/seo/template";

export const revalidate = 60;

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
  const d = result.data as {
    name: string;
    description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    robots_index?: boolean | null;
  };
  const title = applySeoTemplate(d.meta_title, { name: d.name }) || d.name;
  const description =
    applySeoTemplate(d.meta_description, { name: d.name, description: d.description || undefined }) ||
    d.description ||
    `محصولات برند ${d.name}`;
  return {
    title,
    description,
    robots: d.robots_index === false ? { index: false, follow: true } : undefined,
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
        hex: (c as { hex_code?: string | null }).hex_code ?? null,
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
    brandSlug: slug,
    categorySlug,
    q,
    sort,
    featured,
    attrs: Object.keys(attrs).length ? attrs : undefined,
    sizeValue,
    colorValue,
    minPrice: minPrice && !Number.isNaN(minPrice) ? minPrice : undefined,
    maxPrice: maxPrice && !Number.isNaN(maxPrice) ? maxPrice : undefined,
    colorId,
    sizeId,
  });

  if (!result.success || !result.data) {
    return (
    <>
      <JsonLd
        data={[
          brandPageSchema({
            name: brand.name,
            description: (brand as { description?: string | null }).description,
            slug,
            logo: (brand as { logo_url?: string | null }).logo_url ?? null,
          }),
          breadcrumbSchema([
            { name: "خانه", url: ((process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir").replace(/\/$/, "")) + "/" },
            { name: "برندها", url: ((process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir").replace(/\/$/, "")) + "/brands" },
            { name: brand.name, url: ((process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir").replace(/\/$/, "")) + "/brands/" + slug },
          ]),
        ]}
      />

      <CatalogRealtimeRefresh />

      <main className="w-full max-w-none mx-auto px-4 py-12">
        <p className="text-destructive text-center">
          {result.error ?? "خطا"}
        </p>
      </main>
    </>
    );
  }

  const { data: products, total, page, totalPages } = result.data;
  const attrsProp = Object.keys(attrs).length ? attrs : undefined;

  return (
    <main className="w-full max-w-none mx-auto px-4 py-8 md:py-12">
      <JsonLd
        data={[
          brandPageSchema({
            name: brand.name,
            description: (brand as { description?: string | null }).description,
            slug,
            logo: (brand as { logo_url?: string | null }).logo_url ?? null,
          }),
          breadcrumbSchema([
            { name: "خانه", url: "/" },
            { name: "برندها", url: "/brands" },
            { name: brand.name, url: "/brands/" + slug },
          ]),
        ]}
      />
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-iranyekan-heavy text-primary">{brand.name}</h1>
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
          <h2 className="mb-3 text-lg font-semibold text-primary">درباره {brand.name}</h2>
          <div className="text-muted-foreground prose prose-sm max-w-none leading-7 whitespace-pre-line">
            {brand.description}
          </div>
        </section>
      ) : null}
    </main>
  );
}
