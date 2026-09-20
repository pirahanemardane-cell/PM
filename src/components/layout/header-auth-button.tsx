"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { getMyProfileAction, mergeGuestCartAction } from "@/app/(shop)/actions/shop";
import { useServerCartStore } from "@/lib/server-cart-store";

type Props = {
  className?: string;
  onNavigate?: () => void;
  fullWidth?: boolean;
};

export function HeaderAuthButton({ className, onNavigate, fullWidth }: Props) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyProfileAction();
        if (cancelled) return;
        if (res.ok) {
          const name = (res.profile?.full_name || "").trim();
          setLabel(name || (res.email ? res.email.split("@")[0] : "حساب من"));
          // یک‌بار merge سبد مهمان → کاربر
          try {
            await mergeGuestCartAction();
            await useServerCartStore.getState().refresh();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("pm:cart-changed"));
            }
          } catch {
            /* ignore merge errors on header load */
          }
        } else {
          setLabel("");
        }
      } catch {
        if (!cancelled) setLabel("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const guestClass =
    className ||
    (fullWidth
      ? "bg-primary text-primary-foreground flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium"
      : "border-border hover:bg-primary hover:text-primary-foreground inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm");

  const userClass =
    className ||
    (fullWidth
      ? "bg-primary text-primary-foreground flex h-10 w-full items-center justify-center gap-2 truncate rounded-xl px-3 text-sm font-medium"
      : "border-border hover:bg-primary hover:text-primary-foreground inline-flex h-10 max-w-[9rem] shrink-0 items-center gap-1.5 truncate rounded-xl border px-3 text-sm");

  if (label === null) {
    return (
      <span className={guestClass + " text-muted-foreground opacity-70"}>
        <UserRound className="h-4 w-4" />
        …
      </span>
    );
  }

  if (label) {
    return (
      <Link
        href="/dashboard?tab=profile"
        onClick={onNavigate}
        title={label}
        className={userClass}
      >
        <UserRound className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <Link href="/ورود" onClick={onNavigate} className={guestClass}>
      <UserRound className="h-4 w-4" />
      ورود
    </Link>
  );
}
