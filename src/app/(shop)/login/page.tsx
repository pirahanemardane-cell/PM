"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/ui/premium-auth";

function LoginInner() {
  const next = useSearchParams().get("next") || "";
  const admin = next.startsWith("/admin");
  return (
    <div
      className="bg-background flex min-h-[70vh] w-full items-center justify-center px-4 py-10"
      dir="rtl"
    >
      <div className="border-border bg-card w-full max-w-md rounded-2xl border shadow-sm">
        <AuthForm
          initialMode="login"
          hideRegister={admin}
          defaultNext={admin ? "/admin/dashboard" : "/dashboard"}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
