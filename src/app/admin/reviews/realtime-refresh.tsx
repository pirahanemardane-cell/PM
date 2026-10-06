"use client";

import { useRouter } from "next/navigation";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

export function ReviewsRealtimeRefresh() {
  const router = useRouter();
  useRtEvent(RT.reviews, () => {
    router.refresh();
  });
  return null;
}
