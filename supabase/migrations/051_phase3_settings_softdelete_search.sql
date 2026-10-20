-- Phase 3 remaining: soft-delete columns, site_settings formal, search_queries
-- Safe to re-run

-- A) deleted_at on catalog-ish tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='deleted_at') THEN
    ALTER TABLE public.products ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name='deleted_at') THEN
    ALTER TABLE public.categories ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='brands' AND column_name='deleted_at') THEN
    ALTER TABLE public.brands ADD COLUMN deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='blog_posts')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='blog_posts' AND column_name='deleted_at') THEN
    ALTER TABLE public.blog_posts ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_deleted_at_idx ON public.products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS categories_deleted_at_idx ON public.categories(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS brands_deleted_at_idx ON public.brands(deleted_at) WHERE deleted_at IS NULL;

-- B) site_settings formal (key/value)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read site_settings" ON public.site_settings;
CREATE POLICY "public read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin write site_settings" ON public.site_settings;
CREATE POLICY "admin write site_settings"
  ON public.site_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

INSERT INTO public.site_settings (key, value) VALUES
  ('store', jsonb_build_object('name', 'پیراهن مردانه', 'currency', 'IRR')),
  ('shipping_warehouse', jsonb_build_object('city', 'تهران', 'lat', null, 'lng', null)),
  ('seo', jsonb_build_object('allow_index', false))
ON CONFLICT (key) DO NOTHING;

-- C) search_queries log (foundation for phase 8 analytics)
CREATE TABLE IF NOT EXISTS public.search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  normalized_query text,
  result_count integer NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_queries_created_idx ON public.search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS search_queries_norm_idx ON public.search_queries(normalized_query);

ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read search_queries" ON public.search_queries;
CREATE POLICY "admin read search_queries"
  ON public.search_queries FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
-- inserts via service role only
