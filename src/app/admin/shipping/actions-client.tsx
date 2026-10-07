"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from "./actions";

type Props =
  | { mode: "create" }
  | {
      mode?: "edit";
      id: string;
      title: string;
      description: string;
      fee: number;
      isActive: boolean;
      sortOrder: number;
    };

export function ShippingActions(props: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isCreate = props.mode === "create";

  const [title, setTitle] = useState(isCreate ? "" : props.title);
  const [description, setDescription] = useState(isCreate ? "" : props.description);
  const [fee, setFee] = useState(isCreate ? "0" : String(props.fee));
  const [sortOrder, setSortOrder] = useState(
    isCreate ? "99" : String(props.sortOrder),
  );
  const [editing, setEditing] = useState(false);

  const save = () => {
    start(async () => {
      if (isCreate) {
        await createShippingMethod({
          title,
          description,
          fee: Number(fee) || 0,
          sort_order: Number(sortOrder) || 99,
        });
        setTitle("");
        setDescription("");
        setFee("0");
        setSortOrder("99");
      } else {
        await updateShippingMethod(props.id, {
          title,
          description,
          fee: Number(fee) || 0,
          sort_order: Number(sortOrder) || 0,
        });
        setEditing(false);
      }
      router.refresh();
    });
  };

  if (isCreate) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          placeholder="عنوان *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          placeholder="توضیح"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          placeholder="هزینه (تومان)"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />
        <input
          type="number"
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          placeholder="ترتیب نمایش"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
        <button
          type="button"
          disabled={pending || !title.trim()}
          onClick={save}
          className="bg-primary text-primary-foreground col-span-full rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          افزودن روش ارسال
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {!editing ? (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing(true)}
            className="text-secondary text-xs hover:underline"
          >
            ویرایش
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await updateShippingMethod(props.id, {
                  is_active: !props.isActive,
                });
                router.refresh();
              })
            }
            className="text-xs hover:underline"
          >
            {props.isActive ? "غیرفعال کردن" : "فعال کردن"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                if (confirm("حذف این روش ارسال؟")) {
                  await deleteShippingMethod(props.id);
                  router.refresh();
                }
              })
            }
            className="text-destructive text-xs hover:underline"
          >
            حذف
          </button>
        </>
      ) : (
        <div className="space-y-1.5">
          <input
            className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان"
          />
          <input
            className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح"
          />
          <input
            type="number"
            className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="هزینه"
          />
          <input
            type="number"
            className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="ترتیب"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs"
            >
              ذخیره
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-muted-foreground text-xs"
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
