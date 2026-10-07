"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useUiState } from "@/lib/ui-states";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        warning: "bg-amber-600 text-white hover:bg-amber-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  state?: "idle" | "loading" | "success" | "error" | "disabled" | "pending" | "warning";
  stateText?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, state, stateText, children, onSuccess, onError, ...props }, ref) => {
    const { state: currentState, setState, setError } = useUiState();

    const effectiveState = state ?? currentState;
    const effectiveText = stateText || (effectiveState === "loading" ? "در حال پردازش..." : "");

    const Comp = asChild ? Slot : "button";

    const handleClick = async (e: React.MouseEvent) => {
      if (effectiveState === "disabled" || effectiveState === "loading") return;

      setState("loading");
      onError?.("");
      onSuccess?.();

      try {
        await props.onClick?.(e);
        setState("success");
        setTimeout(() => setState("idle"), 1500);
      } catch (err) {
        const message = err instanceof Error ? err.message : "عملیات ناموفق بود";
        setError(message);
        setState("error");
        onError?.(message);
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), {
          "animate-pulse": effectiveState === "loading",
          "bg-emerald-600 hover:bg-emerald-700": effectiveState === "success",
          "bg-amber-600 hover:bg-amber-700": effectiveState === "warning",
          "pointer-events-none opacity-75": effectiveState === "disabled",
        })}
        ref={ref}
        onClick={handleClick}
        disabled={effectiveState === "disabled" || effectiveState === "loading"}
        {...props}
      >
        {children}
        {effectiveText && <span className="ml-2 text-xs opacity-75">{effectiveText}</span>}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
