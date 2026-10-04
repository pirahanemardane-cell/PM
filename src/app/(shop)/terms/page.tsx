import type { Metadata } from "next";
import { getTextPageContentAction } from "@/app/admin/actions/content-pages";
import { LegalView } from "@/components/content/legal-view";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "شرایط استفاده | پیراهن مردانه",
  description: "شرایط و قوانین استفاده از فروشگاه پیراهن مردانه",
};

export default async function TermsPage() {
  const content = await getTextPageContentAction("terms");
  return (
    <main className="px-4 py-8 md:py-12">
      <LegalView content={content} variant="terms" />
    </main>
  );
}
