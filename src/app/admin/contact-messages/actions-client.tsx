"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateContactMessageStatus } from "./actions";

export function ContactMessageActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const setStatus = (next: string) => {
    start(async () => {
      await updateContactMessageStatus(id, next);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {status !== "read" ? (
        <button type="button" disabled={pending} onClick={() => setStatus("read")} className="text-secondary text-xs hover:underline">
          خوانده شد
        </button>
      ) : null}
      {status !== "replied" ? (
        <button type="button" disabled={pending} onClick={() => setStatus("replied")} className="text-secondary text-xs hover:underline">
          پاسخ داده شد
        </button>
      ) : null}
      {status !== "archived" ? (
        <button type="button" disabled={pending} onClick={() => setStatus("archived")} className="text-muted-foreground text-xs hover:underline">
          آرشیو
        </button>
      ) : null}
    </div>
  );
}
