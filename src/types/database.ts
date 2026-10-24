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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
          admin_reply: string | null;
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
          admin_reply?: string | null;
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
          admin_reply?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
          max_discount_amount: number | null;
          once_per_user: boolean;
          product_ids: string[] | null;
          category_ids: string[] | null;
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
          max_discount_amount?: number | null;
          once_per_user?: boolean;
          product_ids?: string[] | null;
          category_ids?: string[] | null;
          max_discount_amount?: number | null;
          once_per_user?: boolean;
          product_ids?: string[] | null;
          category_ids?: string[] | null;
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
        Relationships: [];
      };

      orders: {
        Row: {
          id: string; user_id: string | null; status: string; payment_status: string;
          total_amount: number;
          shipping_name: string | null; shipping_phone: string | null;
          shipping_address: string | null; shipping_city: string | null;
          shipping_postal: string | null; note: string | null; discount_code: string | null; discount_amount: number | null; paid_at: string | null;
          tracking_number: string | null; shipped_at: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; user_id?: string | null; status?: string; payment_status?: string;
          total_amount?: number;
          shipping_name?: string | null; shipping_phone?: string | null;
          shipping_address?: string | null; shipping_city?: string | null;
          shipping_posta