-- Allow media-library uploads without attaching to a product yet
ALTER TABLE product_images
  ALTER COLUMN product_id DROP NOT NULL;
