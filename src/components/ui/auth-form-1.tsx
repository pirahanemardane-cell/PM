"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

enum AuthView {
  SIGN_IN = "sign-in",
  SIGN_UP = "sign-up",
  FORGOT_PASSWORD = "forgot-password",
  RESET_SUCCESS = "reset-success",
}

interface AuthState {
  view: AuthView;
}

interface FormState {
  isLoading: boolean;
  error: string | null;
  showPassword: boolean;
}

const signInSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست"),
  password: z.string().min(8, "رمز حداقل ۸ کاراکتر باشد"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "نام حداقل ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل معتبر نیست"),
  password: z.string().min(8, "رمز حداقل ۸ کاراکتر باشد"),
  terms: z.literal(true, {
    errorMap: () => ({ message: "پذیرش قوانین الزامی است" }),
  }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست"),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function Auth({ className, ...props }: React.ComponentProps<"div">) {
  const [state, setState] = React.useState<AuthState>({
    view: AuthView.SIGN_IN,
  });

  const setView = React.useCallback((view: AuthView) => {
    setState((prev) => ({ ...prev, view }));
  }, []);

  return (
    <div
      data-slot="auth"
      className={cn("mx-auto w-full max-w-md", className)}
      {...props}
    >
      <div className="border-border/50 bg-card/80 relative overflow-hidden rounded-xl border shadow-xl backdrop-blur-sm">
        <div className="from-primary/5 to-secondary/5 absolute inset-0 bg-gradient-to-br" />
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {state.view === AuthView.SIGN_IN && (
              <AuthSignIn
                key="sign-in"
                onForgotPassword={() => setView(AuthView.FORGOT_PASSWORD)}
                onSignUp={() => setView(AuthView.SIGN_UP)}
              />
            )}
            {state.view === AuthView.SIGN_UP && (
              <AuthSignUp
                key="sign-up"
                onSignIn={() => setView(AuthView.SIGN_IN)}
              />
            )}
            {state.view === AuthView.FORGOT_PASSWORD && (
              <AuthForgotPassword
                key="forgot-password"
                onSignIn={() => setView(AuthView.SIGN_IN)}
                onSuccess={() => setView(AuthView.RESET_SUCCESS)}
              />
            )}
            {state.view === AuthView.RESET_SUCCESS && (
              <AuthResetSuccess
                key="reset-success"
                onSignIn={() => setView(AuthView.SIGN_IN)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AuthForm<T>({
  onSubmit,
  children,
  className,
}: {
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      onSubmit={onSubmit}
      data-slot="auth-form"
      className={cn("space-y-6", className)}
    >
      {children}
    </form>
  );
}

function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="border-destructive/20 bg-destructive/10 text-destructive mb-6 animate-in rounded-lg border p-4 text-sm">
      {message}
    </div>
  );
}

function AuthSocialButtons({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="mt-6 w-full">
      <Button
        type="button"
        variant="outline"
        className="bg-background/50 border-border/50 h-12 w-full"
        disabled={isLoading}
      >
        گوگل
      </Button>
    </div>
  );
}

function AuthSeparator({ text = "یا ادامه با" }: { text?: string }) {
  return (
    <div className="relative mt-6">
      <div className="absolute inset-0 flex items-center">
        <Separator />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card text-muted-foreground px-2">{text}</span>
      </div>
    </div>
  );
}

function AuthSignIn({
  onForgotPassword,
  onSignUp,
}: {
  onForgotPassword: () => void;
  onSignUp: () => void;
}) {
  const [formState, setFormState] = React.useState<FormState>({
    isLoading: false,
    error: null,
    showPassword: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async () => {
    setFormState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setFormState((prev) => ({
        ...prev,
        error: "ایمیل یا رمز اشتباه است (حالت دمو)",
      }));
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-iranyekan-heavy text-primary">خوش آمدید</h1>
        <p className="text-muted-foreground mt-2 text-sm">ورود به حساب کاربری</p>
      </div>
      <AuthError message={formState.error} />
      <AuthForm onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">ایمیل</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={formState.isLoading}
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">رمز عبور</Label>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={onForgotPassword}
              disabled={formState.isLoading}
            >
              فراموشی رمز؟
            </Button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={formState.showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={formState.isLoading}
              className={cn(errors.password && "border-destructive")}
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 left-0 h-full"
              onClick={() =>
                setFormState((prev) => ({
                  ...prev,
                  showPassword: !prev.showPassword,
                }))
              }
              disabled={formState.isLoading}
            >
              {formState.showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={formState.isLoading}>
          {formState.isLoading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال ورود...
            </>
          ) : (
            "ورود"
          )}
        </Button>
      </AuthForm>
      <AuthSeparator />
      <AuthSocialButtons isLoading={formState.isLoading} />
      <p className="text-muted-foreground mt-8 text-center text-sm">
        حساب ندارید؟{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm"
          onClick={onSignUp}
          disabled={formState.isLoading}
        >
          عضویت
        </Button>
      </p>
    </motion.div>
  );
}

function AuthSignUp({ onSignIn }: { onSignIn: () => void }) {
  const [formState, setFormState] = React.useState<FormState>({
    isLoading: false,
    error: null,
    showPassword: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", terms: false as unknown as true },
  });

  const terms = watch("terms");

  const onSubmit = async () => {
    setFormState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setFormState((prev) => ({
        ...prev,
        error: "این ایمیل قبلاً ثبت شده (حالت دمو)",
      }));
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-iranyekan-heavy text-primary">ایجاد حساب</h1>
        <p className="text-muted-foreground mt-2 text-sm">عضویت در فروشگاه</p>
      </div>
      <AuthError message={formState.error} />
      <AuthForm onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="name">نام</Label>
          <Input
            id="name"
            type="text"
            placeholder="نام شما"
            disabled={formState.isLoading}
            className={cn(errors.name && "border-destructive")}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">ایمیل</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="name@example.com"
            disabled={formState.isLoading}
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">رمز عبور</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={formState.showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={formState.isLoading}
              className={cn(errors.password && "border-destructive")}
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 left-0 h-full"
              onClick={() =>
                setFormState((prev) => ({
                  ...prev,
                  showPassword: !prev.showPassword,
                }))
              }
              disabled={formState.isLoading}
            >
              {formState.showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={!!terms}
            onCheckedChange={(checked) =>
              setValue("terms", checked === true, { shouldValidate: true })
            }
            disabled={formState.isLoading}
          />
          <Label htmlFor="terms" className="text-sm leading-6">
            قوانین و حریم خصوصی را می‌پذیرم
          </Label>
        </div>
        {errors.terms && (
          <p className="text-destructive text-xs">{errors.terms.message}</p>
        )}
        <Button type="submit" className="w-full" disabled={formState.isLoading}>
          {formState.isLoading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال ثبت...
            </>
          ) : (
            "عضویت"
          )}
        </Button>
      </AuthForm>
      <AuthSeparator />
      <AuthSocialButtons isLoading={formState.isLoading} />
      <p className="text-muted-foreground mt-8 text-center text-sm">
        حساب دارید؟{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm"
          onClick={onSignIn}
          disabled={formState.isLoading}
        >
          ورود
        </Button>
      </p>
    </motion.div>
  );
}

function AuthForgotPassword({
  onSignIn,
  onSuccess,
}: {
  onSignIn: () => void;
  onSuccess: () => void;
}) {
  const [formState, setFormState] = React.useState<FormState>({
    isLoading: false,
    error: null,
    showPassword: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async () => {
    setFormState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await new Promise((r) => setTimeout(r, 1200));
      onSuccess();
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative p-8"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={onSignIn}
        disabled={formState.isLoading}
      >
        <ArrowLeft className="h-4 w-4 rotate-180" />
        <span className="sr-only">بازگشت</span>
      </Button>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-iranyekan-heavy text-primary">بازیابی رمز</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          ایمیل خود را وارد کنید
        </p>
      </div>
      <AuthError message={formState.error} />
      <AuthForm onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="forgot-email">ایمیل</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="name@example.com"
            disabled={formState.isLoading}
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={formState.isLoading}>
          {formState.isLoading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال ارسال...
            </>
          ) : (
            "ارسال لینک"
          )}
        </Button>
      </AuthForm>
      <p className="text-muted-foreground mt-8 text-center text-sm">
        رمز را به خاطر دارید؟{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm"
          onClick={onSignIn}
          disabled={formState.isLoading}
        >
          ورود
        </Button>
      </p>
    </motion.div>
  );
}

function AuthResetSuccess({ onSignIn }: { onSignIn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center p-8 text-center"
    >
      <div className="bg-primary/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <MailCheck className="text-primary h-8 w-8" />
      </div>
      <h1 className="text-2xl font-iranyekan-heavy text-primary">ایمیل را چک کنید</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        لینک بازیابی رمز ارسال شد (حالت دمو).
      </p>
      <Button type="button" variant="outline" className="mt-6 w-full max-w-xs" onClick={onSignIn}>
        بازگشت به ورود
      </Button>
    </motion.div>
  );
}
