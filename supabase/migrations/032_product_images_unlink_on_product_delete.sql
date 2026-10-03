-- =====================================================
-- وقتی محصول حذف می‌شود، تصاویر در کتابخانه رسانه بمانند
-- product_id / variant_id فقط null می‌شوند (unlink)
-- =====================================================

-- اطمینان از nullable بودن (قبلاً در 028 هم آمده)
ALTER TABLE product_images
  ALTER COLUMN product_id DROP NOT NULL;

-- حذف FK قدیمی (CASCADE) و جایگزینی با SET NULL
ALTER TABLE product_images
  DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;

ALTER TABLE product_images
  ADD CONSTRAINT product_images_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES products(id)
  ON DELETE SET NULL;

-- variant_id از قبل SET NULL بود؛ برای اطمینان دوباره تنظیم
ALTER TABLE product_images
  DROP CONSTRAINT IF EXISTS product_images_variant_id_fkey;

ALTER TABLE product_images
  ADD CONSTRAINT product_images_variant_id_fkey
  FOREIGN KEY (variant_id)
  REFERENCES product_variants(id)
  ON DELETE SET NULL;
