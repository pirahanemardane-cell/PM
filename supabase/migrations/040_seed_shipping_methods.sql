-- روش‌های رایج ارسال؛ پیش‌فرض فقط پست فعال است
-- ادمین با «فعال کردن» در پنل، روش را در چک‌اوت نشان می‌دهد

INSERT INTO public.shipping_methods (title, description, fee, is_active, sort_order, provider_code, pricing_type, api_config)
SELECT v.title, v.description, v.fee, v.is_active, v.sort_order, v.provider_code, v.pricing_type, '{}'::jsonb
FROM (VALUES
  ('پست پیشتاز', 'ارسال از طریق پست — ۲ تا ۴ روز کاری', 45000, true, 1, 'post', 'fixed'),
  ('تیپاکس', '۱ تا ۳ روز کاری', 65000, false, 2, 'tipax', 'fixed'),
  ('اسنپ‌باکس', 'ارسال سریع درون‌شهری', 0, false, 3, 'snappbox', 'negotiable'),
  ('الوپیک', 'پیک موتوری — تهران', 0, false, 4, 'alopeyk', 'negotiable'),
  ('پیک موتوری', 'فقط تهران — توافقی', 0, false, 5, 'peyk', 'negotiable'),
  ('تحویل حضوری', 'از فروشگاه — رایگان', 0, false, 6, 'pickup', 'fixed')
) AS v(title, description, fee, is_active, sort_order, provider_code, pricing_type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.shipping_methods m
  WHERE m.provider_code = v.provider_code
     OR m.title = v.title
);
