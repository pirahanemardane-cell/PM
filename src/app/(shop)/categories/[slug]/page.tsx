import { CatalogRealtimeRefresh } from "@/components/shop/catalog-realtime-refresh";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryService } from "@/services/category.service";
import { ProductService } from "@/services/product.service";
import { ProductInfiniteList } from "@/components/product/product-infinite-list";
import { toPersianDigits } from "@/lib/numbers";
import { JsonLd } from "@/components/seo/json-ld";
import { collectionPageSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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
  return {
    title: d.meta_title || d.name,
    description: d.meta_description || d.description || `محصولات دسته ${d.name}`,
    robots: d.robots_index === false ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryListingPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const categoryService = new CategoryService();
  const productService = new ProductService();

  const catResult = await categoryService.getBySlug(slug);
  if (!catResult.success || !catResult.data) notFound();

  const category = catResult.data;
  const sort =
    typeof sp.sort === "string"
      ? (sp.sort as "newest" | "price_asc" | "price_desc" | "popular")
      : "newest";

  const result = await productService.getPublishedProducts({
    page: 1,
    pageSize: 12,
    categorySlug: slug,
    sort,
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

  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir").replace(/\/$/, "");
  return (
    <main className="w-full max-w-none mx-auto px-4 py-8 md:py-12">
      <JsonLd
        data={[
          collectionPageSchema({
            name: category.name,
            description: category.description,
            url: `/categories/${slug}`,
          }),
          breadcrumbSchema([
            { name: "خانه", url: siteBase + "/" },
            { name: "دسته‌ها", url: siteBase + "/categories" },
            { name: category.name, url: siteBase + "/categories/" + slug },
          ]),
        ]}
      />
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl text-primary">{category.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {toPersianDigits(String(total))} محصول
        </p>
      </div>

      <ProductInfiniteList
        initialProducts={products}
        initialPage={page}
        initialHasMore={page < totalPages}
        categorySlug={slug}
        sort={sort}
      />

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
