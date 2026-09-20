"use client";

import Link from "next/link";

export default function Page() {
  return (
    <div className="space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">دسته‌بندی مقالات</h1>
      <p className="text-muted-foreground text-sm">لیست دسته‌های بلاگ.</p>
      <Link href="/admin/dashboard" className="text-primary text-sm underline">
        داشبورد
      </Link>
    </div>
  );
}
