"use client";

import { addToCartAction } from "@/app/(shop)/actions/shop";
import { useShopStore } from "@/lib/shop-store";

/** بعد از لاگین موفق: آیتم‌های local با variantId را به DB می‌فرستد */
export async function mergeGuestCartToServer(): Promise<{
  merged: number;
  failed: number;
}> {
  const cart = useShopStore.getState().cart;
  let merged = 0;
  let failed = 0;

  for (const item of cart) {
    const vid = (item as { variantId?: string }).variantId;
    if (!vid) continue;
    const qty = item.quantity ?? 1;
    try {
      const res = await addToCartAction(vid, qty);
      if (res.ok || res.error === "login_required") {
        // login_required اینجا نباید بیاید (بعد از لاگین)
        if (res.ok) merged += 1;
        else failed += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return { merged, failed };
}
