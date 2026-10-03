"use client";

import { useRouter } from "next/navigation";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

/** رفرش نرم صفحه با تغییر برند / دسته / برچسب محصول */
export function CatalogRealtimeRefresh() {
  const router = useRouter();
  useRtEvent(RT.catalog, () => {
    router.refresh();
  });
  return null;
}
