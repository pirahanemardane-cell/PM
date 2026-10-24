/**
 * قوانین دسترسی سطح اپ (ضد IDOR) — مکمل RLS دیتابیس
 * استاندارد: کاربر فقط منبع خودش؛ ادمین جدا؛ مهمان فقط با session_id سفارش مهمان
 */

export type AccessActor = {
  userId: string | null;
  role?: string | null;
  sessionId?: string | null;
};

export function isAdminRole(role?: string | null): boolean {
  return String(role || "").toLowerCase() === "admin";
}

/** سفارش: مالک user_id یا (مهمان) session_id */
export function canAccessOrder(
  actor: AccessActor,
  order: { user_id?: string | null; session_id?: string | null },
): boolean {
  if (isAdminRole(actor.role)) return true;
  if (actor.userId && order.user_id && actor.userId === order.user_id) return true;
  if (
    !order.user_id &&
    actor.sessionId &&
    order.session_id &&
    actor.sessionId === order.session_id
  ) {
    return true;
  }
  return false;
}

/** آدرس / پروفایل / مرجوعی وابسته به user_id */
export function canAccessUserOwned(
  actor: AccessActor,
  ownerUserId: string | null | undefined,
): boolean {
  if (isAdminRole(actor.role)) return true;
  if (!actor.userId || !ownerUserId) return false;
  return actor.userId === ownerUserId;
}

/** جلوگیری از حدس id: اگر منبع نیست → همان پاسخ «یافت نشد» (نه 403 با نشت وجود) */
export function idorDenyAsNotFound(): { ok: false; error: "not_found" } {
  return { ok: false, error: "not_found" };
}
