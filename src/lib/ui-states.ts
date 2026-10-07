/**
 * فاز ۲ — سیستم طراحی
 * تعریف رسمی States برای همه کامپوننت‌های UI
 */

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
