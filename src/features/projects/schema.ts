import { z } from "zod";

/**
 * Project form validation schema.
 */
export const projectSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  slug: z.string().optional(),
  overview: z.string().optional(),
  thumbnail: z.string().optional(),
  thumbnailFileId: z.string().nullable().optional(),
  fieldId: z.string().nullable().optional(),
  provinceId: z.string().nullable().optional(),
  year: z
    .number({ message: "Năm phải là số" })
    .min(1990, "Năm không hợp lệ")
    .max(2100, "Năm không hợp lệ")
    .nullable()
    .optional(),
  metaTitle: z.string().max(60, "Meta title tối đa 60 ký tự").optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description tối đa 160 ký tự")
    .optional(),
  isPublished: z.boolean().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
