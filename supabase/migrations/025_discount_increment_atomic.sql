-- Return whether used_count was actually incremented (for race-safe apply)

CREATE OR REPLACE FUNCTION public.increment_discount_use(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE discounts
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE upper(code) = upper(trim(p_code))
    AND is_active = true
    AND (max_uses IS NULL OR COALESCE(used_count, 0) < max_uses)
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now());

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
