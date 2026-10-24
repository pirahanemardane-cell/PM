CREATE TABLE IF NOT EXISTS public.url_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path text NOT NULL,
  to_path text NOT NULL,
  status_code int NOT NULL DEFAULT 301
    CHECK (status_code IN (301, 302, 307, 308)),
  is_active boolean NOT NULL DEFAULT true,
  note text,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'product_slug_change', 'import', 'system')),
  hit_count bigint NOT NULL DEFAULT 0,
  last_hit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT url_redirects_from_unique UNIQUE (from_path),
  CONSTRAINT url_redirects_no_self CHECK (from_path <> to_path)
);

CREATE INDEX IF NOT EXISTS url_redirects_active_from_idx
  ON public.url_redirects (from_path)
  WHERE is_active = true;

ALTER TABLE public.url_redirects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read active redirects" ON public.url_redirects;
CREATE POLICY "public read active redirects"
  ON public.url_redirects FOR SELECT
  USING (is_active = true);
