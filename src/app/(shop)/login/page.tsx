"use client";

import { AuthForm } from "@/components/ui/premium-auth";
import { mergeGuestCartToServer } from "@/lib/merge-guest-cart";

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-[70vh] w-full items-center justify-center px-4 py-10" dir="rtl">
      <div className="border-border bg-card w-full max-w-md rounded-2xl border shadow-sm">
        <AuthForm
          initialMode="login"
          onSuccess={async () => {
            await mergeGuestCartToServer();
            window.location.href = "/dashboard";
          }}
        />
      </div>
    </div>
  );
}
