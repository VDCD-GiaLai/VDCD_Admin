import { z } from "zod";

/**
 * Article form validation schema.
 */
export const articleSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  slug: z.string().optional(),
  content: z.string().optional(),
  thumbnail: z.string().optional(),
  thumbnailFileId: z.string().nullable().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  projectId: z.string().nullable().optional(),
  programId: z.string().nullable().optional(),
  solutionId: z.string().nullable().optional(),
  metaTitle: z.string().max(60, "Meta title tối đa 60 ký tự").optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description tối đa 160 ký tự")
    .optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().nullable().optional(),
});

export type ArticleFormData = z.infer<typeof articleSchema>;
