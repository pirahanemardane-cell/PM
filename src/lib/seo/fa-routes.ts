/**
 * Persian-canonical storefront page routes.
 * FA paths are what users/SEO should see; EN paths stay reachable via rewrite/301.
 * Product/blog entity slugs stay English kebab-case under FA prefixes.
 */

export type FaRoute = {
  /** Canonical Persian path (no trailing slash) */
  fa: string;
  /** Internal English app path (may include ?query for tab aliases) */
  en: string;
};

/** Page-level FA ↔ EN pairs (safe; no invented product/brand slugs). */
export const FA_PAGE_ROUTES: readonly FaRoute[] = [
  { fa: "/ورود", en: "/login" },
  { fa: "/ثبت-نام", en: "/register" },
  { fa: "/محصولات", en: "/products" },
  { fa: "/سبد-خرید", en: "/cart" },
  { fa: "/علاقه-مندی-ها", en: "/dashboard?tab=wishlist" },
  { fa: "/مقایسه", en: "/compare" },
  { fa: "/آخرین-مشاهده-ها", en: "/dashboard?tab=recent" },
  { fa: "/تماس", en: "/contact" },
  { fa: "/درباره-ما", en: "/about" },
  { fa: "/سوالات-متداول", en: "/faq" },
  { fa: "/شرایط-استفاده", en: "/terms" },
  { fa: "/حریم-خصوصی", en: "/privacy" },
  { fa: "/ارسال", en: "/shipping" },
  { fa: "/مرجوعی", en: "/returns" },
  { fa: "/راهنمای-سایز", en: "/size-guide" },
  { fa: "/پیگیری-سفارش", en: "/track" },
  { fa: "/برندها", en: "/brands" },
  { fa: "/دسته-بندی-ها", en: "/categories" },
  { fa: "/بلاگ", en: "/blog" },
  { fa: "/داشبورد", en: "/dashboard" },
  { fa: "/جستجو", en: "/search" },
  { fa: "/تسویه-حساب", en: "/checkout" },
  { fa: "/گارانتی", en: "/warranty" },
  { fa: "/فاکتور", en: "/invoice" },
] as const;

/** Extra EN aliases that 301 to an existing FA canonical. */
export const EN_ALIAS_TO_FA: Readonly<Record<string, string>> = {
  "/wishlist": "/علاقه-مندی-ها",
  "/recently-viewed": "/آخرین-مشاهده-ها",
  "/پیگیری": "/پیگیری-سفارش",
};

/** FA path → internal EN destination (for proxy rewrites). */
export const FA_TO_EN: Readonly<Record<string, string>> = Object.fromEntries(
  FA_PAGE_ROUTES.map((r) => [r.fa, r.en]),
);

/** Exact EN pathname → FA canonical (dashboard tab routes excluded; use aliases). */
export const EN_TO_FA: Readonly<Record<string, string>> = (() => {
  const map: Record<string, string> = { ...EN_ALIAS_TO_FA };
  for (const r of FA_PAGE_ROUTES) {
    const enPath = r.en.split("?")[0] || "/";
    if (enPath === "/dashboard" && r.en.includes("?")) continue;
    if (!map[enPath]) map[enPath] = r.fa;
  }
  return map;
})();

/** Static sitemap / llms paths that should be FA-canonical. */
export const FA_STATIC_SITEMAP_PATHS: readonly string[] = [
  "",
  "/محصولات",
  "/دسته-بندی-ها",
  "/برندها",
  "/بلاگ",
  "/درباره-ما",
  "/تماس",
  "/سوالات-متداول",
  "/ارسال",
  "/مرجوعی",
  "/حریم-خصوصی",
  "/شرایط-استفاده",
  "/راهنمای-سایز",
  "/جستجو",
  "/پیگیری-سفارش",
  "/گارانتی",
];

/** Reserved single-segment paths (FA + EN) for root [slug] brand/category resolver. */
export const RESERVED_ROOT_SEGMENTS: readonly string[] = [
  "",
  "admin",
  "api",
  "login",
  "register",
  "dashboard",
  "cart",
  "checkout",
  "products",
  "brands",
  "blog",
  "contact",
  "about",
  "faq",
  "terms",
  "privacy",
  "shipping",
  "returns",
  "size-guide",
  "track",
  "categories",
  "tag",
  "wishlist",
  "compare",
  "recently-viewed",
  "search",
  "warranty",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "ورود",
  "ثبت-نام",
  "علاقه-مندی-ها",
  "مقایسه",
  "سبد-خرید",
  "محصولات",
  "آخرین-مشاهده-ها",
  "تماس",
  "درباره-ما",
  "سوالات-متداول",
  "شرایط-استفاده",
  "حریم-خصوصی",
  "ارسال",
  "مرجوعی",
  "راهنمای-سایز",
  "پیگیری-سفارش",
  "پیگیری",
  "برندها",
  "دسته-بندی-ها",
  "بلاگ",
  "داشبورد",
  "جستجو",
  "تسویه-حساب",
  "گارانتی",
  "فاکتور",
  "invoice",
];

function stripTrailingSlash(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

/** Canonical FA href for a known EN (or already-FA) page path; unknown paths returned as-is. */
export function faHref(enPath: string): string {
  const raw = String(enPath || "").trim();
  if (!raw) return "/";
  const qIndex = raw.indexOf("?");
  const pathOnly = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const query = qIndex >= 0 ? raw.slice(qIndex) : "";
  const normalized = stripTrailingSlash(pathOnly);

  if (normalized === "/dashboard" || normalized === "/داشبورد") {
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : "");
    const tab = params.get("tab");
    if (tab === "wishlist") return "/علاقه-مندی-ها";
    if (tab === "compare") return "/مقایسه";
    if (tab === "recent") return "/آخرین-مشاهده-ها";
    return (EN_TO_FA["/dashboard"] || "/داشبورد") + query;
  }

  if (normalized.startsWith("/products/")) {
    return "/محصولات/" + normalized.slice("/products/".length) + query;
  }
  if (normalized.startsWith("/blog/")) {
    return "/بلاگ/" + normalized.slice("/blog/".length) + query;
  }
  if (normalized.startsWith("/brands/")) {
    const slug = normalized.slice("/brands/".length);
    if (slug && !slug.includes("/")) return "/" + encodeURIComponent(decodeSafe(slug)) + query;
  }
  if (normalized.startsWith("/categories/")) {
    const slug = normalized.slice("/categories/".length);
    if (slug && !slug.includes("/")) return "/" + encodeURIComponent(decodeSafe(slug)) + query;
  }

  const fa = EN_TO_FA[normalized];
  if (fa) return fa + query;
  return raw;
}

function decodeSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Product PDP — English slug kept under FA list prefix. */
export function productHref(slug: string): string {
  const s = String(slug || "").trim().replace(/^\/+|\/+$/g, "");
  return `/محصولات/${s}`;
}

/** Brand/category detail: root `/{slug}` (proxy rewrites when slug exists). */
export function brandOrCategoryHref(slug: string): string {
  const s = String(slug || "").trim().replace(/^\/+|\/+$/g, "");
  return `/${encodeURIComponent(s)}`;
}

export function blogPostHref(slug: string): string {
  const s = String(slug || "").trim().replace(/^\/+|\/+$/g, "");
  return `/بلاگ/${s}`;
}

/**
 * Resolve EN→FA redirect target for an incoming pathname.
 * Returns null when the path should not redirect (already FA, or no mapping).
 */
export function enPathToFaRedirect(pathname: string): string | null {
  let p = pathname;
  try {
    p = decodeURIComponent(pathname);
  } catch {
    /* keep */
  }
  p = stripTrailingSlash(p);

  if (EN_TO_FA[p]) return EN_TO_FA[p];

  if (p.startsWith("/products/")) {
    const rest = p.slice("/products/".length);
    if (rest) return `/محصولات/${rest}`;
  }
  if (p.startsWith("/blog/")) {
    const rest = p.slice("/blog/".length);
    if (rest) return `/بلاگ/${rest}`;
  }
  if (p.startsWith("/invoice/")) {
    const rest = p.slice("/invoice/".length);
    if (rest) return `/فاکتور/${rest}`;
  }
  if (p.startsWith("/brands/")) {
    const slug = p.slice("/brands/".length);
    if (slug && !slug.includes("/")) return `/${slug}`;
  }
  if (p.startsWith("/categories/")) {
    const slug = p.slice("/categories/".length);
    if (slug && !slug.includes("/")) return `/${slug}`;
  }

  return null;
}

/**
 * Resolve FA→EN rewrite destination (including nested product/blog prefixes).
 */
export function faPathToEnRewrite(pathname: string): string | null {
  let p = pathname;
  try {
    p = decodeURIComponent(pathname);
  } catch {
    /* keep */
  }
  p = stripTrailingSlash(p);

  if (FA_TO_EN[p]) return FA_TO_EN[p];

  if (p.startsWith("/محصولات/")) {
    const rest = p.slice("/محصولات/".length);
    if (rest) return `/products/${rest}`;
  }
  if (p.startsWith("/بلاگ/")) {
    const rest = p.slice("/بلاگ/".length);
    if (rest) return `/blog/${rest}`;
  }
  if (p.startsWith("/فاکتور/")) {
    const rest = p.slice("/فاکتور/".length);
    if (rest) return `/invoice/${rest}`;
  }

  return null;
}

/** Next.js rewrite entries: FA → EN (includes query destinations). */
export function nextFaRewrites(): { source: string; destination: string }[] {
  const out: { source: string; destination: string }[] = [];
  for (const r of FA_PAGE_ROUTES) {
    out.push({ source: r.fa, destination: r.en });
  }
  out.push(
    { source: "/محصولات/:path*", destination: "/products/:path*" },
    { source: "/بلاگ/:path*", destination: "/blog/:path*" },
    { source: "/فاکتور/:path*", destination: "/invoice/:path*" },
    { source: "/%D9%88%D8%B1%D9%88%D8%AF", destination: "/login" },
    { source: "/%D8%AB%D8%A8%D8%AA-%D9%86%D8%A7%D9%85", destination: "/register" },
  );
  return out;
}
