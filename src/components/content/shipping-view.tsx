import type { TextPageContent } from "@/lib/content/static-pages";
import { toPersianDigits } from "@/lib/numbers";

/** قالب مرحله‌ای ارسال */
export function ShippingView({ content }: { content: TextPageContent }) {
  return (
    <div className="mx-auto w-full max-w-4xl" dir="rtl">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-primary md:text-3xl">
          {content.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          از پرداخت تا رسیدن بسته — مسیر سفارش شما
        </p>
      </div>

      <ol className="relative space-y-0">
        {content.paragraphs.map((p, i) => (
          <li key={i} className="relative flex gap-4 pb-10 last:pb-0">
            {i < content.paragraphs.length - 1 ? (
              <span
                className="bg-border absolute top-10 right-[1.15rem] h-[calc(100%-2.5rem)] w-px"
                aria-hidden
              />
            ) : null}
            <span className="bg-primary text-primary-foreground relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm">
              {toPersianDigits(String(i + 1))}
            </span>
            <div className="border-border bg-card flex-1 rounded-2xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm leading-7 md:text-base">
                {p}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
