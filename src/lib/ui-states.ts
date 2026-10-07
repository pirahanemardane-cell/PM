"use client";

import { useState } from "react";

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
export type UiColor =
  | "primary"
  | "secondary"
  | "accent"
  | "destructive"
  | "muted"
  | "foreground";

/** هوک ساده بدون Context — نیاز به Provider ندارد */
export function useUiState(initial: UiState = "idle") {
  const [state, setState] = useState<UiState>(initial);
  const [error, setError] = useState<string | null>(null);
  return { state, setState, error, setError };
}
