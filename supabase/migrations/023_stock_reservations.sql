-- رزرو موجودی فقط در checkout (TTL 15 دقیقه)
CREATE TABLE IF NOT EXISTS stock_reservations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id    UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_res_user_active
  ON stock_reservations (user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stock_res_variant_active
  ON stock_reservations (variant_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stock_res_expires
  ON stock_reservations (expires_at) WHERE status = 'active';

ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_res_select_own ON stock_reservations;
CREATE POLICY stock_res_select_own ON stock_reservations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- آزادسازی رزروهای منقضی + برگرداندن موجودی
CREATE OR REPLACE FUNCTION release_expired_stock_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  n int := 0;
BEGIN
  FOR r IN
    SELECT id, variant_id, quantity
    FROM stock_reservations
    WHERE status = 'active' AND expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE stock_reservations
    SET status = 'expired', updated_at = now()
    WHERE id = r.id AND status = 'active';
    IF FOUND THEN
      PERFORM increment_variant_stock(r.variant_id, r.quantity);
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END;
$$;

-- رزرو یک واریانت برای کاربر (کسر موجودی + ردیف active)
CREATE OR REPLACE FUNCTION reserve_variant_stock(
  p_user_id uuid,
  p_variant_id uuid,
  p_qty int,
  p_minutes int DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ok boolean;
  ttl int;
BEGIN
  IF p_user_id IS NULL OR p_variant_id IS NULL OR p_qty IS NULL OR p_qty < 1 THEN
    RETURN false;
  END IF;
  ttl := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 60));

  -- آزادسازی منقضی‌ها
  PERFORM release_expired_stock_reservations();

  -- اگر همین کاربر رزرو active دارد، آزاد کن و دوباره بگیر (همگام با سبد فعلی)
  PERFORM release_user_variant_reservation(p_user_id, p_variant_id);

  ok := decrement_variant_stock(p_variant_id, p_qty);
  IF NOT ok THEN
    RETURN false;
  END IF;

  INSERT INTO stock_reservations (user_id, variant_id, quantity, status, expires_at)
  VALUES (p_user_id, p_variant_id, p_qty, 'active', now() + make_interval(mins => ttl));

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION release_user_variant_reservation(
  p_user_id uuid,
  p_variant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, quantity
    FROM stock_reservations
    WHERE user_id = p_user_id AND variant_id = p_variant_id AND status = 'active'
    FOR UPDATE
  LOOP
    UPDATE stock_reservations
    SET status = 'released', updated_at = now()
    WHERE id = r.id AND status = 'active';
    IF FOUND THEN
      PERFORM increment_variant_stock(p_variant_id, r.quantity);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION release_all_user_reservations(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD; n int := 0;
BEGIN
  FOR r IN
    SELECT id, variant_id, quantity
    FROM stock_reservations
    WHERE user_id = p_user_id AND status = 'active'
    FOR UPDATE
  LOOP
    UPDATE stock_reservations
    SET status = 'released', updated_at = now()
    WHERE id = r.id AND status = 'active';
    IF FOUND THEN
      PERFORM increment_variant_stock(r.variant_id, r.quantity);
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END;
$$;

-- تبدیل رزرو به مصرف‌شده بدون برگرداندن موجودی (بعد از ثبت سفارش)
CREATE OR REPLACE FUNCTION consume_user_reservations(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  UPDATE stock_reservations
  SET status = 'consumed', updated_at = now()
  WHERE user_id = p_user_id AND status = 'active';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION extend_user_reservations(
  p_user_id uuid,
  p_minutes int DEFAULT 15
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE ttl int; n int;
BEGIN
  ttl := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 60));
  UPDATE stock_reservations
  SET expires_at = now() + make_interval(mins => ttl), updated_at = now()
  WHERE user_id = p_user_id AND status = 'active' AND expires_at > now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION release_expired_stock_reservations() FROM PUBLIC;
REVOKE ALL ON FUNCTION reserve_variant_stock(uuid, uuid, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION release_user_variant_reservation(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION release_all_user_reservations(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION consume_user_reservations(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION extend_user_reservations(uuid, int) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION release_expired_stock_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION reserve_variant_stock(uuid, uuid, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION release_user_variant_reservation(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION release_all_user_reservations(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION consume_user_reservations(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION extend_user_reservations(uuid, int) TO service_role;
