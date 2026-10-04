import type { TextPageContent } from "@/lib/content/static-pages";
import { toPersianDigits } from "@/lib/numbers";

/** قالب رسمی برای شرایط استفاده و حریم خصوصی */
export function LegalView({
  content,
  variant = "terms",
}: {
  content: TextPageContent;
  variant?: "terms" | "privacy";
}) {
  const badge =
    variant === "privacy" ? "حفاظت از داده" : "قوانین فروشگاه";

  return (
    <article className="mx-auto w-full max-w-3xl" dir="rtl">
      <div className="border-border bg-card mb-8 overflow-hidden rounded-2xl border">
        <div className="from-primary/10 to-background bg-gradient-to-b px-6 py-8 md:px-10">
          <span className="bg-primary/15 text-primary inline-block rounded-full px-3 py-1 text-xs font-medium">
            {badge}
          </span>
          <h1 className="mt-4 text-2xl font-bold text-primary md:text-3xl">
            {content.title}
          </h1>
        </div>
        <div className="space-y-6 px-6 py-8 md:px-10">
          {content.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-primary/40 mt-1 shrink-0 font-mono text-sm">
                {toPersianDigits(String(i + 1).padStart(2, "0"))}
              </span>
              <p className="text-muted-foreground leading-8">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
