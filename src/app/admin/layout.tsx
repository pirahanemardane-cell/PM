import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = await requireAdmin();

  if (!gate.ok) {
    if (gate.error === "login_required") {
      redirect("/login?next=/admin/dashboard");
    }
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
