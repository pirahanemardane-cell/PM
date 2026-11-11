-- PR2 shop gaps: loyalty redeem columns, bundle cart price override,
-- warranty evidence, stock-alert email, abandoned-cart nudges.

-- ---------------------------------------------------------------------------
-- Orders: loyalty redeem snapshot
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS loyalty_points_redeemed int NOT NULL DEFAULT 0;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS loyalty_discount_amount numeric(12,0) NOT NULL DEFAULT 0;

-- Idempotent earn: one order_paid tx per order
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_tx_order_paid_unique
  ON public.loyalty_transactions (order_id)
  WHERE order_id IS NOT NULL AND points > 0 AND reason LIKE 'order_paid%';

-- Seed redeem rate (toman per point) — inactive until admin enables if desired;
-- app defaults to 1000 if missing.
INSERT INTO public.loyalty_rules (key, label, points, is_active, meta)
VALUES
  ('point_value_toman', 'ارزش هر امتیاز هنگام تسویه (تومان)', 1000, true, '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Cart: optional unit price override for bundles
-- ---------------------------------------------------------------------------
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS unit_price_override numeric(12,0);
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS bundle_complement_id uuid
    REFERENCES public.product_complements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS cart_items_bundle_complement_id_idx
  ON public.cart_items(bundle_complement_id)
  WHERE bundle_complement_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Warranty claim evidence images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warranty_claim_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.warranty_claims(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS warranty_claim_images_claim_id_idx
  ON public.warranty_claim_images(claim_id);

ALTER TABLE public.warranty_claim_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wci_own_or_admin" ON public.warranty_claim_images;
CREATE POLICY "wci_own_or_admin" ON public.warranty_claim_images FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.warranty_claims c
      WHERE c.id = warranty_claim_images.claim_id AND c.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "wci_insert_own" ON public.warranty_claim_images;
CREATE POLICY "wci_insert_own" ON public.warranty_claim_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.warranty_claims c
      WHERE c.id = warranty_claim_images.claim_id AND c.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "wci_admin_all" ON public.warranty_claim_images;
CREATE POLICY "wci_admin_all" ON public.warranty_claim_images
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Stock alerts: guest email channel (+ is_active alignment with types)
-- ---------------------------------------------------------------------------
ALTER TABLE public.stock_alerts
  ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.stock_alerts
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS stock_alerts_email_pending_idx
  ON public.stock_alerts(email)
  WHERE email IS NOT NULL AND status = 'pending';

-- ---------------------------------------------------------------------------
-- Abandoned cart nudges (MVP)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.abandoned_cart_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'in_app'
    CHECK (channel IN ('in_app', 'email', 'both')),
  notified_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (cart_id)
);

CREATE INDEX IF NOT EXISTS abandoned_cart_nudges_notified_at_idx
  ON public.abandoned_cart_nudges(notified_at DESC);

ALTER TABLE public.abandoned_cart_nudges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acn_admin_all" ON public.abandoned_cart_nudges;
CREATE POLICY "acn_admin_all" ON public.abandoned_cart_nudges
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "acn_own_select" ON public.abandoned_cart_nudges;
CREATE POLICY "acn_own_select" ON public.abandoned_cart_nudges FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
