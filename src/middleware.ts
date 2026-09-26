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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return applySecurityHeaders(await updateSession(request));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
