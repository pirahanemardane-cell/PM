"use client";

import { CatalogWizard } from "@/components/admin/catalog-wizard";
import { adminCreateBrandAction } from "@/app/admin/actions/catalog";

export default function NewBrandPage() {
  return (
    <CatalogWizard
      kind="brand"
      saveAction={async (input) => {
        const res = await adminCreateBrandAction(input);
        if (!res.ok) return res;
        return { ok: true as const, id: res.id };
      }}
    />
  );
}
