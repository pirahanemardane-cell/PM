-- 026 once_per_user on discounts
ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS once_per_user boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.discounts.once_per_user IS
  'اگر true باشد هر user_id فقط یک‌بار می‌تواند این کد را روی سفارش بزند';
