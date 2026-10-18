-- =====================================================
-- فاز ۱۳ — Free shipping rules
-- =====================================================

-- تنظیمات در site_settings (اگر جدول از قبل هست)
-- کلیدها:
--   free_shipping_enabled: true/false
--   free_shipping_min_amount: عدد تومان (مثلاً 2000000)
--   free_shipping_exclude_provider_codes: لیست کدهایی که شامل ارسال رایگان نمی‌شوند (مثلاً peyk,alopeyk)

DO $$
BEGIN
  -- اگر جدول site_settings وجود دارد، کلیدها را اضافه کن
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'site_settings'
  ) THEN
    INSERT INTO public.site_settings (key, value)
    VALUES
      ('free_shipping_enabled', 'true'),
      ('free_shipping_min_amount', '2000000'),
      ('free_shipping_exclude_provider_codes', 'peyk,alopeyk')
    ON CONFLICT (key) DO NOTHING;
  ELSE
    -- جدول ساده اگر وجود نداشت
    CREATE TABLE IF NOT EXISTS public.site_settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public can read site_settings"
      ON public.site_settings FOR SELECT USING (true);

    INSERT INTO public.site_settings (key, value)
    VALUES
      ('free_shipping_enabled', 'true'),
      ('free_shipping_min_amount', '2000000'),
      ('free_shipping_exclude_provider_codes', 'peyk,alopeyk')
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

COMMENT ON TABLE public.site_settings IS 'تنظیمات سیستم — شامل قوانین ارسال رایگان فاز ۱۳';
