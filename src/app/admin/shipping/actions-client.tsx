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
      providerCode: string;
      pricingType: string;
      apiConfig: Record<string, unknown>;
    };

export function ShippingActions(props: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isCreate = props.mode === "create";

  const [title, setTitle] = useState(isCreate ? "" : props.title);
  const [description, setDescription] = useState(
    isCreate ? "" : props.description,
  );
  const [fee, setFee] = useState(isCreate ? "0" : String(props.fee));
  const [sortOrder, setSortOrder] = useState(
    isCreate ? "99" : String(props.sortOrder),
  );
  const [providerCode, setProviderCode] = useState(
    isCreate ? "" : props.providerCode,
  );
  const [pricingType, setPricingType] = useState(
    isCreate ? "fixed" : props.pricingType,
  );
  const [apiKey, setApiKey] = useState(
    isCreate ? "" : String((props.apiConfig as any)?.api_key || ""),
  );
  const [clientId, setClientId] = useState(
    isCreate ? "" : String((props.apiConfig as any)?.client_id || ""),
  );
  const [contractCode, setContractCode] = useState(
    isCreate ? "" : String((props.apiConfig as any)?.contract_code || ""),
  );
  const [baseUrl, setBaseUrl] = useState(
    isCreate ? "" : String((props.apiConfig as any)?.base_url || ""),
  );
  const [originLat, setOriginLat] = useState(
    isCreate ? "" : String((props.apiConfig as any)?.origin_lat || ""),
  );
  const [originLng, setOriginLng] = useState(
    isCreate ? "" : String((props.apiConfig as any)?.origin_lng || ""),
  );
  const [editing, setEditing] = useState(false);
  const [showApi, setShowApi] = useState(false);

  const code = (isCreate ? providerCode : props.providerCode || "").toLowerCase();

  const buildApiConfig = () => {
    const cfg: Record<string, unknown> = {};
    if (baseUrl.trim()) cfg.base_url = baseUrl.trim();
    if (apiKey.trim()) cfg.api_key = apiKey.trim();

    // فقط فیلدهای مربوط به همان سرویس
    if (code === "tipax") {
      if (contractCode.trim()) cfg.contract_code = contractCode.trim();
    }
    if (code === "snappbox") {
      if (clientId.trim()) cfg.client_id = clientId.trim();
      if (originLat.trim()) cfg.origin_lat = Number(originLat);
      if (originLng.trim()) cfg.origin_lng = Number(originLng);
    }
    if (code === "alopeyk") {
      if (apiKey.trim()) cfg.api_token = apiKey.trim();
      if (originLat.trim()) cfg.origin_lat = Number(originLat);
      if (originLng.trim()) cfg.origin_lng = Number(originLng);
      cfg.transport_type = "motor_taxi";
    }
    return cfg;
  };

  const save = () => {
    start(async () => {
      if (isCreate) {
        await createShippingMethod({
          title,
          description,
          fee: Number(fee) || 0,
          sort_order: Number(sortOrder) || 99,
          provider_code: providerCode || undefined,
          pricing_type: pricingType,
        });
        setTitle("");
        setDescription("");
        setFee("0");
        setSortOrder("99");
        setProviderCode("");
        setPricingType("fixed");
      } else {
        await updateShippingMethod(props.id, {
          title,
          description,
          fee: Number(fee) || 0,
          sort_order: Number(sortOrder) || 0,
          provider_code: providerCode || undefined,
          pricing_type: pricingType,
          api_config: buildApiConfig(),
        });
        setEditing(false);
        setShowApi(false);
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
          placeholder="هزینه ثابت (تومان)"
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
        <select
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          value={pricingType}
          onChange={(e) => setPricingType(e.target.value)}
        >
          <option value="fixed">قیمت ثابت</option>
          <option value="api">استعلام API</option>
          <option value="negotiable">توافقی</option>
        </select>
        <input
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          placeholder="کد سرویس (post / tipax / snappbox / ...)"
          value={providerCode}
          onChange={(e) => setProviderCode(e.target.value)}
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
      {!editing && !showApi ? (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing(true)}
            className="text-secondary text-xs hover:underline"
          >
            ویرایش
          </button>
          {props.pricingType === "api" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowApi(true)}
              className="text-primary text-xs hover:underline"
            >
              تنظیم API
            </button>
          ) : null}
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
      ) : null}

      {editing ? (
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
            placeholder="هزینه ثابت"
          />
          <select
            className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value)}
          >
            <option value="fixed">قیمت ثابت</option>
            <option value="api">استعلام API</option>
            <option value="negotiable">توافقی</option>
          </select>
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
      ) : null}

      {showApi ? (
        <div className="border-border mt-1 space-y-1.5 rounded-lg border p-2">
          <p className="text-xs font-medium">
            تنظیمات API — {props.title}
            {code ? ` (${code})` : ""}
          </p>

          {/* Base URL برای همه APIها */}
          <input
            className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Base URL"
            dir="ltr"
          />

          {/* تیپاکس: API Key + Contract Code */}
          {code === "tipax" && (
            <>
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key (تیپاکس)"
                dir="ltr"
              />
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                placeholder="Contract Code (تیپاکس)"
                dir="ltr"
              />
            </>
          )}

          {/* اسنپ باکس: API Key + Client ID + مختصات مبدا */}
          {code === "snappbox" && (
            <>
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key (اسنپ باکس)"
                dir="ltr"
              />
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Client ID (اسنپ باکس)"
                dir="ltr"
              />
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={originLat}
                onChange={(e) => setOriginLat(e.target.value)}
                placeholder="عرض جغرافیایی انبار (origin_lat)"
                dir="ltr"
              />
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={originLng}
                onChange={(e) => setOriginLng(e.target.value)}
                placeholder="طول جغرافیایی انبار (origin_lng)"
                dir="ltr"
              />
            </>
          )}

          {/* الوپیک */}
          {code === "alopeyk" && (
            <>
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Access Token (Bearer JWT)"
                dir="ltr"
              />
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={originLat}
                onChange={(e) => setOriginLat(e.target.value)}
                placeholder="عرض جغرافیایی انبار (origin_lat)"
                dir="ltr"
              />
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={originLng}
                onChange={(e) => setOriginLng(e.target.value)}
                placeholder="طول جغرافیایی انبار (origin_lng)"
                dir="ltr"
              />
              <p className="text-muted-foreground text-[10px]">
                نوع پیش‌فرض: motor_taxi — توکن از پنل الوپیک / فروش
              </p>
            </>
          )}

          {/* پست پیشتاز: بدون کلید */}
          {code === "post" && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              پست پیشتاز فعلاً با جدول تعرفه داخلی محاسبه می‌شود.
              برای نرخ دقیق، قرارداد تاپین یا سامانه رسمی لازم است.
            </p>
          )}

          {/* ناشناخته */}
          {!["tipax", "snappbox", "post", "alopeyk"].includes(code) && (
            <>
              <input
                className="border-input bg-background h-8 w-full rounded border px-2 text-xs"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key"
                dir="ltr"
              />
            </>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs"
            >
              ذخیره API
            </button>
            <button
              type="button"
              onClick={() => setShowApi(false)}
              className="text-muted-foreground text-xs"
            >
              بستن
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
