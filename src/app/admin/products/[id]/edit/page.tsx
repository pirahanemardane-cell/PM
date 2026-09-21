"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  adminGetProductAction,
  adminUpdateProductAction,
} from "@/app/admin/actions/products";
import { adminUploadProductImageAction, adminDeleteProductImageAction } from "@/app/admin/actions/media";
import {
  adminListCategoriesAction,
  adminListBrandsAction,
} from "@/app/admin/actions/taxonomy";
import { adminListProductTagsAction } from "@/app/admin/actions/tags";
import { Toolbar } from "@/components/ui/toolbar";
import { LumaSpin } from "@/components/ui/luma-spin";

type Opt = { id: string; name: string };

export default function EditProductPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<Opt[]>([]);
  const [brands, setBrands] = useState<Opt[]>([]);
  const [tags, setTags] = useState<Opt[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [featured, setFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [bestseller, setBestseller] = useState(false);

  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [size, setSize] = useState("");
  const [colorName, setColorName] = useState("");
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    void (async () => {
      const [c, b, t] = await Promise.all([
        adminListCategoriesAction(),
        adminListBrandsAction(),
        adminListProductTagsAction(),
      ]);
      if (c.ok) {
        setCats(
          (c.items as { id: string; name: string }[]).map((x) => ({
            id: x.id,
            name: x.name,
          })),
        );
      }
      if (b.ok) {
        setBrands(
          (b.items as { id: string; name: string }[]).map((x) => ({
            id: x.id,
            name: x.name,
          })),
        );
      }
      if (t.ok) {
        setTags(
          (t.items as { id: string; name: string; is_active?: boolean }[])
            .filter((x) => x.is_active !== false)
            .map((x) => ({ id: x.id, name: x.name })),
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const prod = await adminGetProductAction(id);
      if (cancelled) return;
      if (!prod.ok) {
        setErr(prod.error === "not_found" ? "محصول یافت نشد" : "خطا در بارگذاری");
        setLoading(false);
        return;
      }
      const p = prod.product as {
        name: string;
        slug: string;
        category_id: string;
        brand_id?: string | null;
        short_description?: string | null;
        description?: string | null;
        status: string;
        is_featured?: boolean;
        is_new?: boolean;
        is_bestseller?: boolean;
        product_variants?: {
          sku?: string | null;
          price?: number;
          original_price?: number | null;
          stock_quantity?: number;
          size?: string | null;
          color_name?: string | null;
        }[];
        product_images?: {
          url?: string;
          alt_text?: string | null;
          is_primary?: boolean;
        }[];
        product_tag_map?: { tag_id: string }[];
      };
      setName(p.name ?? "");
      setSlug(p.slug ?? "");
      setCategoryId(p.category_id ?? "");
      setBrandId(p.brand_id ?? "");
      setShortDesc(p.short_description ?? "");
      setDescription(p.description ?? "");
      setStatus((p.status as "draft" | "published" | "archived") || "draft");
      setFeatured(!!p.is_featured);
      setIsNew(!!p.is_new);
      setBestseller(!!p.is_bestseller);
      const v = p.product_variants?.[0];
      if (v) {
        setPrice(String(v.price ?? ""));
        setOriginalPrice(v.original_price != null ? String(v.original_price) : "");
        setStock(String(v.stock_quantity ?? 0));
        setSize(v.size ?? "");
        setColorName(v.color_name ?? "");
        setSku(v.sku ?? "");
      }
      const img =
        p.product_images?.find((i) => i.is_primary) ?? p.product_images?.[0];
      if (img) {
        setImageUrl(img.url ?? "");
        setImageAlt(img.alt_text ?? "");
        setPrimaryImageId((img as { id?: string }).id ?? null);
      }
      setSelectedTags((p.product_tag_map ?? []).map((x) => x.tag_id));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await adminUpdateProductAction(id, {
      name,
      category_id: categoryId,
      brand_id: brandId || null,
      short_description: shortDesc || null,
      description: description || null,
      status,
      is_featured: featured,
      is_new: isNew,
      is_bestseller: bestseller,
      price: Number(price),
      original_price: originalPrice ? Number(originalPrice) : null,
      stock_quantity: Number(stock) || 0,
      size: size || null,
      color_name: colorName || null,
      sku: sku || null,
      tag_ids: selectedTags,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(
        res.error === "validation"
          ? "نام و دسته الزامی است"
          : res.error || "خطا",
      );
      return;
    }
    router.push("/admin/products");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20" dir="rtl">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ویرایش محصول</h1>
        <Link
          href="/admin/products"
          className="text-muted-foreground text-sm underline"
        >
          بازگشت
        </Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <section className="border-border space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">اطلاعات پایه</h2>
          <label className="block space-y-1 text-sm">
            <span>نام *</span>
            <input
              className="border-border bg-background w-full rounded-xl border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>اسلاگ</span>
            <input
              className="border-border bg-background w-full rounded-xl border px-3 py-2"
              value={slug}
              readOnly
              dir="ltr"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>دسته‌بندی *</span>
              <select
                className="border-border bg-background w-full rounded-xl border px-3 py-2"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">انتخاب…</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span>برند</span>
              <select
                className="border-border bg-background w-full rounded-xl border px-3 py-2"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="">—</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span>خلاصه</span>
            <textarea
              className="border-border bg-background w-full rounded-xl border px-3 py-2"
              rows={2}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
            />
          </label>
          <div className="space-y-1 text-sm">
            <span>توضیحات</span>
            <div className="border-border overflow-hidden rounded-xl border">
              <Toolbar />
              <textarea
                className="bg-background w-full border-0 px-3 py-2 focus:outline-none"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <span>وضعیت</span>
              <select
                className="border-border rounded-lg border px-2 py-1"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="draft">پیش‌نویس</option>
                <option value="published">منتشر</option>
                <option value="archived">بایگانی</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              ویژه
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
              />
              جدید
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bestseller}
                onChange={(e) => setBestseller(e.target.checked)}
              />
              پرفروش
            </label>
          </div>
        </section>

        <section className="border-border space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">واریانت اصلی</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>قیمت *</span>
              <input
                className="border-border bg-background w-full rounded-xl border px-3 py-2"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                inputMode="numeric"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>قیمت قبل</span>
              <input
                className="border-border bg-background w-full rounded-xl border px-3 py-2"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                inputMode="numeric"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>موجودی</span>
              <input
                className="border-border bg-background w-full rounded-xl border px-3 py-2"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                inputMode="numeric"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>SKU</span>
              <input
                className="border-border bg-background w-full rounded-xl border px-3 py-2"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                dir="ltr"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>سایز</span>
              <input
                className="border-border bg-background w-full rounded-xl border px-3 py-2"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>رنگ</span>
              <input
                className="border-border bg-background w-full rounded-xl border px-3 py-2"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="border-border space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">تصویر اصلی</h2>
          <p className="text-muted-foreground text-xs">
            آپلود مستقیم — تبدیل به WebP، عرض حداکثر ۱۲۰۰، واترمارک بالا-راست
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              {uploadingImage ? "در حال آپلود…" : "انتخاب فایل تصویر"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingImage || busy}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setUploadingImage(true);
                  setErr("");
                  try {
                    const fd = new FormData();
                    fd.set("file", f);
                    const res = await adminUploadProductImageAction(fd);
                    if (!res.ok) {
                      setErr(
                        res.error === "too_large"
                          ? "حجم فایل بیش از ۱۲ مگابایت است"
                          : res.error === "not_image"
                            ? "فقط فایل تصویری مجاز است"
                            : "آپلود ناموفق بود",
                      );
                      return;
                    }
                    setImageUrl(res.url);
                  } catch {
                    setErr("آپلود ناموفق بود");
                  } finally {
                    setUploadingImage(false);
                  }
                }}
              />
            </label>
            {imageUrl ? (
              <button
                type="button"
                className="text-sm text-destructive underline"
                disabled={uploadingImage || busy}
                onClick={async () => {
                  const url = imageUrl;
                  const imageId = primaryImageId;
                  setImageUrl("");
                  setPrimaryImageId(null);
                  try {
                    await adminDeleteProductImageAction({ url, imageId });
                  } catch {
                    /* best-effort */
                  }
                }}
              >
                حذف تصویر
              </button>
            ) : null}
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span>آدرس تصویر (اختیاری / خودکار بعد از آپلود)</span>
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm"
              dir="ltr"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://media.pirahanmardane.ir/..."
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>متن جایگزین (alt)</span>
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="توضیح کوتاه تصویر"
            />
          </label>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={imageAlt || "پیش‌نمایش"}
              className="mt-2 max-h-48 rounded-md border object-contain"
            />
          ) : null}
        </section>

        {tags.length ? (
          <section className="border-border space-y-2 rounded-xl border p-4">
            <h2 className="font-semibold">برچسب‌ها</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              {tags.map((tg) => {
                const on = selectedTags.includes(tg.id);
                return (
                  <button
                    key={tg.id}
                    type="button"
                    className={
                      on
                        ? "bg-primary text-primary-foreground rounded-lg px-2 py-1"
                        : "border-border rounded-lg border px-2 py-1"
                    }
                    onClick={() =>
                      setSelectedTags((prev) =>
                        on ? prev.filter((x) => x !== tg.id) : [...prev, tg.id],
                      )
                    }
                  >
                    {tg.name}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {err ? <p className="text-destructive text-sm">{err}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="bg-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm disabled:opacity-60"
        >
          {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </button>
      </form>
    </div>
  );
}
