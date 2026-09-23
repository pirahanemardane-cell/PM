export const PREDEFINED_NOTIFICATIONS = [
  {
    id: "welcome",
    title: "خوش آمدید",
    body: "به فروشگاه پیراهن مردانه خوش آمدید. از خریدتان سپاسگزاریم.",
    type: "system",
  },
  {
    id: "order_shipped",
    title: "سفارش ارسال شد",
    body: "سفارش شما ارسال شده و به‌زودی به دستتان می‌رسد.",
    type: "order",
  },
  {
    id: "order_delivered",
    title: "سفارش تحویل شد",
    body: "سفارش شما با موفقیت تحویل داده شد. نظرتان برایمان مهم است.",
    type: "order",
  },
  {
    id: "promo",
    title: "پیشنهاد ویژه",
    body: "تخفیف محدود روی محصولات منتخب — همین حالا در فروشگاه ببینید.",
    type: "promo",
  },
  {
    id: "support_reply",
    title: "پاسخ پشتیبانی",
    body: "به تیکت شما پاسخ داده شد. از پنل مشتری بخش پشتیبانی را باز کنید.",
    type: "support",
  },
] as const;
