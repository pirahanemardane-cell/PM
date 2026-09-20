-- Orders
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled')),
  total_amount    NUMERIC(12,0) NOT NULL DEFAULT 0,
  shipping_name   TEXT,
  shipping_phone  TEXT,
  shipping_address TEXT,
  shipping_city   TEXT,
  shipping_postal  TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id      UUID NOT NULL REFERENCES product_variants(id),
  product_id      UUID NOT NULL REFERENCES products(id),
  title           TEXT NOT NULL,
  size_name       TEXT,
  color_name      TEXT,
  unit_price      NUMERIC(12,0) NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  line_total      NUMERIC(12,0) NOT NULL
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TRIGGER tr_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- کاربر فقط سفارش خودش
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY orders_insert_own ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY order_items_select_own ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );
CREATE POLICY order_items_insert_own ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );
