CREATE TABLE IF NOT EXISTS stock_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT,
  variant_id    UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'notified', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at   TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_alerts_user_variant_pending
  ON stock_alerts (user_id, variant_id)
  WHERE status = 'pending' AND user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_alerts_phone_variant_pending
  ON stock_alerts (phone, variant_id)
  WHERE status = 'pending' AND phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_alerts_variant_pending
  ON stock_alerts (variant_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS sms_outbox (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT NOT NULL,
  body          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  meta          JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at       TIMESTAMPTZ
);

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_alerts_select_own ON stock_alerts;
CREATE POLICY stock_alerts_select_own ON stock_alerts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS stock_alerts_insert_own ON stock_alerts;
CREATE POLICY stock_alerts_insert_own ON stock_alerts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS stock_alerts_update_own ON stock_alerts;
CREATE POLICY stock_alerts_update_own ON stock_alerts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
