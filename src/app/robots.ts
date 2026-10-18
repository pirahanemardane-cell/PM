import type { MetadataRoute } from "next";
import { isSiteIndexable, SITE_URL } from "@/lib/seo/indexing";

/**
 * تا وقتی NEXT_PUBLIC_ALLOW_INDEX=true نباشد کل سایت disallow است.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isSiteIndexable()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      host: SITE_URL,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/checkout",
          "/checkout/",
          "/api/",
          "/login",
          "/register",
          "/ورود",
          "/ثبت-نام",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
