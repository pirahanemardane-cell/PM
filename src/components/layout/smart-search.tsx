"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["پیراهن رسمی", "پیراهن کژوال", "پیراهن جین", "پیراهن فصلی"];
const BRANDS = ["برند A", "برند B", "برند C", "برند داخلی"];
const COLORS = [
  { name: "سفید", value: "white" },
  { name: "مشکی", value: "black" },
  { name: "آبی", value: "blue" },
  { name: "خاکستری", value: "gray" },
  { name: "کرم", value: "cream" },
];

export function SmartSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
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

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (color) params.set("color", color);
    if (minPrice) params.set("min", minPrice);
    if (maxPrice) params.set("max", maxPrice);
    const qs = params.toString();
    router.push(qs ? `/محصولات?${qs}` : "/محصولات");
    setOpen(false);
  }

  function clearFilters() {
    setCategory("");
    setBrand("");
    setColor("");
    setMinPrice("");
    setMaxPrice("");
  }

  return (
    <div className={cn("relative w-full max-w-xl", className)} dir="rtl">
      <form onSubmit={submit} className="flex h-10 items-center gap-2">
        <div className="border-border bg-background flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-xl border">
          <Search className="text-muted-foreground mr-2 ml-3 h-4 w-4 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی هوشمند محصول، برند، رنگ…"
            className="font-iranyekan placeholder:text-muted-foreground h-10 min-w-0 flex-1 bg-transparent py-0 text-sm outline-none"
            dir="rtl"
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1 border-r border-border px-2.5 text-xs",
              open || activeFilters
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-primary hover:text-primary-foreground"
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

      {open ? (
        <div className="border-border bg-card absolute top-[calc(100%+8px)] right-0 left-0 z-50 rounded-xl border p-4 shrink-0 overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">فیلتر پیشرفته</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearFilters} className="text-muted-foreground text-xs hover:underline h-10 items-center justify-center rounded-xl hover:bg-primary hover:text-primary-foreground shrink-0">
                پاک کردن
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">دسته‌بندی محصول</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-xl border px-2 text-sm text-right overflow-hidden"
              >
                <option value="">همه</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">برند</span>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-xl border px-2 text-sm text-right overflow-hidden"
              >
                <option value="">همه</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">حداقل قیمت (تومان)</span>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-xl border px-2 text-sm text-right overflow-hidden"
                dir="rtl"
              />
            </label>

            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">حداکثر قیمت (تومان)</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-xl border px-2 text-sm text-right overflow-hidden"
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
                      : "border-border hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => submit()}
            className="bg-primary text-primary-foreground mt-4 h-10 w-full rounded-xl text-sm font-medium hover:bg-primary hover:text-primary-foreground shrink-0"
          >
            اعمال فیلتر و جستجو
          </button>
        </div>
      ) : null}
    </div>
  );
}
