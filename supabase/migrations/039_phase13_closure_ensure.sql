-- اطمینان از وجود جداول/کلیدهای فاز ۱۳ (idempotent)
-- مناطق و ارسال رایگان اگر قبلاً از 035/036 آمده باشند تکراری نمی‌سازند

-- free shipping keys
INSERT INTO public.site_settings (key, value)
VALUES
  ('free_shipping_enabled', 'true'),
  ('free_shipping_min_amount', '2000000'),
  ('free_shipping_exclude_provider_codes', 'peyk,alopeyk')
ON CONFLICT (key) DO NOTHING;

-- tracking columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text null,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz null;
