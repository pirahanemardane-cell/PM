import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { applySecurityHeaders } from "@/lib/security/headers";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/request-id";

const PERSIAN_ROUTES: Record<string, string> = {
  "/ورود": "/login",
  "/ثبت-نام": "/register",
  "/علاقه-مندی-ها": "/wishlist",
  "/مقایسه": "/compare",
  "/سبد-خرید": "/cart",
  "/آخرین-مشاهده-ها": "/recently-viewed",
  "/محصولات": "/products",
  "/تماس": "/contact",
  "/درباره-ما": "/about",
  "/سوالات-متداول": "/faq",
  "/شرایط-استفاده": "/terms",
  "/حریم-خصوصی": "/privacy",
  "/ارسال": "/shipping",
  "/مرجوعی": "/returns",
  "/راهنمای-سایز": "/size-guide",
  "/پیگیری-سفارش": "/track",
  "/پیگیری": "/track",
};

const RESERVED = new Set([
  "", "admin", "api", "login", "register", "dashboard", "cart", "checkout",
  "products", "brands", "blog", "contact", "about", "faq", "terms", "privacy",
  "shipping", "returns", "size-guide", "track", "categories", "tag", "wishlist",
  "compare", "recently-viewed", "_next", "favicon.ico", "robots.txt",
  "sitemap.xml", "llms.txt", "ورود", "ثبت-نام", "علاقه-مندی-ها", "مقایسه",
  "سبد-خرید", "محصولات",
]);

function decodeSeg(raw: string): string {
  let s = raw;
  for (let i = 0; i < 3; i++) {
    try {
      const d = decodeURIComponent(s);
      if (d === s) break;
      s = d;
    } catch {
      break;
    }
  }
  return s;
}

function requestIdFrom(request: NextRequest): string {
  return resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
}

async function sessionRewrite(request: NextRequest, pathname: string) {
  const rid = requestIdFrom(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const sessionRes = await updateSession(request);
  const rewrite = NextResponse.rewrite(url);
  sessionRes.cookies.getAll().forEach((c) => rewrite.cookies.set(c.name, c.value));
  return applySecurityHeaders(rewrite, rid);
}

async function supabaseExists(
  table: "brands" | "categories",
  slug: string,
): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return false;
  try {
    const q =
      table === "brands"
        ? `slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=slug&limit=1`
        : `slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`;
    const res = await fetch(`${base}/rest/v1/${table}?${q}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      // edge-friendly
      next: { revalidate: 60 },
    } as RequestInit);
    if (!res.ok) return false;
    const rows = (await res.json()) as unknown[];
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}


async function lookupUrlRedirect(
  pathname: string,
): Promise<{ to: string; code: number } | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  let p = pathname;
  try {
    p = decodeURIComponent(pathname);
  } catch {
    /* ignore */
  }
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  try {
    const q = `from_path=eq.${encodeURIComponent(p)}&is_active=eq.true&select=to_path,status_code&limit=1`;
    const res = await fetch(`${base}/rest/v1/url_redirects?${q}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      next: { revalidate: 30 },
    } as RequestInit);
    if (!res.ok) return null;
    const rows = (await res.json()) as { to_path?: string; status_code?: number }[];
    if (!Array.isArray(rows) || !rows[0]?.to_path) return null;
    const code = Number(rows[0].status_code) || 301;
    return { to: String(rows[0].to_path), code };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ریدایرکت formal از DB (۳۰۱ و ...)
  try {
    const hit = await lookupUrlRedirect(pathname);
    if (hit) {
      const url = request.nextUrl.clone();
      url.pathname = hit.to;
      return NextResponse.redirect(url, hit.code as 301 | 302 | 307 | 308);
    }
  } catch {
    /* ignore lookup errors */
  }

  let dest = PERSIAN_ROUTES[pathname];
  if (!dest) {
    try {
      dest = PERSIAN_ROUTES[decodeURIComponent(pathname)];
    } catch {
      /* ignore */
    }
  }
  if (dest) return sessionRewrite(request, dest);

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 1) {
    const seg = decodeSeg(parts[0]);
    if (!RESERVED.has(seg) && !RESERVED.has(seg.toLowerCase()) && !seg.includes(".")) {
      // برند اول — URL نوار همان /لاکوست می‌ماند
      if (await supabaseExists("brands", seg)) {
        return sessionRewrite(request, "/brands/" + seg);
      }
      if (await supabaseExists("categories", seg)) {
        return sessionRewrite(request, "/categories/" + seg);
      }
    }
  }

  return applySecurityHeaders(await updateSession(request), requestIdFrom(request));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|hero/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|ico|webmanifest)$).*)",
  ],
};
