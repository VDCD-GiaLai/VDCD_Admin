"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChangePassword, useLogout } from "@/features/auth/api";
import { ChangePasswordSchema, type ChangePasswordFormData } from "@/features/auth/schema";
import { FormInput } from "@/components/ui/FormInput";
import { AppButton } from "@/components/ui/AppButton";

export function ChangePasswordForm() {
  const changePasswordMutation = useChangePassword();
  const logoutMutation = useLogout();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        reset();
        // Option to force logout here after password change
        logoutMutation.mutate();
      },
    });
  };

  const isPending = changePasswordMutation.isPending;
  const error = changePasswordMutation.error;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="mb-1 text-lg font-bold text-text">Đổi mật khẩu</h3>
      <p className="mb-4 text-sm text-text-muted">
        Sau khi đổi mật khẩu thành công, bạn sẽ được yêu cầu đăng nhập lại.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error.message || "Mật khẩu cũ không đúng hoặc có lỗi xảy ra"}
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          <FormInput
            type="password"
            label="Mật khẩu cũ"
            id="oldPassword"
            placeholder="Nhập mật khẩu hiện tại"
            errorMessage={errors.oldPassword?.message}
            {...register("oldPassword")}
          />

          <FormInput
            type="password"
            label="Mật khẩu mới"
            id="newPassword"
            placeholder="Mật khẩu ít nhất 6 ký tự"
            errorMessage={errors.newPassword?.message}
            {...register("newPassword")}
          />

          <FormInput
            type="password"
            label="Xác nhận mật khẩu mới"
            id="confirmPassword"
            placeholder="Nhập lại mật khẩu mới"
            errorMessage={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <AppButton
          type="submit"
          isLoading={isPending}
          disabled={isPending}
          variant="solid"
          color="danger"
        >
          Đổi mật khẩu
        </AppButton>
      </form>
    </div>
  );
}
