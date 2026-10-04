-- عضویت خبرنامه / اطلاع‌رسانی تخفیف با موبایل
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  source text DEFAULT 'home',
  ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  CONSTRAINT newsletter_subscribers_phone_unique UNIQUE (phone)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_phone ON public.newsletter_subscribers (phone);
CREATE INDEX IF NOT EXISTS idx_newsletter_created ON public.newsletter_subscribers (created_at DESC);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
