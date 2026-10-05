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
  "ورود",
  "ثبت-نام",
  "علاقه-مندی-ها",
  "مقایسه",
  "سبد-خرید",
  "محصولات",
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

async function withSessionRewrite(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const sessionRes = await updateSession(request);
  const rewrite = NextResponse.rewrite(url);
  sessionRes.cookies.getAll().forEach((c) => {
    rewrite.cookies.set(c.name, c.value);
  });
  return applySecurityHeaders(rewrite);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // مسیرهای فارسی ثابت
  let dest = PERSIAN_ROUTES[pathname];
  if (!dest) {
    try {
      dest = PERSIAN_ROUTES[decodeURIComponent(pathname)];
    } catch {
      /* ignore */
    }
  }
  if (dest) {
    return withSessionRewrite(request, dest);
  }

  // تک‌بخشی: /لاکوست یا /پیراهن-رسمی
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 1) {
    const seg = decodeSeg(parts[0]);
    if (!RESERVED.has(seg) && !RESERVED.has(seg.toLowerCase()) && !seg.includes(".")) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        try {
          const sb = createClient(supabaseUrl, supabaseKey);

          // 1) برند اول
          const { data: brand } = await sb
            .from("brands")
            .select("slug")
            .eq("is_active", true)
            .eq("slug", seg)
            .maybeSingle();

          if (brand?.slug) {
            // URL مرورگر همان /لاکوست می‌ماند
            return withSessionRewrite(
              request,
              "/brands/" + encodeURIComponent(brand.slug),
            );
          }

          // 2) دسته
          const { data: cat } = await sb
            .from("categories")
            .select("slug")
            .eq("slug", seg)
            .maybeSingle();

          if (cat?.slug) {
            return withSessionRewrite(
              request,
              "/categories/" + encodeURIComponent(cat.slug),
            );
          }
        } catch (e) {
          console.error("[middleware resolve slug]", e);
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
