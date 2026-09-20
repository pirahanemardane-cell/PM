"use client";

import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <div className="bg-background min-h-screen p-6" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">تنظیمات</h1>
        <p className="text-muted-foreground text-sm">
          تنظیمات فروشگاه، سئو، درگاه و OTP عمداً برای فاز بعدی نگه داشته شده‌اند.
        </p>
        <ul className="text-muted-foreground list-inside list-disc text-sm">
          <li>هیرو و ظاهر صفحه اصلی</li>
          <li>سئو و متا</li>
          <li>درگاه پرداخت</li>
          <li>OTP واقعی</li>
        </ul>
        <Link href="/admin/dashboard" className="text-primary text-sm underline">
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
