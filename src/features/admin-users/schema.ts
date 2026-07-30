import { z } from "zod";

export const adminUserSchema = z.object({
  username: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(100, "Tên đăng nhập tối đa 100 ký tự"),
  email: z
    .string()
    .email("Email không hợp lệ")
    .max(255, "Email tối đa 255 ký tự"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(100, "Mật khẩu tối đa 100 ký tự")
    .optional() // Optional for updates, required for creation
    .or(z.literal("")),
  role: z.enum(["superadmin", "editor", "viewer"] as const, {
    message: "Vui lòng chọn vai trò hợp lệ",
  }),
  isActive: z.boolean().default(true),
});

export type AdminUserFormValues = z.infer<typeof adminUserSchema>;
