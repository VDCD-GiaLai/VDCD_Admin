import { z } from "zod";

/**
 * Slide form validation schema.
 * Used for both create and edit forms.
 */
export const slideSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),

  subtitle: z.string().nullable().optional().or(z.literal("")),

  description: z.string().nullable().optional().or(z.literal("")),

  ctaText: z
    .string()
    .max(100, "Nút CTA tối đa 100 ký tự")
    .nullable()
    .optional()
    .or(z.literal("")),

  ctaUrl: z
    .string()
    .url("URL CTA không hợp lệ")
    .or(z.literal(""))
    .nullable()
    .optional(),

  imageUrl: z
    .string()
    .min(1, "Ảnh slide không được để trống")
    .url("URL ảnh không hợp lệ"),

  imageFileId: z.string().nullable().optional(),

  order: z.number().int().min(0).optional(),

  isActive: z.boolean().optional(),
});

export type SlideFormData = z.infer<typeof slideSchema>;
