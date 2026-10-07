# فاز ۱ — لاگ‌گیری و مشاهده‌پذیری

## ابزار فعلی
- Sentry: خطاهای runtime
- GET /api/health: سلامت
- Cron backup به R2 با CRON_SECRET
- console.error با پیشوند دامنه مثل [checkout] [shipping]

## اصول
1. هرگز secret، توکن، cookie کامل لاگ نشود
2. پیشوند ثابت: [shipping] [checkout] [createOrder]
3. UI پیام فارسی؛ جزئیات فنی در لاگ/Sentry
4. خطای قابل انتظار API ارسال: warn نه error بحرانی

## باید لاگ شود
- شکست API ارسال
- شکست ثبت سفارش
- خطای DB غیرمنتظره
- برخورد Rate limit
- نتیجه cron backup

## نباید لاگ شود
- SERVICE_ROLE_KEY و secrets
- Access token سرویس‌های ارسال

## تست سلامت
curl -s https://pirahanmardane.ir/api/health
