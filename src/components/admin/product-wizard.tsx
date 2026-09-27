"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminCreateProductAction,
  adminGetProductAction,
  adminUpdateProductAction,
  adminSyncProductVariantsAction,
  adminAddProductGalleryImageAction,
  adminCheckProductSlugAction,
} from "@/app/admin/actions/products";
import {
  adminListAttributesAction,
  adminGetProductAttributeValuesAction,
  adminSyncProductAttributesAction,
  type AttrWithOptions,
} from "@/app/admin/actions/attributes";
import {
  adminUploadProductImageAction,
  adminDeleteProductImageAction,
} from "@/app/admin/actions/media";
import {
  adminListCategoriesAction,
  adminListBrandsAction,
} from "@/app/admin/actions/taxonomy";
import { adminListProductTagsAction } from "@/app/admin/actions/tags";
import { adminListSizeGuidesAction } from "@/app/admin/actions/products";
import { Toolbar } from "@/components/ui/toolbar";
import { LumaSpin } from "@/components/ui/luma-spin";
import { parseLocaleNumber } from "@/lib/numbers";

type Opt = { id: string; name: string };
type VRow = {
  key: string;
  id?: string;
  size: string;
  color_name: string;
  sku: string;
  price: string;
  original_price: string;
  stock: string;
  image_url: string;
};

const STEPS = [
  { id: 1, title: "هویت" },
  { id: 2, title: "قیمت" },
  { id: 3, title: "طبقه‌بندی" },
  { id: 4, title: "مشخصات" },
  { id: 5, title: "رسانه" },
  { id: 6, title: "واریانت / موجودی" },
  { id: 7, title: "راهنمای سایز" },
  { id: 8, title: "توضیحات" },
  { id: 9, title: "انتشار" },
] as const;

function emptyVariant(seed?: { price?: string; original?: string }): VRow {
  return {
    key: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    size: "",
    color_name: "",
    sku: "",
    price: seed?.price ?? "",
    original_price: seed?.original ?? "",
    stock: "0",
    image_url: "",
  };
}

function suggestSlug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\u0600-\u06FFa-z0-9\-]+/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `p-${Date.now()}`
  );
}

/** slug: فارسی + لاتین کوچک + عدد + خط تیره */
const SLUG_RE = /^[\u0600-\u06FFa-z0-9]+(?:-[\u0600-\u06FFa-z0-9]+)*$/;

export type ProductWizardProps = { productId?: string | null };

export function ProductWizard({ productId: initialId = null }: ProductWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState<string | null>(initialId);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!initialId);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featured, setFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [productType, setProductType] = useState<"simple" | "variable">("simple");
  const [simpleSku, setSimpleSku] = useState("");
  const [simpleStock, setSimpleStock] = useState("0");
  const [variants, setVariants] = useState<VRow[]>([emptyVariant()]);
  const [imageUrl, setImageUrl] = useState("");
  const [gallery, setGallery] = useState<{ id?: string; url: string }[]>([]);
  const [attrDefs, setAttrDefs] = useState<AttrWithOptions[]>([]);
  const sizeAttr = attrDefs.find((a) => a.slug === "size");
  const colorAttr = attrDefs.find((a) => a.slug === "color");
  const sizeOpts = (sizeAttr?.options ?? []) as Array<{ id: string; value: string; hex?: string | null }>;
  const colorOpts = (colorAttr?.options ?? []) as Array<{ id: string; value: string; hex?: string | null }>;
  const specDefs = attrDefs.filter((a) => a.slug !== "size" && a.slug !== "color");
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [loadedAttrRows, setLoadedAttrRows] = useState<
    Array<{ attribute_id: string; option_id?: string | null; value_text?: string | null }>
  >([]);

  /** option ids chosen on step 4 for variant axes */
  const [pickedSizeIds, setPickedSizeIds] = useState<string[]>([]);
  const [pickedColorIds, setPickedColorIds] = useState<string[]>([]);
  const pickedSizeOpts = sizeOpts.filter((o) => pickedSizeIds.includes(o.id));
  const pickedColorOpts = colorOpts.filter((o) => pickedColorIds.includes(o.id));
  const sizeChoices = pickedSizeOpts.length ? pickedSizeOpts : sizeOpts;
  const colorChoices = pickedColorOpts.length ? pickedColorOpts : colorOpts;
  const [cats, setCats] = useState<Opt[]>([]);
  const [brands, setBrands] = useState<Opt[]>([]);
  const [tags, setTags] = useState<Opt[]>([]);
  const [guides, setGuides] = useState<Opt[]>([]);
  const [sizeGuideId, setSizeGuideId] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [publishMode, setPublishMode] = useState<"draft" | "now" | "schedule">("draft");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken" | "err">("idle");

  useEffect(() => {
    void (async () => {
      const [c, b, t, a, g] = await Promise.all([
        adminListCategoriesAction(),
        adminListBrandsAction(),
        adminListProductTagsAction(),
        adminListAttributesAction(),
        adminListSizeGuidesAction(),
      ]);
      const pickOpts = (res: { ok?: boolean; items?: { id: string; name: string }[]; data?: { id: string; name: string }[] }) =>
        ((res.items ?? res.data ?? []) as { id: string; name: string }[]).map((x) => ({ id: x.id, name: x.name }));
      if (c.ok) setCats(pickOpts(c as { items?: { id: string; name: string }[]; data?: { id: string; name: string }[] }));
      if (b.ok) setBrands(pickOpts(b as { items?: { id: string; name: string }[]; data?: { id: string; name: string }[] }));
      if (t.ok) setTags(pickOpts(t as { items?: { id: string; name: string }[]; data?: { id: string; name: string }[] }));
      if (a.ok) setAttrDefs((((a as { items?: AttrWithOptions[]; data?: AttrWithOptions[] }).items) ?? ((a as { data?: AttrWithOptions[] }).data) ?? []) as AttrWithOptions[]);
      if (g.ok) setGuides(pickOpts(g as { items?: { id: string; name: string }[]; data?: { id: string; name: string }[] }));
    })();
  }, []);

  useEffect(() => {
    if (!initialId) return;
    void (async () => {
      setLoading(true);
      const res = await adminGetProductAction(initialId);
      const payload = (res as { data?: unknown; product?: unknown }).data ?? (res as { product?: unknown }).product;
      if (!res.ok || !payload) {
        const detail = (res as { detail?: string }).detail;
        setErr(detail || (res as { error?: string }).error || "محصول یافت نشد");
        setLoading(false);
        return;
      }
      const p = payload as Record<string, unknown>;
      setName(String(p.name ?? ""));
      setSlug(String(p.slug ?? ""));
      setSlugTouched(true);
      setCategoryId(String(p.category_id ?? ""));
      setBrandId(String(p.brand_id ?? "") || "");
      setShortDesc(String(p.short_description ?? ""));
      setDescription(String(p.description ?? ""));
      setStatus((p.status as "draft" | "published") || "draft");
      setFeatured(!!p.is_featured);
      setIsNew(p.is_new !== false);
      setIsActive(p.is_active !== false);
      setImageUrl(String(p.image_url ?? ""));
      setSizeGuideId(String(p.size_guide_id ?? "") || "");
      {
        const pa = p.published_at ? String(p.published_at) : "";
        if (pa) {
          const d = new Date(pa);
          if (!Number.isNaN(d.getTime())) {
            const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setPublishedAt(local);
            if (d.getTime() > Date.now()) setPublishMode("schedule");
            else if ((p.status as string) === "published") setPublishMode("now");
          }
        } else if ((p.status as string) === "published") setPublishMode("now");
      }
      const tagIds = (p.tag_ids as string[]) || [];
      setSelectedTags(tagIds);
      const vars = (p.variants as Array<Record<string, unknown>>) || [];
      if (vars.length > 1 || (vars[0] && (vars[0].size || vars[0].color_name))) {
        setProductType("variable");
        {
          const imgsEarly =
            (p.images as Array<{ url?: string; variant_id?: string | null }>) || [];
          const byVariant = new Map<string, string>();
          for (const im of imgsEarly) {
            if (im.variant_id && im.url) byVariant.set(String(im.variant_id), String(im.url));
          }
          setVariants(
            vars.map((v) => {
              const vid = v.id ? String(v.id) : undefined;
              return {
                key: String(v.id ?? `e-${Math.random()}`),
                id: vid,
                size: String(v.size ?? ""),
                color_name: String(v.color_name ?? ""),
                sku: String(v.sku ?? ""),
                price: String(v.price ?? ""),
                original_price: String(v.original_price ?? ""),
                stock: String(v.stock_quantity ?? v.stock ?? "0"),
                image_url: String(
                  (vid && byVariant.get(vid)) || v.image_url || "",
                ),
              };
            }),
          );
        }
      } else if (vars[0]) {
        setProductType("simple");
        setSimpleSku(String(vars[0].sku ?? ""));
        setSimpleStock(String(vars[0].stock_quantity ?? vars[0].stock ?? "0"));
        setPrice(String(vars[0].price ?? ""));
        setSalePrice(String(vars[0].original_price ?? "") === String(vars[0].price ?? "") ? "" : String(vars[0].original_price ?? ""));
        // price = selling, original = higher struck-through in some schemas — map carefully
        const pr = Number(vars[0].price);
        const op = Number(vars[0].original_price);
        if (op && op > pr) {
          setPrice(String(op));
          setSalePrice(String(pr));
        } else {
          setPrice(String(vars[0].price ?? ""));
          setSalePrice("");
        }
      }
      const imgs =
        (p.images as Array<{
          id?: string;
          url: string;
          is_primary?: boolean;
          variant_id?: string | null;
        }>) || [];
      setGallery(
        imgs
          .filter(
            (i) =>
              i.url &&
              !i.is_primary &&
              !i.variant_id &&
              i.url !== p.image_url,
          )
          .map((i) => ({ id: i.id, url: i.url })),
      );
      const av = await adminGetProductAttributeValuesAction(initialId);
      if (av.ok) {
        const list =
          (
            av as {
              values?: Array<{
                attribute_id: string;
                option_id?: string | null;
                value_text?: string | null;
              }>;
            }
          ).values ?? [];
        setLoadedAttrRows(list);
        const map: Record<string, string> = {};
        for (const row of list) {
          const oid = (row.option_id || row.value_text || "").trim();
          if (oid) map[row.attribute_id] = oid;
        }
        setAttrValues(map);
      }
      setProductId(initialId);
      setLoading(false);
    })();
  }, [initialId]);


  useEffect(() => {
    if (!loadedAttrRows.length || !attrDefs.length) return;
    const sizeId = attrDefs.find((a) => a.slug === "size")?.id;
    const colorId = attrDefs.find((a) => a.slug === "color")?.id;
    const sizes: string[] = [];
    const colors: string[] = [];
    const map: Record<string, string> = {};
    for (const row of loadedAttrRows) {
      const oid = (row.option_id || row.value_text || "").trim();
      if (!oid) continue;
      if (sizeId && row.attribute_id === sizeId) sizes.push(oid);
      else if (colorId && row.attribute_id === colorId) colors.push(oid);
      else map[row.attribute_id] = oid;
    }
    if (Object.keys(map).length) setAttrValues((m) => ({ ...map, ...m }));
    if (sizes.length) setPickedSizeIds(sizes);
    if (colors.length) setPickedColorIds(colors);
  }, [loadedAttrRows, attrDefs]);

  useEffect(() => {
    if (!slugTouched && name) setSlug(suggestSlug(name));
  }, [name, slugTouched]);

  const sellingPrice = useMemo(() => {
    const p = parseLocaleNumber(price);
    const s = parseLocaleNumber(salePrice);
    if (s > 0 && s < p) return s;
    return p;
  }, [price, salePrice]);

  const originalPrice = useMemo(() => {
    const p = parseLocaleNumber(price);
    const s = parseLocaleNumber(salePrice);
    if (s > 0 && s < p) return p;
    return p;
  }, [price, salePrice]);

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!name.trim()) return "نام محصول الزامی است";
      if (!slug.trim()) return "slug الزامی است";
      if (!SLUG_RE.test(slug.trim()))
        return "slug: حروف فارسی/لاتین، عدد و خط تیره";
      if (slugStatus === "taken") return "این slug قبلاً استفاده شده";
    }
    if (s === 2) {
      if (!(parseLocaleNumber(price) > 0)) return "قیمت اصلی معتبر نیست";
      const sp = parseLocaleNumber(salePrice);
      if (salePrice && sp > 0 && sp >= parseLocaleNumber(price))
        return "قیمت بعد از تخفیف باید کمتر از قیمت اصلی باشد";
    }
    if (s === 3 && !categoryId) return "دسته الزامی است";
    if (s === 5 && !imageUrl) return "تصویر شاخص الزامی است";
    if (s === 6) {
      if (productType === "simple") {
        if (!(parseLocaleNumber(simpleStock) >= 0)) return "موجودی نامعتبر";
      } else if (variants.length > 0) {
        for (const v of variants) {
          if (!v.size && !v.color_name) return "هر واریانت باید سایز یا رنگ داشته باشد";
          if (!(parseLocaleNumber(v.price) > 0) && !(sellingPrice > 0))
            return "قیمت واریانت یا قیمت مرحله ۲ لازم است";
        }
      }
      // متغیر بدون واریانت = Skip مجاز
    }
    if (s === 8 && !shortDesc.trim()) return "توضیح کوتاه الزامی است";
    if (s === 9 && publishMode === "schedule") {
      if (!publishedAt.trim()) return "تاریخ زمان‌بندی الزامی است";
    }
    return null;
  }

  const persistCore = useCallback(
    async (opts: { finalStatus?: "draft" | "published" }) => {
      const st = opts.finalStatus ?? status;
      let resolvedStatus: "draft" | "published" = st;
      let resolvedPublishedAt: string | null = null;
      if (opts.finalStatus === "published" || publishMode === "now") {
        resolvedStatus = "published";
        resolvedPublishedAt = new Date().toISOString();
      } else if (publishMode === "schedule" && publishedAt) {
        resolvedStatus = "published";
        const d = new Date(publishedAt);
        resolvedPublishedAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
      } else if (publishMode === "draft") {
        resolvedStatus = "draft";
        resolvedPublishedAt = null;
      }
      const base = {
        name: name.trim(),
        slug: slug.trim(),
        category_id: categoryId || null,
        brand_id: brandId || null,
        short_description: shortDesc,
        description,
        status: resolvedStatus,
        is_featured: featured,
        is_new: isNew,
        image_url: imageUrl || null,
        tag_ids: selectedTags,
        size_guide_id: sizeGuideId || null,
        published_at: resolvedPublishedAt,
        price: sellingPrice || 0,
        original_price: originalPrice || null,
        stock_quantity: parseLocaleNumber(simpleStock) || 0,
      };

      let id = productId;
      if (!id) {
        const res = await adminCreateProductAction({
          ...base,
          status: "draft",
        } as Parameters<typeof adminCreateProductAction>[0]);
        if (!res.ok) return { ok: false as const, error: (res as { error?: string }).error || "ایجاد ناموفق" };
        const createdId = (res as { id?: string }).id || (res as { data?: { id?: string } }).data?.id;
        if (!createdId) return { ok: false as const, error: "ایجاد ناموفق" };
        id = String(createdId);
        setProductId(id);
      } else {
        const upd = await adminUpdateProductAction(id, base as Parameters<typeof adminUpdateProductAction>[1]);
        if (!upd.ok) return { ok: false as const, error: (upd as { detail?: string }).detail || upd.error || "به‌روزرسانی ناموفق" };
      }

      // attributes (specs + picked size/color options for filters)
      {
        const rows: Array<{ attribute_id: string; option_id: string }> = Object.entries(attrValues)
          .filter(([, v]) => v)
          .map(([attribute_id, option_id]) => ({ attribute_id, option_id }));
        if (sizeAttr?.id) {
          for (const oid of pickedSizeIds) rows.push({ attribute_id: sizeAttr.id, option_id: oid });
        }
        if (colorAttr?.id) {
          for (const oid of pickedColorIds) rows.push({ attribute_id: colorAttr.id, option_id: oid });
        }
        const syncAttr = await adminSyncProductAttributesAction(id, rows as never);
        if (!syncAttr.ok) {
          return {
            ok: false as const,
            error:
              (syncAttr as { detail?: string }).detail ||
              (syncAttr as { error?: string }).error ||
              "ذخیره مشخصات ناموفق",
          };
        }
      }

      // variants
      const sp = sellingPrice;
      const op = originalPrice;
      let vPayload: Array<Record<string, unknown>>;
      if (productType === "simple") {
        vPayload = [
          {
            size: null,
            color_name: null,
            sku: simpleSku || null,
            price: sp,
            original_price: op > sp ? op : sp,
            stock_quantity: parseLocaleNumber(simpleStock) || 0,
            image_url: null,
          },
        ];
      } else {
        vPayload = variants.map((v) => {
          const vp = parseLocaleNumber(v.price) || sp;
          const vo = parseLocaleNumber(v.original_price) || op;
          const hx = colorOpts.find((o) => o.value === v.color_name)?.hex ?? null;
          return {
            id: v.id,
            size: v.size || null,
            color_name: v.color_name || null,
            color_hex: hx,
            sku: v.sku || null,
            price: vp,
            original_price: vo > vp ? vo : vp,
            stock_quantity: parseLocaleNumber(v.stock) || 0,
            image_url: v.image_url || null,
          };
        });
      }
      const syncV = await adminSyncProductVariantsAction(id, vPayload as never);
      if (!syncV.ok) {
        return {
          ok: false as const,
          error:
            (syncV as { detail?: string }).detail ||
            (syncV as { error?: string }).error ||
            "sync_variants",
        };
      }

      if (opts.finalStatus === "published" || (opts.finalStatus === undefined && st === "published")) {
        const pub = await adminUpdateProductAction(id, { status: "published" });
        if (!pub.ok) {
          return {
            ok: false as const,
            error: (pub as { detail?: string }).detail || pub.error || "publish",
          };
        }
      }
      return { ok: true as const, id };
    },
    [
      productId, name, slug, categoryId, brandId, shortDesc, description, status,
      featured, isNew, isActive, imageUrl, selectedTags, attrValues, productType, pickedSizeIds, pickedColorIds, sizeAttr, colorAttr, colorOpts,
      simpleSku, simpleStock, variants, sellingPrice, originalPrice,
      sizeGuideId, publishedAt, publishMode,
    ],
  );

  
  async function checkSlug(): Promise<boolean> {
    const s = slug.trim();
    if (!s || !SLUG_RE.test(s)) {
      setSlugStatus("err");
      return false;
    }
    setSlugStatus("checking");
    const res = await adminCheckProductSlugAction(s, productId);
    if (!res.ok) {
      setSlugStatus("err");
      return false;
    }
    setSlugStatus(res.available ? "ok" : "taken");
    return res.available;
  }

  async function ensureProductId(): Promise<string | null> {
    if (productId) return productId;
    setBusy(true);
    const res = await persistCore({ finalStatus: "draft" });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return null;
    }
    setOkMsg("پیش‌نویس ذخیره شد");
    return res.id;
  }

  async function goNext() {
    setErr("");
    setOkMsg("");
    if (step === 1) {
      const ok = await checkSlug();
      if (!ok) {
        setErr(slugStatus === "taken" ? "این slug قبلاً استفاده شده" : "slug نامعتبر است");
        return;
      }
    }
    const v = validateStep(step);
    if (v) {
      setErr(v);
      return;
    }
    if (step === 3 || step === 4) {
      const id = await ensureProductId();
      if (!id) return;
      // مشخصات باید همان لحظه ذخیره شوند
      if (step === 4) {
        setBusy(true);
        const res = await persistCore({ finalStatus: "draft" });
        setBusy(false);
        if (!res.ok) {
          setErr(res.error || "ذخیره مشخصات ناموفق");
          return;
        }
        setOkMsg("مشخصات ذخیره شد");
      }
    }
    if (step < 9) setStep((s) => s + 1);
  }

  function goPrev() {
    setErr("");
    setOkMsg("");
    if (step > 1) setStep((s) => s - 1);
  }

  async function saveDraft() {
    setBusy(true);
    setErr("");
    setOkMsg("");
    const res = await persistCore({ finalStatus: "draft" });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setOkMsg("پیش‌نویس ذخیره شد");
  }

  async function finishPublish() {
    const slugOk = await checkSlug();
    if (!slugOk) {
      setErr("slug تکراری یا نامعتبر — مرحله هویت");
      setStep(1);
      return;
    }
    const v = validateStep(9);
    if (v) {
      setErr(v);
      return;
    }
    // re-validate critical steps
    for (const s of [1, 2, 3, 5, 6, 8]) {
      const e = validateStep(s);
      if (e) {
        setErr(`مرحله ${s}: ${e}`);
        setStep(s);
        return;
      }
    }
    setBusy(true);
    setErr("");
    const res = await persistCore({ finalStatus: status });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  async function onMainImage(file: File | null) {
    if (!file) return;
    const id = await ensureProductId();
    if (!id) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("productId", id);
    const res = await adminUploadProductImageAction(fd);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || "آپلود ناموفق");
      return;
    }
    const url = String((res as { url?: string }).url ?? (res as { data?: { url?: string } }).data?.url ?? "");
    if (url) {
      setImageUrl(url);
      await adminUpdateProductAction(id, { image_url: url } as never);
      setOkMsg("تصویر شاخص ذخیره شد");
    }
  }

  async function onGalleryImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    const id = await ensureProductId();
    if (!id) return;
    setBusy(true);
    setErr("");
    let okCount = 0;
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("productId", id);
        const up = await adminUploadProductImageAction(fd);
        if (!up.ok) {
          errors.push(
            file.name +
              ":" +
              String((up as { error?: string }).error || "upload"),
          );
          continue;
        }
        const url = String(
          (up as { url?: string }).url ??
            (up as { data?: { url?: string } }).data?.url ??
            "",
        );
        if (!url) {
          errors.push(file.name + ":no_url");
          continue;
        }
        let imgId =
          (up as { imageId?: string }).imageId ||
          (up as { image?: { id?: string } }).image?.id;
        // اگر آپلود بدون product_id در DB مانده → صریح لینک کن
        if (!imgId) {
          const add = await adminAddProductGalleryImageAction({
            productId: id,
            url,
          });
          if (!add.ok) {
            errors.push(
              file.name +
                ":" +
                String(
                  (add as { detail?: string }).detail ||
                    (add as { error?: string }).error ||
                    "link",
                ),
            );
            continue;
          }
          imgId = (add as { image?: { id?: string } }).image?.id;
        }
        setGallery((g) => [...g, { id: imgId, url }]);
        okCount += 1;
      } catch (e) {
        errors.push(file.name + ":exception");
        console.error("[onGalleryImages]", e);
      }
    }
    setBusy(false);
    if (okCount) setOkMsg(okCount + " تصویر به گالری اضافه شد");
    if (errors.length) setErr("خطا در: " + errors.slice(0, 3).join("، "));
  }

  async function onVariantImage(idx: number, file: File | null) {
    if (!file) return;
    const id = await ensureProductId();
    if (!id) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("productId", id);
    const up = await adminUploadProductImageAction(fd);
    setBusy(false);
    if (!up.ok) {
      setErr((up as { error?: string }).error || "آپلود تصویر واریانت ناموفق");
      return;
    }
    const url = String(
      (up as { url?: string }).url ??
        (up as { data?: { url?: string } }).data?.url ??
        "",
    );
    if (!url) {
      setErr("آپلود بدون URL");
      return;
    }
    setVariants((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, image_url: url } : r)),
    );
    setOkMsg("تصویر واریانت تنظیم شد — با ذخیره به رنگ لینک می‌شود");
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4" dir="rtl">
      <Toolbar
        title={productId ? "ویرایش محصول" : "محصول جدید"}
        description="ویزارد ۹مرحله‌ای ساخت و ویرایش"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          {busy ? <span className="text-muted-foreground">در حال ذخیره…</span> : null}
          {okMsg ? <span className="text-green-700 dark:text-green-400">{okMsg}</span> : null}
          {err ? <span className="text-destructive">{err}</span> : null}
        </div>
        <Link href="/admin/products" className="text-muted-foreground text-sm underline">
          بازگشت به لیست
        </Link>
      </div>

      <nav className="border-border overflow-x-auto rounded-xl border p-3">
        <ol className="flex min-w-max gap-1">
          {STEPS.map((s) => {
            const active = s.id === step;
            const done = s.id < step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (productId || s.id <= step) {
                      setStep(s.id);
                      setErr("");
                    }
                  }}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60",
                  ].join(" ")}
                >
                  {s.id}. {s.title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="border-border space-y-4 rounded-xl border p-4">
        <h2 className="text-primary font-semibold">
          مرحله {step}: {STEPS[step - 1]?.title}
        </h2>

        {step === 1 && (
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>نام محصول</span>
              <input
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>slug</span>
              <input
                className="border-input bg-background w-full rounded-lg border px-3 py-2 font-mono text-sm"
                value={slug}
              onBlur={() => void checkSlug()}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>قیمت اصلی (تومان)</span>
              <input
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>قیمت بعد از تخفیف (اختیاری)</span>
              <input
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                inputMode="numeric"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>دسته</span>
              <select
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
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
            <div className="space-y-1 text-sm">
              <span>برچسب‌ها</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const on = selectedTags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={
                        on
                          ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs"
                          : "bg-muted rounded-full px-3 py-1 text-xs"
                      }
                      onClick={() =>
                        setSelectedTags((prev) =>
                          on ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                        )
                      }
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            {!attrDefs.length ? (
              <p className="text-muted-foreground text-sm">مشخصه‌ای تعریف نشده. از ادمین → مشخصات اضافه کنید.</p>
            ) : null}

            {sizeOpts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">سایز (چندتایی — برای واریانت)</p>
                <div className="flex flex-wrap gap-2">
                  {sizeOpts.map((o) => {
                    const on = pickedSizeIds.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={
                          on
                            ? "bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm"
                            : "border-border rounded-lg border px-3 py-1.5 text-sm"
                        }
                        onClick={() =>
                          setPickedSizeIds((ids) =>
                            on ? ids.filter((x) => x !== o.id) : [...ids, o.id],
                          )
                        }
                      >
                        {o.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {colorOpts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">رنگ (چندتایی — برای واریانت)</p>
                <div className="flex flex-wrap gap-2">
                  {colorOpts.map((o) => {
                    const on = pickedColorIds.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={
                          on
                            ? "bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
                            : "border-border inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
                        }
                        onClick={() =>
                          setPickedColorIds((ids) =>
                            on ? ids.filter((x) => x !== o.id) : [...ids, o.id],
                          )
                        }
                      >
                        <span
                          className="border-border inline-block h-3.5 w-3.5 rounded-full border"
                          style={{ backgroundColor: o.hex || "#ccc" }}
                        />
                        {o.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {specDefs.map((a) => (
              <label key={a.id} className="block space-y-1 text-sm">
                <span>{a.name}</span>
                <select
                  className="border-input bg-background w-full rounded-lg border px-3 py-2"
                  value={attrValues[a.id] ?? ""}
                  onChange={(e) =>
                    setAttrValues((m) => ({ ...m, [a.id]: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  {(a.options ?? []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <p className="text-muted-foreground text-xs">
              سایز و رنگ انتخاب‌شده در گام واریانت استفاده می‌شوند. بقیه مشخصات روی محصول ذخیره و در فیلتر فروشگاه می‌آیند.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">تصویر شاخص</p>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="mb-2 h-32 w-32 rounded-lg object-cover" />
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void onMainImage(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">گالری</p>
              <div className="mb-2 flex flex-wrap gap-2">
                {gallery.map((g, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={g.id ?? i} src={g.url} alt="" className="h-20 w-20 rounded object-cover" />
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  void onGalleryImages(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className="text-muted-foreground mt-1 text-xs">چند تصویر را یکجا انتخاب کنید.</p>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                className={
                  productType === "simple"
                    ? "bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm"
                    : "bg-muted rounded-lg px-3 py-1.5 text-sm"
                }
                onClick={() => setProductType("simple")}
              >
                ساده
              </button>
              <button
                type="button"
                className={
                  productType === "variable"
                    ? "bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm"
                    : "bg-muted rounded-lg px-3 py-1.5 text-sm"
                }
                onClick={() => setProductType("variable")}
              >
                متغیر
              </button>
            </div>
            <p className="text-muted-foreground text-xs">
              واریانت اجباری نیست — می‌توانید خالی بگذارید و «بعدی» بزنید (Skip).
              گزینه‌های سایز/رنگ از انتخاب گام مشخصات محدود شده‌اند.
            </p>
            {productType === "simple" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span>SKU</span>
                  <input
                    className="border-input bg-background w-full rounded-lg border px-3 py-2"
                    value={simpleSku}
                    onChange={(e) => setSimpleSku(e.target.value)}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>موجودی</span>
                  <input
                    className="border-input bg-background w-full rounded-lg border px-3 py-2"
                    value={simpleStock}
                    onChange={(e) => setSimpleStock(e.target.value)}
                    inputMode="numeric"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div key={v.key} className="border-border space-y-2 rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {v.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.image_url}
                          alt=""
                          className="h-14 w-14 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground flex h-14 w-14 items-center justify-center rounded-lg border border-dashed text-[10px]">
                          بدون تصویر
                        </div>
                      )}
                      <label className="bg-muted hover:bg-muted/80 cursor-pointer rounded-lg px-3 py-1.5 text-xs">
                        تصویر این رنگ/واریانت
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            void onVariantImage(idx, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {v.image_url ? (
                        <button
                          type="button"
                          className="text-destructive text-xs"
                          onClick={() =>
                            setVariants((rows) =>
                              rows.map((r, i) =>
                                i === idx ? { ...r, image_url: "" } : r,
                              ),
                            )
                          }
                        >
                          حذف تصویر
                        </button>
                      ) : null}
                      {v.color_name ? (
                        <span className="text-muted-foreground text-xs">
                          رنگ: {v.color_name}
                        </span>
                      ) : null}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <select
                        className="border-input bg-background min-w-[5.5rem] rounded-lg border px-2 py-1.5 text-sm"
                        value={v.size}
                        onChange={(e) => {
                          const size = e.target.value;
                          setVariants((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, size } : r)),
                          );
                        }}
                      >
                        <option value="">سایز…</option>
                        {sizeChoices.map((o) => (
                          <option key={o.id} value={o.value}>
                            {o.value}
                          </option>
                        ))}
                      </select>
                      <select
                        className="border-input bg-background min-w-[5.5rem] rounded-lg border px-2 py-1.5 text-sm"
                        value={v.color_name}
                        onChange={(e) => {
                          const color_name = e.target.value;
                          setVariants((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, color_name } : r)),
                          );
                        }}
                      >
                        <option value="">رنگ…</option>
                        {colorChoices.map((o) => (
                          <option key={o.id} value={o.value}>
                            {o.value}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="SKU"
                        className="border-input bg-background rounded-lg border px-2 py-1.5 text-sm"
                        value={v.sku}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, sku: val } : r)),
                          );
                        }}
                      />
                      <input
                        placeholder="قیمت"
                        className="border-input bg-background rounded-lg border px-2 py-1.5 text-sm"
                        value={v.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, price: val } : r)),
                          );
                        }}
                      />
                      <input
                        placeholder="موجودی"
                        className="border-input bg-background rounded-lg border px-2 py-1.5 text-sm"
                        value={v.stock}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, stock: val } : r)),
                          );
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="text-destructive text-xs"
                      onClick={() => setVariants((rows) => rows.filter((_, i) => i !== idx))}
                    >
                      حذف واریانت
                    </button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="bg-muted rounded-lg px-3 py-1.5 text-sm"
                  onClick={() =>
                    setVariants((rows) => [
                      ...rows,
                      emptyVariant({ price: String(sellingPrice || ""), original: String(originalPrice || "") }),
                    ])
                  }
                >
                  + واریانت
                </button>
                <button
                  type="button"
                  className="border-border rounded-lg border px-3 py-1.5 text-sm"
                  onClick={() => {
                    const sizes = sizeChoices.length ? sizeChoices : [{ id: "", value: "" }];
                    const colors = colorChoices.length ? colorChoices : [{ id: "", value: "" }];
                    const rows = [];
                    for (const s of sizes) {
                      for (const c of colors) {
                        rows.push(
                          emptyVariant({
                            price: String(sellingPrice || ""),
                            original: String(originalPrice || ""),
                          }),
                        );
                        rows[rows.length - 1].size = s.value || "";
                        rows[rows.length - 1].color_name = c.value || "";
                      }
                    }
                    if (rows.length) setVariants(rows);
                  }}
                >
                  ساخت از سایز×رنگ
                </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>راهنمای سایز</span>
              <select
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
                value={sizeGuideId}
                onChange={(e) => setSizeGuideId(e.target.value)}
              >
                <option value="">پیش‌فرض دسته / سراسری</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-muted-foreground text-xs">
              اگر خالی بماند، ابتدا راهنمای همان دسته و سپس راهنمای سراسری استفاده می‌شود.
            </p>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>توضیح کوتاه</span>
              <textarea
                className="border-input bg-background min-h-[80px] w-full rounded-lg border px-3 py-2"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>توضیح کامل</span>
              <textarea
                className="border-input bg-background min-h-[160px] w-full rounded-lg border px-3 py-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>وضعیت</span>
              <select
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              >
                <option value="draft">پیش‌نویس</option>
                <option value="published">انتشار</option>
              </select>
            </label>
            <div className="space-y-2 text-sm">
              <span className="block">زمان انتشار</span>
              <div className="flex flex-wrap gap-2">
                {([["draft", "پیش‌نویس"], ["now", "همین حالا"], ["schedule", "زمان‌بندی"]] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    className={publishMode === k ? "bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs" : "bg-muted rounded-lg px-3 py-1.5 text-xs"}
                    onClick={() => {
                      setPublishMode(k);
                      if (k === "draft") setStatus("draft");
                      else setStatus("published");
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {publishMode === "schedule" ? (
                <input type="datetime-local" className="border-input bg-background mt-2 w-full rounded-lg border px-3 py-2" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              ویژه (featured)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
              نشان «جدید»
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              فعال در فروشگاه
            </label>
                      </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="border-border rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          disabled={step <= 1 || busy}
          onClick={goPrev}
        >
          قبلی
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="border-border rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
            disabled={busy}
            onClick={() => void saveDraft()}
          >
            ذخیره پیش‌نویس
          </button>
          {step < 9 ? (
            <button
              type="button"
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-40"
              disabled={busy}
              onClick={() => void goNext()}
            >
              بعدی
            </button>
          ) : (
            <button
              type="button"
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-40"
              disabled={busy}
              onClick={() => void finishPublish()}
            >
              {status === "published" ? "انتشار و پایان" : "ذخیره و پایان"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
