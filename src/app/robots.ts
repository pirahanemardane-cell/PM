import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/checkout",
          "/cart",
          "/سبد-خرید",
          "/ورود",
          "/register",
          "/ثبت-نام",
          "/login",
          "/account",
          "/profile",
          "/wishlist",
          "/علاقه-مندی-ها",
          "/compare",
          "/مقایسه",
          "/track",
          "/tags/",
          "/product-tags/",
          "/blog/tags/",
        ],
      },
    ],
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
    host: siteUrl.replace(/\/$/, ""),
  };
}
