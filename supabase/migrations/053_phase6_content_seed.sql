-- Phase 6: static content + demo blog
INSERT INTO public.site_settings (key, value, updated_at) VALUES
('page_faq', '{"items":[{"q":"چطور سایز مناسب را انتخاب کنم؟","a":"از صفحه راهنمای سایز استفاده کنید. بین دو سایز معمولاً بزرگ‌تر راحت‌تر است."},{"q":"زمان ارسال چقدر است؟","a":"پس از پرداخت معمولاً ۱ تا ۳ روز کاری آماده‌سازی سپس ارسال."},{"q":"شرایط مرجوعی چیست؟","a":"کالای استفاده‌نشده با برچسب طبق سیاست مرجوعی قابل بازگشت است."},{"q":"پیگیری سفارش؟","a":"از داشبورد وضعیت و کد رهگیری را ببینید."},{"q":"پرداخت چگونه است؟","a":"پس از آدرس و ارسال به مرحله پرداخت می‌روید."},{"q":"رنگ عکس با واقعیت؟","a":"عکس‌ها نزدیک واقعیت‌اند؛ نور صفحه ممکن است کمی فرق بدهد."}]}'::jsonb, now()),
('page_terms', '{"title":"شرایط استفاده","paragraphs":["با استفاده از فروشگاه شرایط را می‌پذیرید.","ثبت سفارش یعنی پذیرش قیمت و سیاست مرجوعی."]}'::jsonb, now()),
('page_privacy', '{"title":"حریم خصوصی","paragraphs":["اطلاعات فقط برای خرید و پشتیبانی استفاده می‌شود.","کلیدها در مرورگر ذخیره نمی‌شوند."]}'::jsonb, now()),
('page_shipping', '{"title":"ارسال و تحویل","paragraphs":["آماده‌سازی معمولاً ۱ تا ۳ روز کاری است.","هزینه ارسال در تسویه‌حساب اعلام می‌شود."]}'::jsonb, now()),
('page_returns', '{"title":"سیاست مرجوعی","paragraphs":["کالای نو با برچسب در بازه اعلام‌شده قابل مرجوعی است.","از داشبورد درخواست ثبت کنید."]}'::jsonb, now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

INSERT INTO public.blog_categories (name, slug, description, is_active, sort_order)
VALUES ('راهنمای خرید', 'buying-guide', 'نکات انتخاب پیراهن', true, 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.blog_posts (category_id, title, slug, excerpt, body, status, published_at)
SELECT c.id, 'چطور سایز پیراهن را انتخاب کنیم؟', 'how-to-choose-shirt-size',
  'راهنمای اندازه‌گیری سینه و گردن',
  'اندازه‌گیری دور سینه، گردن و آستین را انجام دهید. از صفحه راهنمای سایز استفاده کنید.',
  'published', now()
FROM public.blog_categories c WHERE c.slug = 'buying-guide'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.blog_posts (category_id, title, slug, excerpt, body, status, published_at)
SELECT c.id, 'تفاوت پیراهن رسمی و اسپرت', 'dress-vs-casual-shirt',
  'کجا رسمی و کجا اسپرت بپوشیم',
  'رسمی برای کار و مراسم؛ آکسفورد برای روزمره با جین.',
  'published', now()
FROM public.blog_categories c WHERE c.slug = 'buying-guide'
ON CONFLICT (slug) DO NOTHING;
