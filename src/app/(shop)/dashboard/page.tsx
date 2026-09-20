"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toaster";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { useShopStore } from "@/lib/shop-store"
import { useServerCartStore } from "@/lib/server-cart-store";
import { cn } from "@/lib/utils";
import {
import { LumaSpin } from "@/components/ui/luma-spin";
  getCartAction,
  removeCartItemAction,
  updateCartQuantityAction,
  listMyOrdersAction,
  reorderOrderAction,
  getMyProfileAction,
  updateMyProfileAction,
  listMyAddressesAction,
  listActiveDiscountsAction,
  listShopProductsAction,
  trackOrderAction,
  createMyAddressAction,
  updateMyAddressAction,
  deleteMyAddressAction,
  setDefaultAddressAction,
  listWishlistAction,
  toggleWishlistAction,
  type CartLineDTO
} from "@/app/(shop)/actions/shop";

const TABS = [
  { id: "shop", label: "فروشگاه" },
  { id: "cart", label: "سبد خرید" },
  { id: "orders", label: "سفارش‌ها" },
  { id: "track", label: "پیگیری" },
  { id: "wishlist", label: "علاقه‌مندی‌ها" },
  { id: "compare", label: "مقایسه" },
  { id: "recent", label: "بازدید اخیر" },
  { id: "addresses", label: "آدرس‌ها" },
  { id: "coupons", label: "کد تخفیف" },
  { id: "tickets", label: "پشتیبانی" },
  { id: "returns", label: "بازگشت کالا" },
  { id: "profile", label: "پروفایل" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function BuyerDashboardPage() {
  const [tab, setTab] = useState<TabId>("cart");
  const [authChecked, setAuthChecked] = useState(false);
  const [authOk, setAuthOk] = useState(false);
  const router = useRouter();
  const serverLines = useServerCartStore((s) => s.lines);
  const refreshServerCart = useServerCartStore((s) => s.refresh);
  // سازگاری با UI قبلی
  const serverCart = serverLines as unknown as CartLineDTO[];
  const setServerCart = (updater: CartLineDTO[] | ((prev: CartLineDTO[]) => CartLineDTO[])) => {
    const store = useServerCartStore.getState();
    const next = typeof updater === "function" ? updater(store.lines as unknown as CartLineDTO[]) : updater;
    store.setLines(next as unknown as import("@/lib/server-cart-store").ServerCartLine[]);
  };
  const [cartLoading, setCartLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [reorderBusy, setReorderBusy] = useState<string | null>(null);
  const [reorderMsg, setReorderMsg] = useState<string | null>(null);
  const [activeDiscounts, setActiveDiscounts] = useState<
    { code: string; type: string; value: number; min_order_amount?: number | null; ends_at?: string | null }[]
  >([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });
  const [serverWishlist, setServerWishlist] = useState<
    { productId: string; title: string; slug: string; price: number; image?: string }[]
  >([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addressesList, setAddressesList] = useState<
    {
      id: string;
      title: string | null;
      full_name: string;
      phone: string;
      province: string | null;
      city: string;
      address_line: string;
      postal_code: string | null;
      is_default: boolean;
    }[]
  >([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrForm, setAddrForm] = useState({
    title: "",
    full_name: "",
    phone: "",
    province: "",
    city: "",
    address_line: "",
    postal_code: "",
    is_default: false,
  });
  const [addrMsg, setAddrMsg] = useState<string | null>(null);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [trackCode, setTrackCode] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<{
    orderNumber: string;
    status: string;
    total: number;
    createdAt?: string;
  } | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);



  async function loadWishlist() {
    setWishlistLoading(true);
    try {
      const res = await listWishlistAction();
      if (res.ok) setServerWishlist(res.items);
      else setServerWishlist([]);
    } finally {
      setWishlistLoading(false);
    }
  }


  const cart = useShopStore((s) => s.cart);
  const wishlist = useShopStore((s) => s.wishlist);
  const compare = useShopStore((s) => s.compare);
  const recent = useShopStore((s) => s.recentlyViewed);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const toggleCompare = useShopStore((s) => s.toggleCompare);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getMyProfileAction();
      if (cancelled) return;
      if (!res.ok) {
        setAuthChecked(true);
        setAuthOk(false);
        router.replace("/ورود?next=/dashboard");
        return;
      }
      setAuthOk(true);
      setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCartLoading(true);
      await refreshServerCart();
      if (!cancelled) setCartLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshServerCart]);

  useEffect(() => {
    if (tab !== "orders") return;
    setOrdersLoading(true);
    (async () => {
      const res = await listMyOrdersAction();
      if (res.ok) setMyOrders(res.items);
      setOrdersLoading(false);
    })();
  }, [tab]);

  useEffect(() => {
    function onOrders() {
      if (tab !== "orders") return;
      void (async () => {
        const res = await listMyOrdersAction();
        if (res.ok) setMyOrders(res.items);
      })();
    }
    window.addEventListener("pm:orders-changed", onOrders);
    return () => window.removeEventListener("pm:orders-changed", onOrders);
  }, [tab]);


  useEffect(() => {
    if (tab !== "coupons") return;
    setCouponsLoading(true);
    (async () => {
      const res = await listActiveDiscountsAction();
      if (res.ok) setActiveDiscounts(res.items as typeof activeDiscounts);
      else setActiveDiscounts([]);
      setCouponsLoading(false);
    })();
  }, [tab]);


  useEffect(() => {
    if (tab !== "profile") return;
    setProfileLoading(true);
    setProfileMsg(null);
    (async () => {
      const res = await getMyProfileAction();
      if (res.ok) {
        setProfileForm({
          full_name: res.profile.full_name ?? "",
          phone: res.profile.phone ?? "",
        });
        setProfileEmail(res.email);
      }
      setProfileLoading(false);
    })();
  }, [tab]);

  useEffect(() => {
    if (tab !== "wishlist") return;
    void loadWishlist();
  }, [tab]);

  useEffect(() => {
    if (tab !== "addresses") return;
    setAddrLoading(true);
    (async () => {
      const res = await listMyAddressesAction();
      if (res.ok) setAddressesList(res.items as typeof addressesList);
      else setAddressesList([]);
      setAddrLoading(false);
    })();
  }, [tab]);

  useEffect(() => {
    if (tab !== "shop") return;
    setShopLoading(true);
    (async () => {
      const res = await listShopProductsAction();
      if (res.ok) setShopProducts(res.products as any[]);
      else setShopProducts([]);
      setShopLoading(false);
    })();
  }, [tab]);



  useEffect(() => {
    function onWish() {
      void loadWishlist();
    }
    window.addEventListener("pm:wishlist-changed", onWish);
    return () => window.removeEventListener("pm:wishlist-changed", onWish);
  }, []);




  const counts = useMemo(
    () => ({
      cart: serverCart.length > 0 ? serverCart.reduce((n, l) => n + (l.quantity || 1), 0) : cart.reduce((n, l) => n + (l.quantity ?? 1), 0),
      wishlist: serverWishlist.length > 0 ? serverWishlist.length : wishlist.length,
      compare: compare.length,
      recent: recent.length,
    }),
    [serverCart, cart, wishlist, serverWishlist, compare, recent]
  );

  async function handleRemoveServerCart(line: CartLineDTO) {
    setRemovingId(line.variantId);
    try {
      const res = await removeCartItemAction(line.variantId);
      if (res.ok) {
                          toast.success("از سبد حذف شد");
        setServerCart((prev) =>
          prev.filter((x) => x.variantId !== line.variantId)
        );
        removeFromCart(line.productId, {
          color: line.color,
          size: line.size,
        });
        window.dispatchEvent(new CustomEvent("pm:cart-changed"));
      }
    } finally {
      setRemovingId(null);
    }
  }

  async function handleUpdateQty(line: CartLineDTO, next: number) {
    if (next < 1) return;
    setServerCart((prev) =>
      prev.map((x) =>
        x.variantId === line.variantId ? { ...x, quantity: next } : x
      )
    );
    const res = await updateCartQuantityAction(line.variantId, next);
    if (!res.ok) {
      await refreshServerCart();
      window.dispatchEvent(new CustomEvent("pm:cart-changed"));
    }
  }



  async function handleRemoveWishlist(productId: string) {
    setServerWishlist((prev) => prev.filter((x) => x.productId !== productId));
    const local = wishlist.find((w) => w.id === productId);
    if (local) toggleWishlist(local);
    const res = await toggleWishlistAction(productId);
    if (!res.ok) {
      await loadWishlist();
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pm:wishlist-changed"));
    }
  }


  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center" dir="rtl">
        <LumaSpin />
      </div>
    );
  }

  if (!authOk) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center" dir="rtl">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="bg-surface-muted min-h-screen" dir="rtl">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="border-border bg-card h-fit rounded-2xl border p-4 shadow-sm">
          <h1 className="mb-4 text-lg font-bold">پنل خریدار</h1>
          <nav className="space-y-1">
            {TABS.map((t) => {
              const c =
                t.id === "cart"
                  ? counts.cart
                  : t.id === "wishlist"
                    ? counts.wishlist
                    : t.id === "compare"
                      ? counts.compare
                      : t.id === "recent"
                        ? counts.recent
                        : 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm",
                    tab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span>{t.label}</span>
                  {c > 0 ? (
                    <span
                      className={cn(
                        "rounded-full px-2 text-[11px]",
                        tab === t.id ? "bg-background/20" : "bg-muted"
                      )}
                    >
                      {c}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="border-border bg-card rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {TABS.find((t) => t.id === tab)?.label}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {tab === "cart" ? (
                <Link
                  href="/checkout"
                  className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-xl px-3 text-xs font-medium"
                >
                  تسویه حساب
                </Link>
              ) : null}
              <Link
                href="/محصولات"
                className="text-primary text-sm hover:underline"
              >
                ادامه خرید
              </Link>
            </div>
          </div>

          {tab === "orders" ? (
            ordersLoading ? (
              <div className="flex justify-center py-10" dir="rtl"><LumaSpin /></div>
            ) : myOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">هنوز سفارشی ثبت نکرده‌اید.</p>
            ) : (
              <ul className="space-y-4">
                {myOrders.map((o: any) => (
                  <li
                    key={o.id}
                    className="border-border rounded-xl border p-4 text-right"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold">
                        {(Number(o.total_amount) || 0).toLocaleString("fa-IR")} تومان
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {o.created_at
                          ? new Date(o.created_at).toLocaleDateString("fa-IR")
                          : ""}
                        {" · "}
                        {o.status === "pending"
                          ? "در انتظار"
                          : o.status === "paid"
                            ? "پرداخت‌شده"
                            : o.status === "shipped"
                              ? "ارسال‌شده"
                              : o.status === "delivered"
                                ? "تحویل"
                                : o.status === "cancelled"
                                  ? "لغو"
                                  : o.status}
                      </span>
                    </div>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      {(o.order_items ?? []).map((it: any) => (
                        <li key={it.id}>
                          {it.title}
                          {it.size_name ? ` · ${it.size_name}` : ""}
                          {it.quantity > 1 ? ` × ${it.quantity}` : ""}
                        </li>
                      ))}
                    </ul>
                    {o.shipping_address ? (
                      <p className="text-muted-foreground mt-2 text-xs">
                        ارسال: {o.shipping_name} — {o.shipping_address}
                        {o.shipping_city ? `، ${o.shipping_city}` : ""}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={reorderBusy === o.id}
                        className="bg-primary text-primary-foreground h-9 rounded-lg px-3 text-xs font-medium disabled:opacity-50"
                        onClick={async () => {
                          setReorderMsg(null);
                          setReorderBusy(o.id);
                          const res = await reorderOrderAction(o.id);
                          setReorderBusy(null);
                          if (!res.ok) {
                            setReorderMsg(
                              res.error === "none_added"
                                ? "اقلام قابل افزودن نبود (variant حذف‌شده؟)."
                                : res.error === "empty"
                                  ? "این سفارش قلمی ندارد."
                                  : "خرید مجدد ناموفق بود."
                            );
                            return;
                          }
                          setReorderMsg(`${res.added} قلم به سبد اضافه شد.`);
                          // برو تب سبد
                          window.location.href = "/dashboard?tab=cart";
                        }}
                      >
                        {reorderBusy === o.id ? "…" : "خرید مجدد"}
                      </button>
                      <span className="text-muted-foreground text-[11px]" dir="ltr">
                        #{String(o.id).slice(0, 8)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : tab === "profile" ? (
            profileLoading ? (
              <div className="flex justify-center py-10" dir="rtl"><LumaSpin /></div>
            ) : (
              <form
                className="mx-auto max-w-md space-y-4 text-right"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setProfileSaving(true);
                  setProfileMsg(null);
                  const res = await updateMyProfileAction({
                    full_name: profileForm.full_name,
                    phone: profileForm.phone,
                  });
                  setProfileSaving(false);
                  if (res.ok) setProfileMsg("ذخیره شد.");
                  else setProfileMsg(res.error || "خطا در ذخیره");
                }}
              >
                {profileEmail ? (
                  <p className="text-muted-foreground text-xs">
                    ایمیل: {profileEmail}
                  </p>
                ) : null}
                <div>
                  <label className="mb-1 block text-sm">نام و نام خانوادگی</label>
                  <input
                    className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                    placeholder="مثلاً علی رضایی"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">موبایل</label>
                  <input
                    className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="0912…"
                    dir="ltr"
                  />
                </div>
                {profileMsg ? (
                  <p
                    className={
                      profileMsg === "ذخیره شد."
                        ? "text-sm text-green-600"
                        : "text-destructive text-sm"
                    }
                  >
                    {profileMsg}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-primary text-primary-foreground h-11 w-full rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {profileSaving ? "در حال ذخیره…" : "ذخیره پروفایل"}
                </button>
                <Link href="/ورود" className="text-primary block text-center text-xs hover:underline">
                  مدیریت ورود
                </Link>
              </form>
            )
          ) : tab === "addresses" ? (
            <div className="space-y-6">
              {addrMsg ? (
                <p
                  className={
                    addrMsg.includes("ذخیره شد")
                      ? "text-sm text-green-600"
                      : "text-destructive text-sm"
                  }
                >
                  {addrMsg}
                </p>
              ) : null}

              {addrLoading ? (
                <div className="flex justify-center py-10" dir="rtl"><LumaSpin /></div>
              ) : addressesList.length === 0 ? (
                <p className="text-muted-foreground text-sm">آدرسی ثبت نشده.</p>
              ) : (
                <ul className="space-y-3">
                  {addressesList.map((a) => (
                    <li
                      key={a.id}
                      className="border-border rounded-xl border p-4 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 text-right">
                          <p className="font-medium">
                            {a.title || "آدرس"}
                            {a.is_default ? (
                              <span className="text-primary mr-2 text-xs">
                                (پیش‌فرض)
                              </span>
                            ) : null}
                          </p>
                          <p>
                            {a.full_name} — {a.phone}
                          </p>
                          <p className="text-muted-foreground mt-1">
                            {[a.province, a.city].filter(Boolean).join("، ")}
                            {a.address_line ? ` — ${a.address_line}` : ""}
                            {a.postal_code ? ` | ${a.postal_code}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!a.is_default ? (
                            <button
                              type="button"
                              className="text-primary text-xs"
                              onClick={async () => {
                                const res = await setDefaultAddressAction(a.id);
                                if (res.ok) {
                                  const list = await listMyAddressesAction();
                                  if (list.ok)
                                    setAddressesList(
                                      list.items as typeof addressesList
                                    );
                                }
                              }}
                            >
                              پیش‌فرض
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="text-destructive text-xs"
                            onClick={async () => {
                              const res = await deleteMyAddressAction(a.id);
                              if (res.ok) {
                                setAddressesList((prev) =>
                                  prev.filter((x) => x.id !== a.id)
                                );
                              }
                            }}
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form
                className="border-border space-y-3 rounded-xl border p-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAddrSaving(true);
                  setAddrMsg(null);
                  const res = await createMyAddressAction({
                    title: addrForm.title || undefined,
                    full_name: addrForm.full_name,
                    phone: addrForm.phone,
                    province: addrForm.province || undefined,
                    city: addrForm.city,
                    address_line: addrForm.address_line,
                    postal_code: addrForm.postal_code || undefined,
                    is_default: addrForm.is_default,
                  });
                  setAddrSaving(false);
                  if (!res.ok) {
                    setAddrMsg(
                      res.error === "required_fields"
                        ? "نام، موبایل، شهر و آدرس الزامی است."
                        : res.error === "login_required"
                          ? "لطفاً دوباره وارد شوید."
                          : `ذخیره ناموفق: ${res.error || "server"}`
                    );
                    return;
                  }
                  setAddrMsg("آدرس ذخیره شد.");
                  setAddrForm({
                    title: "",
                    full_name: "",
                    phone: "",
                    province: "",
                    city: "",
                    address_line: "",
                    postal_code: "",
                    is_default: false,
                  });
                  const list = await listMyAddressesAction();
                  if (list.ok)
                    setAddressesList(list.items as typeof addressesList);
                }}
              >
                <p className="text-sm font-medium">افزودن آدرس</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="border-border bg-background h-10 rounded-lg border px-3 text-sm"
                    placeholder="عنوان (خانه / محل کار)"
                    value={addrForm.title}
                    onChange={(e) =>
                      setAddrForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                  <input
                    required
                    className="border-border bg-background h-10 rounded-lg border px-3 text-sm"
                    placeholder="نام گیرنده *"
                    value={addrForm.full_name}
                    onChange={(e) =>
                      setAddrForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                  />
                  <input
                    required
                    className="border-border bg-background h-10 rounded-lg border px-3 text-sm"
                    placeholder="موبایل *"
                    value={addrForm.phone}
                    onChange={(e) =>
                      setAddrForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                  <input
                    className="border-border bg-background h-10 rounded-lg border px-3 text-sm"
                    placeholder="استان"
                    value={addrForm.province}
                    onChange={(e) =>
                      setAddrForm((f) => ({ ...f, province: e.target.value }))
                    }
                  />
                  <input
                    required
                    className="border-border bg-background h-10 rounded-lg border px-3 text-sm"
                    placeholder="شهر *"
                    value={addrForm.city}
                    onChange={(e) =>
                      setAddrForm((f) => ({ ...f, city: e.target.value }))
                    }
                  />
                  <input
                    className="border-border bg-background h-10 rounded-lg border px-3 text-sm"
                    placeholder="کد پستی"
                    value={addrForm.postal_code}
                    onChange={(e) =>
                      setAddrForm((f) => ({
                        ...f,
                        postal_code: e.target.value,
                      }))
                    }
                  />
                </div>
                <textarea
                  required
                  rows={2}
                  className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="آدرس کامل *"
                  value={addrForm.address_line}
                  onChange={(e) =>
                    setAddrForm((f) => ({
                      ...f,
                      address_line: e.target.value,
                    }))
                  }
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={addrForm.is_default}
                    onChange={(e) =>
                      setAddrForm((f) => ({
                        ...f,
                        is_default: e.target.checked,
                      }))
                    }
                  />
                  آدرس پیش‌فرض
                </label>
                <button
                  type="submit"
                  disabled={addrSaving}
                  className="bg-primary text-primary-foreground h-10 w-full rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {addrSaving ? "در حال ذخیره…" : "ذخیره آدرس"}
                </button>
              </form>
            </div>
          ) : tab === "shop" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm">محصولات فروشگاه</p>
                <Link
                  href="/products"
                  className="text-primary text-xs hover:underline"
                >
                  همه محصولات
                </Link>
              </div>
              {shopLoading ? (
                <div className="flex justify-center py-10" dir="rtl"><LumaSpin /></div>
              ) : shopProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">محصولی یافت نشد.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {shopProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          ) : tab === "track" ? (
            <div className="mx-auto max-w-md space-y-4">
              <p className="text-muted-foreground text-sm">
                کد سفارش را وارد کنید تا وضعیت را ببینید.
              </p>
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setTrackLoading(true);
                  setTrackError(null);
                  setTrackResult(null);
                  const res = await trackOrderAction(trackCode);
                  setTrackLoading(false);
                  if (!res.ok) {
                    setTrackError(
                      res.error === "not_found"
                        ? "سفارشی با این کد پیدا نشد."
                        : res.error === "empty"
                          ? "کد سفارش را وارد کنید."
                          : "خطا در پیگیری."
                    );
                    return;
                  }
                  setTrackResult(res.order);
                }}
              >
                <input
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder="مثلاً PM-…"
                  className="border-border bg-background h-11 flex-1 rounded-xl border px-3 text-sm"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="bg-primary text-primary-foreground h-11 rounded-xl px-5 text-sm font-medium disabled:opacity-50"
                >
                  {trackLoading ? "…" : "پیگیری"}
                </button>
              </form>
              {trackError ? (
                <p className="text-destructive text-sm">{trackError}</p>
              ) : null}
              {trackResult ? (
                <div className="border-border space-y-2 rounded-xl border p-4 text-sm">
                  <p>
                    <span className="text-muted-foreground">کد: </span>
                    <span className="font-medium">{trackResult.orderNumber}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">وضعیت: </span>
                    <span className="font-medium">{trackResult.status}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">مبلغ: </span>
                    {trackResult.total.toLocaleString("fa-IR")} تومان
                  </p>
                  {trackResult.createdAt ? (
                    <p className="text-muted-foreground text-xs">
                      {new Date(trackResult.createdAt).toLocaleDateString("fa-IR")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : tab === "coupons" ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                کدهای فعال را کپی کنید و در صفحه تسویه حساب اعمال کنید.
              </p>
              {couponsLoading ? (
                <div className="flex justify-center py-10" dir="rtl"><LumaSpin /></div>
              ) : activeDiscounts.length === 0 ? (
                <p className="text-muted-foreground text-sm">کد فعالی نیست.</p>
              ) : (
                <ul className="space-y-3">
                  {activeDiscounts.map((d) => (
                    <li
                      key={d.code}
                      className="border-border flex flex-wrap items-center justify-between gap-2 rounded-xl border p-4 text-sm"
                    >
                      <div className="text-right">
                        <p className="font-mono font-bold tracking-wide" dir="ltr">
                          {d.code}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {d.type === "percentage"
                            ? `${Number(d.value).toLocaleString("fa-IR")}٪ تخفیف`
                            : `${Number(d.value).toLocaleString("fa-IR")} تومان تخفیف`}
                          {d.min_order_amount
                            ? ` · حداقل سفارش ${Number(d.min_order_amount).toLocaleString("fa-IR")} تومان`
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-primary text-xs"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(d.code);
                            toast.success("کد کپی شد");
                          } catch {
                            toast.error("کپی ناموفق بود");
                          }
                        }}
                      >
                        کپی
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/checkout" className="text-primary text-sm hover:underline">
                رفتن به تسویه حساب
              </Link>
            </div>
          ) : tab === "tickets" || tab === "returns" ? (
            <p className="text-muted-foreground text-sm">
              این بخش در فاز بعدی فعال می‌شود.
            </p>
          ) : tab === "cart" ? (
            cartLoading ? (
              <div className="flex justify-center py-10" dir="rtl"><LumaSpin /></div>
            ) : serverCart.length === 0 && cart.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                موردی در این بخش نیست.
              </p>
            ) : serverCart.length > 0 ? (
              <>
                <ul className="space-y-3">
                  {serverCart.map((line, index) => (
                    <li
                      key={line.itemId || index}
                      className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {line.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={line.image}
                            alt={line.title}
                            className="h-14 w-14 shrink-0 rounded-lg object-cover bg-muted"
                          />
                        ) : (
                          <div className="bg-muted h-14 w-14 shrink-0 rounded-lg" />
                        )}
                        <div className="min-w-0 text-right">
                          <p className="truncate font-medium">{line.title}</p>
                          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                            {line.colorHex || line.color ? (
                              <span
                                className="border-border inline-block h-4 w-4 rounded-full border"
                                style={{
                                  backgroundColor:
                                    line.colorHex ||
                                    (line.color?.startsWith("#")
                                      ? line.color
                                      : undefined),
                                }}
                                title={line.color || ""}
                              />
                            ) : null}
                            {line.size ? (
                              <span className="border-border rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                                {line.size}
                              </span>
                            ) : null}
                            {line.color && !line.color.startsWith("#") ? (
                              <span>{line.color}</span>
                            ) : null}
                          </div>
                          <p className="text-xs">
                            {line.price.toLocaleString("fa-IR")} تومان
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="border-border h-7 w-7 rounded-md border text-sm"
                            onClick={() =>
                              handleUpdateQty(
                                line,
                                Math.max(1, line.quantity - 1)
                              )
                            }
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="border-border h-7 w-7 rounded-md border text-sm"
                            onClick={() =>
                              handleUpdateQty(line, line.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={removingId === line.variantId}
                          className="text-destructive text-xs disabled:opacity-50"
                          onClick={() => handleRemoveServerCart(line)}
                        >
                          حذف
                        </button>
                        {line.slug ? (
                          <Link
                            href={`/products/${line.slug}`}
                            className="text-primary text-xs hover:underline"
                          >
                            مشاهده
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-border mt-4 space-y-3 rounded-xl border p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">جمع کل</span>
                    <span className="font-bold">
                      {serverCart
                        .reduce(
                          (s, line) =>
                            s +
                            Number((line as { price?: number; unitPrice?: number }).price ??
                              (line as { unitPrice?: number }).unitPrice ??
                              0) *
                              Number(line.quantity ?? 1),
                          0
                        )
                        .toLocaleString("fa-IR")}{" "}
                      تومان
                    </span>
                  </div>
                  <Link
                    href="/checkout"
                    className="bg-primary text-primary-foreground inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium"
                  >
                    تسویه حساب
                  </Link>
                </div>
              </>
            ) : (
              <ul className="space-y-3">
                {cart.map((p) => {
                  const key = `${p.id}|${p.color ?? ""}|${p.size ?? ""}`;
                  return (
                    <li
                      key={key}
                      className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt={p.title}
                            className="bg-muted h-14 w-14 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="bg-muted h-14 w-14 shrink-0 rounded-lg" />
                        )}
                        <div className="min-w-0 text-right">
                          <p className="truncate font-medium">{p.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {[p.size, p.color].filter(Boolean).join(" · ")}
                            {(p.quantity ?? 1) > 1
                              ? ` × ${p.quantity}`
                              : ""}
                          </p>
                          <p className="text-xs">
                            {(p.price ?? 0).toLocaleString("fa-IR")} تومان
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-destructive text-xs"
                        onClick={() =>
                          removeFromCart(p.id, {
                            color: p.color,
                            size: p.size,
                          })
                        }
                      >
                        حذف از سبد
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            (() => {
              const list =
                tab === "wishlist"
                  ? (serverWishlist.length > 0
                      ? serverWishlist.map((w) => ({
                          id: w.productId,
                          title: w.title,
                          price: w.price,
                          image: w.image,
                          href: w.slug ? `/products/${w.slug}` : undefined,
                        }))
                      : wishlist)
                  : tab === "compare"
                    ? compare
                    : recent;
              if (list.length === 0) {
                return (
                  <p className="text-muted-foreground text-sm">
                    موردی در این بخش نیست.
                  </p>
                );
              }
              return (
                <ul className="space-y-3">
                  {list.map((p: any) => (
                    <li
                      key={p.id}
                      className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt={p.title}
                            className="bg-muted h-14 w-14 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="bg-muted h-14 w-14 shrink-0 rounded-lg" />
                        )}
                        <div className="min-w-0 text-right">
                          <p className="truncate font-medium">{p.title}</p>
                          <p className="text-xs">
                            {typeof p.price === "number"
                              ? `${p.price.toLocaleString("fa-IR")} تومان`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {tab === "wishlist" ? (
                          <button
                            type="button"
                            className="text-destructive text-xs"
                            onClick={() => void handleRemoveWishlist(p.id)}
                          >
                            حذف
                          </button>
                        ) : null}
                        {tab === "compare" ? (
                          <button
                            type="button"
                            className="text-destructive text-xs"
                            onClick={() => toggleCompare(p)}
                          >
                            حذف از مقایسه
                          </button>
                        ) : null}
                        {(p.href || p.slug) ? (
                          <Link
                            href={p.href || `/products/${p.slug}`}
                            className="text-primary text-xs hover:underline"
                          >
                            مشاهده
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()
          )}
        </section>
      </div>
    </div>
  );
}
