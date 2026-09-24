"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminCreateProductAction } from "@/app/admin/actions/products";
import {
  adminListAttributesAction,
  adminSyncProductAttributesAction,
  type AttrWithOptions,
} from "@/app/admin/actions/attributes";
import { adminUploadProductImageAction, adminDeleteProductImageAction } from "@/app/admin/actions/media";
import {
  adminListCategoriesAction,
  adminListBrandsAction,
} from "@/app/admin/actions/taxonomy";
import { adminListProductTagsAction } from "@/app/admin/actions/tags";
import { Toolbar } from "@/components/ui/toolbar";
import { parseLocaleNumber } from "@/lib/numbers";

type Opt = { id: string; name: string };

export default function NewProductPage() {
  const router = useRouter();
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
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featured, setFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [bestseller, setBestseller] = useState(false);

  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [size, setSize] = useState("");
  type VRow = {
    key: string;
    size: string;
    color_name: string;
    sku: string;
    price: string;
    original_price: string;
    stock: string;
    image_url: string;
  };
  const [variantRows, setVariantRows] = useState<VRow[]>([
    {
      key: "n-0",
      size: "",
      color_name: "",
      sku: "",
      price: "",
      original_price: "",
      stock: "0",
      image_url: "",
    },
  ]);
  const [colorName, setColorName] = useState("");
  const [attrCatalog, setAttrCatalog] = useState<AttrWithOptions[]>([]);
  const [attrSelections, setAttrSelections] = useState<Record<string, string>>({});
  const [sku, setSku] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    void adminListAttributesAction().then((r) => {
      if (r.ok) setAttrCatalog(r.items);
    });
  }, []);
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await adminCreateProductAction({
      name,
      slug: slug || undefined,
      category_id: categoryId,
      brand_id: brandId || null,
      short_description: shortDesc || undefined,
      description: description || undefined,
      status,
      is_featured: featured,
      is_new: isNew,
      is_bestseller: bestseller,
      price: parseLocaleNumber(price) ?? 0,
      original_price: originalPrice ? parseLocaleNumber(originalPrice) : null,
      stock_quantity: parseLocaleNumber(stock) ?? 0,
      size: size || undefined,
      color_name: colorName || undefined,
      sku: sku || undefined,
      tag_ids: selectedTags,
      variants: variantRows.map((r) => ({
        size: r.size || null,
        color_name: r.color_name || null,
        sku: r.sku || null,
        price: parseLocaleNumber(r.price) ?? parseLocaleNumber(price) ?? 0,
        original_price: r.original_price
          ? parseLocaleNumber(r.original_price)
          : originalPrice
            ? parseLocaleNumber(originalPrice)
            : null,
        stock_quantity: parseLocaleNumber(r.stock) ?? 0,
        image_url: r.image_url || null,
      })),
      image_url: imageUrl || undefined,
      image_alt: imageAlt || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        name_required: "نام الزامی است",
        category_required: "دسته الزامی است",
        price_invalid: "قیمت نامعتبر",
      };
      setErr(map[res.error] || res.error || "خطا");
      return;
    }
    if (res.ok && res.id && Object.keys(attrSelections).length) {
      await adminSyncProductAttributesAction(
        res.id,
        Object.entries(attrSelections)
          .filter(([, oid]) => oid)
          .map(([attribute_id, option_id]) => ({ attribute_id, option_id })),
      );
    }
    router.push("/admin/products");
  }

  return (
    <div className="w-full max-w-none space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">افزودن محصول</h1>
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
            <span>اسلاگ (خالی = خودکار)</span>
            <input
              className="border-border bg-background w-full rounded-xl border px-3 py-2"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
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
            <span>خلاصه محصول</span>
            <textarea
              className="border-border bg-background w-full rounded-xl border px-3 py-2"
              rows={3}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="یک پاراگراف کوتاه برای نمایش در صفحه محصول (زیر لینک‌های راهنما)"
            />
            <p className="text-muted-foreground text-xs">
              در صفحه محصول زیر راهنمای سایز / ارسال / مرجوعی نشان داده می‌شود.
            </p>
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
                placeholder="توضیح محصول…"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <select
              className="border-border rounded-lg border px-2 py-1"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published")
              }
            >
              <option value="draft">پیش‌نویس</option>
              <option value="published">منتشر</option>
            </select>
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
                  setImageUrl("");
                  try {
                    await adminDeleteProductImageAction({ url });
                  } catch {
                    /* best-effort: UI already cleared */
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

        <section className="border-border space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">برچسب‌ها</h2>
          <div className="flex flex-wrap gap-3">
            {tags.map((tg) => (
              <label key={tg.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tg.id)}
                  onChange={(e) => {
                    setSelectedTags((prev) =>
                      e.target.checked
                        ? [...prev, tg.id]
                        : prev.filter((id) => id !== tg.id),
                    );
                  }}
                />
                {tg.name}
              </label>
            ))}
          </div>
        </section>

        
        <div className="border-border space-y-3 rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">وریانت‌ها (سایز / رنگ / موجودی)</h2>
            <button
              type="button"
              className="border-border rounded-lg border px-3 py-1 text-xs"
              onClick={() =>
                setVariantRows((prev) => [
                  ...prev,
                  {
                    key: `n-${Date.now()}`,
                    size: "",
                    color_name: "",
                    sku: "",
                    price: price || "",
                    original_price: originalPrice || "",
                    stock: "0",
                  },
                ])
              }
            >
              + وریانت
            </button>
          </div>
          {variantRows.map((row, idx) => (
            <div
              key={row.key}
              className="bg-muted/30 grid gap-2 rounded-xl p-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <label className="block space-y-1 text-xs">
                <span>سایز</span>
                <input
                  className="border-border bg-background w-full rounded-lg border px-2 py-1.5"
                  value={row.size}
                  onChange={(e) =>
                    setVariantRows((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, size: e.target.value } : r,
                      ),
                    )
                  }
                  placeholder="M"
                />
              </label>
              <label className="block space-y-1 text-xs">
                <span>رنگ</span>
                <input
                  className="border-border bg-background w-full rounded-lg border px-2 py-1.5"
                  value={row.color_name}
                  onChange={(e) =>
                    setVariantRows((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, color_name: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <label className="block space-y-1 text-xs">
                <span>SKU</span>
                <input
                  className="border-border bg-background w-full rounded-lg border px-2 py-1.5"
                  value={row.sku}
                  onChange={(e) =>
                    setVariantRows((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, sku: e.target.value } : r,
                      ),
                    )
                  }
                  dir="ltr"
                />
              </label>
              <label className="block space-y-1 text-xs">
                <span>قیمت</span>
                <input
                  className="border-border bg-background w-full rounded-lg border px-2 py-1.5"
                  value={row.price}
                  onChange={(e) =>
                    setVariantRows((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, price: e.target.value } : r,
                      ),
                    )
                  }
                  dir="ltr"
                />
              </label>
              <label className="block space-y-1 text-xs">
                <span>قیمت قبلی</span>
                <input
                  className="border-border bg-background w-full rounded-lg border px-2 py-1.5"
                  value={row.original_price}
                  onChange={(e) =>
                    setVariantRows((prev) =>
                      prev.map((r, i) =>
                        i === idx
                          ? { ...r, original_price: e.target.value }
                          : r,
                      ),
                    )
                  }
                  dir="ltr"
                />
              </label>
              <label className="block space-y-1 text-xs">
                <span>موجودی</span>
                <input
                  className="border-border bg-background w-full rounded-lg border px-2 py-1.5"
                  value={row.stock}
                  onChange={(e) =>
                    setVariantRows((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, stock: e.target.value } : r,
                      ),
                    )
                  }
                  dir="ltr"
                />
              </label>

              <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3">
                {row.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image_url} alt="" className="h-14 w-14 rounded-lg object-cover border" />
                ) : null}
                <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-xs hover:bg-muted">
                  {row.image_url ? "تعویض تصویر وریانت" : "تصویر وریانت"}
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
                      try {
                        const fd = new FormData();
                        fd.set("file", f);
                        const res = await adminUploadProductImageAction(fd);
                        if (res.ok) {
                          setVariantRows((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, image_url: res.url } : r,
                            ),
                          );
                        } else {
                          setErr("آپلود تصویر وریانت ناموفق بود");
                        }
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                </label>
                {row.image_url ? (
                  <button
                    type="button"
                    className="text-destructive text-xs underline"
                    onClick={() =>
                      setVariantRows((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, image_url: "" } : r,
                        ),
                      )
                    }
                  >
                    حذف تصویر
                  </button>
                ) : null}
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  className="text-destructive text-xs hover:underline disabled:opacity-40"
                  disabled={variantRows.length <= 1}
                  onClick={() =>
                    setVariantRows((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  حذف این وریانت
                </button>
              </div>
            </div>
          ))}
        </div>

        
        {attrCatalog.length > 0 ? (
          <div className="border-border space-y-3 rounded-2xl border p-4">
            <h2 className="font-semibold">مشخصات فنی</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {attrCatalog.map((a) => (
                <label key={a.id} className="block space-y-1 text-sm">
                  <span className="font-medium">{a.name}</span>
                  <select
                    className="border-border bg-background w-full rounded-xl border px-3 py-2 text-sm"
                    value={attrSelections[a.id] ?? ""}
                    onChange={(e) =>
                      setAttrSelections((prev) => ({
                        ...prev,
                        [a.id]: e.target.value,
                      }))
                    }
                  >
                    <option value="">— انتخاب —</option>
                    {a.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.value}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {err ? <p className="text-destructive text-sm">{err}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {busy ? "در حال ذخیره…" : "ذخیره محصول"}
        </button>
      </form>
    </div>
  );
}
