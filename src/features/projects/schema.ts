import { z } from "zod";

/**
 * Technical highlight — key-value pair for project stats.
 */
const technicalHighlightSchema = z.object({
  label: z.string().min(1, "Tên thông số không được trống"),
  value: z.string().min(1, "Giá trị không được trống"),
});

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

  // ── Detail fields ──────────────────────────────────────
  challenge: z.string().optional(),
  challengeImage: z.string().optional(),
  challengeImageFileId: z.string().nullable().optional(),
  services: z.array(z.string()).optional(),
  discipline: z.string().optional(),
  transformationBefore: z.string().optional(),
  transformationBeforeFileId: z.string().nullable().optional(),
  transformationAfter: z.string().optional(),
  transformationAfterFileId: z.string().nullable().optional(),
  technicalHighlights: z.array(technicalHighlightSchema).optional(),
  nextProjectSlug: z.string().optional(),

  // ── SEO & Publishing ───────────────────────────────────
  metaTitle: z.string().max(60, "Meta title tối đa 60 ký tự").optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description tối đa 160 ký tự")
    .optional(),
  isPublished: z.boolean().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
