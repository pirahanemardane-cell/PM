# Realtime — پیراهن مردانه

## معماری
- یک کانال مرکزی: `RealtimeBridge` در root layout
- رویدادهای پنجره‌ای: `src/lib/realtime/events.ts` (`RT.*`)
- شنونده UI: `useRtEvent(RT.xxx, callback)`
- اشتراک مستقیم جدول (در صورت نیاز): `useRealtimeTable`

## جداول تحت نظر
| جدول | رویداد | مصرف‌کننده نمونه |
|------|--------|------------------|
| cart_items | RT.cart | سبد / هدر |
| wishlists | RT.wishlist | علاقه‌مندی |
| orders | RT.orders | سفارش کاربر / ادمین |
| product_variants | RT.stock | PDP BuyBox |
| products | RT.catalog | لیست‌ها |
| reviews | RT.reviews | نظرات PDP |
| contact_messages | RT.support | پشتیبانی ادمین |

## کار دستی (یک‌بار)
در Supabase → SQL Editor فایل `031_realtime_publication.sql` را اجرا کن.

## تست سریع
1. دو تب باز کن (یکی ادمین، یکی فروشگاه)
2. stock یک واریانت را در ادمین عوض کن → PDP بدون رفرش باید به‌روز شود
3. آیتم به سبد اضافه کن → هدر/سبد باید بدون رفرش به‌روز شود
