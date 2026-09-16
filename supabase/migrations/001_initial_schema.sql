-- =====================================================
-- پیراهن مردانه - Initial Production Schema
-- =====================================================
-- دامنه: پیراهن مردانه + کروات + پاپیون + دکمه سردست + اکسسوری
-- اصول: Server-first | Realtime-first | SEO-ready | RLS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. CATEGORIES
CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  image_url     TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  meta_title    TEXT,
  meta_description TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- 2. BRANDS
CREATE TABLE brands (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  logo_url      TEXT,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_slug ON brands(slug);

-- 3. PRODUCTS
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id       UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id          UUID REFERENCES brands(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  is_new            BOOLEAN NOT NULL DEFAULT false,
  is_bestseller     BOOLEAN NOT NULL DEFAULT false,
  meta_title        TEXT,
  meta_description  TEXT,
  average_rating    NUMERIC(2,1) DEFAULT 0,
  review_count      INTEGER NOT NULL DEFAULT 0,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- 4. PRODUCT VARIANTS
CREATE TABLE product_variants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku             TEXT UNIQUE,
  size            TEXT,
  color_name      TEXT,
  color_hex       TEXT,
  price           NUMERIC(12,0) NOT NULL,
  original_price  NUMERIC(12,0),
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  weight_grams    INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, size, color_name)
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_stock ON product_variants(stock_quantity) WHERE is_active = true;

-- 5. ATTRIBUTES
CREATE TABLE attributes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL DEFAULT 'select' CHECK (type IN ('select', 'text', 'number', 'boolean')),
  is_filterable BOOLEAN NOT NULL DEFAULT true,
  is_required   BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ATTRIBUTE OPTIONS
CREATE TABLE attribute_options (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribute_id  UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  value         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(attribute_id, slug)
);

CREATE INDEX idx_attr_options_attribute ON attribute_options(attribute_id);

-- 7. PRODUCT ATTRIBUTE VALUES
CREATE TABLE product_attribute_values (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id  UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  option_id     UUID REFERENCES attribute_options(id) ON DELETE SET NULL,
  value_text    TEXT,
  UNIQUE(product_id, attribute_id)
);

CREATE INDEX idx_pav_product ON product_attribute_values(product_id);
CREATE INDEX idx_pav_attribute ON product_attribute_values(attribute_id);

-- 8. PRODUCT IMAGES
CREATE TABLE product_images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id    UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  url           TEXT NOT NULL,
  alt_text      TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_images_product ON product_images(product_id);
CREATE INDEX idx_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- 9. SIZE GUIDES
CREATE TABLE size_guides (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE size_guide_rows (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  size_guide_id UUID NOT NULL REFERENCES size_guides(id) ON DELETE CASCADE,
  size_label    TEXT NOT NULL,
  chest_cm      NUMERIC(5,1),
  waist_cm      NUMERIC(5,1),
  shoulder_cm   NUMERIC(5,1),
  sleeve_cm     NUMERIC(5,1),
  length_cm     NUMERIC(5,1),
  neck_cm       NUMERIC(5,1),
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_size_guide_rows ON size_guide_rows(size_guide_id);

-- 10. PROFILES
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT UNIQUE,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. REVIEWS
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         TEXT,
  body          TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  is_approved   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id) WHERE is_approved = true;

-- 12. WISHLISTS
CREATE TABLE wishlists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 13. CARTS + CART ITEMS
CREATE TABLE carts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id       UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id    UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cart_id, variant_id)
);

-- 14. DISCOUNTS
CREATE TABLE discounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT UNIQUE,
  type          TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value         NUMERIC(12,0) NOT NULL,
  min_order_amount NUMERIC(12,0),
  max_uses      INTEGER,
  used_count    INTEGER NOT NULL DEFAULT 0,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TRIGGERS
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_categories_updated BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_brands_updated BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_variants_updated BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_reviews_updated BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_carts_updated BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_cart_items_updated BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_guide_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published products"
  ON products FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL);

CREATE POLICY "Public can view active variants"
  ON product_variants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view brands"
  ON brands FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view product images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Public can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Public can view attributes"
  ON attributes FOR SELECT USING (true);

CREATE POLICY "Public can view attribute options"
  ON attribute_options FOR SELECT USING (true);

CREATE POLICY "Public can view product attributes"
  ON product_attribute_values FOR SELECT USING (true);

CREATE POLICY "Public can view size guides"
  ON size_guides FOR SELECT USING (true);

CREATE POLICY "Public can view size guide rows"
  ON size_guide_rows FOR SELECT USING (true);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
