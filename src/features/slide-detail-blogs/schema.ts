import { z } from "zod";

// ─── Spacing Schema ──────────────────────────────────────────

const blockSpacingSchema = z
  .object({
    marginTop: z.number().min(0).optional(),
    marginBottom: z.number().min(0).optional(),
  })
  .optional();

// ─── Block Schemas ───────────────────────────────────────────

export const headingBlockSchema = z.object({
  id: z.string(),
  type: z.literal("heading"),
  level: z.union(
    [z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)],
    { error: "Cấp độ tiêu đề phải là H1–H6" },
  ),
  text: z.string().min(1, "Tiêu đề mục không được để trống"),
  fontSize: z.number().min(10).max(96).optional(),
  spacing: blockSpacingSchema,
});

export const paragraphBlockSchema = z.object({
  id: z.string(),
  type: z.literal("paragraph"),
  text: z.string().min(1, "Nội dung đoạn văn không được để trống"),
  fontSize: z.number().min(10).max(96).optional(),
  spacing: blockSpacingSchema,
});

export const imageBlockSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  url: z.string().min(1, "Đường dẫn ảnh không được để trống"),
  fileId: z.string().nullable().optional(),
  alt: z.string().optional(),
  caption: z.string().nullable().optional(),
  spacing: blockSpacingSchema,
});

export const listBlockSchema = z.object({
  id: z.string(),
  type: z.literal("list"),
  items: z
    .array(z.string().min(1, "Mục không được để trống"))
    .min(1, "Danh sách phải có ít nhất 1 mục"),
  fontSize: z.number().min(10).max(96).optional(),
  spacing: blockSpacingSchema,
});

export const sectionChildBlockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  paragraphBlockSchema,
  imageBlockSchema,
  listBlockSchema,
]);

export const sectionBlockSchema = z.object({
  id: z.string(),
  type: z.literal("section"),
  number: z.string().min(1, "Số thứ tự không được để trống"),
  title: z.string().min(1, "Tiêu đề nhóm không được để trống"),
  children: z.array(sectionChildBlockSchema),
  spacing: blockSpacingSchema,
});

export const ctaBlockSchema = z.object({
  id: z.string(),
  type: z.literal("cta"),
  label: z.string().min(1, "Nhãn nút không được để trống"),
  url: z.string().min(1, "Đường dẫn liên kết không được để trống"),
  fontSize: z.number().min(10).max(96).optional(),
  spacing: blockSpacingSchema,
});

export const slideDetailBlogBlockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  paragraphBlockSchema,
  imageBlockSchema,
  listBlockSchema,
  sectionBlockSchema,
  ctaBlockSchema,
]);

export const heroMetaSchema = z
  .object({
    placement: z.enum(["above_title", "between_title_desc", "below_desc"]).optional(),
    position: z.enum(["top", "center", "bottom"]).optional(),
    caption: z.string().optional(),
  })
  .optional();

export const slideDetailBlogContentSchema = z.object({
  version: z.number(),
  blocks: z.array(slideDetailBlogBlockSchema),
  heroMeta: heroMetaSchema,
});

// ─── Main Form Schema ────────────────────────────────────────

export const slideDetailBlogSchema = z.object({
  slideId: z.string().min(1, "Vui lòng chọn slide liên kết"),
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  subtitle: z.string().nullable().optional(),
  slug: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  heroImageUrl: z.string().nullable().optional(),
  heroImageFileId: z.string().nullable().optional(),
  seoTitle: z
    .string()
    .max(255, "SEO Title tối đa 255 ký tự")
    .nullable()
    .optional(),
  metaDescription: z
    .string()
    .max(500, "Meta Description tối đa 500 ký tự")
    .nullable()
    .optional(),
  content: slideDetailBlogContentSchema,
  isPublished: z.boolean(),
});

export type SlideDetailBlogFormData = z.infer<typeof slideDetailBlogSchema>;
