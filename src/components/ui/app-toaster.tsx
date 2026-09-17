"use client";

import { Toast, Toaster } from "@ark-ui/react/toast";
import { Portal } from "@ark-ui/react/portal";
import {
  CheckCircle,
  AlertCircle,
  X,
  Info,
  AlertTriangle,
} from "lucide-react";
import { toaster } from "@/lib/toaster";

const toastTypes = [
  {
    type: "success" as const,
    icon: CheckCircle,
    colors:
      "bg-green-50 border-l-4 border-green-500 text-green-800 dark:bg-green-950/80 dark:text-green-100 dark:border-green-400",
    iconColor: "text-green-500",
  },
  {
    type: "error" as const,
    icon: AlertCircle,
    colors:
      "bg-red-50 border-l-4 border-red-500 text-red-800 dark:bg-red-950/80 dark:text-red-100 dark:border-red-400",
    iconColor: "text-red-500",
  },
  {
    type: "warning" as const,
    icon: AlertTriangle,
    colors:
      "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-100 dark:border-yellow-400",
    iconColor: "text-yellow-500",
  },
  {
    type: "info" as const,
    icon: Info,
    colors:
      "bg-blue-50 border-l-4 border-blue-500 text-blue-800 dark:bg-blue-950/80 dark:text-blue-100 dark:border-blue-400",
    iconColor: "text-blue-500",
  },
];

export function AppToaster() {
  return (
    <Portal>
      <Toaster toaster={toaster}>
        {(toast) => {
          const toastConfig = toastTypes.find((t) => t.type === toast.type);
          const Icon = toastConfig?.icon || Info;
          return (
            <Toast.Root
              className={`min-w-80 rounded-lg p-4 shadow-lg relative transition-all duration-300 will-change-transform h-(--height) opacity-(--opacity) translate-x-(--x) translate-y-(--y) scale-(--scale) z-(--z-index) ${
                toastConfig?.colors ||
                "bg-white border border-gray-100 dark:bg-gray-900"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    toastConfig?.iconColor || "text-gray-500"
                  }`}
                />
                <div className="flex-1 pe-6">
                  <Toast.Title className="text-sm font-semibold">
                    {toast.title}
                  </Toast.Title>
                  {toast.description ? (
                    <Toast.Description className="mt-0.5 text-sm opacity-80">
                      {toast.description}
                    </Toast.Description>
                  ) : null}
                </div>
              </div>
              <Toast.CloseTrigger className="absolute top-3 end-3 rounded p-1 transition-colors hover:bg-black/10">
                <X className="h-3 w-3" />
              </Toast.CloseTrigger>
            </Toast.Root>
          );
        }}
      </Toaster>
    </Portal>
  );
}
