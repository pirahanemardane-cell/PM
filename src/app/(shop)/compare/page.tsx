import type { Metadata } from "next";
import { CompareMatrix } from "@/components/shop/compare-matrix";

export const metadata: Metadata = {
  title: "مقایسه محصولات | پیراهن مردانه",
  description: "مقایسه کنارهم مشخصات، قیمت و موجودی پیراهن‌های انتخابی.",
  alternates: { canonical: "/مقایسه" },
};

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6" dir="rtl">
      <h1 className="text-2xl font-bold text-primary">مقایسه محصولات</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        تا ۴ محصول را از فروشگاه به لیست مقایسه اضافه کنید.
      </p>
      <CompareMatrix />
    </main>
  );
}
