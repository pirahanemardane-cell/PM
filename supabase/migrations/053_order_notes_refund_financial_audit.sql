-- یادداشت‌های سفارش (مشتری / داخلی ادمین)
CREATE TABLE IF NOT EXISTS public.order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  body text NOT NULL,
  visibility text NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('customer', 'internal')),
  actor_type text NOT NULL DEFAULT 'admin'
    CHECK (actor_type IN ('admin', 'customer', 'system')),
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_notes_order_idx
  ON public.order_notes(order_id, created_at DESC);

ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer read own customer notes" ON public.order_notes;
CREATE POLICY "customer read own customer notes"
  ON public.order_notes FOR SELECT
  USING (
    visibility = 'customer'
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- فیلدهای بازپرداخت روی مرجوعی
ALTER TABLE public.return_requests
  ADD COLUMN IF NOT EXISTS refund_amount numeric,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_method text;

-- لاگ مالی جدا
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  return_id uuid REFERENCES public.return_requests(id) ON DELETE SET NULL,
  amount numeric,
  currency text NOT NULL DEFAULT 'IRR',
  meta jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_audit_logs_created_idx
  ON public.financial_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS financial_audit_logs_order_idx
  ON public.financial_audit_logs(order_id);

ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;
-- فقط service role / ادمین از سرور می‌نویسد و می‌خواند
