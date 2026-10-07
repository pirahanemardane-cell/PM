import { redirect } from "next/navigation";

/** /dashboard/orders → تب سفارش‌ها */
export default function DashboardOrdersRedirect() {
  redirect("/dashboard?tab=orders");
}
