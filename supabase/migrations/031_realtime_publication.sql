-- Realtime publication — یک‌بار در Supabase SQL Editor اجرا شود
-- جداول لازم برای Realtime کامل فروشگاه

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS wishlists;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS orders;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS products;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS contact_messages;

-- اگر خطای "already member" داد، نادیده بگیر — یعنی از قبل اضافه شده
