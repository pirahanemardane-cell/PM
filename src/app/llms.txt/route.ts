import { NextResponse } from "next/server";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir").replace(/\/$/, "");

export function GET() {
  const body = `# پیراهن مردانه
> فروشگاه تخصصی پیراهن مردانه، کروات، پاپیون و اکسسوری

## صفحات اصلی
- [خانه](${site}/)
- [محصولات](${site}/محصولات)
- [دسته‌بندی‌ها](${site}/دسته-بندی-ها)
- [برندها](${site}/برندها)
- [بلاگ](${site}/بلاگ)
- [تماس](${site}/تماس)
- [درباره ما](${site}/درباره-ما)
- [سوالات متداول](${site}/سوالات-متداول)

## قوانین
- [قوانین و مقررات](${site}/شرایط-استفاده)
- [حریم خصوصی](${site}/حریم-خصوصی)
- [شرایط ارسال](${site}/ارسال)
- [مرجوعی](${site}/مرجوعی)

## نقشه سایت
- [sitemap.xml](${site}/sitemap.xml)
`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
