import type { Metadata } from "next";
import Link from "next/link";
import { getTextPageContentAction } from "@/app/admin/actions/content-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "گارانتی دوخت و تعویض آسان | پیراهن مردانه",
  description: "شرایط گارانتی دوخت، تعویض آسان و ثبت ادعا از داشبورد مشتری.",
};

export default async function WarrantyPage() {
  const content = await getTextPageContentAction("warranty");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6" dir="rtl">
      <h1 className="text-2xl font-bold text-primary">{content.title}</h1>
      <div className="text-muted-foreground mt-6 space-y-4 text-sm leading-7">
        {content.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/dashboard?tab=claims"
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2"
        >
          ثبت ادعا
        </Link>
        <Link href="/returns" className="border-border rounded-xl border px-4 py-2">
          سیاست مرجوعی
        </Link>
      </div>
    </main>
  );
}
