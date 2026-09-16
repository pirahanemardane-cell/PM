import type { Metadata } from "next";
import { Auth } from "@/components/ui/auth-form-1";

export const metadata: Metadata = {
  title: "ورود | عضویت",
  description: "ورود و عضویت در فروشگاه پیراهن مردانه",
};

export default function LoginPage() {
  return (
    <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Auth />
    </main>
  );
}
