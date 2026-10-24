-- Phase B: internal funnel analytics (applied also via Supabase SQL Editor)
-- See production if already ran manually.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name    text NOT NULL
                CHECK (event_name IN (
                  'view_item','add_to_cart','view_cart','begin_checkout',
                  'add_shipping_info','add_payment_info','purchase','search'
                )),
  session_id    text,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id    uuid,
  variant_id    uuid,
  order_id      uuid,
  quantity      integer,
  value         numeric(14,0),
  currency      text NOT NULL DEFAULT 'IRR',
  search_term   text,
  result_count  integer,
  path          text,
  device        text CHECK (device IS NULL OR device IN ('mobile','desktop','tablet','unknown')),
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
