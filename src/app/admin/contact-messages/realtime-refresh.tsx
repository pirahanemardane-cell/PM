"use client";

import { useRouter } from "next/navigation";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

/** با پیام جدید، لیست ادمین بدون رفرش دستی به‌روز می‌شود */
export function ContactMessagesRealtimeRefresh() {
  const router = useRouter();
  useRtEvent(RT.support, () => {
    router.refresh();
  });
  return null;
}
