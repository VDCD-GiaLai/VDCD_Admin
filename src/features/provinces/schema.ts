import { z } from "zod";

/**
 * Province form validation schema.
 * Used for both create and edit forms.
 */
export const provinceSchema = z.object({
  name: z
    .string()
    .min(1, "Tên tỉnh thành không được để trống")
    .max(100, "Tên tỉnh thành tối đa 100 ký tự"),

  code: z
    .string()
    .min(1, "Mã tỉnh không được để trống")
    .max(10, "Mã tỉnh tối đa 10 ký tự"),

  hasProject: z.boolean().optional(),

  centerCount: z
    .number()
    .int("Số trung tâm phải là số nguyên")
    .min(0, "Số trung tâm không được âm")
    .optional(),
});

export type ProvinceFormData = z.infer<typeof provinceSchema>;
