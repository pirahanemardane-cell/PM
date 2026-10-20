# Soft-delete policy — Phase 3

## Rule
- Soft-delete column: `deleted_at` (null = active)
- Storefront queries must exclude soft-deleted rows (`.is("deleted_at", null)`)
- Prefer soft-delete for products, categories, brands, blog
- Hard delete only for junk data / GDPR via service role

## Code
- `src/lib/soft-delete.ts`
- Search already filters `deleted_at` on products

## Admin
When deleting in admin UI, set `deleted_at = now()` instead of DELETE when the table supports it.
