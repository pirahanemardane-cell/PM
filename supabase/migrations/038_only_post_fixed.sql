-- فقط پست فعال + نرخ ثابت
UPDATE shipping_methods
SET is_active = false, updated_at = now()
WHERE COALESCE(provider_code, '') NOT ILIKE '%post%'
  AND title NOT ILIKE '%پست%';

UPDATE shipping_methods
SET is_active = true,
    pricing_type = 'fixed',
    provider_code = 'post',
    title = COALESCE(NULLIF(TRIM(title), ''), 'پست پیشتاز'),
    description = COALESCE(description, 'ارسال از طریق پست — ۲ تا ۴ روز کاری'),
    fee = CASE WHEN fee IS NULL OR fee <= 0 THEN 45000 ELSE fee END,
    sort_order = 1,
    updated_at = now()
WHERE provider_code ILIKE '%post%' OR title ILIKE '%پست%';

INSERT INTO shipping_methods (title, description, fee, is_active, sort_order, provider_code, pricing_type, api_config)
SELECT 'پست پیشتاز', 'ارسال از طریق پست — ۲ تا ۴ روز کاری', 45000, true, 1, 'post', 'fixed', '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM shipping_methods
  WHERE provider_code ILIKE '%post%' OR title ILIKE '%پست%'
);
