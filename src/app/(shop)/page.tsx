import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { BrandService } from "@/services/brand.service";
import { ProductCard } from "@/components/product/product-card";
import { FlashSalePromoCard } from "@/components/home/flash-sale-promo-card";
import { getFlashSaleEndsAtAction } from "@/app/admin/actions/flash-sale";
import { toPersianDigits } from "@/lib/numbers";
import { NewsletterSmsBox } from "@/components/home/newsletter-sms-box";
import { OrderTrackBox } from "@/components/home/order-track-box";
import { HeroScroll } from "@/components/home/hero-scroll";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه تخصصی پیراهن مردانه",
  description:
    "خرید پیراهن مردانه، کروات، پاپیون و اکسسوری از فروشگاه تخصصی پیراهن مردانه",
};

function SectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold md:text-2xl text-primary">{title}</h2>
      {href ? (
        <Link
          href={href}
          className=" hover:text-foreground text-sm"
        >
          مشاهده همه
        </Link>
      ) : null}
    </div>
  );
}

function HorizontalRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

export default async function HomePage() {
  const productService = new ProductService();
  const categoryService = new CategoryService();
  const brandService = new BrandService();

  const [featuredResult, newResult, bestsellerResult, categoriesResult, brandsResult] =
    await Promise.all([
      productService.getPublishedProducts({ page: 1, pageSize: 8, featured: true }),
      productService.getPublishedProducts({ page: 1, pageSize: 8, sort: "newest" }),
      productService.getPublishedProducts({ page: 1, pageSize: 12, bestseller: true }),
      categoryService.getRoots(),
      brandService.getActive(),
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
  const brands =
    brandsResult.success && brandsResult.data ? brandsResult.data : [];

  // پرفروش‌ها از فلگ is_bestseller — اگر خالی بود newest
  const bestsellersRaw =
    bestsellerResult.success && bestsellerResult.data
      ? bestsellerResult.data.data
      : [];
  const bestsellers =
    bestsellersRaw.length > 0
      ? bestsellersRaw
      : (newest as Array<{ is_bestseller?: boolean }>).filter((p) => p.is_bestseller)
          .length
        ? (newest as Array<{ is_bestseller?: boolean }>).filter((p) => p.is_bestseller)
        : newest;
  const flashRes = await getFlashSaleEndsAtAction();
  const flashEndsAt = flashRes.ok ? flashRes.endsAt : null;
  // فقط وقتی زمان پایان در آینده است، فروش ویژه فعال است
  const flashActive =
    Boolean(flashEndsAt) &&
    !Number.isNaN(new Date(flashEndsAt as string).getTime()) &&
    new Date(flashEndsAt as string).getTime() > Date.now();
  // پیشنهاد شگفت‌انگیز = فقط محصولات is_featured (بدون fallback به newest)
  const deals = flashActive ? featured : [];

  const features = [
    {
      title: "ضمانت کالا",
      desc: "کالای با کیفیت",
      icon: ShieldCheck,
    },
    {
      title: "ارسال سریع",
      desc: "ارسال به سراسر کشور",
      icon: Truck,
    },
    {
      title: "۷ روز بازگشت",
      desc: "مرجوعی آسان طبق شرایط",
      icon: RotateCcw,
    },
    {
      title: "پشتیبانی",
      desc: "همراه شما قبل و بعد خرید",
      icon: Headphones,
    },
  ];

  return (
    <>
      <HeroScroll />
      <main className="w-full max-w-none mx-auto space-y-14 px-4 py-10 md:py-14">
      {/* 1. Feature */}
      <section aria-label="اعتماد" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-card flex flex-col gap-2 rounded-2xl border p-4"
          >
            <f.icon className="text-primary size-6" />
            <h3 className="text-sm font-semibold text-primary">{f.title}</h3>
            <p className="text-muted-foreground text-xs leading-6">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* 2. Brands */}
      {brands.length > 0 ? (
        <section aria-label="برندها">
          <SectionHeader title="برندها" href="/brands" />
          <HorizontalRail>
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/brands/${b.slug}`}
                className="bg-muted/40 hover:border-foreground/20 flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl border px-3 text-center text-sm font-medium transition-colors hover:bg-muted/60"
              >
                {b.name}
              </Link>
            ))}
          </HorizontalRail>
        </section>
      ) : null}

      {/* 3. Categories */}
      {categories.length > 0 && (
        <section aria-label="دسته‌بندی‌ها">
          <SectionHeader title="دسته‌بندی‌ها" href="/products" />
          <HorizontalRail>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="hover:border-foreground/20 flex h-24 w-40 shrink-0 items-center justify-center rounded-2xl border p-4 text-center text-sm font-medium transition-colors hover:bg-muted/40"
              >
                {cat.name}
              </Link>
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* 4. Newest */}
      <section aria-label="محصولات جدید">
        <SectionHeader title="محصولات جدید" href="/products?sort=newest" />
        {newest.length > 0 ? (
          <HorizontalRail>
            {newest.map((product) => (
              <div key={product.id} className="w-[min(100%,240px)] shrink-0 sm:w-[220px] lg:w-[calc((100%-2.25rem)/3.5)]">
                <ProductCard product={product} />
              </div>
            ))}
          </HorizontalRail>
        ) : (
          <p className="text-muted-foreground text-sm">فعلاً محصول جدیدی موجود نیست.</p>
        )}
      </section>

      {/* 5. Deals */}
      <section aria-label="پیشنهاد شگفت‌انگیز">
        <SectionHeader title="پیشنهاد شگفت‌انگیز" href="/products?featured=1" />
        {flashActive ? (
          <HorizontalRail>
            <div className="w-[min(100%,240px)] shrink-0 sm:w-[220px] lg:w-[calc((100%-2.25rem)/3.5)]">
              <FlashSalePromoCard endsAt={flashEndsAt} />
            </div>
            {deals.map((product) => (
              <div key={product.id} className="w-[min(100%,240px)] shrink-0 sm:w-[220px] lg:w-[calc((100%-2.25rem)/3.5)]">
                <ProductCard product={product} />
              </div>
            ))}
          </HorizontalRail>
        ) : (
          <p className="text-muted-foreground text-sm">پیشنهاد شگفت‌انگیزی فعلاً فعال نیست.</p>
        )}
      </section>

      {/* 6. Bestsellers */}
      <section aria-label="پرفروش‌ترین‌ها">
        <SectionHeader title="پرفروش‌ترین‌ها" href="/products?sort=popular" />
        {bestsellers.length > 0 ? (
          <HorizontalRail>
            {bestsellers.map((product) => (
              <div key={product.id} className="w-[min(100%,240px)] shrink-0 sm:w-[220px] lg:w-[calc((100%-2.25rem)/3.5)]">
                <ProductCard product={product} />
              </div>
            ))}
          </HorizontalRail>
        ) : (
          <p className="text-muted-foreground text-sm">پرفروش‌ترین‌ها فعلاً خالی است.</p>
        )}
      </section>


      {/* 8 + 9 */}
      <section className="grid gap-6 md:grid-cols-2">
        <NewsletterSmsBox />
        <OrderTrackBox />
      </section>
    </main>
    </>
  );
}
