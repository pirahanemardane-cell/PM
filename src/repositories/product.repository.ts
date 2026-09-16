import { BaseRepository } from "./base.repository";
import type { Product, ProductVariant, ProductImage } from "@/types/database";

export type ProductWithRelations = Product & {
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  variants?: ProductVariant[];
  images?: ProductImage[];
};

export class ProductRepository extends BaseRepository {
  async findPublished(options?: {
    page?: number;
    pageSize?: number;
    categorySlug?: string;
    featured?: boolean;
  }) {
    const client = await this.getClient();
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 12;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from("products")
      .select(
        `
        *,
        brand:brands(id, name, slug),
        category:categories(id, name, slug),
        images:product_images(id, url, alt_text, is_primary, sort_order),
        variants:product_variants(id, price, original_price, stock_quantity, size_id, color_id, is_active)
      `,
        { count: "exact" }
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (options?.featured) {
      query = query.eq("is_featured", true);
    }

    if (options?.categorySlug) {
      const { data: category } = await client
        .from("categories")
        .select("id")
        .eq("slug", options.categorySlug)
        .eq("is_active", true)
        .single();

      if (category) {
        query = query.eq("category_id", category.id);
      }
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data ?? []) as ProductWithRelations[],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  async findBySlug(slug: string) {
    const client = await this.getClient();

    const { data, error } = await client
      .from("products")
      .select(
        `
        *,
        brand:brands(id, name, slug),
        category:categories(id, name, slug),
        images:product_images(id, url, alt_text, is_primary, sort_order),
        variants:product_variants(*)
      `
      )
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as ProductWithRelations;
  }

  async findById(id: string) {
    const client = await this.getClient();

    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as Product;
  }
}
