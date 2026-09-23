"use client";

import { useNotifications } from "@/lib/notifications/use-notifications";

export function NotificationCountBadge() {
  const { unread } = useNotifications(true);
  if (unread <= 0) return null;
  return (
    <span className="bg-primary text-primary-foreground absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
      {unread > 99 ? "99+" : unread}
    </span>
  );
}
