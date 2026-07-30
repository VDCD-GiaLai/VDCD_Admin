"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCurrentUser, useUpdateProfile } from "@/features/auth/api";
import { UpdateProfileSchema, type UpdateProfileFormData } from "@/features/auth/schema";
import { FormInput } from "@/components/ui/FormInput";
import { AppButton } from "@/components/ui/AppButton";

export function ProfileEditForm() {
  const { data: user } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: { username: "" },
  });

  // Populate form when user data is loaded
  useEffect(() => {
    if (user) {
      reset({ username: user.username });
    }
  }, [user, reset]);

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const isPending = updateProfileMutation.isPending;
  const isSuccess = updateProfileMutation.isSuccess;
  const error = updateProfileMutation.error;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-text">Sửa thông tin cá nhân</h3>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        
        {isSuccess && (
          <div className="mb-4 rounded-lg bg-success/10 px-4 py-3 text-sm font-medium text-success">
            Cập nhật thông tin thành công
          </div>
        )}
        
        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error.message || "Có lỗi xảy ra, vui lòng thử lại"}
          </div>
        )}

        <div className="mb-4">
          <FormInput
            label="Tên hiển thị"
            id="profile-username"
            placeholder="Nhập tên hiển thị"
            errorMessage={errors.username?.message}
            {...register("username")}
          />
        </div>

        <AppButton
          type="submit"
          isLoading={isPending}
          disabled={isPending}
        >
          Lưu thay đổi
        </AppButton>
      </form>
    </div>
  );
}
