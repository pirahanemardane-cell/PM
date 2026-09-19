import Link from "next/link";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "newest", label: "جدیدترین" },
  { value: "popular", label: "محبوب‌ترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
] as const;

type Props = {
  currentSort?: string;
  categorySlug?: string;
  brandSlug?: string;
  q?: string;
  featured?: boolean;
};

function buildHref(
  sort: string,
  props: Omit<Props, "currentSort">
) {
  const params = new URLSearchParams();
  params.set("sort", sort);
  if (props.categorySlug) params.set("category", props.categorySlug);
  if (props.brandSlug) params.set("brand", props.brandSlug);
  if (props.q) params.set("q", props.q);
  if (props.featured) params.set("featured", "1");
  return `/products?${params.toString()}`;
}

export function ProductSortBar(props: Props) {
  const current = props.currentSort ?? "newest";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground me-2 text-sm">مرتب‌سازی:</span>
      {SORTS.map((s) => (
        <Link
          key={s.value}
          href={buildHref(s.value, props)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition-colors",
            current === s.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted"
          )}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
