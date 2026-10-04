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
  /** null = loading | "" = مهمان | string = شماره/برچسب */
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyProfileAction();
        if (cancelled) return;
        if (res.ok) {
          const phone = (res.profile?.phone || "").trim();
          // فقط شماره تماس — بدون نام و بدون آواتار
          setLabel(phone || "حساب من");
          try {
            await mergeGuestCartAction();
            await useServerCartStore.getState().refresh();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("pm:cart-changed"));
            }
          } catch {
            /* ignore */
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
      ? "border-border hover:bg-muted flex h-10 w-full items-center justify-center truncate rounded-xl border px-3 text-sm font-medium"
      : "border-border hover:bg-muted inline-flex h-10 max-w-[11rem] shrink-0 items-center truncate rounded-xl border px-2.5 text-sm tabular-nums");

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
        dir="ltr"
      >
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
