import { z } from "zod";

/**
 * Organization form validation schema.
 * All fields optional since it's a single-record update (PUT).
 */
export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, "Tên tổ chức không được để trống")
    .max(255, "Tên tổ chức tối đa 255 ký tự"),

  tagline: z
    .string()
    .max(255, "Khẩu hiệu tối đa 255 ký tự")
    .nullable()
    .optional(),

  description: z.string().nullable().optional(),

  mission: z.string().nullable().optional(),

  vision: z.string().nullable().optional(),

  coreValues: z.string().nullable().optional(),

  foundedYear: z
    .number()
    .int("Năm phải là số nguyên")
    .min(1900, "Năm không hợp lệ")
    .max(new Date().getFullYear(), "Năm không được vượt quá năm hiện tại")
    .nullable()
    .optional(),

  stats: z
    .object({
      provinces: z.number().int().min(0).optional(),
      centers: z.number().int().min(0).optional(),
      projects: z.number().int().min(0).optional(),
      staff: z.number().int().min(0).optional(),
    })
    .nullable()
    .optional(),

  socialLinks: z
    .object({
      facebook: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
      zalo: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
      youtube: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
    })
    .nullable()
    .optional(),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;
