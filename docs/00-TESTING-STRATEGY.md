# Testing Strategy — پیراهن مردانه

نسخه: ۱.۰ | ۲۰۲۶-۱۰-۲۰ | محدوده: فاز ۰ تا ۱۷ (بدون درگاه پرداخت)

## هدف
جلوگیری از رگرسیون روی مسیر خرید، احراز هویت، سفارش و پنل ادمین — بدون وابستگی به درگاه (فاز ۱۱).

## لایه‌ها

### ۱) دستی (الزامی قبل از هر لانچ محتوا)
| مسیر | چه چیزی چک شود |
|------|----------------|
| /products | لیست، فیلتر، صفحه محصول |
| افزودن به سبد → /cart → /checkout | موجودی، آدرس، روش ارسال، جمع |
| /dashboard | سفارش، آدرس، مرجوعی، پروفایل، تغییر رمز |
| /admin | محصول، سفارش، ارسال، نظرات، مرجوعی |
| /api/health | ok |
| موبایل RTL | منو، سبد، چک‌اوت |

### ۲) Unit (Vitest) — اولویت بعدی کد
- قیمت / تخفیف / free-shipping threshold
- business-rules (مرجوعی، لغو مشتری)
- نرمال‌سازی جستجوی فارسی
- normalizeIranMobile

فایل‌ها: `src/lib/**` با پسوند `.test.ts` کنار ماژول یا در `__tests__`.

### ۳) Integration
- Auth: sign-in / sign-out / change password
- Cart: add / update / merge guest→user
- Orders: create (mock پرداخت) / cancel customer / status history
- Returns: create در پنجره مجاز

### ۴) E2E (بعد از محتوای واقعی)
- Playwright روی staging
- سناریو: جستجو → PDP → سبد → چک‌اوت تا قبل از درگاه

## Definition of Done تست
- [ ] مسیر دستی جدول بالا بدون خطای کاربر
- [ ] unitهای business-rules و قیمت سبز (وقتی نوشته شدند)
- [ ] هیچ secret در تست commit نشود

## خارج از محدوده فعلی
- تست خودکار درگاه پرداخت (فاز ۱۱)
- تست بار (load) production
