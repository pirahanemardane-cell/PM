-- Phase 13: tracking number + shipped_at on orders
alter table public.orders
  add column if not exists tracking_number text null,
  add column if not exists shipped_at timestamptz null;

comment on column public.orders.tracking_number is 'Courier tracking code';
comment on column public.orders.shipped_at is 'When status moved to shipped / tracking set';
