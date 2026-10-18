"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listShippingZonesAdminAction,
  saveMethodZonesAction,
  createShippingZoneAction,
  addZoneProvinceAction,
  removeZoneLocationAction,
  deleteShippingZoneAction,
} from "./zones-actions";
import { IRAN_PROVINCES } from "@/lib/iran-provinces";

type Zone = { id: string; name: string; description: string | null; is_active: boolean };
type Method = { id: string; title: string; provider_code: string | null; is_active: boolean };
type Loc = { id: string; zone_id: string; province: string; city: string | null };
type Link = { method_id: string; zone_id: string };

export function ShippingZonesForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState("");
  const [addProvince, setAddProvince] = useState<Record<string, string>>({});

  async function reload() {
    setLoading(true);
    const res = await listShippingZonesAdminAction();
    setLoading(false);
    if (!res.ok) {
      setErr("بارگذاری مناطق ناموفق");
      return;
    }
    setZones(res.zones as Zone[]);
    setMethods(res.methods as Method[]);
    setLocations(res.locations as Loc[]);
    setLinks(res.links as Link[]);
  }

  useEffect(() => {
    void reload();
  }, []);

  const locsByZone = useMemo(() => {
    const m = new Map<string, Loc[]>();
    for (const loc of locations) {
      const arr = m.get(loc.zone_id) ?? [];
      arr.push(loc);
      m.set(loc.zone_id, arr);
    }
    return m;
  }, [locations]);

  function zoneIdsForMethod(methodId: string) {
    return links.filter((l) => l.method_id === methodId).map((l) => l.zone_id);
  }

  async function toggleZone(methodId: string, zoneId: string, checked: boolean) {
    const current = new Set(zoneIdsForMethod(methodId));
    if (checked) current.add(zoneId);
    else current.delete(zoneId);
    setSaving(methodId);
    setMsg(null);
    setErr(null);
    const res = await saveMethodZonesAction(methodId, [...current]);
    setSaving(null);
    if (!res.ok) {
      setErr("ذخیره ناموفق");
      return;
    }
    setMsg("مناطق روش ارسال ذخیره شد");
    await reload();
  }

  async function onCreateZone(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const res = await createShippingZoneAction({ name: newZoneName });
    if (!res.ok) {
      setErr("ایجاد منطقه ناموفق");
      return;
    }
    setNewZoneName("");
    setMsg("منطقه جدید ساخته شد");
    await reload();
  }

  async function onAddProvince(zoneId: string) {
    const p = (addProvince[zoneId] || "").trim();
    if (!p) return;
    setErr(null);
    const res = await addZoneProvinceAction(zoneId, p);
    if (!res.ok) {
      setErr("افزودن استان ناموفق");
      return;
    }
    setAddProvince((s) => ({ ...s, [zoneId]: "" }));
    setMsg("استان اضافه شد");
    await reload();
  }

  async function onRemoveLoc(id: string) {
    if (!confirm("این استان از منطقه حذف شود؟")) return;
    const res = await removeZoneLocationAction(id);
    if (!res.ok) {
      setErr("حذف ناموفق");
      return;
    }
    setMsg("استان حذف شد");
    await reload();
  }

  async function onDeleteZone(id: string) {
    if (!confirm("کل این منطقه حذف شود؟ (استان‌ها و اتصال روش‌ها هم پاک می‌شوند)")) return;
    const res = await deleteShippingZoneAction(id);
    if (!res.ok) {
      setErr("حذف منطقه ناموفق");
      return;
    }
    setMsg("منطقه حذف شد");
    await reload();
  }

  if (loading) {
    return (
      <div className="border-border text-muted-foreground rounded-xl border p-4 text-sm">
        در حال بارگذاری مناطق ارسال…
      </div>
    );
  }

  return (
    <div className="border-border space-y-6 rounded-xl border p-4" dir="rtl">
      <div>
        <h2 className="font-semibold">مناطق ارسال (Zones)</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          اگر برای یک روش هیچ منطقه‌ای تیک نخورد = در همه جا فعال است.
        </p>
      </div>

      <form onSubmit={onCreateZone} className="flex flex-wrap items-end gap-2">
        <label className="block space-y-1 text-sm">
          <span>منطقه جدید</span>
          <input
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            className="border-input bg-background h-10 rounded-xl border px-3"
            placeholder="مثلاً غرب کشور"
          />
        </label>
        <button
          type="submit"
          className="bg-primary text-primary-foreground h-10 rounded-xl px-4 text-sm"
        >
          افزودن منطقه
        </button>
      </form>

      <div className="space-y-4">
        {zones.map((z) => {
          const locs = locsByZone.get(z.id) ?? [];
          return (
            <div key={z.id} className="border-border rounded-lg border p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{z.name}</span>
                <button
                  type="button"
                  onClick={() => void onDeleteZone(z.id)}
                  className="text-destructive text-xs underline"
                >
                  حذف منطقه
                </button>
              </div>
              <ul className="text-muted-foreground mb-2 space-y-1 text-xs">
                {locs.length === 0 ? (
                  <li>هنوز استانی ندارد</li>
                ) : (
                  locs.map((loc) => (
                    <li key={loc.id} className="flex items-center gap-2">
                      <span>{loc.province}</span>
                      <button
                        type="button"
                        onClick={() => void onRemoveLoc(loc.id)}
                        className="text-destructive text-[10px]"
                      >
                        حذف
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={addProvince[z.id] || ""}
                  onChange={(e) =>
                    setAddProvince((s) => ({ ...s, [z.id]: e.target.value }))
                  }
                  className="border-input bg-background h-9 rounded-lg border px-2 text-xs"
                >
                  <option value="">افزودن استان…</option>
                  {IRAN_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void onAddProvince(z.id)}
                  className="border-border h-9 rounded-lg border px-3 text-xs"
                >
                  افزودن
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 border-t pt-4">
        <p className="text-sm font-medium">اتصال روش ارسال به منطقه</p>
        {methods.map((m) => {
          const selected = new Set(zoneIdsForMethod(m.id));
          return (
            <div key={m.id} className="border-border rounded-lg border p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {m.title}
                  {!m.is_active ? (
                    <span className="text-muted-foreground mr-2 text-xs"> (غیرفعال)</span>
                  ) : null}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {selected.size === 0 ? "همه مناطق" : `${selected.size} منطقه`}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {zones.map((z) => (
                  <label key={z.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={selected.has(z.id)}
                      disabled={saving === m.id}
                      onChange={(e) =>
                        void toggleZone(m.id, z.id, e.target.checked)
                      }
                    />
                    {z.name}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
    </div>
  );
}
