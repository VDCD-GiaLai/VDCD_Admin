import { z } from "zod";

const ctaButtonSchema = z.object({
  label: z.string().min(1, "Label không được để trống"),
  href: z.string().min(1, "Link không được để trống"),
  variant: z.string().optional(),
  ariaLabel: z.string().optional(),
  _type: z.enum(["cta", "slide"]).optional(),
  id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
  imageUrl: z.string().optional(),
  imageFileId: z.string().nullable().optional(),
});

export const pageBannerSlideSchema = z.object({
  id: z.string().min(1),
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  subtitle: z.string().nullable().optional().or(z.literal("")),
  tag: z
    .string()
    .max(100, "Tag tối đa 100 ký tự")
    .nullable()
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .min(1, "Ảnh banner không được để trống")
    .url("URL ảnh không hợp lệ"),
  imageFileId: z.string().nullable().optional().or(z.literal("")),
});

export type PageBannerSlideFormData = z.infer<typeof pageBannerSlideSchema>;

/**
 * Page Banner form validation schema.
 */
export const pageBannerSchema = z.object({
  pageKey: z
    .string()
    .min(1, "Vui lòng nhập mã trang")
    .max(50, "Mã trang tối đa 50 ký tự"),

  title: z.string().max(255, "Tiêu đề tối đa 255 ký tự").optional().or(z.literal("")),

  subtitle: z.string().nullable().optional().or(z.literal("")),

  tag: z.string().max(100, "Tag tối đa 100 ký tự").nullable().optional().or(z.literal("")),

  imageUrl: z.string().optional().or(z.literal("")),

  imageFileId: z.string().nullable().optional(),

  ctaButtons: z.array(ctaButtonSchema).nullable().optional(),

  slides: z
    .array(pageBannerSlideSchema)
    .min(1, "Cần ít nhất 1 slide banner"),

  isActive: z.boolean().optional(),
});

export type PageBannerFormData = z.infer<typeof pageBannerSchema>;
