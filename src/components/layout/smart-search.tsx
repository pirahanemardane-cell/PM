"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, X, LayoutGrid, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type SuggestProduct = {
  name: string;
  slug: string;
  brand?: string | null;
  category?: string | null;
};
type SuggestItem = { name: string; slug: string };
type SuggestPost = { title: string; slug: string };

const SORTS = [
  { value: "", label: "جدیدترین" },
  { value: "popular", label: "محبوب‌ترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
];

export function SmartSearch({ className }: { className?: string }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SuggestProduct[]>([]);
  const [brands, setBrands] = useState<SuggestItem[]>([]);
  const [categories, setCategories] = useState<SuggestItem[]>([]);
  const [posts, setPosts] = useState<SuggestPost[]>([]);

  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [sort, setSort] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [facetCats, setFacetCats] = useState<SuggestItem[]>([]);
  const [facetBrands, setFacetBrands] = useState<SuggestItem[]>([]);
  const [facetColors, setFacetColors] = useState<SuggestItem[]>([]);
  const [facetSizes, setFacetSizes] = useState<SuggestItem[]>([]);
  const [facetsLoaded, setFacetsLoaded] = useState(false);

  const activeFilters = useMemo(() => {
    let n = 0;
    if (category) n++;
    if (brand) n++;
    if (color) n++;
    if (size) n++;
    if (sort) n++;
    if (minPrice || maxPrice) n++;
    return n;
  }, [category, brand, color, size, sort, minPrice, maxPrice]);

  const hasSuggest =
    products.length > 0 ||
    brands.length > 0 ||
    categories.length > 0 ||
    posts.length > 0;

  const goResults = useCallback(
    (query?: string) => {
      const params = new URLSearchParams();
      const text = (query ?? q).trim();
      if (text) params.set("q", text);
      if (category) params.set("category", category);
      if (brand) params.set("brand", brand);
      if (color) params.set("color", color);
      if (size) params.set("size", size);
      if (sort) params.set("sort", sort);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      const qs = params.toString();
      router.push(qs ? `/products?${qs}` : "/products");
      setSuggestOpen(false);
      setFilterOpen(false);
    },
    [q, category, brand, color, size, sort, minPrice, maxPrice, router]
  );

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    goResults();
  }

  function clearFilters() {
    setCategory("");
    setBrand("");
    setColor("");
    setSize("");
    setSort("");
    setMinPrice("");
    setMaxPrice("");
  }

  useEffect(() => {
    if (!filterOpen || facetsLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/search/facets");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setFacetCats(data.categories ?? []);
        setFacetBrands(data.brands ?? []);
        setFacetColors(data.colors ?? []);
        setFacetSizes(data.sizes ?? []);
        setFacetsLoaded(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterOpen, facetsLoaded]);

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setProducts([]);
      setBrands([]);
      setCategories([]);
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(text)}`
        );
        if (!res.ok) throw new Error("suggest failed");
        const data = await res.json();
        setProducts(data.products ?? []);
        setBrands(data.brands ?? []);
        setCategories(data.categories ?? []);
        setPosts(data.posts ?? []);
      } catch {
        setProducts([]);
        setBrands([]);
        setCategories([]);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setSuggestOpen(false);
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const chip = (active: boolean) =>
    cn(
      "rounded-xl border px-3 py-1.5 text-xs transition-colors",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border hover:bg-muted"
    );

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={submit}
        className="border-border bg-background flex items-center gap-1 rounded-2xl border p-1 shadow-sm"
      >
        <div className="flex min-w-0 flex-1 items-center">
          <Search className="text-muted-foreground mr-2 ml-2 h-4 w-4 shrink-0" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSuggestOpen(true);
              setFilterOpen(false);
            }}
            onFocus={() => {
              if (q.trim().length >= 2) setSuggestOpen(true);
            }}
            placeholder="جستجوی محصول، برند، دسته…"
            className="placeholder:text-muted-foreground h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
            dir="rtl"
            autoComplete="off"
          />
          {q ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setSuggestOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground px-2"
              aria-label="پاک کردن"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setFilterOpen((v) => !v);
              setSuggestOpen(false);
            }}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1 border-r border-border px-2.5 text-xs",
              filterOpen || activeFilters
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
            aria-label="فیلترها"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">فیلتر</span>
            {activeFilters > 0 ? (
              <span className="bg-primary text-primary-foreground flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]">
                {activeFilters}
              </span>
            ) : null}
          </button>
        </div>
        <button
          type="submit"
          className="bg-primary text-primary-foreground hidden h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium sm:inline-flex"
        >
          جستجو
        </button>
      </form>

      {suggestOpen && q.trim().length >= 2 ? (
        <div className="border-border bg-card fixed inset-x-0 top-[3.5rem] z-[120] max-h-[min(80vh,32rem)] overflow-y-auto rounded-none border-x-0 border-b border-t px-3 py-3 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:left-0 sm:top-[calc(100%+8px)] sm:max-h-[min(70vh,28rem)] sm:rounded-xl sm:border sm:shadow-lg">
          {loading && !hasSuggest ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">
              در حال جستجو…
            </p>
          ) : null}
          {!loading && !hasSuggest ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">
              نتیجه‌ای یافت نشد
            </p>
          ) : null}
          {products.length > 0 ? (
            <ul className="divide-border divide-y">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/products/${p.slug}`}
                    onClick={() => setSuggestOpen(false)}
                    className="hover:bg-muted/60 flex items-center gap-3 px-3 py-2.5 text-sm"
                  >
                    <LayoutGrid className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {p.name}
                    </span>
                    {(p.brand || p.category) && (
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {p.brand || p.category}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {categories.length > 0 ? (
            <div className="border-border border-t px-3 py-2">
              <p className="text-muted-foreground mb-1 text-[11px]">دسته‌بندی</p>
              <ul className="space-y-0.5">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/products?category=${encodeURIComponent(c.slug)}`}
                      onClick={() => setSuggestOpen(false)}
                      className="hover:bg-muted/60 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <Tag className="text-muted-foreground h-3.5 w-3.5" />
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {brands.length > 0 ? (
            <div className="border-border border-t px-3 py-2">
              <p className="text-muted-foreground mb-1 text-[11px]">برند</p>
              <ul className="space-y-0.5">
                {brands.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={`/brands/${b.slug}`}
                      onClick={() => setSuggestOpen(false)}
                      className="hover:bg-muted/60 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <Tag className="text-muted-foreground h-3.5 w-3.5" />
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {posts.length > 0 ? (
            <div className="border-border border-t px-3 py-2">
              <p className="text-muted-foreground mb-1 text-[11px]">مقالات</p>
              <ul className="space-y-0.5">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={"/blog/" + post.slug}
                      onClick={() => setSuggestOpen(false)}
                      className="hover:bg-muted/60 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <Tag className="text-muted-foreground h-3.5 w-3.5" />
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => goResults()}
            className="border-border text-primary hover:bg-muted/50 sticky bottom-0 w-full border-t bg-card px-4 py-3 text-center text-sm font-medium"
          >
            مشاهده همه نتایج جستجو
          </button>
        </div>
      ) : null}

      {filterOpen ? (
        <div className="border-border bg-card fixed inset-x-0 top-[3.5rem] z-[120] max-h-[min(80vh,36rem)] overflow-y-auto rounded-none border-x-0 border-b border-t px-3 py-3 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:left-0 sm:top-[calc(100%+8px)] sm:max-h-[min(75vh,32rem)] sm:rounded-xl sm:border sm:shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">فیلتر پیشرفته</span>
            <div className="flex items-center gap-2">
              {activeFilters > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-muted-foreground text-xs hover:text-primary"
                >
                  پاک کردن
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                مرتب‌سازی
              </p>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <button
                    key={s.value || "newest"}
                    type="button"
                    onClick={() => setSort(s.value)}
                    className={chip(sort === s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                دسته‌بندی
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("")}
                  className={chip(!category)}
                >
                  همه
                </button>
                {facetCats.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() =>
                      setCategory(category === c.slug ? "" : c.slug)
                    }
                    className={chip(category === c.slug)}
                  >
                    {c.name}
                  </button>
                ))}
                {!facetsLoaded ? (
                  <span className="text-muted-foreground text-xs">…</span>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                برند
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBrand("")}
                  className={chip(!brand)}
                >
                  همه
                </button>
                {facetBrands.map((b) => (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => setBrand(brand === b.slug ? "" : b.slug)}
                    className={chip(brand === b.slug)}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">حداقل قیمت (تومان)</span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="border-input bg-background h-10 w-full rounded-xl border px-2 text-sm"
                  dir="rtl"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">حداکثر قیمت (تومان)</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="border-input bg-background h-10 w-full rounded-xl border px-2 text-sm"
                  dir="rtl"
                />
              </label>
            </div>

            <div>
              <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                رنگ
              </p>
              <div className="flex flex-wrap gap-2">
                {facetColors.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setColor(color === c.slug ? "" : c.slug)}
                    className={chip(color === c.slug)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                سایز
              </p>
              <div className="flex flex-wrap gap-2">
                {facetSizes.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => setSize(size === s.slug ? "" : s.slug)}
                    className={chip(size === s.slug)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => goResults()}
            className="bg-primary text-primary-foreground mt-4 h-10 w-full rounded-xl text-sm font-medium"
          >
            اعمال و جستجو
          </button>
        </div>
      ) : null}
    </div>
  );
}
