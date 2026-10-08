# پیراهن مردانه | pirahanmardane.ir

فروشگاه تخصصی پیراهن مردانه – ساخته‌شده با Next.js 15 + Supabase + Vercel + Cloudflare + R2

## تکنولوژی‌ها
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend**: Supabase (Auth + Database + Realtime + Storage)
- **Hosting**: Vercel (region: fra1)
- **CDN & Security**: Cloudflare
- **Files & Backup**: Cloudflare R2
- **Monitoring**: Sentry
- **Rate Limit**: Upstash Redis

## راه‌اندازی محلی

\`\`\`bash
# نصب وابستگی‌ها
npm install

# کپی فایل محیطی
cp .env.example .env.local
# سپس مقادیر را پر کنید

# اجرای توسعه
npm run dev
\`\`\`

سایت روی http://localhost:3000 بالا می‌آید.

## ساختار مهم
- `src/app/(shop)` → صفحات فروشگاه
- `src/app/admin` → پنل ادمین
- `src/app/api` → APIها
- `supabase/migrations` → تمام تغییرات دیتابیس
- `docs/SECURITY.md` → راهنمای امنیت

## استقرار
هر push روی branch اصلی به‌صورت خودکار روی Vercel دیپلوی می‌شود.

## وضعیت فعلی (اکتبر ۲۰۲۶)
- سایت زنده است اما هنوز noindex (پیش‌انتشار)
- کاتالوگ محصول واقعی هنوز وارد نشده
- درگاه پرداخت و باشگاه مشتریان کامل در فاز بعدی

## تماس
برای سوالات فنی به صاحب پروژه مراجعه کنید.

## مستندات فاز ۰
- [نیازمندی‌ها و User Flows](docs/00-REQUIREMENTS-AND-USER-FLOWS.md)
- [استاندارد کدنویسی](docs/00-CODING-STANDARDS.md)
- [قرارداد Git](docs/00-GIT-CONVENTION.md)
- [Definition of Done](docs/00-DEFINITION-OF-DONE.md)

## مستندات فاز ۱
- [گردش کار برنچ](docs/01-BRANCH-AND-WORKFLOW.md)
- [لاگ‌گیری](docs/01-LOGGING.md)

## مستندات فاز ۴
- [وضعیت احراز هویت](docs/04-AUTH-STATUS.md)

## بستن فاز ۰ تا ۴
- [سند بستن رسمی](docs/PHASES-0-4-CLOSURE.md)

## مستندات فاز ۵
- [وضعیت کاتالوگ](docs/05-CATALOG-STATUS.md)

## مستندات فاز ۶
- [وضعیت محتوا](docs/06-CONTENT-STATUS.md)

## مستندات فاز ۷
- [صفحه محصول](docs/07-PRODUCT-PAGE.md)

## مستندات فاز ۸
- [وضعیت جستجو](docs/08-SEARCH-STATUS.md)

## مستندات فاز ۹
- [وضعیت سبد](docs/09-CART-STATUS.md)

## مستندات فاز ۱۰
- [وضعیت چک‌اوت](docs/10-CHECKOUT-STATUS.md)

## مستندات فاز ۱۱
- [وضعیت پرداخت](docs/11-PAYMENT-STATUS.md)
