"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { signInAction, signUpAction, resetPasswordAction, requestOtpAction, verifyOtpAction } from "@/app/(shop)/actions/auth";
import { isValidIranMobile, normalizeIranMobile, onlyDigits } from "@/lib/numbers";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  Phone,
  Loader2,
  MessageSquare,
} from "lucide-react";

type AuthMode = "login" | "signup" | "reset";
type LoginMethod = "password" | "otp";
type RegistrationStep = "details" | "verification" | "complete";
type OtpStep = "phone" | "code";

interface AuthFormProps {
  hideRegister?: boolean;
  defaultNext?: string;
  onSuccess?: (userData: {
    email?: string;
    phone?: string;
    name?: string;
  }) => void;
  onClose?: () => void;
  initialMode?: AuthMode;
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: boolean;
  rememberMe: boolean;
  verificationCode: string;
  otpCode: string;
  loginId: string; // موبایل یا ایمیل در ورود با رمز
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  loginId?: string;
  agreeToTerms?: string;
  general?: string;
  verificationCode?: string;
  otpCode?: string;
}

function isValidIranPhone(phone: string) {
  return isValidIranMobile(phone);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** ورود با رمز: موبایل یا ایمیل */
function isValidLoginId(value: string) {
  const v = value.trim();
  if (!v) return false;
  if (v.includes("@")) return isValidEmail(v);
  return isValidIranPhone(v);
}

export function AuthForm({
  onSuccess,
  onClose,
  initialMode = "login",
  className,
  hideRegister = false,
  defaultNext,
}: AuthFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [registrationStep, setRegistrationStep] =
    useState<RegistrationStep>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeToTerms: false,
    rememberMe: false,
    verificationCode: "",
    otpCode: "",
    loginId: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      // ——— ورود با OTP (ملی‌پیامک واقعی) ———
      if (authMode === "login" && loginMethod === "otp") {
        if (otpStep === "phone") {
          if (!formData.phone.trim() || !isValidIranPhone(formData.phone)) {
            setErrors({ phone: "شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲…)" });
            setIsLoading(false);
            return;
          }
          const res = await requestOtpAction(normalizeIranMobile(formData.phone) ?? formData.phone);
          if (!res.ok) {
            const map: Record<string, string> = {
              invalid_phone: "شماره موبایل معتبر نیست",
              rate_limit: "کمی صبر کنید و دوباره تلاش کنید",
              send_failed: "ارسال پیامک ناموفق بود",
              config: "تنظیمات SMS ناقص است (env)",
              server: "خطای سرور",
              send_failed: "ارسال پیامک ناموفق بود",
              config: "پیکربندی پیامک ناقص است",
              server: "خطای سرور",
            };
            setErrors({
              phone: map[res.error] || "ارسال کد ناموفق بود",
            });
            setIsLoading(false);
            return;
          }
          setOtpStep("code");
          setSuccessMessage("کد تأیید به موبایل شما ارسال شد");
          setIsLoading(false);
          return;
        }
        if (!/^\d{6}$/.test(formData.otpCode)) {
          setErrors({ otpCode: "کد ۶ رقمی را وارد کنید" });
          setIsLoading(false);
          return;
        }
        const ver = await verifyOtpAction(normalizeIranMobile(formData.phone) ?? formData.phone, formData.otpCode);
        if (!ver.ok) {
          const map: Record<string, string> = {
            invalid_phone: "شماره نامعتبر است",
            invalid_code: "کد نادرست است",
            expired: "کد منقضی شده؛ دوباره درخواست کنید",
            too_many_attempts: "تلاش بیش از حد؛ کمی بعد دوباره",
            server: "خطای سرور در ورود",
          };
          setErrors({
            otpCode: map[(ver as { error: string }).error] || "تأیید ناموفق",
          });
          setIsLoading(false);
          return;
        }
                
        
        
        const email = (ver as { email?: string }).email;
        const tempPass = (ver as { temp_password?: string }).temp_password;
        if (!email || !tempPass) {
          setErrors({ otpCode: "خطا در ساخت نشست؛ دوباره تلاش کنید" });
          setIsLoading(false);
          return;
        }
        try {
          const { createBrowserClient } = await import("@supabase/ssr");
          const browser = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          );
          const { data: signed, error: signErr } = await browser.auth.signInWithPassword({
            email,
            password: tempPass,
          });
          if (signErr || !signed.session) {
            console.error("[otp signIn]", signErr);
            setErrors({ otpCode: "ورود ناموفق؛ دوباره کد بگیرید" });
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("[otp session]", e);
          setErrors({ otpCode: "خطا در ورود" });
          setIsLoading(false);
          return;
        }

        setSuccessMessage("ورود موفق");
        try { void onSuccess?.({ phone: formData.phone }); } catch {}

        const role = String((ver as { role?: string }).role || "").toLowerCase();
        const isAdmin = role === "admin";
        const qNext = new URLSearchParams(window.location.search).get("next");
        let dest = qNext || defaultNext || (isAdmin ? "/admin/dashboard" : "/dashboard");
        if (!dest.startsWith("/")) dest = "/dashboard";
        if (dest.startsWith("/admin") && !isAdmin) dest = "/dashboard";
        window.location.replace(dest);
        return;




      }

      // ——— ورود با رمز (موبایل یا ایمیل) ———
      if (authMode === "login" && loginMethod === "password") {
        if (!isValidLoginId(formData.loginId)) {
          setErrors({ loginId: "شماره موبایل یا ایمیل معتبر وارد کنید" });
          setIsLoading(false);
          return;
        }
        if (!formData.password) {
          setErrors({ password: "رمز عبور الزامی است" });
          setIsLoading(false);
          return;
        }
        const id = formData.loginId.trim();
        if (!id.includes("@")) {
          setErrors({ loginId: "فعلاً فقط ورود با ایمیل فعال است" });
          setIsLoading(false);
          return;
        }
        const res = await signInAction(id, formData.password);
        if (!res.ok) {
          setErrors({ general: res.error || "ورود ناموفق" });
          setIsLoading(false);
          return;
        }
        onSuccess?.({ email: id });
        setIsLoading(false);
        return;
      }

      // ——— بازیابی ———
      if (authMode === "reset") {
        if (!isValidLoginId(formData.loginId) && !isValidIranPhone(formData.phone)) {
          const id = formData.loginId || formData.phone;
          if (!isValidLoginId(id)) {
            setErrors({ loginId: "موبایل یا ایمیل معتبر وارد کنید" });
            return;
          }
        }
        setSuccessMessage("لینک / کد بازیابی ارسال شد");
        setTimeout(() => setAuthMode("login"), 1500);
        return;
      }

      // ——— ثبت‌نام: موبایل اجباری، ایمیل اختیاری ———
      if (authMode === "signup") {
        if (registrationStep === "details") {
          if (!formData.name.trim()) {
            setErrors({ name: "نام و نام خانوادگی الزامی است" });
            return;
          }
          if (!formData.phone.trim() || !isValidIranPhone(formData.phone)) {
            setErrors({ phone: "شماره موبایل الزامی و باید معتبر باشد" });
            return;
          }
          if (formData.email.trim() && !isValidEmail(formData.email)) {
            setErrors({ email: "ایمیل معتبر نیست (اختیاری است)" });
            return;
          }
          if (!formData.password || formData.password.length < 6) {
            setErrors({ password: "رمز عبور حداقل ۶ کاراکتر باشد" });
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            setErrors({ confirmPassword: "رمزها یکسان نیستند" });
            return;
          }
          if (!formData.agreeToTerms) {
            setErrors({ agreeToTerms: "پذیرش قوانین الزامی است" });
            return;
          }
          setRegistrationStep("verification");
          setSuccessMessage("کد تأیید ارسال شد — در نسخه بعدی به OTP واقعی وصل می‌شود");
          return;
        }

        if (registrationStep === "verification") {
          if (!/^\d{6}$/.test(formData.verificationCode)) {
            setErrors({ verificationCode: "کد ۶ رقمی وارد کنید" });
            return;
          }
          setRegistrationStep("complete");
          setSuccessMessage("ثبت‌نام کامل شد");
          onSuccess?.({
            phone: formData.phone,
            email: formData.email.trim() || undefined,
            name: formData.name,
          });
          return;
        }
      }
    } catch {
      setErrors({ general: "خطا — دوباره تلاش کنید" });
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "border-input bg-muted/50 w-full rounded-xl border py-3 pr-4 pl-10 text-right focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className={cn("p-6", className)} dir="rtl">
      {successMessage ? (
        <div className="mb-4 rounded-xl border border-green-400/30 bg-green-500/20 p-3 text-sm text-green-700 dark:text-green-300">
          {successMessage}
        </div>
      ) : null}
      {errors.general ? (
        <div className="border-destructive/30 bg-destructive/20 text-destructive mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm">
          <AlertTriangle className="h-4 w-4" />
          {errors.general}
        </div>
      ) : null}

      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold">
          {authMode === "login"
            ? "ورود"
            : authMode === "reset"
              ? "بازیابی رمز عبور"
              : "عضویت"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {authMode === "login"
            ? "ورود با موبایل/ایمیل یا کد یکبارمصرف"
            : authMode === "reset"
              ? "بازیابی دسترسی"
              : "موبایل الزامی — ایمیل اختیاری"}
        </p>
      </div>

      {/* تب ورود / عضویت */}
      {authMode !== "reset" && registrationStep === "details" ? (
        <div className="bg-muted mb-4 flex rounded-xl p-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setOtpStep("phone");
            }}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium",
              authMode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            ورود
          </button>
          <button
            type="button"
            onClick={() => {
              if (!hideRegister) setAuthMode("signup");
              setRegistrationStep("details");
            }}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium",
              authMode === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            عضویت
          </button>
        </div>
      ) : null}

      {/* تب رمز / OTP فقط در ورود */}
      {authMode === "login" ? (
        <div className="bg-muted mb-6 flex rounded-xl p-1">
          <button
            type="button"
            onClick={() => {
              setLoginMethod("password");
              setOtpStep("phone");
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium",
              loginMethod === "password"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Lock className="h-4 w-4" />
            رمز عبور
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod("otp");
              setOtpStep("phone");
              setFormData((p) => ({ ...p, otpCode: "" }));
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium",
              loginMethod === "otp"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            ورود با OTP
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* بازیابی */}
        {authMode === "reset" ? (
          <>
            <div className="relative">
              <Phone className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <input
                type="text"
                placeholder="موبایل یا ایمیل"
                value={formData.loginId}
                onChange={(e) => handleInputChange("loginId", e.target.value)}
                className={inputCls}
              />
            </div>
            {errors.loginId ? (
              <p className="text-destructive text-xs">{errors.loginId}</p>
            ) : null}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground w-full rounded-xl py-3 font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                "ارسال کد بازیابی"
              )}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className="text-primary w-full text-sm"
            >
              بازگشت به ورود
            </button>
          </>
        ) : /* ورود OTP */ authMode === "login" && loginMethod === "otp" ? (
          <>
            {otpStep === "phone" ? (
              <>
                <div className="relative">
                  <Phone className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="شماره موبایل *"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={inputCls}
                  />
                </div>
                {errors.phone ? (
                  <p className="text-destructive text-xs">{errors.phone}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground w-full rounded-xl py-3 font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    "دریافت کد OTP"
                  )}
                </button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-center text-sm">
                  کد به <strong>{formData.phone}</strong> ارسال شد
                </p>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="کد ۶ رقمی"
                  value={formData.otpCode}
                  onChange={(e) =>
                    handleInputChange(
                      "otpCode",
                      onlyDigits(e.target.value, 6)
                    )
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={inputCls + " text-center font-mono text-lg tracking-widest"}
                  dir="ltr"
                />
                {errors.otpCode ? (
                  <p className="text-destructive text-xs">{errors.otpCode}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground w-full rounded-xl py-3 font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    "ورود"
                  )}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground w-full text-sm"
                  onClick={() => {
                    setOtpStep("phone");
                    setFormData((p) => ({ ...p, otpCode: "" }));
                  }}
                >
                  تغییر شماره
                </button>
              </>
            )}
          </>
        ) : /* تأیید ثبت‌نام */ authMode === "signup" &&
          registrationStep === "verification" ? (
          <>
            <p className="text-muted-foreground text-center text-sm">
              کد به موبایل <strong>{formData.phone}</strong> ارسال شد
            </p>
            <input
              type="text"
              maxLength={6}
              placeholder="کد ۶ رقمی"
              value={formData.verificationCode}
              onChange={(e) =>
                handleInputChange(
                  "verificationCode",
                  onlyDigits(e.target.value, 6).replace(/\D/g, "").slice(0, 6)
                )
              }
              className="border-input bg-muted/50 w-full rounded-xl border py-3 text-center font-mono text-2xl tracking-widest"
            />
            {errors.verificationCode ? (
              <p className="text-destructive text-xs">{errors.verificationCode}</p>
            ) : null}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground w-full rounded-xl py-3 font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                "تأیید و ادامه"
              )}
            </button>
          </>
        ) : authMode === "signup" && registrationStep === "complete" ? (
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold">ثبت‌نام با موفقیت انجام شد</p>
            <button
              type="button"
              className="bg-primary text-primary-foreground w-full rounded-xl py-3 font-medium"
              onClick={() => {
                onClose?.();
                onSuccess?.({
                  phone: formData.phone,
                  email: formData.email.trim() || undefined,
                  name: formData.name,
                });
              }}
            >
              ورود به داشبورد
            </button>
          </div>
        ) : (
          /* فرم ورود با رمز یا ثبت‌نام */
          <>
            {authMode === "signup" ? (
              <div className="relative">
                <User className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="نام و نام خانوادگی *"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={inputCls}
                />
                {errors.name ? (
                  <p className="text-destructive mt-1 text-xs">{errors.name}</p>
                ) : null}
              </div>
            ) : null}

            {/* ورود با رمز: موبایل یا ایمیل */}
            {authMode === "login" ? (
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="شماره موبایل یا ایمیل *"
                  value={formData.loginId}
                  onChange={(e) => handleInputChange("loginId", e.target.value)}
                  className={inputCls}
                />
                {errors.loginId ? (
                  <p className="text-destructive mt-1 text-xs">{errors.loginId}</p>
                ) : null}
              </div>
            ) : null}

            {/* ثبت‌نام: موبایل اجباری */}
            {authMode === "signup" ? (
              <div className="relative">
                <Phone className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="شماره موبایل *"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={inputCls}
                />
                {errors.phone ? (
                  <p className="text-destructive mt-1 text-xs">{errors.phone}</p>
                ) : null}
              </div>
            ) : null}

            {/* ثبت‌نام: ایمیل اختیاری */}
            {authMode === "signup" ? (
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="ایمیل (اختیاری)"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={inputCls}
                />
                {errors.email ? (
                  <p className="text-destructive mt-1 text-xs">{errors.email}</p>
                ) : null}
              </div>
            ) : null}

            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="رمز عبور *"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={cn(inputCls, "pl-10 pr-12")}
              />
              <button
                type="button"
                className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
              {errors.password ? (
                <p className="text-destructive mt-1 text-xs">{errors.password}</p>
              ) : null}
            </div>

            {authMode === "signup" ? (
              <>
                <div className="relative">
                  <Shield className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="تکرار رمز عبور *"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={cn(inputCls, "pl-10 pr-12")}
                  />
                  <button
                    type="button"
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  {errors.confirmPassword ? (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.confirmPassword}
                    </p>
                  ) : null}
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) =>
                      handleInputChange("agreeToTerms", e.target.checked)
                    }
                    className="mt-1"
                  />
                  <span className="text-muted-foreground">
                    قوانین و حریم خصوصی را می‌پذیرم
                  </span>
                </label>
                {errors.agreeToTerms ? (
                  <p className="text-destructive text-xs">{errors.agreeToTerms}</p>
                ) : null}
              </>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      handleInputChange("rememberMe", e.target.checked)
                    }
                  />
                  <span className="text-muted-foreground">مرا به خاطر بسپار</span>
                </label>
                <button
                  type="button"
                  className="text-primary"
                  onClick={() => setAuthMode("reset")}
                >
                  فراموشی رمز؟
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground w-full rounded-xl py-3 font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : authMode === "login" ? (
                "ورود"
              ) : (
                "ثبت‌نام"
              )}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default AuthForm;
