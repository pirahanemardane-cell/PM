-- Atomic stock adjust (service_role only)
CREATE OR REPLACE FUNCTION decrement_variant_stock(p_variant_id uuid, p_qty int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN RETURN false; END IF;
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_qty
  WHERE id = p_variant_id AND is_active = true AND stock_quantity >= p_qty;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n = 1;
END;
$$;

CREATE OR REPLACE FUNCTION increment_variant_stock(p_variant_id uuid, p_qty int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN RETURN; END IF;
  UPDATE product_variants
  SET stock_quantity = stock_quantity + p_qty
  WHERE id = p_variant_id;
END;
$$;

REVOKE ALL ON FUNCTION decrement_variant_stock(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION increment_variant_stock(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrement_variant_stock(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION increment_variant_stock(uuid, int) TO service_role;
