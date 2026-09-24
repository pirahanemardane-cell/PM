"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/ui/premium-auth";
import { mergeGuestCartToServer } from "@/lib/merge-guest-cart";

function LoginInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const wantsAdmin = next.startsWith("/admin");

  return (
    <div
      className="bg-background flex min-h-[70vh] w-full items-center justify-center px-4 py-10"
      dir="rtl"
    >
      <div className="border-border bg-card w-full max-w-md rounded-2xl border shadow-sm">
        <AuthForm
          initialMode="login"
          hideRegister={wantsAdmin}
          defaultNext={wantsAdmin ? "/admin/dashboard" : "/dashboard"}
          onSuccess={async () => {
            try {
              await mergeGuestCartToServer();
            } catch {}
          }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center" dir="rtl">…</div>}>
      <LoginInner />
    </Suspense>
  );
}
