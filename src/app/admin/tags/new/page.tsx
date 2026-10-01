"use client";

import { CatalogWizard } from "@/components/admin/catalog-wizard";
import { adminCreateProductTagAction } from "@/app/admin/actions/tags";

export default function NewTagPage() {
  return (
    <CatalogWizard
      kind="tag"
      saveAction={async (input) => {
        const res = await adminCreateProductTagAction(input);
        if (!res.ok) return res;
        return { ok: true as const, id: String(res.id) };
      }}
    />
  );
}
