import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { applySecurityHeaders } from "@/lib/security/headers";

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
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "apple-icon.png",
  "icon.png",
  "icon.svg",
  "icon0.svg",
  "icon1.png",
  "ورود",
  "ثبت-نام",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const catMatch = pathname.match(/^\/categories\/(.+)$/);
  if (catMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/" + catMatch[1];
    return applySecurityHeaders(NextResponse.redirect(url, 308));
  }

  let dest = PERSIAN_ROUTES[pathname];
  if (!dest) {
    try {
      dest = PERSIAN_ROUTES[decodeURIComponent(pathname)];
    } catch {
      /* ignore */
    }
  }

  if (dest) {
    const url = request.nextUrl.clone();
    url.pathname = dest;
    const sessionRes = await updateSession(request);
    const rewrite = NextResponse.rewrite(url);
    sessionRes.cookies.getAll().forEach((c) => {
      rewrite.cookies.set(c.name, c.value);
    });
    return applySecurityHeaders(rewrite);
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 1) {
    let seg = parts[0];
    try {
      seg = decodeURIComponent(seg);
    } catch {
      /* keep */
    }
    const lower = seg.toLowerCase();
    if (!RESERVED.has(seg) && !RESERVED.has(lower) && !seg.includes(".")) {
      const url = request.nextUrl.clone();
      url.pathname = "/categories/" + encodeURIComponent(seg);
      const sessionRes = await updateSession(request);
      const rewrite = NextResponse.rewrite(url);
      sessionRes.cookies.getAll().forEach((c) => {
        rewrite.cookies.set(c.name, c.value);
      });
      return applySecurityHeaders(rewrite);
    }
  }


  return applySecurityHeaders(await updateSession(request));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|hero/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|ico|webmanifest)$).*)",
  ],
};
