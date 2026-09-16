import Link from "next/link";
import Image from "next/image";
import type { ProductWithRelations } from "@/repositories/product.repository";
import { toPersianDigits } from "@/lib/numbers";
import { Badge } from "@/components/ui/badge";

function formatPrice(price: number) {
  return toPersianDigits(price.toLocaleString("en-US")) + " تومان";
}

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const primaryImage =
    product.images?.find((img) => img.is_primary) ?? product.images?.[0];
  const activeVariants = product.variants?.filter((v) => v.is_active) ?? [];
  const minPrice =
    activeVariants.length > 0
      ? Math.min(...activeVariants.map((v) => Number(v.price)))
      : null;
  const inStock = activeVariants.some((v) => v.stock_quantity > 0);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group overflow-hidden rounded-2xl border bg-card transition hover:shadow-md"
    >
      <div className="relative aspect-[4/5] bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text ?? product.name}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            بدون تصویر
          </div>
        )}
        <div className="absolute start-2 top-2 flex flex-col gap-1">
          {product.is_new && <Badge className="bg-emerald-600">جدید</Badge>}
          {product.is_featured && <Badge variant="secondary">ویژه</Badge>}
        </div>
      </div>

      <div className="space-y-1.5 p-3">
        {product.brand && (
          <p className="text-muted-foreground text-xs">{product.brand.name}</p>
        )}
        <h2 className="line-clamp-2 text-sm font-medium leading-6">
          {product.name}
        </h2>
        <div className="flex items-center justify-between gap-2 pt-1">
          {minPrice != null ? (
            <span className="text-sm font-bold">{formatPrice(minPrice)}</span>
          ) : (
            <span className="text-muted-foreground text-xs">قیمت نامشخص</span>
          )}
          {!inStock && (
            <span className="text-destructive text-xs">ناموجود</span>
          )}
        </div>
      </div>
    </Link>
  );
}
