# امنیت پیراهن مردانه

## انجام‌شده در کد
- Rate limit (Upstash) روی auth / contact / API
- Security headers در middleware + next.config
- Health check: `/api/health`
- بک‌آپ روزانه: `/api/cron/backup` → R2 (نیاز به `CRON_SECRET`)
- RLS hardening: `supabase/migrations/030_rls_hardening.sql`
- Gitleaks secret scanning
- Edge cache برای APIهای عمومی
- Region: Vercel `fra1` (نزدیک به کاربر ایران/اروپا)

## کارهای دستی (یک‌بار)
1. در Supabase → SQL Editor محتوای `030_rls_hardening.sql` را اجرا کنید.
2. در Supabase → Authentication → URL Configuration دامنه production را مجاز کنید.
3. `SUPABASE_SERVICE_ROLE_KEY` فقط در Vercel server env (هرگز `NEXT_PUBLIC_`).
4. R2 و Upstash و `CRON_SECRET` فقط server-side در Vercel.
5. Cloudflare: SSL Full (strict)، Always Use HTTPS، Bot Fight Mode در صورت نیاز.

## Load Balancing & Scaling
- Vercel خودکار traffic را بین edge/serverless scale می‌کند.
- Region ثابت `fra1` در `vercel.json` برای latency پایدار.
- Supabase connection pooling (Transaction mode) برای اوج ترافیک توصیه می‌شود.

## تست سریع RLS
با anon key (نه service role):
- `contact_messages` نباید SELECT عمومی بدهد
- `orders` فقط سفارش خود کاربر
- `products` فقط published
