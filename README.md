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
