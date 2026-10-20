# Phase 5 — Catalog content status

Date: 2026-10-20

| Item | Status |
|------|--------|
| Catalog structure (filter, slug, PLP) | done (prior) |
| Demo products seed SQL | done (`020_catalog_demo_products.sql`) |
| Size guide page + fallback table | done |
| FAQ defaults (richer) | done (`static-pages.ts`) |
| About page copy | done |
| Terms / privacy / shipping / returns defaults | done |
| Admin-editable pages via site_settings | done (prior CMS) |
| Owner final product photos/copy | owner data (replace demo anytime in admin) |

## Apply if catalog empty
Run in Supabase: `supabase/migrations/020_catalog_demo_products.sql`

## Do not
Rewrite PLP/PDP architecture for seed content.
