"use client";
import { ProductActions } from "@/components/shop/product-actions";

const demo = {
  id: "demo-shirt-1",
  title: "پیراهن رسمی نمونه",
  price: 1290000,
  brand: "برند A",
  category: "پیراهن رسمی",
  color: "white",
  href: "/products",
};

export function DemoShopActions() {
  return (
    <div className="bg-surface-muted border-border mx-auto my-6 max-w-6xl rounded-2xl border p-4" dir="rtl">
      <p className="mb-3 text-sm font-medium">تست اکشن‌های realtime (سبد / لایک / مقایسه / بازدید)</p>
      <ProductActions product={demo} />
    </div>
  );
}
