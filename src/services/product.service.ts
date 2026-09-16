import { BaseService } from "./base.service";
import { ProductRepository } from "@/repositories/product.repository";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { ProductWithRelations } from "@/repositories/product.repository";

export class ProductService extends BaseService {
  private repo = new ProductRepository();

  async getPublishedProducts(options?: {
    page?: number;
    pageSize?: number;
    categorySlug?: string;
    featured?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<ProductWithRelations>>> {
    try {
      const result = await this.repo.findPublished(options);
      return this.success(result);
    } catch (e) {
      console.error("[ProductService.getPublishedProducts]", e);
      return this.failure("خطا در دریافت محصولات");
    }
  }

  async getProductBySlug(
    slug: string
  ): Promise<ApiResponse<ProductWithRelations>> {
    try {
      const product = await this.repo.findBySlug(slug);
      if (!product) {
        return this.failure("محصول یافت نشد");
      }
      return this.success(product);
    } catch (e) {
      console.error("[ProductService.getProductBySlug]", e);
      return this.failure("خطا در دریافت محصول");
    }
  }
}
