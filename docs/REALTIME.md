# Realtime — وضعیت کامل

## کانال مرکزی
`RealtimeBridge` در root layout — کانال `pm:site-rt-v4`

## رویدادها (`RT`)
| کلید | event | منبع جدول |
|------|-------|-----------|
| cart | pm:cart-changed | cart_items |
| wishlist | pm:wishlist-changed | wishlists |
| orders | pm:orders-changed | orders |
| stock | pm:stock-changed | product_variants |
| catalog | pm:catalog-changed | products |
| reviews | pm:reviews-changed | reviews |
| support | pm:support-changed | contact_messages |
| returns | pm:returns-changed | return_requests |
| notifications | pm:notifications-changed | notifications |

## مصرف‌کننده‌ها
- سبد: refresh در Bridge + store
- موجودی PDP: ProductBuyBox ← RT.stock
- نظرات PDP: ProductReviews ← RT.reviews
- لیست محصولات: ProductInfiniteList ← RT.catalog
- سفارش ادمین: listener روی pm:orders-changed
- نظرات ادمین: useRtEvent(RT.reviews)
- پیام تماس ادمین: ContactMessagesRealtimeRefresh ← RT.support
- اعلان‌ها: کانال اختصاصی + RT.notifications

## Publication
همه جداول لازم باید در `supabase_realtime` باشند (تأیید شده).

## Fallback
با `visibilitychange` وقتی تب دوباره فعال می‌شود، سیگنال همگام‌سازی نرم ارسال می‌شود.
