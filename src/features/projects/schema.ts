import { z } from "zod";
import { documentContentSchema } from "@/shared/content-editor";

/**
 * Technical highlight — key-value pair for project stats.
 * Allows empty string during drafting; clean pairs are filtered during submit.
 */
const technicalHighlightSchema = z.object({
  label: z.string(),
  value: z.string(),
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
  tempFolderKey: z.string().optional(),
  content: documentContentSchema.optional(),
  overview: z.string().optional(),
  thumbnail: z.string().optional(),
  thumbnailFileId: z.string().nullable().optional(),
  fieldId: z.string().nullable().optional(),
  provinceId: z.string().nullable().optional(),
  year: z
    .union([
      z.number().min(1990, "Năm không hợp lệ (1990 - 2100)").max(2100, "Năm không hợp lệ (1990 - 2100)"),
      z.nan().transform(() => null),
      z.literal(0).transform(() => null),
      z.null(),
    ])
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
  metaTitle: z.string().max(255, "Meta title tối đa 255 ký tự").optional(),
  metaDescription: z
    .string()
    .max(255, "Meta description tối đa 255 ký tự")
    .optional(),
  isPublished: z.boolean().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
