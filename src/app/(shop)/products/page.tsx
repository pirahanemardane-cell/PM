import type { Metadata } from "next";
import { ProductService } from "@/services/product.service";
import { ProductInfiniteList } from "@/components/product/product-infinite-list";
import { toPersianDigits } from "@/lib/numbers";

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

  const categorySlug =
    typeof params.category === "string" ? params.category : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const sort =
    typeof params.sort === "string"
      ? (params.sort as "newest" | "price_asc" | "price_desc" | "popular")
      : "newest";
  const featured = params.featured === "1" ? true : undefined;

  const result = await service.getPublishedProducts({
    page: 1,
    pageSize: 12,
    categorySlug,
    q,
    sort,
    featured,
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

      <ProductInfiniteList
        initialProducts={products}
        initialPage={page}
        initialHasMore={page < totalPages}
        categorySlug={categorySlug}
        q={q}
        sort={sort}
        featured={featured}
      />
    </main>
  );
}
