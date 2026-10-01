"use client";

import { CatalogWizard } from "@/components/admin/catalog-wizard";
import { adminCreateProductTagAction } from "@/app/admin/actions/tags";

export default function NewTagPage() {
  return <CatalogWizard kind="tag" createAction={adminCreateProductTagAction as never} />;
}
