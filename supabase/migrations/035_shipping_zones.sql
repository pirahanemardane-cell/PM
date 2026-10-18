-- =====================================================
-- فاز ۱۳ — Shipping Zones
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shipping_zone_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id     UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  province    TEXT NOT NULL,
  city        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (zone_id, province, city)
);

CREATE INDEX IF NOT EXISTS idx_zone_locations_province
  ON public.shipping_zone_locations (province);
CREATE INDEX IF NOT EXISTS idx_zone_locations_zone
  ON public.shipping_zone_locations (zone_id);

CREATE TABLE IF NOT EXISTS public.shipping_method_zones (
  method_id   UUID NOT NULL REFERENCES public.shipping_methods(id) ON DELETE CASCADE,
  zone_id     UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  PRIMARY KEY (method_id, zone_id)
);

CREATE TRIGGER tr_shipping_zones_updated
  BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zone_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_method_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active shipping zones"
  ON public.shipping_zones FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view zone locations"
  ON public.shipping_zone_locations FOR SELECT
  USING (true);

CREATE POLICY "Public can view method zones"
  ON public.shipping_method_zones FOR SELECT
  USING (true);

INSERT INTO public.shipping_zones (name, description, sort_order) VALUES
  ('تهران', 'شهر تهران و حومه', 10),
  ('استان‌های همجوار', 'البرز، قم، مرکزی، سمنان، مازندران، گیلان', 20),
  ('سایر ایران', 'بقیه استان‌ها', 30)
ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_zone_locations (zone_id, province, city)
SELECT id, 'تهران', NULL
FROM public.shipping_zones WHERE name = 'تهران'
ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_zone_locations (zone_id, province, city)
SELECT z.id, p.province, NULL
FROM public.shipping_zones z
CROSS JOIN (VALUES
  ('البرز'), ('قم'), ('مرکزی'), ('سمنان'), ('مازندران'), ('گیلان')
) AS p(province)
WHERE z.name = 'استان‌های همجوار'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.shipping_zones IS 'مناطق ارسال — فاز ۱۳';
COMMENT ON TABLE public.shipping_zone_locations IS 'استان/شهرهای هر منطقه';
COMMENT ON TABLE public.shipping_method_zones IS 'کدام روش ارسال در کدام منطقه فعال است';
