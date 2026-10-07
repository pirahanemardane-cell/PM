/**
 * فاز ۲ — سیستم طراحی
 * تعریف رسمی States برای همه کامپوننت‌های UI
 */

import { createContext, useContext, useState, ReactNode } from "react";

export type UiState =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "empty"
  | "empty-error"
  | "disabled"
  | "pending"
  | "warning";

export type UiVariant =
  | "default"
  | "destructive"
  | "outline"
  | "ghost"
  | "secondary"
  | "link"
  | "success"
  | "warning";

export type UiSize = "sm" | "md" | "lg" | "xl";
export type UiColor = "primary" | "secondary" | "accent" | "destructive" | "muted" | "foreground";

interface UiStateContextType {
  state: UiState;
  setState: (s: UiState) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

const UiStateContext = createContext<UiStateContextType | null>(null);

export function UiStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UiState>("idle");
  const [error, setError] = useState<string | null>(null);

  return (
    <UiStateContext.Provider value={{ state, setState, error, setError }}>
      {children}
    </UiStateContext.Provider>
  );
}

export const useUiState = () => {
  const context = useContext(UiStateContext);
  if (!context) throw new Error("useUiState must be used within UiStateProvider");
  return context;
};
