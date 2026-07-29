import { z } from "zod";

/**
 * Program form validation schema.
 * Used for both create and edit forms.
 */
export const programSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  content: z.string().optional(),
  thumbnail: z.string().optional(),
  thumbnailFileId: z.string().nullable().optional(),
  fieldId: z.string().nullable().optional(),
  metaTitle: z
    .string()
    .max(60, "Meta title tối đa 60 ký tự")
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description tối đa 160 ký tự")
    .optional(),
  isPublished: z.boolean().optional(),
});

export type ProgramFormData = z.infer<typeof programSchema>;
