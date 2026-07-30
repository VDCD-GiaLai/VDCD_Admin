import { z } from "zod";

/**
 * Login form validation schema.
 * Shared between client-side form validation and type generation.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không đúng định dạng"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const UpdateProfileSchema = z.object({
  username: z.string().min(1, "Tên hiển thị không được để trống").max(50, "Tên quá dài"),
});
export type UpdateProfileFormData = z.infer<typeof UpdateProfileSchema>;

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu cũ"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});
export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;
