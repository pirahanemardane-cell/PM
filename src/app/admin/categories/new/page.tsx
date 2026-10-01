"use client";

import { useEffect, useState } from "react";
import { CatalogWizard } from "@/components/admin/catalog-wizard";
import {
  adminCreateCategoryAction,
  adminListCategoriesAction,
} from "@/app/admin/actions/catalog";

export default function NewCategoryPage() {
  const [parents, setParents] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    void adminListCategoriesAction().then((res) => {
      if (res.ok) {
        setParents(
          (res.items as { id: string; name: string; parent_id?: string | null; is_active?: boolean }[])
            .filter((c) => !c.parent_id && c.is_active !== false)
            .map((c) => ({ id: c.id, name: c.name })),
        );
      }
    });
  }, []);
  return (
    <CatalogWizard
      kind="category"
      createAction={adminCreateCategoryAction}
      parentOptions={parents}
    />
  );
}
