"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/lib/notifications/use-notifications";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const { unread } = useNotifications(true);

  return (
    <Link
      href="/dashboard?tab=notifications"
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5",
        className,
      )}
      aria-label="اعلان‌ها"
    >
      <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
      {unread > 0 ? (
        <span className="bg-primary text-primary-foreground absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
