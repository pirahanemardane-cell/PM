# Staging

## Branches
- `main` → Production (pirahanmardane.ir)
- `staging` → Staging / Preview

## Deploy
- Push to `main` → Vercel Production
- Push to `staging` → Vercel Preview (optional custom domain staging.pirahanmardane.ir)

## Supabase
- Prefer a **separate** Supabase project for staging
- Run the same migrations as production
- Never point staging env at production SERVICE_ROLE in day-to-day work

## Env on Vercel
- Production: real keys, NEXT_PUBLIC_SITE_URL=https://pirahanmardane.ir
- Preview/Staging: staging Supabase + NEXT_PUBLIC_SITE_URL=staging URL
- CRON_SECRET should differ per environment when possible

## Workflow
1. Develop / test on `staging`
2. Merge `staging` → `main` when ready for production
