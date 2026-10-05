import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { applySecurityHeaders } from "@/lib/security/headers";
import { createClient } from "@supabase/supabase-js";

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
  "about",
  "blog",
  "brands",
  "cart",
  "categories",
  "checkout",
  "contact",
  "dashboard",
  "faq",
  "login",
  "products",
  "register",
  "privacy",
  "returns",
  "shipping",
  "size-guide",
  "terms",
  "track",
  "tag",
  "wishlist",
  "compare",
  "api",
  "admin",
  "ورود",
  "ثبت-نام",
  "علاقه-مندی-ها",
  "مقایسه",
  "سبد-خرید",
  "محصولات",
  "تماس",
  "درباره-ما",
  "_next",
]);

function decodePath(raw: string): string {
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

  // تک‌بخشی: /لاکوست یا /پیراهن-رسمی → rewrite داخلی
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 1) {
    const seg = decodePath(parts[0]);
    if (!RESERVED.has(seg) && !RESERVED.has(parts[0])) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        try {
          const sb = createClient(url, key);
          // اول برند
          const { data: brand } = await sb
            .from("brands")
            .select("slug")
            .eq("is_active", true)
            .eq("slug", seg)
            .maybeSingle();
          if (brand?.slug) {
            const u = request.nextUrl.clone();
            u.pathname = "/brands/" + encodeURIComponent(brand.slug);
            const sessionRes = await updateSession(request);
            const rw = NextResponse.rewrite(u);
            sessionRes.cookies.getAll().forEach((c) => rw.cookies.set(c.name, c.value));
            return applySecurityHeaders(rw);
          }
          // بعد دسته
          const { data: cat } = await sb
            .from("categories")
            .select("slug")
            .eq("slug", seg)
            .maybeSingle();
          if (cat?.slug) {
            const u = request.nextUrl.clone();
            u.pathname = "/categories/" + encodeURIComponent(cat.slug);
            const sessionRes = await updateSession(request);
            const rw = NextResponse.rewrite(u);
            sessionRes.cookies.getAll().forEach((c) => rw.cookies.set(c.name, c.value));
            return applySecurityHeaders(rw);
          }
        } catch (e) {
          console.error("[middleware slug resolve]", e);
        }
      }
    }
  }

  return applySecurityHeaders(await updateSession(request));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|hero/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|ico|webmanifest)$).*)",
  ],
};
