"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

type RealtimePayload = {
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

type Options = {
  table: string;
  schema?: string;
  event?: RealtimeEvent;
  filter?: string;
  enabled?: boolean;
  onPayload: (payload: RealtimePayload) => void;
};

/** اشتراک استاندارد روی هر جدول — الگوی واحد کل سایت */
export function useRealtimeTable({
  table,
  schema = "public",
  event = "*",
  filter,
  enabled = true,
  onPayload,
}: Options) {
  const cb = useRef(onPayload);
  cb.current = onPayload;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channelName = `rt:${schema}:${table}:${filter ?? "all"}:${event}`;

    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event,
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: RealtimePayload) => {
          cb.current(payload);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, schema, event, filter, enabled]);
}
