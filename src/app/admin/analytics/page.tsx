"use client";

import Link from "next/link";

export default function AdminAnalyticsPage() {
  return (
    <div className="bg-background min-h-screen p-6" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">گزارش‌ها</h1>
        <p className="text-muted-foreground text-sm">
          این بخش عمداً اسکلت است — نمودار فروش و قیف خرید بعداً اضافه می‌شود.
        </p>
        <Link href="/admin/dashboard" className="text-primary text-sm underline">
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
