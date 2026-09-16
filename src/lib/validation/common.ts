import { z } from "zod";
import { normalizePhone, isValidIranianPhone } from "@/lib/numbers";

export const phoneSchema = z
  .string()
  .min(1, "شماره موبایل الزامی است")
  .transform(normalizePhone)
  .refine(isValidIranianPhone, "شماره موبایل معتبر نیست");

export const emailSchema = z.string().email("ایمیل معتبر نیست");

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(12),
});
