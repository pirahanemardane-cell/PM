"use client";

import { AuthForm } from "@/components/ui/premium-auth";
import { mergeGuestCartToServer } from "@/lib/merge-guest-cart";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const isAdminPath =
    next.startsWith("/admin") ||
    (typeof window !== "undefined" && window.location.pathname.includes("admin"));

  return (
    <div
      className="bg-background flex min-h-[70vh] w-full items-center justify-center px-4 py-10"
      dir="rtl"
    >
      <div className="border-border bg-card w-full max-w-md rounded-2xl border shadow-sm">
        <AuthForm
          initialMode="login"
          hideRegister={Boolean(next.startsWith("/admin"))}
          defaultNext={next.startsWith("/admin") ? "/admin/dashboard" : "/dashboard"}
          onSuccess={async () => {
            try {
              await mergeGuestCartToServer();
            } catch {
              /* ignore */
            }
            // ریدایرکت اصلی داخل AuthForm بعد از OTP انجام می‌شود؛
            // اینجا فقط برای مسیرهایی که onSuccess از والد صدا زده می‌شود
          }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center" dir="rtl">
          در حال بارگذاری…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
