"use client";

import Link from "next/link";
import ClothingRailHero from "@/components/ui/product-rail-gallery";
import type { RailGarment } from "@/components/ui/product-rail-gallery";

/** Fallback illustrations when the catalog has no photo-ready featured items. */
const DEMO_ITEMS: RailGarment[] = [
  {
    id: "shirt-white",
    name: "پیراهن رسمی سفید",
    kind: "shirt",
    color: "#F4F1EA",
    trim: "#2a2a2a",
    tag: "رسمی",
    description: "پیراهن کلاسیک روزمره و رسمی با برش تمیز.",
    details: ["نخی", "یقه کلاسیک", "آستین بلند"],
  },
  {
    id: "shirt-sky",
    name: "پیراهن آبی آسمانی",
    kind: "shirt",
    color: "#9EC9E0",
    trim: "#1e3a4c",
    tag: "کژوال",
    description: "آبی ملایم برای استایل روز و محل کار.",
    details: ["اکسفورد", "دکمه پایین"],
  },
  {
    id: "tee-bone",
    name: "تی‌شرت استخوانی",
    kind: "tee",
    color: "#EDE8DF",
    trim: "#444",
    tag: "بیسیک",
    description: "تی‌شرت ضخیم برای لایه‌بندی زیر پیراهن.",
    details: ["پنبه‌ای", "فیت معمولی"],
  },
  {
    id: "shirt-navy",
    name: "پیراهن سرمه‌ای",
    kind: "shirt",
    color: "#1B2A4A",
    trim: "#c9a227",
    tag: "رسمی",
    description: "سرمه‌ای تیره با جزئیات ظریف.",
    details: ["نخی", "یقه فرنچ"],
  },
  {
    id: "knit-olive",
    name: "بافت زیتونی",
    kind: "knit",
    color: "#6E7A4E",
    trim: "#2c2c2c",
    tag: "پاییزه",
    description: "لایه میانی گرم برای فصل خنک.",
    details: ["بافت", "یقه هفت"],
  },
  {
    id: "shirt-light",
    name: "پیراهن روشن اداری",
    kind: "shirt",
    color: "#E8EEF5",
    trim: "#3d4f66",
    tag: "اداری",
    description: "انتخاب مطمئن برای محیط کار.",
    details: ["نخی", "آسان‌اتو"],
  },
];

export type HomeRailCatalogItem = {
  id: string;
  name: string;
  image?: string;
  backImage?: string;
  tag?: string;
  description?: string;
  details?: string[];
};

type Props = {
  /** Live catalog garments (prefer photos). Falls back to demo illustrations. */
  items?: HomeRailCatalogItem[];
};

export function HomeClothingRail({ items }: Props) {
  const catalog: RailGarment[] = (items ?? [])
    .filter((item) => Boolean(item.image))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      backImage: item.backImage,
      tag: item.tag,
      description: item.description,
      details: item.details,
    }));

  const usePhotos = catalog.length >= 3;
  const railItems = usePhotos ? catalog : DEMO_ITEMS;

  return (
    <section
      aria-label="پیشنهاد هفته"
      className="overflow-hidden rounded-3xl border bg-card"
    >
      <ClothingRailHero
        items={railItems}
        hanger={usePhotos ? "none" : "wood"}
        autoplay
        interval={2800}
        labels={{
          front: "جلو",
          back: "پشت",
          close: "بستن",
          show: "نمایش",
        }}
        eyebrow="منتخب فروشگاه"
        heading="پیشنهاد هفته"
        caption="روی هر لباس بکشید یا لمس کنید تا جلو بیاید"
        action={
          <Link
            href="/محصولات"
            className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm outline-none transition-[transform,background-color,box-shadow] hover:-translate-y-px hover:bg-primary/90 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            مشاهده محصولات
          </Link>
        }
      />
    </section>
  );
}
