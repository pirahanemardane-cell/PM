# تعریف Notification و Analytics — فاز ۰

نسخه: ۱.۰ | ۲۰۲۶-۱۰-۲۰

## ۱) سیستم اعلان (Notification)

### کانال‌های فعلی
| کانال | وضعیت | محل |
|-------|--------|------|
| In-app (جدول notifications) | پیاده‌سازی شده | داشبورد مشتری تب اعلان‌ها |
| Realtime به‌روزرسانی | پیاده‌سازی شده | notifications-provider |
| ایمیل transactional | نه | بعد از انتخاب provider |
| SMS وضعیت سفارش | اسکلت | lib/sms + تنظیمات ادمین |

### رویدادهای استاندارد اعلان
| رویداد | مخاطب | اولویت |
|--------|--------|--------|
| order_status_changed | مشتری | بالا |
| return_status_changed | مشتری | بالا |
| review_approved | مشتری | متوسط |
| low_stock (ادمین) | ادمین | متوسط |
| new_contact_message | ادمین | متوسط |

### قوانین
- متن اعلان فارسی و کوتاه
- لینک داخلی به سفارش / مرجوعی / محصول
- بدون قرار دادن داده حساس (کارت، رمز)
- mark read / mark all در UI مشتری

## ۲) Analytics (نیازمندی)

### سطح ۱ — الان
- Health + Sentry خطا
- search_queries (در صورت جدول)
- گزارش فروش ادمین (در صورت فعال)

### سطح ۲ — قبل از ایندکس عمومی
| رویداد | پارامتر حداقل |
|--------|----------------|
| view_item | product_id, price |
| add_to_cart | product_id, qty |
| begin_checkout | value |
| purchase | order_id, value (بعد از فاز ۱۱) |
| search | query, result_count |

### ابزار پیشنهادی
- GA4 یا Plausible + dataLayer تجارت‌الکترونیک
- داشبورد ادمین داخلی برای funnel ساده

### خارج از محدوده تا لانچ محتوا
- A/B تست
- attribution تبلیغات
