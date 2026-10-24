CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'zarinpal',
  event_key text NOT NULL,
  authority text,
  ref_id text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount numeric,
  status text NOT NULL DEFAULT 'received',
  payload jsonb,
  verified boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_webhook_events_event_key_unique UNIQUE (provider, event_key)
);
CREATE INDEX IF NOT EXISTS payment_webhook_events_order_idx ON public.payment_webhook_events(order_id);
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
