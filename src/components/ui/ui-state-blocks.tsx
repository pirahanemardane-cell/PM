"use client";

import { cn } from "@/lib/utils";
import { LumaSpin } from "@/components/ui/luma-spin";

export function LoadingBlock({
  className,
  label = "در حال بارگذاری…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}
      dir="rtl"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <LumaSpin />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

export function EmptyBlock({
  title = "موردی نیست",
  description,
  className,
  action,
}: {
  title?: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-border bg-muted/20 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-12 text-center",
        className,
      )}
      dir="rtl"
    >
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-sm text-xs">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorBlock({
  title = "خطا در بارگذاری",
  description = "لطفاً دوباره تلاش کنید.",
  className,
  onRetry,
}: {
  title?: string;
  description?: string;
  className?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className={cn(
        "border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-12 text-center",
        className,
      )}
      dir="rtl"
      role="alert"
    >
      <p className="text-destructive text-sm font-medium">{title}</p>
      <p className="text-muted-foreground max-w-sm text-xs">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="border-border hover:bg-muted mt-2 rounded-lg border px-3 py-1.5 text-xs"
        >
          تلاش مجدد
        </button>
      ) : null}
    </div>
  );
}

export function DisabledOverlay({
  children,
  disabled,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("relative", disabled && "pointer-events-none opacity-50", className)}
      aria-disabled={disabled || undefined}
    >
      {children}
    </div>
  );
}
