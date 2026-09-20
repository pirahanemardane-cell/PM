"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

const LABEL_MAP: Record<string, string> = {
  products: "محصولات",
  product: "محصول",
  login: "ورود",
  register: "ثبت‌نام",
  cart: "سبد خرید",
  wishlist: "علاقه‌مندی‌ها",
  compare: "مقایسه",
  dashboard: "داشبورد",
  about: "درباره ما",
  contact: "تماس با ما",
  "recently-viewed": "آخرین مشاهده‌ها",
  "ورود": "ورود",
  "ثبت-نام": "ثبت‌نام",
  "محصولات": "محصولات",
  "سبد-خرید": "سبد خرید",
  "علاقه-مندی-ها": "علاقه‌مندی‌ها",
  "مقایسه": "مقایسه",
  "داشبورد": "داشبورد",
  "درباره-ما": "درباره ما",
  "تماس-با-ما": "تماس با ما",
  "آخرین-مشاهده-ها": "آخرین مشاهده‌ها",
};

/** مسیر انگلیسی داخلی → فارسی برای لینک breadcrumb */
const EN_TO_FA: Record<string, string> = {
  products: "محصولات",
  login: "ورود",
  register: "ثبت-نام",
  cart: "سبد-خرید",
  wishlist: "علاقه-مندی-ها",
  compare: "مقایسه",
  dashboard: "داشبورد",
  about: "درباره-ما",
  contact: "تماس-با-ما",
  "recently-viewed": "آخرین-مشاهده-ها",
};

function labelize(seg: string) {
  try {
    seg = decodeURIComponent(seg);
  } catch {
    /* ignore */
  }
  if (LABEL_MAP[seg]) return LABEL_MAP[seg];
  return seg.replace(/-/g, " ");
}

function faHref(parts: string[], endIndex: number) {
  const segs = parts.slice(0, endIndex + 1).map((s) => {
    try {
      s = decodeURIComponent(s);
    } catch {
      /* */
    }
    return EN_TO_FA[s] || s;
  });
  return "/" + segs.join("/");
}

export function AppBreadcrumb({
  className,
  items,
}: {
  className?: string;
  items?: Crumb[];
}) {
  const pathname = usePathname() || "/";

  // داشبورد / سبد / چک‌اوت — بدون breadcrumb
  const path = decodeURIComponent(pathname);
  if (
    path.startsWith("/dashboard") ||
    path.includes("dashboard") ||
    path.startsWith("/داشبورد") ||
    path.includes("داشبورد") ||
    path === "/cart" ||
    path.startsWith("/سبد") ||
    path.startsWith("/checkout") ||
    path.startsWith("/چک")
  ) {
    return null;
  }

  if (!items?.length) {
    if (pathname === "/" || pathname === "") return null;
    if (pathname.startsWith("/admin")) return null;
  }

  let crumbs: Crumb[] = items ?? [];

  if (!crumbs.length) {
    const parts = pathname.split("/").filter(Boolean);
    if (!parts.length) return null;
    crumbs = parts.map((seg, i) => ({
      href: faHref(parts, i),
      label: labelize(seg),
    }));
  }

  return (
    <nav
      aria-label="breadcrumb"
      className={cn("bg-surface-muted border-border border-b", className)}
      dir="rtl"
    >
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
        <li>
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            خانه
          </Link>
        </li>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              <span className="text-muted-foreground select-none" aria-hidden>
                |
              </span>
              {last || !c.href ? (
                <span className="text-foreground font-medium">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default AppBreadcrumb;
