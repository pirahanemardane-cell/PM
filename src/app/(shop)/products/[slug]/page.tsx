import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { toPersianDigits } from "@/lib/numbers";
import { Badge } from "@/components/ui/badge";

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
    ...new Set(activeVariants.map((v) => v.size).filter(Boolean)),
  ] as string[];
  const colors = [
    ...new Map(
      activeVariants
        .filter((v) => v.color_name)
        .map((v) => [v.color_name, v.color_hex])
    ).entries(),
  ];

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <nav className="text-muted-foreground mb-6 text-sm">
        <Link href="/" className="hover:text-foreground">
          خانه
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-foreground">
          محصولات
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text ?? product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              بدون تصویر
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            {product.brand && (
              <p className="text-muted-foreground text-sm">
                {product.brand.name}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-iranyekan-heavy">
              {product.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              {product.is_new && (
                <Badge className="bg-emerald-600">جدید</Badge>
              )}
              {product.is_featured && (
                <Badge variant="secondary">ویژه</Badge>
              )}
              {product.is_bestseller && (
                <Badge variant="outline">پرفروش</Badge>
              )}
            </div>
          </div>

          {minPrice != null && (
            <p className="text-2xl font-bold">{formatPrice(minPrice)}</p>
          )}

          {product.short_description && (
            <p className="text-muted-foreground leading-7">
              {product.short_description}
            </p>
          )}

          {sizes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">سایز</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="rounded-lg border px-3 py-1.5 text-sm"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">رنگ</p>
              <div className="flex flex-wrap gap-2">
                {colors.map(([name, hex]) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
                  >
                    {hex && (
                      <span
                        className="size-4 rounded-full border"
                        style={{ backgroundColor: hex }}
                      />
                    )}
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <div className="border-t pt-6">
              <h2 className="mb-2 font-semibold">توضیحات</h2>
              <p className="text-muted-foreground leading-7 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

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
    </main>
  );
}
