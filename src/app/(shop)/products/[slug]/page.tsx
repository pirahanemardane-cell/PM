import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { toPersianDigits } from "@/lib/numbers";
import { Badge } from "@/components/ui/badge";
import { ProductBuyBox } from "@/components/product/product-buy-box";

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

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text ?? product.name}
              fill
              className="object-contain"
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

          {product.short_description && (
            <p className="text-muted-foreground leading-7">
              {product.short_description}
            </p>
          )}

          <ProductBuyBox
            productId={product.id}
            title={product.name}
            image={primaryImage?.url}
            href={`/products/${product.slug}`}
            variants={variantOptions}
          />

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
