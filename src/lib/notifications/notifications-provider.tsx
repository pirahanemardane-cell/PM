"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  listMyNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type NotificationDTO,
} from "@/app/(shop)/actions/notifications";
import { toast } from "@/lib/toaster";

type Ctx = {
  items: NotificationDTO[];
  loading: boolean;
  unread: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAll: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx | null>(null);

const empty: Ctx = {
  items: [],
  loading: false,
  unread: 0,
  refresh: async () => {},
  markRead: async () => {},
  markAll: async () => {},
};

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const uidRef = useRef<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        uidRef.current = data.user?.id ?? null;
      } catch {
        uidRef.current = null;
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!uidRef.current) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await listMyNotificationsAction(40);
      if (res.ok) setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  // یک‌بار بعد از تشخیص لاگین — با idle برای امتیاز Lighthouse
  useEffect(() => {
    if (!ready || !uidRef.current || fetchedRef.current) return;
    fetchedRef.current = true;
    const run = () => void refresh();
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, [ready, refresh]);

  // یک کانال realtime فقط برای کاربر لاگین
  useEffect(() => {
    if (!ready || !uidRef.current) return;
    const supabase = createClient();
    const uid = uidRef.current;
    const channel = supabase
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
          setItems((prev) => {
            if (prev.some((x) => x.id === row.id)) return prev;
            return [row, ...prev];
          });
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

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ready]);

  const unread = useMemo(
    () => items.filter((x) => !x.read_at).length,
    [items],
  );

  const markRead = useCallback(async (id: string) => {
    await markNotificationReadAction(id);
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, read_at: new Date().toISOString() } : x,
      ),
    );
  }, []);

  const markAll = useCallback(async () => {
    await markAllNotificationsReadAction();
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? now })));
  }, []);

  const value = useMemo(
    () => ({ items, loading, unread, refresh, markRead, markAll }),
    [items, loading, unread, refresh, markRead, markAll],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(_enabled = true): Ctx {
  return useContext(NotificationsContext) ?? empty;
}
