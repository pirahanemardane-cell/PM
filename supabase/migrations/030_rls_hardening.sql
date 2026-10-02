-- 030: RLS hardening (idempotent-ish)
-- در Supabase Dashboard → SQL Editor این فایل را اجرا کنید.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;
CREATE POLICY "order_items_select_own_or_admin"
  ON public.order_items FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;
CREATE POLICY "order_items_admin_all"
  ON public.order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_admin_select" ON public.contact_messages;
CREATE POLICY "contact_admin_select"
  ON public.contact_messages FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "contact_admin_all" ON public.contact_messages;
CREATE POLICY "contact_admin_all"
  ON public.contact_messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_approved" ON public.reviews;
CREATE POLICY "reviews_public_approved"
  ON public.reviews FOR SELECT
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;
CREATE POLICY "reviews_admin_all"
  ON public.reviews FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE IF EXISTS public.return_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "returns_own_or_admin" ON public.return_requests;
CREATE POLICY "returns_own_or_admin"
  ON public.return_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "returns_insert_own" ON public.return_requests;
CREATE POLICY "returns_insert_own"
  ON public.return_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "returns_admin_all" ON public.return_requests;
CREATE POLICY "returns_admin_all"
  ON public.return_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    EXECUTE 'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

DROP POLICY IF EXISTS "products_public_published" ON public.products;
CREATE POLICY "products_public_published"
  ON public.products FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "brands_public_active" ON public.brands;
CREATE POLICY "brands_public_active"
  ON public.brands FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "brands_admin_all" ON public.brands;
CREATE POLICY "brands_admin_all"
  ON public.brands FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_public_active" ON public.categories;
CREATE POLICY "categories_public_active"
  ON public.categories FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON public.site_settings;
CREATE POLICY "settings_public_read"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "settings_admin_write" ON public.site_settings;
CREATE POLICY "settings_admin_write"
  ON public.site_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
