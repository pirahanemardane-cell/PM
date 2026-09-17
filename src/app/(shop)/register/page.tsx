"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toaster";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      if (name && email && password) {
        showToast({
          title: "ثبت‌نام موفق",
          description: "حساب شما ایجاد شد.",
          type: "success",
        });
        window.location.href = "/dashboard";
      } else {
        showToast({
          title: "خطا",
          description: "همه فیلدها الزامی است.",
          type: "error",
        });
      }
    } catch {
      showToast({
        title: "خطا در ثبت‌نام",
        description: "لطفاً دوباره تلاش کنید.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background flex min-h-[70vh] w-full items-center justify-center px-4 py-12" dir="rtl">
      <div className="border-border bg-card w-full max-w-md rounded-2xl border p-6 shadow-sm sm:p-8">
        <h1 className="font-iranyekan-heavy mb-2 text-2xl">عضویت</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          ساخت حساب کاربری جدید
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              نام و نام خانوادگی
            </label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="نام شما"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              ایمیل
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              رمز عبور
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="حداقل ۸ کاراکتر"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              dir="ltr"
              className="text-left"
            />
          </div>

          <Button type="submit" className="h-10 w-full" disabled={loading}>
            {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          قبلاً عضو شده‌اید؟{" "}
          <Link href="/ورود" className="text-primary font-medium hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </div>
  );
}
