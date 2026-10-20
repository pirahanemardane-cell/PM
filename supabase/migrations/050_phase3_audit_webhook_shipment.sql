-- Phase 3: audit_logs, webhook_events, shipment_events, payment_attempts (skeleton)
-- IF NOT EXISTS — safe to re-run

-- 1) audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('insert','update','delete','soft_delete','restore','status_change')),
  old_data jsonb,
  new_data jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_table_idx ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS audit_logs_record_idx ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read audit_logs" ON public.audit_logs;
CREATE POLICY "admin read audit_logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- inserts via service role only (no public insert policy)

-- 2) webhook_events (payment/shipping callbacks later)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'unknown',
  event_type text NOT NULL,
  external_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','processing','processed','failed','ignored')),
  signature_valid boolean,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_external_uidx
  ON public.webhook_events(provider, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS webhook_events_status_idx ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS webhook_events_created_idx ON public.webhook_events(created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read webhook_events" ON public.webhook_events;
CREATE POLICY "admin read webhook_events"
  ON public.webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 3) shipment_events
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number text,
  status text NOT NULL,
  carrier text,
  notes text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shipment_events_order_idx
  ON public.shipment_events(order_id, created_at DESC);

ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer read own shipment events" ON public.shipment_events;
CREATE POLICY "customer read own shipment events"
  ON public.shipment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin read shipment_events" ON public.shipment_events;
CREATE POLICY "admin read shipment_events"
  ON public.shipment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4) payment_attempts skeleton (phase 11 gateway — schema only)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'pending',
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IRR',
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created','redirected','paid','failed','expired','cancelled')),
  authority text,
  ref_id text,
  raw_request jsonb,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_attempts_order_idx ON public.payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS payment_attempts_authority_idx ON public.payment_attempts(authority);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read payment_attempts" ON public.payment_attempts;
CREATE POLICY "admin read payment_attempts"
  ON public.payment_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
