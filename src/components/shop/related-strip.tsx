import Link from "next/link";

type Item = {
  href: string;
  title: string;
  image?: string | null;
  subtitle?: string | null;
};

export function RelatedStrip({
  title,
  items,
}: {
  title: string;
  items: Item[];
}) {
  if (!items.length) return null;
  return (
    <section className="mt-12 space-y-4" dir="rtl">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="border-border group overflow-hidden rounded-2xl border transition hover:shadow-sm"
          >
            <div className="bg-muted aspect-[3/4] overflow-hidden">
              {it.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.image}
                  alt={it.title}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                  بدون تصویر
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="line-clamp-2 text-sm font-medium">{it.title}</p>
              {it.subtitle ? (
                <p className="text-muted-foreground text-xs">{it.subtitle}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
