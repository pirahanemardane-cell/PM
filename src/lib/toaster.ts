"use client";

import { createToaster } from "@ark-ui/react/toast";

export const toaster = createToaster({
  placement: "bottom-end",
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
