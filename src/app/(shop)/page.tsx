import type { Metadata } from "next";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { BrandService } from "@/services/brand.service";
import { FlashSalePromoCard } from "@/components/home/flash-sale-promo-card";
import { getFlashSaleEndsAtAction } from "@/app/admin/actions/flash-sale";
import { NewsletterSmsBox } from "@/components/home/newsletter-sms-box";
import { OrderTrackBox } from "@/components/home/order-track-box";
import { HeroScroll } from "@/components/home/hero-scroll";
import { HomeAfterHero } from "@/components/home/home-after-hero";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { CarouselCards, CarouselLinks } from "@/components/ui/carousel-cards";
import { productToCarouselCardItem } from "@/lib/product-to-carousel-item";
import type { ProductWithRelations } from "@/repositories/product.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه تخصصی پیراهن مردانه",
  description:
    "خرید پیراهن مردانه، کروات، پاپیون و اکسسوری از فروشگاه تخصصی پیراهن مردانه",
};

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

  const featured: ProductWithRelations[] =
    featuredResult.success && featuredResult.data
      ? (featuredResult.data.data as ProductWithRelations[])
      : [];
  const newest: ProductWithRelations[] =
    newResult.success && newResult.data
      ? (newResult.data.data as ProductWithRelations[])
      : [];
  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];
  const brands =
    brandsResult.success && brandsResult.data ? brandsResult.data : [];

  const bestsellersRaw: ProductWithRelations[] =
    bestsellerResult.success && bestsellerResult.data
      ? (bestsellerResult.data.data as ProductWithRelations[])
      : [];
  const bestsellers =
    bestsellersRaw.length > 0
      ? bestsellersRaw
      : newest.filter((p) => p.is_bestseller).length
        ? newest.filter((p) => p.is_bestseller)
        : newest;

  const flashRes = await getFlashSaleEndsAtAction();
  const flashEndsAt = flashRes.ok ? flashRes.endsAt : null;
  const flashActive =
    Boolean(flashEndsAt) &&
    !Number.isNaN(new Date(flashEndsAt as string).getTime()) &&
    new Date(flashEndsAt as string).getTime() > Date.now();
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

  const newestItems = newest.map(productToCarouselCardItem);
  const dealItems = deals.map(productToCarouselCardItem);
  const bestsellerItems = bestsellers.map(productToCarouselCardItem);

  return (
    <>
      <HeroScroll />
      <HomeAfterHero>
        <main className="mx-auto w-full max-w-none space-y-14 px-4 py-10 md:py-14">
          <section
            aria-label="اعتماد"
            className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
          >
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

          {brands.length > 0 ? (
            <CarouselLinks
              title="برندها"
              viewAllHref="/brands"
              items={brands.map((b) => ({
                id: b.id,
                label: b.name,
                href: `/brands/${b.slug}`,
              }))}
            />
          ) : null}

          {categories.length > 0 ? (
            <CarouselLinks
              title="دسته‌بندی‌ها"
              viewAllHref="/products"
              items={categories.map((cat) => ({
                id: cat.id,
                label: cat.name,
                href: `/categories/${cat.slug}`,
              }))}
            />
          ) : null}

          {newestItems.length > 0 ? (
            <CarouselCards
              title="محصولات جدید"
              viewAllHref="/products?sort=newest"
              items={newestItems}
            />
          ) : (
            <section aria-label="محصولات جدید">
              <h2 className="mb-5 text-xl font-bold text-primary md:text-2xl">
                محصولات جدید
              </h2>
              <p className="text-muted-foreground text-sm">
                فعلاً محصول جدیدی موجود نیست.
              </p>
            </section>
          )}

          <section aria-label="پیشنهاد شگفت‌انگیز">
            {flashActive && (dealItems.length > 0 || flashEndsAt) ? (
              <CarouselCards
                title="پیشنهاد شگفت‌انگیز"
                viewAllHref="/products?featured=1"
                items={dealItems}
                leading={
                  flashEndsAt ? (
                    <FlashSalePromoCard endsAt={flashEndsAt} />
                  ) : null
                }
              />
            ) : (
              <>
                <h2 className="mb-5 text-xl font-bold text-primary md:text-2xl">
                  پیشنهاد شگفت‌انگیز
                </h2>
                <p className="text-muted-foreground text-sm">
                  پیشنهاد شگفت‌انگیزی فعلاً فعال نیست.
                </p>
              </>
            )}
          </section>

          {bestsellerItems.length > 0 ? (
            <CarouselCards
              title="پرفروش‌ترین‌ها"
              viewAllHref="/products?sort=popular"
              items={bestsellerItems}
            />
          ) : (
            <section aria-label="پرفروش‌ترین‌ها">
              <h2 className="mb-5 text-xl font-bold text-primary md:text-2xl">
                پرفروش‌ترین‌ها
              </h2>
              <p className="text-muted-foreground text-sm">
                پرفروش‌ترین‌ها فعلاً خالی است.
              </p>
            </section>
          )}

          <RecentlyViewed />

          <section className="grid gap-6 md:grid-cols-2">
            <NewsletterSmsBox />
            <OrderTrackBox />
          </section>
        </main>
      </HomeAfterHero>
    </>
  );
}
