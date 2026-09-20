import type { Metadata } from "next";

export const metadata: Metadata = { title: "حریم خصوصی" };

export default function Page() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">حریم خصوصی</h1>
      <p className="text-muted-foreground leading-7 text-sm">
        این صفحه به‌زودی با جزئیات کامل به‌روزرسانی می‌شود. برای پیگیری سفارش از داشبورد استفاده کنید.
      </p>
    </main>
  );
}
