import { z } from "zod";

/**
 * Organization form validation schema.
 * All fields optional except `name` since it's a single-record update (PUT/PATCH).
 */
export const organizationSchema = z.object({
  // ── Khối 1: Giới thiệu chung ──
  name: z
    .string()
    .min(1, "Tên tổ chức không được để trống")
    .max(255, "Tên tổ chức tối đa 255 ký tự"),

  shortName: z
    .string()
    .max(100, "Tên viết tắt tối đa 100 ký tự")
    .nullable()
    .optional(),

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

  email: z.string().nullable().optional(),
  hotline: z.string().nullable().optional(),

  // ── Khối 2: Hình ảnh & Sự kiện giới thiệu (Bento Intro) ──
  announcement: z
    .object({
      text: z.string().optional(),
      link: z.string().optional(),
      isActive: z.boolean().optional(),
      imageUrl: z.string().nullable().optional(),
      imageFileId: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),

  // ── Khối 3: Thông điệp Lãnh đạo ──
  leader: z
    .object({
      name: z.string().optional(),
      role: z.string().optional(),
      quote: z.string().optional(),
      avatarUrl: z.string().optional(),
      avatarFileId: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
    })
    .nullable()
    .optional(),

  // ── Khối 4: Sứ mệnh, Tầm nhìn, Giá trị cốt lõi ──
  mission: z.string().nullable().optional(),
  vision: z.string().nullable().optional(),
  coreValues: z.string().nullable().optional(),

  coreValuesList: z
    .array(
      z.object({
        title: z.string().min(1, "Tiêu đề giá trị cốt lõi không được để trống"),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .nullable()
    .optional(),

  // ── Khối 5: Mạng lưới & Quy mô (Thống kê) ──
  stats: z
    .object({
      staff: z.number().int().min(0).optional(),
      experts: z.number().int().min(0).optional(),
      provinces: z.number().int().min(0).optional(),
      projects: z.number().int().min(0).optional(),
    })
    .nullable()
    .optional(),

  statsList: z
    .array(
      z.object({
        key: z.string().optional(),
        value: z.string().min(1, "Giá trị số liệu không được để trống"),
        label: z.string().min(1, "Nhãn thống kê không được để trống"),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .nullable()
    .optional(),

  // ── Khối 6: Năng lực kế thừa & Hệ sinh thái VDCD ──
  ecosystemCapabilities: z.string().nullable().optional(),

  ecosystemMembersArray: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1, "Tên đơn vị thành viên không được để trống"),
        slug: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        order: z.number().optional(),
      })
    )
    .optional(),

  // ── Khối 7: Định hướng phát triển & Lĩnh vực hoạt động ──
  developmentOrientationsArray: z
    .array(
      z.object({
        title: z.string().min(1, "Tiêu đề không được để trống"),
        description: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().optional(),
      })
    )
    .optional(),

  operationFieldsArray: z
    .array(
      z.object({
        title: z.string().min(1, "Tên lĩnh vực không được để trống"),
        description: z.string().optional(),
        icon: z.string().optional(),
        imageUrl: z.string().optional(),
        order: z.number().optional(),
      })
    )
    .optional(),

  // ── Khối 8: Khối Kêu gọi hành động (CTA) ──
  ctaSection: z
    .object({
      badge: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      buttonText: z.string().optional(),
      buttonLink: z.string().optional(),
      secondaryButtonText: z.string().optional(),
      secondaryButtonLink: z.string().optional(),
      subtext: z.string().optional(),
    })
    .nullable()
    .optional(),

  // ── Khối 9: Social Links ──
  socialLinksArray: z
    .array(
      z.object({
        platform: z
          .string()
          .min(1, "Vui lòng nhập phương thức (VD: Zalo, Hotline...)"),
        url: z
          .string()
          .min(1, "Vui lòng nhập thông tin liên hệ (SĐT, Link...)"),
      })
    )
    .optional(),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;
