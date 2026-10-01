"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CatalogWizard, type CatalogItem } from "@/components/admin/catalog-wizard";
import { adminGetBrandAction, adminUpdateBrandAction } from "@/app/admin/actions/catalog";

export default function EditBrandPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void adminGetBrandAction(id).then((res) => {
      setLoading(false);
      if (!res.ok) {
        setErr("بارگذاری ناموفق");
        return;
      }
      setItem(res.item as CatalogItem);
    });
  }, [id]);

  if (err) return <p className="text-destructive p-6">{err}</p>;

  return (
    <CatalogWizard
      kind="brand"
      initial={item}
      loadingInitial={loading}
      saveAction={async (input) => {
        const res = await adminUpdateBrandAction(id, input);
        if (!res.ok) return res;
        return { ok: true as const, id };
      }}
    />
  );
}
