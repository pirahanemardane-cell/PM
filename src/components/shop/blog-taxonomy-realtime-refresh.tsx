"use client";

import { useRouter } from "next/navigation";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

/** رفرش نرم با تغییر دسته/برچسب مقاله */
export function BlogTaxonomyRealtimeRefresh() {
  const router = useRouter();
  useRtEvent(RT.blog, () => {
    router.refresh();
  });
  return null;
}
