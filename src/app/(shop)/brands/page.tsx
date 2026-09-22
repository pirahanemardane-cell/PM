import type { Metadata } from "next";
import Link from "next/link";
import { BrandService } from "@/services/brand.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "برندها",
  description: "همه برندهای فروشگاه تخصصی پیراهن مردانه",
};

export default async function BrandsIndexPage() {
  const service = new BrandService();
  const result = await service.getActive();
  const brands = result.success && result.data ? result.data : [];

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">برندها</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        انتخاب برند برای مشاهده محصولات
      </p>

      {brands.length === 0 ? (
        <p className="text-muted-foreground text-center">برندی ثبت نشده است.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/brands/${b.slug}`}
              className="bg-card hover:border-foreground/20 flex h-24 items-center justify-center rounded-2xl border px-3 text-center text-sm font-medium transition-colors hover:bg-muted/40"
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
