import type { MetadataRoute } from "next";

/** فعلاً sitemap خالی — سایت noindex است */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
