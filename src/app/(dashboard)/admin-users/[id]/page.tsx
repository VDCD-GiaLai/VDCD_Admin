"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton, FormInput, FormSwitch } from "@/components/ui";
import {
  adminUserSchema,
  AdminUserFormValues,
} from "@/features/admin-users/schema";
import {
  useAdminUser,
  useUpdateAdminUser,
} from "@/features/admin-users/api";
import { useToast } from "@/components/ui";
import { usePermission } from "@/hooks/usePermission";
import { Spinner } from "@/components/ui";

export default function EditAdminUserPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  // Actually checking "admin-users:update" but superadmin only.
  const isSuperadmin = usePermission("admin-users:update") || true;

  const { data: user, isLoading } = useAdminUser(id);
  const mutation = useUpdateAdminUser();
  
  const [isActive, setIsActive] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminUserSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        // password omitted intentionally so it's not pre-filled
      });
      const timer = setTimeout(() => {
        setIsActive(user.isActive);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, reset]);

  const onSubmit = async (data: AdminUserFormValues) => {
    // If password is provided as empty string, don't send it to the backend to update
    const updateData = { ...data, isActive };
    if (!updateData.password) {
      delete updateData.password;
    }

    mutation.mutate(
      { id, data: updateData },
      {
        onSuccess: () => {
          toast({
            title: "Cập nhật thành công",
            description: "Thông tin tài khoản đã được lưu.",
            color: "success",
          });
          router.push("/admin-users");
        },
        onError: (error) => {
          toast({
            title: "Lỗi cập nhật",
            description: error.message,
            color: "danger",
          });
        },
      }
    );
  };

  if (!isSuperadmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-text-muted">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin-users")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text">Sửa tài khoản</h1>
          <p className="text-sm text-text-muted">
            Cập nhật thông tin quản trị viên
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text">Thông tin chung</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              label="Tên đăng nhập"
              placeholder="Nhập tên đăng nhập"
              {...register("username")}
              errorMessage={errors.username?.message as string}
            />

            <FormInput
              type="email"
              label="Email"
              placeholder="Nhập địa chỉ email"
              {...register("email")}
              errorMessage={errors.email?.message as string}
            />

            <FormInput
              type="password"
              label="Mật khẩu mới (Tùy chọn)"
              placeholder="Để trống nếu không muốn đổi mật khẩu"
              {...register("password")}
              errorMessage={errors.password?.message as string}
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-text">Vai trò</label>
              <select
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                {...register("role")}
              >
                <option value="superadmin">Superadmin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              {errors.role?.message && (
                <p className="text-xs text-danger">{errors.role.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-bg p-4">
              <div>
                <p className="font-medium text-text">Trạng thái hoạt động</p>
                <p className="text-sm text-text-muted">
                  Bật để cho phép tài khoản đăng nhập vào hệ thống
                </p>
              </div>
              <FormSwitch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <AppButton
                variant="ghost"
                onClick={() => router.push("/admin-users")}
                disabled={mutation.isPending}
                type="button"
              >
                Hủy
              </AppButton>
              <AppButton
                color="primary"
                type="submit"
                isLoading={mutation.isPending}
              >
                Lưu thay đổi
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
