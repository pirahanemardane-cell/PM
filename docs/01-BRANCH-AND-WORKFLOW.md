# فاز ۱ — گردش کار برنچ و توسعه

مکمل: docs/00-GIT-CONVENTION.md

## مدل برنچ

- main: production و دیپلوی Vercel
- feat/*: قابلیت جدید
- fix/*: باگ
- chore/*: docs و تنظیمات
- hotfix/*: رفع فوری production

## کار روزانه — تغییر کوچک
git checkout main
git pull
git add -A
git commit -m "docs: ..."
git push

## کار روزانه — قابلیت غیرکوچک
git checkout main
git pull
git checkout -b feat/short-name
git push -u origin feat/short-name
# سپس PR به main

## قوانین
- روی main فقط تغییر کم‌ریسک
- migration را در PR بنویس
- هرگز env و کلید را commit نکن
- بعد از push دیپلوی را smoke-test کن
