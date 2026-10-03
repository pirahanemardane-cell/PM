"use client";

import { useRouter } from "next/navigation";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

export function BlogRealtimeRefresh() {
  const router = useRouter();
  useRtEvent(RT.blog, () => {
    router.refresh();
  });
  return null;
}
