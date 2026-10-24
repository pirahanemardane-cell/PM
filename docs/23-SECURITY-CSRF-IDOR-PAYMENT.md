# امنیت formal — CSRF / IDOR / Payment verify

تاریخ: ۲۰۲۶-۱۰-۲۴
الگو: فروشگاه‌های بزرگ + درگاه‌های ایرانی (زرین‌پال)

## CSRF
- چک Origin / Sec-Fetch-Site روی POST/PUT/PATCH/DELETE به /api/*
- معاف: cron، webhook، vitals
- Server Actions Next: same-site + کوکی httpOnly Supabase

## IDOR
- قوانین canAccessOrder / canAccessUserOwned
- تست واحد Vitest
- پاسخ not_found به‌جای نشت وجود منبع
- RLS دیتابیس مکمل است

## Payment verify عمیق
- جدول payment_webhook_events + UNIQUE(provider, event_key)
- مبلغ verify === مبلغ سفارش
- بدون ZARINPAL_MERCHANT_ID پرداخت واقعی تأیید نمی‌شود
- PAYMENT_TEST_MODE=true فقط برای تست صریح
- API: POST /api/payment/verify

## Env (Vercel — وقتی درگاه آماده شد)
- ZARINPAL_MERCHANT_ID
- PAYMENT_TEST_MODE (اختیاری true فقط در preview)
- CSRF_TRUSTED_ORIGINS (اختیاری، ویرگول‌جدا)
