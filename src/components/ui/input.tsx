"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUiState } from "@/lib/ui-states";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: "idle" | "loading" | "success" | "error" | "disabled" | "pending" | "warning";
  errorText?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, state, errorText, icon, onFocus, onBlur, ...props }, ref) => {
    const { state: currentState, setState, setError } = useUiState();
    const effectiveState = state ?? currentState;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
      setState("idle");
      setError(null);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      if (e.target.value.trim()) setState("idle");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setState("idle");
      setError(null);
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            {
              "border-destructive focus-visible:ring-destructive": effectiveState === "error",
              "border-emerald-500 focus-visible:ring-emerald-500": effectiveState === "success",
              "border-amber-500 focus-visible:ring-amber-500": effectiveState === "warning",
              "opacity-75": effectiveState === "disabled",
              "animate-pulse": effectiveState === "loading",
            },
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        {errorText && (
          <p className="mt-1 text-xs text-destructive">{errorText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
