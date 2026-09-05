import { z } from "zod";
import { slideDetailBlogContentSchema } from "@/features/slide-detail-blogs/schema";

/**
 * Article form validation schema.
 */
export const articleSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  subtitle: z.string().nullable().optional(),
  slug: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  content: slideDetailBlogContentSchema,
  thumbnail: z.string().nullable().optional(),
  thumbnailFileId: z.string().nullable().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  projectId: z.string().nullable().optional(),
  programId: z.string().nullable().optional(),
  solutionId: z.string().nullable().optional(),
  metaTitle: z.string().max(255, "Meta title tối đa 255 ký tự").optional(),
  metaDescription: z
    .string()
    .max(500, "Meta description tối đa 500 ký tự")
    .optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().nullable().optional(),
});

export type ArticleFormData = z.infer<typeof articleSchema>;

