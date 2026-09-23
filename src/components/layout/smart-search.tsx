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

const COLORS = [
  { name: "سفید", value: "white" },
  { name: "مشکی", value: "black" },
  { name: "آبی", value: "blue" },
  { name: "خاکستری", value: "gray" },
  { name: "کرم", value: "cream" },
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
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const activeFilters = useMemo(() => {
    let n = 0;
    if (category) n++;
    if (brand) n++;
    if (color) n++;
    if (minPrice || maxPrice) n++;
    return n;
  }, [category, brand, color, minPrice, maxPrice]);

  const goResults = useCallback(
    (query?: string) => {
      const params = new URLSearchParams();
      const text = (query ?? q).trim();
      if (text) params.set("q", text);
      if (category) params.set("category", category);
      if (brand) params.set("brand", brand);
      if (color) params.set("color", color);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      const qs = params.toString();
      router.push(qs ? `/products?${qs}` : "/products");
      setSuggestOpen(false);
      setFilterOpen(false);
    },
    [q, category, brand, color, minPrice, maxPrice, router]
  );

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    goResults();
  }

  // debounce پیشنهاد
  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setProducts([]);
      setBrands([]);
      setCategories([]);
      setSuggestOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(text)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("bad");
        const data = await res.json();
        setProducts(data.products ?? []);
        setBrands(data.brands ?? []);
        setCategories(data.categories ?? []);
        setSuggestOpen(true);
        setFilterOpen(false);
      } catch {
        setProducts([]);
        setBrands([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  // کلیک بیرون
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

  const hasSuggest =
    products.length > 0 || brands.length > 0 || categories.length > 0;

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full max-w-xl", className)}
      dir="rtl"
    >
      <form onSubmit={submit} className="flex h-10 items-center gap-2">
        <div className="border-border bg-background flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-xl border">
          <Search className="text-muted-foreground mr-2 ml-3 h-4 w-4 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => {
              if (q.trim().length >= 2) setSuggestOpen(true);
            }}
            placeholder="جستجو"
            className="font-iranyekan placeholder:text-muted-foreground h-10 min-w-0 flex-1 bg-transparent py-0 text-sm outline-none"
            dir="rtl"
            autoComplete="off"
          />
          {q ? (
            <button
              type="button"
              aria-label="پاک کردن"
              className="text-muted-foreground hover:text-foreground px-1"
              onClick={() => {
                setQ("");
                setSuggestOpen(false);
              }}
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

      {/* پیشنهاد زنده — شبیه دیجی‌کالا */}
      {suggestOpen && q.trim().length >= 2 ? (
        <div className="border-border bg-card absolute top-[calc(100%+6px)] right-0 left-0 z-[60] max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border shadow-lg">
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

          <button
            type="button"
            onClick={() => goResults()}
            className="border-border text-primary hover:bg-muted/50 sticky bottom-0 w-full border-t bg-card px-4 py-3 text-center text-sm font-medium"
          >
            مشاهده همه نتایج جستجو
          </button>
        </div>
      ) : null}

      {/* پنل فیلتر قبلی */}
      {filterOpen ? (
        <div className="border-border bg-card absolute top-[calc(100%+8px)] right-0 left-0 z-50 rounded-xl border p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">فیلتر پیشرفته</span>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">حداقل قیمت</span>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-xl border px-2 text-sm"
                dir="rtl"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">حداکثر قیمت</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-xl border px-2 text-sm"
                dir="rtl"
              />
            </label>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            <span className="text-muted-foreground">رنگ</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(color === c.value ? "" : c.value)}
                  className={cn(
                    "rounded-xl border px-3 py-1 text-xs",
                    color === c.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border"
                  )}
                >
                  {c.name}
                </button>
              ))}
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
