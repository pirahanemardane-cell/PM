import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  async rewrites() {
    return [
      { source: "/علاقه-مندی-ها", destination: "/wishlist" },
      { source: "/مقایسه", destination: "/compare" },
      { source: "/سبد-خرید", destination: "/cart" },
      { source: "/آخرین-مشاهده-ها", destination: "/recently-viewed" },
      { source: "/محصولات", destination: "/products" },
      { source: "/ورود", destination: "/login" },
      { source: "/ثبت-نام", destination: "/register" },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
