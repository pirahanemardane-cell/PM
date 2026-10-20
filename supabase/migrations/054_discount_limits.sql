-- 054: سقف تخفیف + محدودیت محصول/دسته
ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC(12,0),
  ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category_ids UUID[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_automatic BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.discounts.max_discount_amount IS
  'سقف مبلغ تخفیف (برای درصدی و ثابت)';
COMMENT ON COLUMN public.discounts.product_ids IS
  'اگر پر باشد فقط این محصولات؛ خالی = همه';
COMMENT ON COLUMN public.discounts.category_ids IS
  'اگر پر باشد فقط این دسته‌ها؛ خالی = همه';
COMMENT ON COLUMN public.discounts.is_automatic IS
  'تخفیف خودکار بدون نیاز به کد (نسخه بعد کامل می‌شود)';
