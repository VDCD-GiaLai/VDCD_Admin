"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormCheckbox, AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useCreateProvince } from "@/features/provinces/api";
import { provinceSchema, type ProvinceFormData } from "@/features/provinces/schema";

/**
 * Create Province page — UC-MAP-01.
 */
export default function NewProvincePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateProvince();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProvinceFormData>({
    resolver: zodResolver(provinceSchema),
    defaultValues: {
      name: "",
      code: "",
      hasProject: false,
      centerCount: 0,
    },
  });

  const onSubmit = (data: ProvinceFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: "Tạo thành công", description: "Tỉnh mới đã được thêm.", color: "success" });
        router.push("/provinces");
      },
      onError: (error) => {
        toast({ title: "Tạo thất bại", description: error.message, color: "danger" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Thêm tỉnh thành</h1>
          <p className="text-sm text-text-muted">Tạo tỉnh/thành phố mới.</p>
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
              <FormInput
                label="Tên tỉnh / thành phố"
                isRequired
                placeholder="VD: Gia Lai"
                errorMessage={errors.name?.message}
                {...register("name")}
              />
              <FormInput
                label="Mã tỉnh"
                isRequired
                placeholder="VD: GL"
                helperText="Mã viết tắt dùng để map GeoJSON"
                errorMessage={errors.code?.message}
                {...register("code")}
              />
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

        <div className="mt-6 flex justify-end gap-3">
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton type="submit" isLoading={createMutation.isPending}>Tạo tỉnh</AppButton>
        </div>
      </form>
    </div>
  );
}
