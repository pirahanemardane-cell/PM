import { BaseRepository } from "./base.repository";
import type { Product, ProductVariant, ProductImage } from "@/types/database";
import type { ProductFilterInput } from "@/lib/validation/product";

export type ProductWithRelations = Product & {
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  variants?: ProductVariant[];
  images?: ProductImage[];
};

export class ProductRepository extends BaseRepository {
  async findPublished(filters: ProductFilterInput = { page: 1, pageSize: 12 }) {
    const client = await this.getClient();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 12;
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
      .is("deleted_at", null);

    // دسته‌بندی
    if (filters.categorySlug) {
      const { data: category } = await client
        .from("categories")
        .select("id")
        .eq("slug", filters.categorySlug)
        .eq("is_active", true)
        .maybeSingle();
      if (category) query = query.eq("category_id", category.id);
    }

    // برند
    if (filters.brandSlug) {
      const { data: brand } = await client
        .from("brands")
        .select("id")
        .eq("slug", filters.brandSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (brand) query = query.eq("brand_id", brand.id);
    }

    // فلگ‌ها
    if (filters.featured === true) query = query.eq("is_featured", true);
    if (filters.isNew === true) query = query.eq("is_new", true);
    if (filters.bestseller === true) query = query.eq("is_bestseller", true);

    // جستجو
    if (filters.q) {
      query = query.ilike("name", `%${filters.q}%`);
    }

    // مرتب‌سازی
    switch (filters.sort) {
      case "price_asc":
      case "price_desc":
        // مرتب‌سازی دقیق قیمت نیاز به view دارد؛ فعلاً newest
        query = query.order("created_at", { ascending: false });
        break;
      case "popular":
        query = query.order("review_count", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    let items = (data ?? []) as ProductWithRelations[];

    // فیلتر سمت اپ برای سایز / رنگ / موجودی / قیمت (روی variants)
    if (filters.sizeId || filters.colorId || filters.inStock || filters.minPrice != null || filters.maxPrice != null) {
      items = items.filter((p) => {
        const variants = (p.variants ?? []).filter((v) => v.is_active);
        return variants.some((v) => {
          if (filters.sizeId && v.size_id !== filters.sizeId) return false;
          if (filters.colorId && v.color_id !== filters.colorId) return false;
          if (filters.inStock && v.stock_quantity <= 0) return false;
          if (filters.minPrice != null && Number(v.price) < filters.minPrice) return false;
          if (filters.maxPrice != null && Number(v.price) > filters.maxPrice) return false;
          return true;
        });
      });
    }

    return {
      data: items,
      total: count ?? items.length,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? items.length) / pageSize),
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
