import type { Metadata } from "next";
import Link from "next/link";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { ProductCard } from "@/components/product/product-card";
import { toPersianDigits } from "@/lib/numbers";

export const metadata: Metadata = {
  title: "فروشگاه تخصصی پیراهن مردانه",
  description:
    "خرید پیراهن مردانه رسمی و اسپرت، کروات، پاپیون و اکسسوری از فروشگاه تخصصی پیراهن مردانه",
};

export default async function HomePage() {
  const productService = new ProductService();
  const categoryService = new CategoryService();

  const [featuredResult, newResult, categoriesResult] = await Promise.all([
    productService.getPublishedProducts({ page: 1, limit: 8, featured: true }),
    productService.getPublishedProducts({ page: 1, limit: 8, sort: "newest" }),
    categoryService.getRoots(),
  ]);

  const featured =
    featuredResult.success && featuredResult.data
      ? featuredResult.data.data
      : [];
  const newest =
    newResult.success && newResult.data ? newResult.data.data : [];
  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];

  return (
    <main className="container mx-auto space-y-14 px-4 py-10 md:py-14">
      <section className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          پیراهن مردانه
        </h1>
        <p className="text-muted-foreground text-base leading-8 md:text-lg">
          فروشگاه تخصصی پیراهن مردانه — رسمی، اسپرت، کروات، پاپیون و اکسسوری.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/products"
            className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            مشاهده همه محصولات
          </Link>
          <Link
            href="/products?featured=true"
            className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            محصولات ویژه
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold md:text-2xl">دسته‌بندی‌ها</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="hover:border-foreground/20 rounded-2xl border p-4 text-center transition-colors hover:bg-muted/40"
              >
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold md:text-2xl">محصولات ویژه</h2>
            <Link
              href="/products?featured=true"
              className="text-muted-foreground text-sm hover:text-foreground"
            >
              مشاهده همه
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {newest.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold md:text-2xl">جدیدترین‌ها</h2>
            <Link
              href="/products?sort=newest"
              className="text-muted-foreground text-sm hover:text-foreground"
            >
              مشاهده همه
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {newest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <p className="text-muted-foreground text-center text-sm">
            {toPersianDigits(String(newest.length))} محصول نمایش داده شد
          </p>
        </section>
      )}
    </main>
  );
}
