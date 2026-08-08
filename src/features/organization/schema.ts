import { z } from "zod";

/**
 * Organization form validation schema.
 * All fields optional since it's a single-record update (PUT).
 */
export const organizationSchema = z.object({
  // ── Khối 1: Giới thiệu chung ──
  name: z
    .string()
    .min(1, "Tên tổ chức không được để trống")
    .max(255, "Tên tổ chức tối đa 255 ký tự"),

  tagline: z
    .string()
    .max(255, "Khẩu hiệu tối đa 255 ký tự")
    .nullable()
    .optional(),

  businessLicenseNo: z
    .string()
    .max(50, "Mã ĐKKD tối đa 50 ký tự")
    .nullable()
    .optional(),

  description: z.string().nullable().optional(),

  foundedYear: z
    .number()
    .int("Năm phải là số nguyên")
    .min(1900, "Năm không hợp lệ")
    .max(new Date().getFullYear(), "Năm không được vượt quá năm hiện tại")
    .nullable()
    .optional(),

  address: z.string().nullable().optional(),

  // ── Khối 2: Sứ mệnh, Tầm nhìn, Giá trị cốt lõi ──
  mission: z.string().nullable().optional(),
  vision: z.string().nullable().optional(),
  coreValues: z.string().nullable().optional(),

  // ── Khối 3: Mạng lưới (Thống kê) ──
  stats: z
    .object({
      staff: z.number().int().min(0).optional(),
      experts: z.number().int().min(0).optional(),
      provinces: z.number().int().min(0).optional(),
      projects: z.number().int().min(0).optional(),
    })
    .nullable()
    .optional(),

  // ── Khối 4: Lĩnh vực hoạt động ──
  operationFieldsArray: z
    .array(
      z.object({
        title: z.string().min(1, "Tiêu đề không được để trống"),
        description: z.string().default(""),
      })
    )
    .optional(),

  // ── Khối 5: Năng lực kế thừa từ VDCD ──
  ecosystemCapabilities: z.string().nullable().optional(),

  // ── Khối 6: Định hướng phát triển ──
  developmentOrientationsArray: z
    .array(
      z.object({
        title: z.string().min(1, "Tiêu đề không được để trống"),
        description: z.string().default(""),
      })
    )
    .optional(),

  // ── Social Links ──
  socialLinksArray: z
    .array(
      z.object({
        platform: z.string().min(1, "Vui lòng nhập phương thức (VD: Zalo, Hotline...)"),
        url: z.string().min(1, "Vui lòng nhập thông tin liên hệ (SĐT, Link...)"),
      })
    )
    .optional(),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;
