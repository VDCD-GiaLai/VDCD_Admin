import { z } from "zod";
import type { ListItem } from "./document.types";

// ─── Spacing Schema ──────────────────────────────────────────

export const blockSpacingSchema = z
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

export const listItemSchema: z.ZodType<ListItem, ListItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    content: z.string().min(1, "Mục không được để trống"),
    children: z.array(listItemSchema),
    checked: z.boolean().optional(),
  }),
);

export const listTypeSchema = z.enum(["bullet", "ordered", "checklist"]);
export const listStyleSchema = z.enum([
  "disc",
  "circle",
  "square",
  "decimal",
  "lower-alpha",
  "upper-alpha",
  "lower-roman",
  "upper-roman",
  "checklist",
]);

export const listFontWeightSchema = z.enum(["normal", "medium", "semibold", "bold"]);

export const listLevelStyleSchema = z.object({
  marker: listStyleSchema.optional(),
  fontSize: z.number().min(10).max(96).optional(),
  fontWeight: listFontWeightSchema.optional(),
  color: z.string().optional(),
  itemSpacing: z.number().min(0).max(48).optional(),
});

export const listStyleConfigSchema = z.object({
  marker: listStyleSchema.optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().min(10).max(96).optional(),
  fontWeight: listFontWeightSchema.optional(),
  color: z.string().optional(),
  lineHeight: z.number().min(1.0).max(3.0).optional(),
  itemSpacing: z.number().min(0).max(48).optional(),
  indentation: z.number().min(8).max(64).optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().min(0).max(10).optional(),
  borderRadius: z.number().min(0).max(32).optional(),
  padding: z.number().min(0).max(48).optional(),
  levelStyles: z.record(z.coerce.number(), listLevelStyleSchema).optional(),
});

export const listBlockSchema = z.object({
  id: z.string(),
  type: z.literal("list"),
  items: z
    .array(listItemSchema)
    .min(1, "Danh sách phải có ít nhất 1 mục"),
  listType: listTypeSchema.optional(),
  listStyle: listStyleSchema.optional(),
  fontSize: z.number().min(10).max(96).optional(),
  lineHeight: z.number().min(1.0).max(3.0).optional(),
  itemSpacing: z.number().min(0).max(48).optional(),
  style: listStyleConfigSchema.optional(),
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

export const ctaAlignSchema = z.enum(["center", "between", "start", "end"]);
export const ctaShapeSchema = z.enum(["square", "pill"]);
export const ctaVariantSchema = z.enum(["solid", "outline"]);
export const ctaLayoutSchema = z.enum(["flex", "between"]);

export const ctaButtonItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Nhãn nút không được để trống"),
  url: z.string().min(1, "Đường dẫn liên kết không được để trống"),
  variant: ctaVariantSchema.optional(),
});

export const ctaBlockSchema = z.object({
  id: z.string(),
  type: z.literal("cta"),
  label: z.string().optional(),
  url: z.string().optional(),
  secondaryLabel: z.string().optional(),
  secondaryUrl: z.string().optional(),
  items: z.array(ctaButtonItemSchema).optional(),
  layout: ctaLayoutSchema.optional(),
  align: ctaAlignSchema.optional(),
  gap: z.number().min(0).max(64).optional(),
  shape: ctaShapeSchema.optional(),
  variant: ctaVariantSchema.optional(),
  fontSize: z.number().min(10).max(96).optional(),
  spacing: blockSpacingSchema,
});

export const quoteBlockSchema = z.object({
  id: z.string(),
  type: z.literal("quote"),
  text: z.string().min(1, "Nội dung trích dẫn không được để trống"),
  author: z.string().nullable().optional(),
  citation: z.string().nullable().optional(),
  fontSize: z.number().min(10).max(96).optional(),
  spacing: blockSpacingSchema,
});

export const highlightBlockSchema = z.object({
  id: z.string(),
  type: z.literal("highlight"),
  text: z.string().min(1, "Nội dung điểm nhấn không được để trống"),
  style: z.string().optional(),
  fontSize: z.number().min(10).max(96).optional(),
  spacing: blockSpacingSchema,
});

export const orderedListBlockSchema = listBlockSchema.extend({
  type: z.literal("ordered_list"),
});

export const contentBlockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  paragraphBlockSchema,
  imageBlockSchema,
  listBlockSchema,
  orderedListBlockSchema,
  sectionBlockSchema,
  ctaBlockSchema,
  quoteBlockSchema,
  highlightBlockSchema,
]);

export const heroMetaSchema = z
  .object({
    placement: z.enum(["above_title", "between_title_desc", "below_desc"]).optional(),
    position: z.enum(["top", "center", "bottom"]).optional(),
    caption: z.string().optional(),
  })
  .optional();

export const documentContentSchema = z.object({
  version: z.number(),
  blocks: z.array(contentBlockSchema),
  heroMeta: heroMetaSchema,
});
