import { z } from "zod";

/**
 * Partner form validation schema.
 * Used for both create and edit forms.
 */
export const partnerSchema = z.object({
  name: z
    .string()
    .min(1, "Tên đối tác không được để trống")
    .max(255, "Tên đối tác tối đa 255 ký tự"),

  logo: z
    .string()
    .url("URL logo không hợp lệ")
    .or(z.literal(""))
    .optional(),

  logoFileId: z.string().nullable().optional(),

  websiteUrl: z
    .string()
    .url("URL website không hợp lệ")
    .or(z.literal(""))
    .nullable()
    .optional(),

  order: z.number().int().min(0).optional(),

  isActive: z.boolean().optional(),
});

export type PartnerFormData = z.infer<typeof partnerSchema>;
