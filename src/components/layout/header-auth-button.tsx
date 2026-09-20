"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { getMyProfileAction } from "@/app/(shop)/actions/shop";

type Props = {
  className?: string;
  onNavigate?: () => void;
  fullWidth?: boolean;
};

export function HeaderAuthButton({
  className,
  onNavigate,
  fullWidth,
}: Props) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyProfileAction();
        if (cancelled) return;
        if (res.ok) {
          const name = (res.profile?.full_name || "").trim();
          setLabel(
            name || (res.email ? res.email.split("@")[0] : "حساب من")
          );
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

  if (label === null) {
    return (
      <span
        className={
          className ||
          "border-border text-muted-foreground inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm"
        }
      >
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
        className={
          className ||
          (fullWidth
            ? "bg-primary text-primary-foreground flex h-10 w-full items-center justify-center gap-2 truncate rounded-xl px-3 text-sm font-medium"
            : "border-border hover:bg-primary hover:text-primary-foreground inline-flex h-10 max-w-[9rem] shrink-0 items-center gap-1.5 truncate rounded-xl border px-3 text-sm")
        }
      >
        <UserRound className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/ورود"
      onClick={onNavigate}
      className={
        className ||
        (fullWidth
          ? "bg-primary text-primary-foreground flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium"
          : "border-border hover:bg-primary hover:text-primary-foreground inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm")
      }
    >
      <UserRound className="h-4 w-4" />
      ورود
    </Link>
  );
}
