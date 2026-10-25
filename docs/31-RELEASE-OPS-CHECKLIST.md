# چک‌لیست رسمی: Staging → QA → Backup → Smoke → Monitor

سایت: https://pirahanmardane.ir
علامت: [x] پاس | [ ] باز | [N/A] رد/غیرکاربردی

## 1) Staging
- [N/A] محیط staging جدا — عمداً حذف شد
- [x] Production از main

## 2) QA (docs/30-QA-CHECKLIST.md)
- [x] چک‌لیست Formal موجود
- [x] npm test 47/47 — 2026-10-25
- [x] security-smoke PASS — 2026-10-25
- [N/A] e2e لوکال (mac12)
- [ ] Functional/UI دستی مالک

## 3) Backup
- [x] Cron /api/cron/backup روزانه 03:00 UTC
- [x] CRON_SECRET در health = ok
- [ ] تأیید یک اجرای موفق (Vercel Cron Logs یا curl با secret)
- [ ] تأیید وجود فایل/خروجی قابل بازیابی
- [ ] سیاست نگه‌داری (چند روز)

## 4) Smoke (بعد دیپلوی)
- [x] /api/health ok
- [x] security-smoke
- [ ] خانه 200 در مرورگر
- [ ] مسیر اصلی فروشگاه دستی

## 5) Monitor
- [x] /api/health + /status
- [x] Sentry / Upstash / R2 از health
- [ ] Uptime خارجی (UptimeRobot و مشابه) — اختیاری
- [ ] کانال هشدار — اختیاری

## جریان بدون Staging
1. merge به main
2. Vercel Production سبز
3. smoke: health + security-smoke
4. در صورت نیاز QA دستی
5. نگاه به health/Sentry

## امضا
| مرحله | نتیجه | تاریخ |
|-------|--------|-------|
| Staging | N/A | 2026-10-25 |
| QA | auto PASS / manual open | 2026-10-25 |
| Backup | cron ok / verify open | |
| Smoke | partial PASS | 2026-10-25 |
| Monitor | in-app ok | 2026-10-25 |
