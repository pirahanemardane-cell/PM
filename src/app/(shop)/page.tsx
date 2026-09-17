import { DemoShopActions } from "@/components/shop/demo-shop-actions";
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
import { ProductCard } from "@/components/product/product-card";
import { toPersianDigits } from "@/lib/numbers";
import { NewsletterSmsBox } from "@/components/home/newsletter-sms-box";
import { OrderTrackBox } from "@/components/home/order-track-box";
import { RecentlyViewed } from "@/components/home/recently-viewed";

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
    <>
      <DemoShopActions />
      (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground text-sm"
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

  // تا اضافه شدن فیلتر bestseller / sale واقعی
  const bestsellers = newest;
  const deals = featured.length ? featured : newest;

  const features = [
    {
      title: "ضمانت اصالت",
      desc: "کالای اصل با ضمانت فروشگاه",
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
    <main className="container mx-auto space-y-14 px-4 py-10 md:py-14">
      {/* 1. Feature */}
      <section aria-label="اعتماد" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-card flex flex-col gap-2 rounded-2xl border p-4"
          >
            <f.icon className="text-primary size-6" />
            <h3 className="text-sm font-semibold">{f.title}</h3>
            <p className="text-muted-foreground text-xs leading-6">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* 2. Brands placeholder */}
      <section aria-label="برندها">
        <SectionHeader title="برندها" href="/brands" />
        <HorizontalRail>
          {["برند ۱", "برند ۲", "برند ۳", "برند ۴"].map((b) => (
            <div
              key={b}
              className="bg-muted/40 flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl border text-sm font-medium"
            >
              {b}
            </div>
          ))}
        </HorizontalRail>
      </section>

      {/* 3. Categories */}
      {categories.length > 0 && (
        <section aria-label="دسته‌بندی‌ها">
          <SectionHeader title="دسته‌بندی‌ها" href="/products" />
          <HorizontalRail>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="hover:border-foreground/20 flex h-24 w-40 shrink-0 items-center justify-center rounded-2xl border p-4 text-center text-sm font-medium transition-colors hover:bg-muted/40"
              >
                {cat.name}
              </Link>
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* 4. Newest */}
      {newest.length > 0 && (
        <section aria-label="محصولات جدید">
          <SectionHeader title="محصولات جدید" href="/products?sort=newest" />
          <HorizontalRail>
            {newest.map((product) => (
              <div key={product.id} className="w-[calc((100%-0.5rem)/1.5)] shrink-0 sm:w-[calc((100%-2rem)/2.25)] lg:w-[calc((100%-3rem)/3.25)]">
                <ProductCard product={product} />
              </div>
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* 5. Deals */}
      {deals.length > 0 && (
        <section aria-label="پیشنهاد شگفت‌انگیز">
          <SectionHeader title="پیشنهاد شگفت‌انگیز" href="/products?featured=true" />
          <HorizontalRail>
            {deals.map((product) => (
              <div key={product.id} className="w-[calc((100%-0.5rem)/1.5)] shrink-0 sm:w-[calc((100%-2rem)/2.25)] lg:w-[calc((100%-3rem)/3.25)]">
                <ProductCard product={product} />
              </div>
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* 6. Bestsellers */}
      {bestsellers.length > 0 && (
        <section aria-label="پرفروش‌ترین‌ها">
          <SectionHeader title="پرفروش‌ترین‌ها" href="/products" />
          <HorizontalRail>
            {bestsellers.map((product) => (
              <div key={product.id} className="w-[calc((100%-0.5rem)/1.5)] shrink-0 sm:w-[calc((100%-2rem)/2.25)] lg:w-[calc((100%-3rem)/3.25)]">
                <ProductCard product={product} />
              </div>
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* 7. Recently viewed */}
      <RecentlyViewed />

      {/* 8 + 9 */}
      <section className="grid gap-6 md:grid-cols-2">
        <NewsletterSmsBox />
        <OrderTrackBox />
      </section>
    </main>
  );
}
