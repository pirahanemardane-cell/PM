# فاز ۲۲ — Bundle analysis + Core Web Vitals (formal)

تاریخ زیرساخت: ۲۰۲۶-۱۰-۲۴
وضعیت زیرساخت: آماده قبل از ایندکس
اندازه‌گیری میدانی: بعد از ایندکس + ترافیک واقعی

## Bundle analysis
اسکریپت: npm run analyze (روی CI/ماشین بیلد — نه الزام روزمره لوکال)
ANALYZE=true next build + @next/bundle-analyzer

## Core Web Vitals
- web-vitals → POST /api/vitals (لاگ Vercel)
- @vercel/speed-insights در layout

اهداف: LCP ≤ 2.5s | INP ≤ 200ms | CLS ≤ 0.1

صفحات چک نزدیک ایندکس: / | /products | PDP | /cart | /checkout
ابزار دستی: PageSpeed Insights (موبایل)
