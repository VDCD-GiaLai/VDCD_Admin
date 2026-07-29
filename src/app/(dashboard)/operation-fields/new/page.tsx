"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useCreateOperationField } from "@/features/operation-fields/api";
import {
  operationFieldSchema,
  type OperationFieldFormData,
} from "@/features/operation-fields/schema";

/**
 * Create Operation Field page — UC-FLD-02.
 */
export default function NewOperationFieldPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateOperationField();

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  const onSubmit = (data: OperationFieldFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Tạo thành công",
          description: "Lĩnh vực mới đã được thêm.",
          color: "success",
        });
        router.push("/operation-fields");
      },
      onError: (error) => {
        toast({
          title: "Tạo thất bại",
          description: error.message,
          color: "danger",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Thêm lĩnh vực</h1>
          <p className="text-sm text-text-muted">
            Tạo lĩnh vực hoạt động mới.
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
                placeholder="VD: Nông nghiệp, Y tế..."
                errorMessage={errors.name?.message}
                {...register("name")}
              />
              <FormInput
                label="Slug"
                placeholder="Tự động nếu để trống"
                helperText="URL-friendly slug, VD: nong-nghiep"
                errorMessage={errors.slug?.message}
                {...register("slug")}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Icon"
                placeholder="VD: mdi:solar-power"
                helperText="Icon class name (Iconify)"
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
              placeholder="Mô tả ngắn về lĩnh vực..."
              errorMessage={errors.shortDescription?.message}
              {...register("shortDescription")}
            />
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <AppButton
            variant="ghost"
            type="button"
            onClick={() => router.back()}
          >
            Huỷ
          </AppButton>
          <AppButton type="submit" isLoading={createMutation.isPending}>
            Tạo lĩnh vực
          </AppButton>
        </div>
      </form>
    </div>
  );
}
