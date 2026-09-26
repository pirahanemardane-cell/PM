-- Phase B: product size guide FK + schedule publish timestamp
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS size_guide_id UUID REFERENCES size_guides(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_size_guide
  ON products(size_guide_id)
  WHERE size_guide_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_published_at
  ON products(published_at)
  WHERE status = 'published' AND deleted_at IS NULL;

UPDATE products
SET published_at = COALESCE(published_at, updated_at, now())
WHERE status = 'published'
  AND published_at IS NULL
  AND deleted_at IS NULL;
