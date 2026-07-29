"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import {
  useOperationField,
  useUpdateOperationField,
} from "@/features/operation-fields/api";
import {
  operationFieldSchema,
  type OperationFieldFormData,
} from "@/features/operation-fields/schema";

/**
 * Edit Operation Field page — UC-FLD-03.
 */
export default function EditOperationFieldPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: field, isLoading } = useOperationField(id);
  const updateMutation = useUpdateOperationField(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OperationFieldFormData>({
    resolver: zodResolver(operationFieldSchema),
    defaultValues: {
      name: "",
      slug: "",
      icon: "",
      shortDescription: "",
      order: 0,
    },
  });

  useEffect(() => {
    if (field) {
      reset({
        name: field.name,
        slug: field.slug,
        icon: field.icon ?? "",
        shortDescription: field.shortDescription ?? "",
        order: field.order,
      });
    }
  }, [field, reset]);

  const onSubmit = (data: OperationFieldFormData) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Cập nhật thành công",
          description: "Lĩnh vực đã được cập nhật.",
          color: "success",
        });
        router.push("/operation-fields");
      },
      onError: (error) => {
        toast({
          title: "Cập nhật thất bại",
          description: error.message,
          color: "danger",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Sửa lĩnh vực</h1>
          <p className="text-sm text-text-muted">
            Chỉnh sửa thông tin lĩnh vực hoạt động.
          </p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>
          ← Quay lại
        </AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Thông tin lĩnh vực
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Tên lĩnh vực"
                isRequired
                errorMessage={errors.name?.message}
                {...register("name")}
              />
              <FormInput
                label="Slug"
                helperText="URL-friendly slug"
                errorMessage={errors.slug?.message}
                {...register("slug")}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Icon"
                placeholder="VD: mdi:solar-power"
                errorMessage={errors.icon?.message}
                {...register("icon")}
              />
              <FormInput
                label="Thứ tự hiển thị"
                type="number"
                errorMessage={errors.order?.message}
                {...register("order", { valueAsNumber: true })}
              />
            </div>
            <FormTextarea
              label="Mô tả ngắn"
              rows={3}
              errorMessage={errors.shortDescription?.message}
              {...register("shortDescription")}
            />
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-end gap-3">
          {isDirty && (
            <p className="text-xs text-warning">Có thay đổi chưa lưu</p>
          )}
          <AppButton
            variant="ghost"
            type="button"
            onClick={() => router.back()}
          >
            Huỷ
          </AppButton>
          <AppButton
            type="submit"
            isLoading={updateMutation.isPending}
            disabled={!isDirty}
          >
            Lưu thay đổi
          </AppButton>
        </div>
      </form>
    </div>
  );
}
