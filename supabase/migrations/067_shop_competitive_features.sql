-- 067: competitive shop features (size profile, review photos, Q&A, complements,
-- warranty claims, loyalty). Apply in Supabase SQL Editor / migration runner.

-- ---------------------------------------------------------------------------
-- User measurements ("my size")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_measurements (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  chest_cm numeric(6,1),
  waist_cm numeric(6,1),
  shoulder_cm numeric(6,1),
  sleeve_cm numeric(6,1),
  length_cm numeric(6,1),
  neck_cm numeric(6,1),
  preferred_size text,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_measurements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_measurements_own" ON public.user_measurements;
CREATE POLICY "user_measurements_own" ON public.user_measurements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_measurements_admin" ON public.user_measurements;
CREATE POLICY "user_measurements_admin" ON public.user_measurements
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Review photos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_images_review_id_idx ON public.review_images(review_id);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_images_public_approved" ON public.review_images;
CREATE POLICY "review_images_public_approved" ON public.review_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_images.review_id
        AND (r.is_approved = true OR r.user_id = auth.uid() OR public.is_admin())
    )
  );
DROP POLICY IF EXISTS "review_images_insert_own" ON public.review_images;
CREATE POLICY "review_images_insert_own" ON public.review_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_images.review_id AND r.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "review_images_admin_all" ON public.review_images;
CREATE POLICY "review_images_admin_all" ON public.review_images
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Product Q&A
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.product_questions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  is_staff boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_questions_product_id_idx ON public.product_questions(product_id);
CREATE INDEX IF NOT EXISTS product_answers_question_id_idx ON public.product_answers(question_id);

ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pq_select" ON public.product_questions;
CREATE POLICY "pq_select" ON public.product_questions FOR SELECT
  USING (is_approved = true OR auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "pq_insert_own" ON public.product_questions;
CREATE POLICY "pq_insert_own" ON public.product_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "pq_admin_all" ON public.product_questions;
CREATE POLICY "pq_admin_all" ON public.product_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.product_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pa_select" ON public.product_answers;
CREATE POLICY "pa_select" ON public.product_answers FOR SELECT
  USING (
    is_approved = true
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.product_questions q
      WHERE q.id = product_answers.question_id AND q.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "pa_insert_staff" ON public.product_answers;
CREATE POLICY "pa_insert_staff" ON public.product_answers FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "pa_admin_all" ON public.product_answers;
CREATE POLICY "pa_admin_all" ON public.product_answers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Complements / bundles (product → related accessory products)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_complements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  complement_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text,
  sort_order int NOT NULL DEFAULT 0,
  is_bundle boolean NOT NULL DEFAULT false,
  bundle_price numeric(12,0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, complement_product_id)
);

CREATE INDEX IF NOT EXISTS product_complements_product_id_idx ON public.product_complements(product_id);

ALTER TABLE public.product_complements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pc_public_select" ON public.product_complements;
CREATE POLICY "pc_public_select" ON public.product_complements FOR SELECT USING (true);
DROP POLICY IF EXISTS "pc_admin_all" ON public.product_complements;
CREATE POLICY "pc_admin_all" ON public.product_complements
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Warranty / exchange claims
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  claim_type text NOT NULL DEFAULT 'warranty'
    CHECK (claim_type IN ('warranty', 'exchange', 'stitching')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'resolved')),
  body text NOT NULL,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS warranty_claims_user_id_idx ON public.warranty_claims(user_id);

ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wc_own_or_admin" ON public.warranty_claims;
CREATE POLICY "wc_own_or_admin" ON public.warranty_claims FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "wc_insert_own" ON public.warranty_claims;
CREATE POLICY "wc_insert_own" ON public.warranty_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "wc_admin_all" ON public.warranty_claims;
CREATE POLICY "wc_admin_all" ON public.warranty_claims
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Loyalty club
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  lifetime_points int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  points int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points int NOT NULL,
  reason text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loyalty_tx_user_id_idx ON public.loyalty_transactions(user_id);

ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "la_own" ON public.loyalty_accounts;
CREATE POLICY "la_own" ON public.loyalty_accounts FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "la_admin_all" ON public.loyalty_accounts;
CREATE POLICY "la_admin_all" ON public.loyalty_accounts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lr_public_select" ON public.loyalty_rules;
CREATE POLICY "lr_public_select" ON public.loyalty_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "lr_admin_all" ON public.loyalty_rules;
CREATE POLICY "lr_admin_all" ON public.loyalty_rules
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lt_own" ON public.loyalty_transactions;
CREATE POLICY "lt_own" ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "lt_admin_all" ON public.loyalty_transactions;
CREATE POLICY "lt_admin_all" ON public.loyalty_transactions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.loyalty_rules (key, label, points, is_active)
VALUES
  ('order_paid', 'امتیاز خرید (هر ۱۰۰٬۰۰۰ تومان)', 1, true),
  ('review_approved', 'ثبت نظر تأییدشده', 20, true),
  ('referral', 'معرفی دوست', 50, false)
ON CONFLICT (key) DO NOTHING;

-- Default warranty / exchange content keys (optional seed via app defaults)
INSERT INTO public.site_settings (key, value, updated_at)
VALUES
  ('store_whatsapp', '', now()),
  ('store_chat_label', 'مشاوره واتساپ', now())
ON CONFLICT (key) DO NOTHING;
