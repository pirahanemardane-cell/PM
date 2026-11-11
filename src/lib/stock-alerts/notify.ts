import { createServiceClient } from "@/lib/supabase/service";
import { sendTransactionalEmail } from "@/lib/email/send";

export async function notifyStockAlertsForVariant(variantId: string): Promise<{
  notified: number;
}> {
  if (!variantId) return { notified: 0 };
  const service = createServiceClient();

  const { data: variant } = await service
    .from("product_variants")
    .select("id, stock_quantity, product_id, size, color_name, products(name, slug)")
    .eq("id", variantId)
    .maybeSingle();

  const stock = Number(variant?.stock_quantity ?? 0);
  if (!variant || stock <= 0) return { notified: 0 };

  const { data: alerts } = await service
    .from("stock_alerts")
    .select("id, user_id, phone, email")
    .eq("variant_id", variantId)
    .eq("status", "pending")
    .limit(500);

  if (!alerts?.length) return { notified: 0 };

  const prod = variant.products as
    | { name?: string; slug?: string }
    | { name?: string; slug?: string }[]
    | null;
  const p = Array.isArray(prod) ? prod[0] : prod;
  const titleName = p?.name ?? "محصول";
  const slug = p?.slug ?? "";
  const size = (variant as { size?: string | null }).size ?? "";
  const color = (variant as { color_name?: string | null }).color_name ?? "";
  const label = [titleName, color, size].filter(Boolean).join(" · ");
  const link = slug ? `/محصولات/${slug}` : "/محصولات";
  const absoluteUrl = slug
    ? `https://pirahanmardane.ir/محصولات/${encodeURIComponent(slug)}`
    : "https://pirahanmardane.ir/محصولات";

  let n = 0;
  for (const a of alerts) {
    try {
      if (a.user_id) {
        await service.from("notifications").insert({
          user_id: a.user_id,
          title: "موجود شد",
          body: `${label} دوباره موجود شد.`,
          type: "stock",
          link,
        });
      }
      if (a.phone) {
        await service.from("sms_outbox").insert({
          phone: a.phone,
          body: `${label} موجود شد. ${absoluteUrl}`,
          status: "queued",
          meta: { variant_id: variantId, alert_id: a.id },
        });
      }
      let emailTo = String((a as { email?: string | null }).email ?? "").trim();
      if (!emailTo && a.user_id) {
        try {
          const { data: u } = await service.auth.admin.getUserById(a.user_id);
          emailTo = String(u?.user?.email ?? "").trim();
        } catch {
          /* optional */
        }
      }
      if (emailTo) {
        await sendTransactionalEmail({
          to: emailTo,
          subject: `${titleName} موجود شد — پیراهن مردانه`,
          html: `<p><strong>${label}</strong> دوباره موجود شد.</p><p><a href="${absoluteUrl}">مشاهده محصول</a></p>`,
          text: `${label} موجود شد: ${absoluteUrl}`,
        });
      }
      await service
        .from("stock_alerts")
        .update({
          status: "notified",
          notified_at: new Date().toISOString(),
        })
        .eq("id", a.id)
        .eq("status", "pending");
      n += 1;
    } catch (e) {
      console.error("[notifyStockAlerts row]", e);
    }
  }

  try {
    const { data: admins } = await service
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(20);
    const body = `${label} موجود شد — ${n} نفر از لیست انتظار مطلع شدند.`;
    for (const ad of admins ?? []) {
      await service.from("notifications").insert({
        user_id: ad.id,
        title: "لیست انتظار موجودی",
        body,
        type: "stock_admin",
        link: "/admin/products",
      });
    }
  } catch (e) {
    console.error("[notifyStockAlerts admin]", e);
  }

  return { notified: n };
}
