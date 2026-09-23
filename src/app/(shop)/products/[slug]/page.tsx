import { RelatedStrip } from "@/components/shop/related-strip";
import { getRelatedProducts } from "@/lib/related-products";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { toPersianDigits } from "@/lib/numbers";
import { Badge } from "@/components/ui/badge";
import { ProductBuyBox } from "@/components/product/product-buy-box";
import { TrackRecentlyViewed } from "@/components/product/track-recently-viewed";
import { ProductReviews } from "@/components/shop/product-reviews";
import { PriceHistory } from "@/components/product/price-history";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductSpecs } from "@/components/product/product-specs";
import { getProductSpecRows } from "@/lib/product-specs";
import { getProductPriceHistory } from "@/lib/price-history";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatPrice(price: number) {
  return toPersianDigits(price.toLocaleString("en-US")) + " تومان";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = new ProductService();
  const result = await service.getProductBySlug(slug);

  if (!result.success || !result.data) {
    return { title: "محصول یافت نشد" };
  }

  const p = result.data;
  return {
    title: p.meta_title ?? p.name,
    description: p.meta_description ?? p.short_description ?? undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = new ProductService();
  const result = await service.getProductBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;
  const images = product.images ?? [];
  const primaryImage =
    images.find((img) => img.is_primary) ?? images[0] ?? null;
  const activeVariants =
    product.variants?.filter((v) => v.is_active) ?? [];
  const minPrice =
    activeVariants.length > 0
      ? Math.min(...activeVariants.map((v) => Number(v.price)))
      : null;
  const sizes = [
    ...new Set(
      activeVariants
        .map((v) => {
          const s = (v as { size?: string | { name?: string | null } | null }).size;
          if (typeof s === "string" && s) return s;
          if (s && typeof s === "object" && s.name) return s.name;
          return null;
        })
        .filter((s): s is string => Boolean(s))
    ),
  ];
  const colors = [
    ...new Map(
      activeVariants
        .map((v) => {
          const c = (v as {
            color_name?: string | null;
            color_hex?: string | null;
            color?: string | { name?: string | null; hex_code?: string | null; hex?: string | null } | null;
          });
          if (c.color_name) return [c.color_name, c.color_hex ?? null] as const;
          if (typeof c.color === "string" && c.color) return [c.color, null] as const;
          if (c.color && typeof c.color === "object") {
            const name = c.color.name ?? c.color.hex_code ?? c.color.hex ?? null;
            const hex = c.color.hex_code ?? c.color.hex ?? null;
            if (name) return [name, hex] as const;
          }
          return null;
        })
        .filter((x): x is readonly [string, string | null] => Boolean(x))
        .map((x) => [x[0], x[1]] as [string, string | null])
    ).entries(),
  ];


  const variantOptions = activeVariants.map((v) => {
    const s = (v as { size?: string | { name?: string | null } | null }).size;
    const sizeName =
      typeof s === "string" ? s : s && typeof s === "object" ? s.name ?? null : null;
    const c = (v as {
      color?: string | { name?: string | null; hex_code?: string | null; hex?: string | null } | null;
      color_hex?: string | null;
      color_name?: string | null;
    });
    let colorVal: string | null = c.color_hex ?? c.color_name ?? null;
    if (!colorVal && c.color && typeof c.color === "object") {
      colorVal = c.color.hex_code ?? c.color.hex ?? c.color.name ?? null;
    } else if (typeof c.color === "string") {
      colorVal = c.color;
    }
    return {
      id: (v as { id: string }).id,
      size: sizeName,
      color: colorVal,
      price: Number((v as { price?: number }).price ?? 0),
      stock: Number((v as { stock_quantity?: number }).stock_quantity ?? 0),
    };
  });

    const relatedProducts = await getRelatedProducts(
    product.id,
    product.category_id ?? product.category?.id ?? null,
    8,
  );
  const priceHistory = await getProductPriceHistory(String(product.id), 40);
  const specRows = await getProductSpecRows(String(product.id));

  return (
    <main className="w-full max-w-none mx-auto px-4 py-8 md:py-12">
      <nav className="text-muted-foreground mb-6 flex flex-wrap items-center gap-1.5 text-xs" aria-label="breadcrumb">
        <Link href="/" className="hover:text-foreground">خانه</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">محصولات</Link>
        {product.category?.slug ? (
          <>
            <span>/</span>
            <Link
              href={`/products?category=${encodeURIComponent(product.category.slug)}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          productName={product.name}
          images={(images ?? []).map((img) => ({
            url: img.url,
            alt: img.alt_text ?? product.name,
          }))}
        />

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-iranyekan-heavy">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              {product.is_new ? (
                <Badge className="inline-flex h-6 items-center border-0 bg-emerald-100 px-2.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  جدید
                </Badge>
              ) : null}
              {product.is_featured ? (
                <Badge className="inline-flex h-6 items-center border-0 bg-amber-100 px-2.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  شگفت‌انگیز
                </Badge>
              ) : null}
              {product.category?.slug ? (
                <Link href={`/products?category=${encodeURIComponent(product.category.slug)}`} className="no-underline hover:no-underline hover:opacity-100">
                  <Badge className="inline-flex h-6 items-center border-0 bg-sky-100 px-2.5 text-xs text-sky-800 shadow-none transition-none hover:bg-sky-100 hover:text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/40 dark:hover:text-sky-200">
                    {product.category.name}
                  </Badge>
                </Link>
              ) : null}
              {product.brand?.slug ? (
                <Link href={`/brands/${product.brand.slug}`} className="no-underline hover:no-underline hover:opacity-100">
                  <Badge className="inline-flex h-6 items-center border-0 bg-violet-100 px-2.5 text-xs text-violet-800 shadow-none transition-none hover:bg-violet-100 hover:text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-900/40 dark:hover:text-violet-200">
                    {product.brand.name}
                  </Badge>
                </Link>
              ) : null}
            </div>
          </div>

          {product.short_description ? (
            <p className="text-muted-foreground leading-7">
              {product.short_description}
            </p>
          ) : null}

          <>
          <TrackRecentlyViewed
            id={String(product.id)}
            title={String(product.name ?? "")}
            price={Number(product.price ?? 0)}
            image={primaryImage?.url}
            href={`/products/${product.slug}`}
          />
          <ProductBuyBox
            productId={product.id}
            title={product.name}
            image={primaryImage?.url}
            href={`/products/${product.slug}`}
            variants={variantOptions}
          />
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/size-guide"
              className="text-primary underline-offset-4 hover:underline"
            >
              راهنمای سایز
            </Link>
            <Link
              href="/shipping"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              شرایط ارسال
            </Link>
            <Link
              href="/returns"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              مرجوعی
            </Link>
          </div>
          <PriceHistory points={priceHistory} />
          </>


          {product.description && (
            <div className="border-t pt-6">
              <h2 className="mb-2 font-semibold">توضیحات</h2>
              <p className="text-muted-foreground leading-7 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          <ProductSpecs rows={specRows} />

          <div className="text-muted-foreground border-t pt-4 text-xs leading-6">
            ارسال سریع · ضمانت اصالت · امکان مرجوعی طبق{" "}
            <Link href="/returns" className="underline underline-offset-2">
              شرایط مرجوعی
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/products"
              className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted"
            >
              بازگشت به محصولات
            </Link>
          </div>
        </div>
      </div>
      {relatedProducts?.length ? (
        <div className="mt-12">
          <RelatedStrip
            title="محصولات مرتبط"
            items={relatedProducts.map((p) => ({
              title: String((p as { name?: string; title?: string }).name ?? (p as { title?: string }).title ?? ""),
              href: `/products/${(p as { slug: string }).slug}`,
              image: (p as { image_url?: string; primary_image_url?: string }).image_url
                ?? (p as { primary_image_url?: string }).primary_image_url
                ?? undefined,
              subtitle: (p as { price?: number }).price != null
                ? `${Number((p as { price: number }).price).toLocaleString("fa-IR")} تومان`
                : null,
            }))}
          />
        </div>
      ) : null}
      <div className="mt-12">
        <ProductReviews productId={product.id} />
      </div>
    </main>
  );
}
