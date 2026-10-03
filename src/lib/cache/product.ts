import { cache } from "react";
import { ProductService } from "@/services/product.service";
import {
  cacheGetOrSet,
  CacheKeys,
  CacheTTL,
} from "@/lib/cache/redis";

/**
 * کش درخواست (React cache) + کش Redis توزیع‌شده
 */
export const getCachedProductBySlug = cache(async (slug: string) => {
  return cacheGetOrSet(
    CacheKeys.productBySlug(slug),
    async () => {
      const service = new ProductService();
      return service.getProductBySlug(slug);
    },
    CacheTTL.product
  );
});
