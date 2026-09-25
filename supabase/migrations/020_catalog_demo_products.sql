-- Demo catalog content (idempotent by product.slug)
-- Run in Supabase SQL Editor. Requires existing categories/brands from earlier seed.

DO $$
DECLARE
  cat_dress uuid;
  cat_casual uuid;
  cat_ties uuid;
  cat_bow uuid;
  cat_cuff uuid;
  brand_id uuid;
  p_id uuid;
BEGIN
  SELECT id INTO cat_dress FROM categories WHERE slug IN ('dress-shirts', 'shirts') ORDER BY CASE WHEN slug = 'dress-shirts' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_casual FROM categories WHERE slug IN ('casual-shirts', 'oxford-shirts', 'shirts') ORDER BY CASE WHEN slug = 'casual-shirts' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_ties FROM categories WHERE slug IN ('ties') LIMIT 1;
  SELECT id INTO cat_bow FROM categories WHERE slug IN ('bow-ties') LIMIT 1;
  SELECT id INTO cat_cuff FROM categories WHERE slug IN ('cufflinks') LIMIT 1;
  SELECT id INTO brand_id FROM brands ORDER BY created_at NULLS LAST LIMIT 1;

  IF cat_dress IS NULL THEN
    RAISE EXCEPTION 'No dress/shirts category found — seed categories first';
  END IF;

  -- 1) پیراهن رسمی آبی
  INSERT INTO products (category_id, brand_id, name, slug, short_description, description, status, is_featured, is_new)
  VALUES (
    cat_dress, brand_id,
    'پیراهن رسمی آبی کلاسیک',
    'classic-blue-dress-shirt',
    'پیراهن رسمی آبی، مناسب محیط کار و مراسم',
    'پارچه نخی با ایستایی مناسب، یقه کلاسیک، برش استاندارد.',
    'published', true, true
  )
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO p_id FROM products WHERE slug = 'classic-blue-dress-shirt';
  IF p_id IS NOT NULL THEN
    INSERT INTO product_variants (product_id, sku, size, color_name, color_hex, price, original_price, stock_quantity, is_active)
    VALUES
      (p_id, 'PM-BLU-M', 'M', 'آبی', '#1E3A5F', 1890000, 2190000, 12, true),
      (p_id, 'PM-BLU-L', 'L', 'آبی', '#1E3A5F', 1890000, 2190000, 15, true),
      (p_id, 'PM-BLU-XL', 'XL', 'آبی', '#1E3A5F', 1890000, 2190000, 8, true)
    ON CONFLICT (product_id, size, color_name) DO NOTHING;
  END IF;

  -- 2) پیراهن اسلیم مشکی
  INSERT INTO products (category_id, brand_id, name, slug, short_description, description, status, is_featured, is_bestseller)
  VALUES (
    cat_dress, brand_id,
    'پیراهن اسلیم فیت مشکی',
    'black-slim-fit-dress-shirt',
    'اسلیم فیت مشکی برای استایل رسمی تیره',
    'برش اسلیم، پارچه سبک، مناسب شلوار رسمی و کروات.',
    'published', true, true
  )
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO p_id FROM products WHERE slug = 'black-slim-fit-dress-shirt';
  IF p_id IS NOT NULL THEN
    INSERT INTO product_variants (product_id, sku, size, color_name, color_hex, price, original_price, stock_quantity, is_active)
    VALUES
      (p_id, 'PM-BLK-M', 'M', 'مشکی', '#111111', 1990000, NULL, 10, true),
      (p_id, 'PM-BLK-L', 'L', 'مشکی', '#111111', 1990000, NULL, 14, true),
      (p_id, 'PM-BLK-XL', 'XL', 'مشکی', '#111111', 1990000, NULL, 6, true)
    ON CONFLICT (product_id, size, color_name) DO NOTHING;
  END IF;

  -- 3) پیراهن اسپرت / آکسفورد
  IF cat_casual IS NOT NULL THEN
    INSERT INTO products (category_id, brand_id, name, slug, short_description, description, status, is_new)
    VALUES (
      cat_casual, brand_id,
      'پیراهن آکسفورد کرم',
      'cream-oxford-casual-shirt',
      'آکسفورد کرم برای استایل روزمره شیک',
      'بافت آکسفورد، رنگ کرم خنثی، مناسب شلوار جین و چinos.',
      'published', true
    )
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO p_id FROM products WHERE slug = 'cream-oxford-casual-shirt';
    IF p_id IS NOT NULL THEN
      INSERT INTO product_variants (product_id, sku, size, color_name, color_hex, price, stock_quantity, is_active)
      VALUES
        (p_id, 'PM-CRM-M', 'M', 'کرم', '#E8DCC8', 1590000, 20, true),
        (p_id, 'PM-CRM-L', 'L', 'کرم', '#E8DCC8', 1590000, 18, true),
        (p_id, 'PM-CRM-XL', 'XL', 'کرم', '#E8DCC8', 1590000, 9, true)
      ON CONFLICT (product_id, size, color_name) DO NOTHING;
    END IF;
  END IF;

  -- 4) کروات
  IF cat_ties IS NOT NULL THEN
    INSERT INTO products (category_id, brand_id, name, slug, short_description, description, status, is_featured)
    VALUES (
      cat_ties, brand_id,
      'کروات ابریشمی سرمه‌ای',
      'navy-silk-tie',
      'کروات سرمه‌ای مات، عرض استاندارد',
      'مناسب پیراهن سفید و آبی؛ گره کلاسیک.',
      'published', true
    )
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO p_id FROM products WHERE slug = 'navy-silk-tie';
    IF p_id IS NOT NULL THEN
      INSERT INTO product_variants (product_id, sku, size, color_name, color_hex, price, stock_quantity, is_active)
      VALUES (p_id, 'PM-TIE-NVY', 'یک‌سایز', 'سرمه‌ای', '#0A1628', 890000, 25, true)
      ON CONFLICT (product_id, size, color_name) DO NOTHING;
    END IF;
  END IF;

  -- 5) پاپیون
  IF cat_bow IS NOT NULL THEN
    INSERT INTO products (category_id, brand_id, name, slug, short_description, description, status)
    VALUES (
      cat_bow, brand_id,
      'پاپیون مشکی مات',
      'matte-black-bow-tie',
      'پاپیون مشکی قابل تنظیم',
      'برای مراسم رسمی و بلک‌تای.',
      'published'
    )
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO p_id FROM products WHERE slug = 'matte-black-bow-tie';
    IF p_id IS NOT NULL THEN
      INSERT INTO product_variants (product_id, sku, size, color_name, color_hex, price, stock_quantity, is_active)
      VALUES (p_id, 'PM-BOW-BLK', 'یک‌سایز', 'مشکی', '#0D0D0D', 690000, 15, true)
      ON CONFLICT (product_id, size, color_name) DO NOTHING;
    END IF;
  END IF;

  -- 6) دکمه سردست
  IF cat_cuff IS NOT NULL THEN
    INSERT INTO products (category_id, brand_id, name, slug, short_description, description, status, is_new)
    VALUES (
      cat_cuff, brand_id,
      'دکمه سردست نقره‌ای گرد',
      'silver-round-cufflinks',
      'ست دکمه سردست نقره‌ای براق',
      'مناسب پیراهن رسمی با سرآستین دوبل.',
      'published', true
    )
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO p_id FROM products WHERE slug = 'silver-round-cufflinks';
    IF p_id IS NOT NULL THEN
      INSERT INTO product_variants (product_id, sku, size, color_name, color_hex, price, stock_quantity, is_active)
      VALUES (p_id, 'PM-CUFF-SLV', 'یک‌سایز', 'نقره‌ای', '#C0C0C0', 790000, 12, true)
      ON CONFLICT (product_id, size, color_name) DO NOTHING;
    END IF;
  END IF;

  -- Best-effort attributes for shirts (fit / fabric / collar-type) if options exist
  INSERT INTO product_attribute_values (product_id, attribute_id, option_id)
  SELECT p.id, a.id, o.id
  FROM products p
  CROSS JOIN attributes a
  JOIN attribute_options o ON o.attribute_id = a.id
  WHERE p.slug IN (
    'classic-blue-dress-shirt',
    'black-slim-fit-dress-shirt',
    'cream-oxford-casual-shirt',
    'white-slim-fit-dress-shirt'
  )
  AND (
    (a.slug = 'fit' AND o.slug IN ('slim', 'slim-fit', 'regular', 'classic'))
    OR (a.slug = 'fabric' AND o.slug IN ('cotton', 'oxford', 'linen'))
    OR (a.slug = 'collar-type' AND o.slug IN ('classic', 'spread', 'point'))
  )
  ON CONFLICT DO NOTHING;

END $$;
