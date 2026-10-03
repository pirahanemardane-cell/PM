import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir";

/** فعلاً کل سایت noindex — وقتی آماده انتشار شد allow را برگردانید */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
    host: siteUrl.replace(/\/$/, ""),
  };
}
