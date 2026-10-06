"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateReviewApproval, updateReviewReply } from "./actions";

export function ReviewActions({
  id,
  isApproved,
  adminReply,
}: {
  id: string;
  isApproved: boolean;
  adminReply: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reply, setReply] = useState(adminReply);
  const [showReply, setShowReply] = useState(false);

  const setApproval = (next: boolean) => {
    start(async () => {
      await updateReviewApproval(id, next);
      router.refresh();
    });
  };

  const saveReply = () => {
    start(async () => {
      await updateReviewReply(id, reply);
      setShowReply(false);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      {!isApproved ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setApproval(true)}
          className="text-emerald-600 text-xs hover:underline"
        >
          تأیید
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setApproval(false)}
          className="text-amber-600 text-xs hover:underline"
        >
          لغو تأیید
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => setShowReply((v) => !v)}
        className="text-secondary text-xs hover:underline"
      >
        {showReply ? "بستن" : "پاسخ"}
      </button>

      {showReply ? (
        <div className="mt-1 space-y-1">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            className="border-input bg-background w-full min-w-[180px] rounded-lg border px-2 py-1.5 text-xs"
            placeholder="پاسخ فروشگاه..."
            dir="rtl"
          />
          <button
            type="button"
            disabled={pending}
            onClick={saveReply}
            className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-xs"
          >
            ذخیره پاسخ
          </button>
        </div>
      ) : null}
    </div>
  );
}
