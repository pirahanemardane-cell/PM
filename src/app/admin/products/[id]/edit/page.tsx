"use client";
import { useParams } from "next/navigation";
import { ProductWizard } from "@/components/admin/product-wizard";
export default function EditProductPage() {
  const params = useParams();
  return <ProductWizard productId={String(params?.id ?? "") || null} />;
}
