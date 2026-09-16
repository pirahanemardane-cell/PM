/**
 * Database types for پیراهن مردانه
 * Generated manually to match production schema
 * Keep in sync with supabase/migrations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          brand_id: string | null;
          name: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          status: "draft" | "published" | "archived";
          is_featured: boolean;
          is_new: boolean;
          is_bestseller: boolean;
          meta_title: string | null;
          meta_description: string | null;
          average_rating: number | null;
          review_count: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          brand_id?: string | null;
          name: string;
          slug: string;
          short_description?: string | null;
          description?: string | null;
          status?: "draft" | "published" | "archived";
          is_featured?: boolean;
          is_new?: boolean;
          is_bestseller?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          average_rating?: number | null;
          review_count?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          brand_id?: string | null;
          name?: string;
          slug?: string;
          short_description?: string | null;
          description?: string | null;
          status?: "draft" | "published" | "archived";
          is_featured?: boolean;
          is_new?: boolean;
          is_bestseller?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          average_rating?: number | null;
          review_count?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string | null;
          size: string | null;
          color_name: string | null;
          color_hex: string | null;
          price: number;
          original_price: number | null;
          stock_quantity: number;
          low_stock_threshold: number;
          is_active: boolean;
          weight_grams: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku?: string | null;
          size?: string | null;
          color_name?: string | null;
          color_hex?: string | null;
          price: number;
          original_price?: number | null;
          stock_quantity?: number;
          low_stock_threshold?: number;
          is_active?: boolean;
          weight_grams?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string | null;
          size?: string | null;
          color_name?: string | null;
          color_hex?: string | null;
          price?: number;
          original_price?: number | null;
          stock_quantity?: number;
          low_stock_threshold?: number;
          is_active?: boolean;
          weight_grams?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attributes: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: "select" | "text" | "number" | "boolean";
          is_filterable: boolean;
          is_required: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type?: "select" | "text" | "number" | "boolean";
          is_filterable?: boolean;
          is_required?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          type?: "select" | "text" | "number" | "boolean";
          is_filterable?: boolean;
          is_required?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      attribute_options: {
        Row: {
          id: string;
          attribute_id: string;
          value: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          attribute_id: string;
          value: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          attribute_id?: string;
          value?: string;
          slug?: string;
          sort_order?: number;
        };
      };
      product_attribute_values: {
        Row: {
          id: string;
          product_id: string;
          attribute_id: string;
          option_id: string | null;
          value_text: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          attribute_id: string;
          option_id?: string | null;
          value_text?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          attribute_id?: string;
          option_id?: string | null;
          value_text?: string | null;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          url?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      size_guides: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      size_guide_rows: {
        Row: {
          id: string;
          size_guide_id: string;
          size_label: string;
          chest_cm: number | null;
          waist_cm: number | null;
          shoulder_cm: number | null;
          sleeve_cm: number | null;
          length_cm: number | null;
          neck_cm: number | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          size_guide_id: string;
          size_label: string;
          chest_cm?: number | null;
          waist_cm?: number | null;
          shoulder_cm?: number | null;
          sleeve_cm?: number | null;
          length_cm?: number | null;
          neck_cm?: number | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          size_guide_id?: string;
          size_label?: string;
          chest_cm?: number | null;
          waist_cm?: number | null;
          shoulder_cm?: number | null;
          sleeve_cm?: number | null;
          length_cm?: number | null;
          neck_cm?: number | null;
          sort_order?: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: "customer" | "admin" | "staff";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "customer" | "admin" | "staff";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "customer" | "admin" | "staff";
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          title: string | null;
          body: string | null;
          is_verified: boolean;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          rating: number;
          title?: string | null;
          body?: string | null;
          is_verified?: boolean;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string;
          rating?: number;
          title?: string | null;
          body?: string | null;
          is_verified?: boolean;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          variant_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          variant_id: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          variant_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      discounts: {
        Row: {
          id: string;
          code: string | null;
          type: "percentage" | "fixed";
          value: number;
          min_order_amount: number | null;
          max_uses: number | null;
          used_count: number;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code?: string | null;
          type: "percentage" | "fixed";
          value: number;
          min_order_amount?: number | null;
          max_uses?: number | null;
          used_count?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string | null;
          type?: "percentage" | "fixed";
          value?: number;
          min_order_amount?: number | null;
          max_uses?: number | null;
          used_count?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience aliases
export type Category = Tables<"categories">;
export type Brand = Tables<"brands">;
export type Product = Tables<"products">;
export type ProductVariant = Tables<"product_variants">;
export type Attribute = Tables<"attributes">;
export type AttributeOption = Tables<"attribute_options">;
export type ProductImage = Tables<"product_images">;
export type SizeGuide = Tables<"size_guides">;
export type SizeGuideRow = Tables<"size_guide_rows">;
export type Profile = Tables<"profiles">;
export type Review = Tables<"reviews">;
export type Wishlist = Tables<"wishlists">;
export type Cart = Tables<"carts">;
export type CartItem = Tables<"cart_items">;
export type Discount = Tables<"discounts">;

// =====================================================
// Extended types (sizes, colors, tags) - migration 003
// =====================================================

export type Size = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Color = {
  id: string;
  name: string;
  slug: string;
  hex_code: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type ProductTag = {
  id: string;
  product_id: string;
  tag_id: string;
  created_at: string;
};
