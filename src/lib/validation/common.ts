import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست");

export const emailSchema = z.string().email("ایمیل معتبر نیست");

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(12),
});
