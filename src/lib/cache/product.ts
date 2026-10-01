import { cache } from "react";
import { ProductService } from "@/services/product.service";

export const getCachedProductBySlug = cache(async (slug: string) => {
  const service = new ProductService();
  return service.getProductBySlug(slug);
});
