"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CatalogWizard, type CatalogItem } from "@/components/admin/catalog-wizard";
import {
  adminGetCategoryAction,
  adminUpdateCategoryAction,
  adminListCategoriesAction,
} from "@/app/admin/actions/catalog";

export default function EditCategoryPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState<{ id: string; name: string }[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void Promise.all([adminGetCategoryAction(id), adminListCategoriesAction()]).then(
      ([res, list]) => {
        setLoading(false);
        if (!res.ok) {
          setErr("بارگذاری ناموفق");
          return;
        }
        setItem(res.item as CatalogItem);
        if (list.ok) {
          setParents(
            (list.items as { id: string; name: string; parent_id?: string | null }[])
              .filter((c) => !c.parent_id && c.id !== id)
              .map((c) => ({ id: c.id, name: c.name })),
          );
        }
      },
    );
  }, [id]);

  if (err) return <p className="text-destructive p-6">{err}</p>;

  return (
    <CatalogWizard
      kind="category"
      initial={item}
      loadingInitial={loading}
      parentOptions={parents}
      saveAction={async (input) => {
        const res = await adminUpdateCategoryAction(id, input);
        if (!res.ok) return res;
        return { ok: true as const, id };
      }}
    />
  );
}
