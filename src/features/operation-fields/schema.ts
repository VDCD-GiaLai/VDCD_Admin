import { z } from "zod";

/**
 * Operation Field form validation schema.
 * Used for both create and edit forms.
 */
export const operationFieldSchema = z.object({
  name: z
    .string()
    .min(1, "Tên lĩnh vực không được để trống")
    .max(100, "Tên lĩnh vực tối đa 100 ký tự"),

  slug: z
    .string()
    .max(100, "Slug tối đa 100 ký tự")
    .optional()
    .or(z.literal("")),

  icon: z
    .string()
    .max(100, "Icon tối đa 100 ký tự")
    .nullable()
    .optional()
    .or(z.literal("")),

  shortDescription: z.string().nullable().optional().or(z.literal("")),

  order: z.number().int("Thứ tự phải là số nguyên").min(0).optional(),
});

export type OperationFieldFormData = z.infer<typeof operationFieldSchema>;
