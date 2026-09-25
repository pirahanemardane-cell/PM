-- Recompute products.average_rating + review_count from approved reviews

CREATE OR REPLACE FUNCTION public.recompute_product_review_stats(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_avg numeric(2,1);
BEGIN
  SELECT count(*)::integer,
         coalesce(round(avg(rating)::numeric, 1), 0)
  INTO v_count, v_avg
  FROM reviews
  WHERE product_id = p_product_id
    AND is_approved = true;

  UPDATE products
  SET review_count = v_count,
      average_rating = v_avg,
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_reviews_recompute_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_product_review_stats(OLD.product_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    PERFORM public.recompute_product_review_stats(NEW.product_id);
    IF OLD.product_id IS DISTINCT FROM NEW.product_id THEN
      PERFORM public.recompute_product_review_stats(OLD.product_id);
    END IF;
    RETURN NEW;
  END IF;

  -- INSERT
  PERFORM public.recompute_product_review_stats(NEW.product_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_reviews_recompute_stats ON reviews;
CREATE TRIGGER tr_reviews_recompute_stats
AFTER INSERT OR UPDATE OF is_approved, rating, product_id OR DELETE
ON reviews
FOR EACH ROW
EXECUTE FUNCTION public.trg_reviews_recompute_stats();

-- one-shot backfill
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT product_id FROM reviews LOOP
    PERFORM public.recompute_product_review_stats(r.product_id);
  END LOOP;
END $$;
