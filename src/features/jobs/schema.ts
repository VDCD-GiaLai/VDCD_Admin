import { z } from "zod";

/**
 * Job form validation schema.
 * Used for both create and edit forms.
 */
export const jobSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  slug: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["full-time", "part-time", "intern"], {
    message: "Vui lòng chọn loại hình công việc hợp lệ",
  }),
  salaryRange: z.string().optional(),
  deadline: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  isUrgent: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type JobFormData = z.infer<typeof jobSchema>;
