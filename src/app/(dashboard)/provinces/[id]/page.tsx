"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormCheckbox, AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useProvince, useUpdateProvince } from "@/features/provinces/api";
import { provinceSchema, type ProvinceFormData } from "@/features/provinces/schema";

/**
 * Edit Province page — UC-MAP-02.
 */
export default function EditProvincePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: province, isLoading } = useProvince(id);
  const updateMutation = useUpdateProvince(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProvinceFormData>({
    resolver: zodResolver(provinceSchema),
    defaultValues: { name: "", code: "", hasProject: false, centerCount: 0 },
  });

  useEffect(() => {
    if (province) {
      reset({
        name: province.name,
        code: province.code,
        hasProject: province.hasProject,
        centerCount: province.centerCount,
      });
    }
  }, [province, reset]);

  const onSubmit = (data: ProvinceFormData) => {
    // Only send editable fields (name/code are not editable in API, but we keep for display)
    updateMutation.mutate(
      { hasProject: data.hasProject, centerCount: data.centerCount },
      {
        onSuccess: () => {
          toast({ title: "Cập nhật thành công", color: "success" });
          router.push("/provinces");
        },
        onError: (error) => {
          toast({ title: "Cập nhật thất bại", description: error.message, color: "danger" });
        },
      },
    );
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
          <h1 className="text-xl font-bold text-text">Sửa tỉnh thành</h1>
          <p className="text-sm text-text-muted">Cập nhật thông tin tỉnh {province?.name}.</p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>← Quay lại</AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">Thông tin tỉnh thành</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="Tên tỉnh" disabled {...register("name")} />
              <FormInput label="Mã tỉnh" disabled {...register("code")} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Số trung tâm"
                type="number"
                errorMessage={errors.centerCount?.message}
                {...register("centerCount", { valueAsNumber: true })}
              />
              <div className="flex items-end pb-1">
                <FormCheckbox
                  label="Có dự án"
                  {...register("hasProject")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-end gap-3">
          {isDirty && <p className="text-xs text-warning">Có thay đổi chưa lưu</p>}
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton type="submit" isLoading={updateMutation.isPending} disabled={!isDirty}>Lưu thay đổi</AppButton>
        </div>
      </form>
    </div>
  );
}
