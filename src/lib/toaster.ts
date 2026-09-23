"use client";

import { createToaster } from "@ark-ui/react/toast";

export const toaster = createToaster({
  placement: "top-start",
  gap: 16,
  overlap: true,
});

export type AppToastType = "success" | "error" | "warning" | "info";

export function showToast(opts: {
  title: string;
  description?: string;
  type?: AppToastType;
}) {
  return toaster.create({
    title: opts.title,
    description: opts.description,
    type: opts.type ?? "info",
  });
}

/** میانبرهای رایج */
export const toast = {
  success: (title: string, description?: string) =>
    showToast({ title, description, type: "success" }),
  error: (title: string, description?: string) =>
    showToast({ title, description, type: "error" }),
  warning: (title: string, description?: string) =>
    showToast({ title, description, type: "warning" }),
  info: (title: string, description?: string) =>
    showToast({ title, description, type: "info" }),
};
