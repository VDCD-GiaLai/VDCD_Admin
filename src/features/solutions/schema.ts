import { z } from "zod";
import { documentContentSchema, type DocumentContent } from "@/shared/content-editor";

/**
 * Solution form validation schema.
 * Used for both create and edit forms.
 * Accepts either serialized JSON string or structured DocumentContent object.
 */
export const solutionSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  content: z.union([z.string(), documentContentSchema]).optional(),
  thumbnail: z.string().optional(),
  thumbnailFileId: z.string().nullable().optional(),
  fieldId: z.string().nullable().optional(),
  websiteUrl: z
    .string()
    .url("Đường dẫn website không hợp lệ")
    .optional()
    .or(z.literal(""))
    .nullable(),
  metaTitle: z
    .string()
    .max(60, "Meta title tối đa 60 ký tự")
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description tối đa 160 ký tự")
    .optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.date().nullable().optional(),
  tempFolderKey: z.string().optional(),
});

export type SolutionFormData = z.infer<typeof solutionSchema>;
export type SolutionFormContent = string | DocumentContent | undefined;
