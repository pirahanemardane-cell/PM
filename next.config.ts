import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  async rewrites() {
    return [
      { source: "/علاقه-مندی-ها", destination: "/wishlist" },
      { source: "/مقایسه", destination: "/compare" },
      { source: "/سبد-خرید", destination: "/cart" },
      { source: "/آخرین-مشاهده-ها", destination: "/recently-viewed" },
      { source: "/محصولات", destination: "/products" },
      { source: "/ورود", destination: "/login" },
      { source: "/%D9%88%D8%B1%D9%88%D8%AF", destination: "/login" },
      { source: "/ثبت-نام", destination: "/register" },
      { source: "/%D8%AB%D8%A8%D8%AA-%D9%86%D8%A7%D9%85", destination: "/register" },
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
      {
        protocol: "https",
        hostname: "media.pirahanmardane.ir",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },
};

export default nextConfig;
