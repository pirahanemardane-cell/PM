"use client";

import { CatalogWizard } from "@/components/admin/catalog-wizard";
import { adminCreateBrandAction } from "@/app/admin/actions/catalog";

export default function NewBrandPage() {
  return <CatalogWizard kind="brand" createAction={adminCreateBrandAction} />;
}
