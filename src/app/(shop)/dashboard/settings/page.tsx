import { redirect } from "next/navigation";

export default function DashboardSettingsRedirect() {
  redirect("/داشبورد?tab=profile");
}
