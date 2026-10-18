"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listShippingZonesAdminAction,
  saveMethodZonesAction,
} from "./zones-actions";

type Zone = { id: string; name: string; description: string | null; is_active: boolean };
type Method = { id: string; title: string; provider_code: string | null; is_active: boolean };
type Loc = { zone_id: string; province: string; city: string | null };
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

  const provincesByZone = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const loc of locations) {
      const arr = m.get(loc.zone_id) ?? [];
      arr.push(loc.city ? `${loc.province} / ${loc.city}` : loc.province);
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

  if (loading) {
    return (
      <div className="border-border text-muted-foreground rounded-xl border p-4 text-sm">
        در حال بارگذاری مناطق ارسال…
      </div>
    );
  }

  return (
    <div className="border-border space-y-4 rounded-xl border p-4" dir="rtl">
      <div>
        <h2 className="font-semibold">مناطق ارسال (Zones)</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          اگر برای یک روش هیچ منطقه‌ای تیک نخورد = در <strong>همه جا</strong> فعال است.
          با تیک زدن منطقه، فقط در همان استان‌ها نمایش داده می‌شود.
        </p>
      </div>

      <div className="space-y-2 text-xs">
        <p className="font-medium">مناطق تعریف‌شده:</p>
        <ul className="text-muted-foreground list-inside list-disc space-y-1">
          {zones.map((z) => (
            <li key={z.id}>
              {z.name}
              {provincesByZone.get(z.id)?.length
                ? ` — ${provincesByZone.get(z.id)!.join("، ")}`
                : " — بدون استان (بعداً اضافه کنید)"}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
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
