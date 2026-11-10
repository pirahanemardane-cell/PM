import { describe, expect, it } from "vitest";
import {
  EN_TO_FA,
  FA_TO_EN,
  blogPostHref,
  brandOrCategoryHref,
  enPathToFaRedirect,
  faHref,
  faPathToEnRewrite,
  nextFaRewrites,
  productHref,
} from "@/lib/seo/fa-routes";

describe("fa-routes", () => {
  it("maps core page routes both ways", () => {
    expect(FA_TO_EN["/محصولات"]).toBe("/products");
    expect(EN_TO_FA["/products"]).toBe("/محصولات");
    expect(FA_TO_EN["/مقایسه"]).toBe("/compare");
    expect(EN_TO_FA["/compare"]).toBe("/مقایسه");
    expect(FA_TO_EN["/ورود"]).toBe("/login");
    expect(EN_TO_FA["/wishlist"]).toBe("/علاقه-مندی-ها");
  });

  it("faHref rewrites known EN links and preserves query", () => {
    expect(faHref("/products")).toBe("/محصولات");
    expect(faHref("/products?featured=1")).toBe("/محصولات?featured=1");
    expect(faHref("/cart")).toBe("/سبد-خرید");
    expect(faHref("/dashboard?tab=wishlist")).toBe("/علاقه-مندی-ها");
    expect(faHref("/dashboard?tab=orders")).toBe("/داشبورد?tab=orders");
    expect(faHref("/ورود")).toBe("/ورود");
  });

  it("keeps English entity slugs under FA prefixes", () => {
    expect(productHref("classic-blue-dress-shirt")).toBe(
      "/محصولات/classic-blue-dress-shirt",
    );
    expect(blogPostHref("buying-guide-post")).toBe("/بلاگ/buying-guide-post");
    expect(brandOrCategoryHref("lacoste")).toBe("/lacoste");
    expect(faHref("/products/classic-blue-dress-shirt")).toBe(
      "/محصولات/classic-blue-dress-shirt",
    );
    expect(faHref("/brands/lacoste")).toBe("/lacoste");
    expect(faHref("/categories/dress-shirts")).toBe("/dress-shirts");
  });

  it("enPathToFaRedirect covers pages and nested prefixes", () => {
    expect(enPathToFaRedirect("/login")).toBe("/ورود");
    expect(enPathToFaRedirect("/products")).toBe("/محصولات");
    expect(enPathToFaRedirect("/products/foo-bar")).toBe("/محصولات/foo-bar");
    expect(enPathToFaRedirect("/blog/hello")).toBe("/بلاگ/hello");
    expect(enPathToFaRedirect("/brands/lacoste")).toBe("/lacoste");
    expect(enPathToFaRedirect("/categories/shirts")).toBe("/shirts");
    expect(enPathToFaRedirect("/محصولات")).toBe(null);
  });

  it("faPathToEnRewrite covers pages and nested prefixes", () => {
    expect(faPathToEnRewrite("/محصولات")).toBe("/products");
    expect(faPathToEnRewrite("/محصولات/foo-bar")).toBe("/products/foo-bar");
    expect(faPathToEnRewrite("/بلاگ/hello")).toBe("/blog/hello");
    expect(faPathToEnRewrite("/علاقه-مندی-ها")).toBe("/dashboard?tab=wishlist");
    expect(faPathToEnRewrite("/products")).toBe(null);
  });

  it("nextFaRewrites includes nested product/blog prefixes", () => {
    const list = nextFaRewrites();
    expect(list.some((r) => r.source === "/محصولات" && r.destination === "/products")).toBe(
      true,
    );
    expect(
      list.some(
        (r) => r.source === "/محصولات/:path*" && r.destination === "/products/:path*",
      ),
    ).toBe(true);
    expect(
      list.some((r) => r.source === "/بلاگ/:path*" && r.destination === "/blog/:path*"),
    ).toBe(true);
  });
});
