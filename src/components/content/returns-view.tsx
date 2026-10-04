import Link from "next/link";
import type { TextPageContent } from "@/lib/content/static-pages";
import { toPersianDigits } from "@/lib/numbers";

/** قالب مرجوعی با CTA */
export function ReturnsView({ content }: { content: TextPageContent }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8" dir="rtl">
      <div className="from-primary/10 via-background to-background rounded-2xl bg-gradient-to-b px-6 py-10 text-center">
        <h1 className="text-2xl font-bold text-primary md:text-3xl">
          {content.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          تعویض و بازگشت آسان — شفاف و بدون دردسر
        </p>
      </div>

      <ul className="space-y-3">
        {content.paragraphs.map((p, i) => (
          <li
            key={i}
            className="border-border bg-card flex gap-3 rounded-xl border p-4"
          >
            <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
              {toPersianDigits(String(i + 1))}
            </span>
            <p className="text-muted-foreground text-sm leading-7">{p}</p>
          </li>
        ))}
      </ul>

      <div className="border-border bg-muted/30 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-6 text-center">
        <p className="text-sm font-medium text-primary">
          درخواست مرجوعی از داشبورد مشتری
        </p>
        <Link
          href="/dashboard"
          className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium"
        >
          رفتن به داشبورد
        </Link>
      </div>
    </div>
  );
}
