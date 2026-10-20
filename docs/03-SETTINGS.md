# Settings سیستم — formal (فاز ۳)

## جدول `site_settings`
- کلید/مقدار jsonb
- خواندن عمومی (SELECT)
- نوشتن فقط admin

## کلیدهای اولیه
- `store` — نام فروشگاه، currency
- `shipping_warehouse` — شهر/مختصات انبار
- `seo` — allow_index

## استفاده
```ts
const { data } = await supabase.from('site_settings').select('value').eq('key', 'store').maybeSingle();
```
