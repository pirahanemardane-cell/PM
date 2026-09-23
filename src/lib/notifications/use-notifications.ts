"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  listMyNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type NotificationDTO,
} from "@/app/(shop)/actions/notifications";
import { toast } from "@/lib/toaster";

export function useNotifications(enabled = true) {
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await listMyNotificationsAction(50);
    if (res.ok) setItems(res.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;

      channel = supabase
        .channel(`notifications:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            const row = payload.new as NotificationDTO;
            setItems((prev) => [row, ...prev]);
            toast.success(row.title, row.body ?? undefined);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            const row = payload.new as NotificationDTO;
            setItems((prev) => prev.map((x) => (x.id === row.id ? row : x)));
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [enabled]);

  const unread = items.filter((x) => !x.read_at).length;

  async function markRead(id: string) {
    await markNotificationReadAction(id);
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, read_at: new Date().toISOString() } : x,
      ),
    );
  }

  async function markAll() {
    await markAllNotificationsReadAction();
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? now })));
  }

  return { items, loading, unread, refresh, markRead, markAll };
}
