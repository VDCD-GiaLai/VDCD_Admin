"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormCheckbox, AppButton, FormTextarea } from "@/components/ui";
import { useToast } from "@/components/ui";
import {
  pageBannerSchema,
  type PageBannerFormData,
} from "@/features/page-banners/schema";
import { uploadImage, validateImageFile, type UploadResult } from "@/lib/upload";
import type { PageBanner } from "@/types/page-banner";
import { useCreatePageBanner, useUpdatePageBanner } from "@/features/page-banners/api";

interface PageBannerFormProps {
  initialData?: PageBanner;
}

export function PageBannerForm({ initialData }: PageBannerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const isEditing = !!initialData;
  const createMutation = useCreatePageBanner();
  const updateMutation = useUpdatePageBanner();

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl ?? null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PageBannerFormData>({
    resolver: zodResolver(pageBannerSchema),
    defaultValues: initialData
      ? {
          pageKey: initialData.pageKey,
          title: initialData.title ?? "",
          subtitle: initialData.subtitle ?? "",
          tag: initialData.tag ?? "",
          imageUrl: initialData.imageUrl,
          imageFileId: initialData.imageFileId ?? "",
          ctaButtons: initialData.ctaButtons ?? [],
          isActive: initialData.isActive,
        }
      : {
          pageKey: "",
          title: "",
          subtitle: "",
          tag: "",
          imageUrl: "",
          imageFileId: "",
          ctaButtons: [],
          isActive: true,
        },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast({ title: "File không hợp lệ", description: validationError, color: "danger" });
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const result: UploadResult = await uploadImage(file, "image");
      setValue("imageUrl", result.url, { shouldValidate: true });
      setValue("imageFileId", result.fileId, { shouldValidate: true });
      toast({ title: "Upload thành công", color: "success" });
    } catch {
      toast({ title: "Upload thất bại", description: "Vui lòng thử lại", color: "danger" });
      if (!initialData?.imageUrl) setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: PageBannerFormData) => {
    if (isEditing) {
      updateMutation.mutate(
        { ...data, pageKey: initialData.pageKey },
        {
          onSuccess: () => {
            toast({ title: "Cập nhật thành công", color: "success" });
            router.push("/page-banners");
          },
          onError: (error) => {
            toast({ title: "Cập nhật thất bại", description: error.message, color: "danger" });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({ title: "Tạo thành công", color: "success" });
          router.push("/page-banners");
        },
        onError: (error) => {
          toast({ title: "Tạo thất bại", description: error.message, color: "danger" });
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">
            {isEditing ? "Chỉnh sửa Banner" : "Thêm Banner"}
          </h1>
          <p className="text-sm text-text-muted">
            {isEditing ? "Cập nhật banner cho trang" : "Tạo banner mới cho trang"}
          </p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>← Quay lại</AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Thông tin Banner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Trang áp dụng (Mã trang) <span className="text-danger">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  {...register("pageKey")}
                  disabled={isEditing}
                >
                  <option value="">Chọn trang...</option>
                  <option value="home">Trang chủ (Home)</option>
                  <option value="about">Về chúng tôi (About)</option>
                  <option value="programs">Chương trình (Programs)</option>
                  <option value="solutions">Giải pháp (Solutions)</option>
                  <option value="projects">Dự án (Projects)</option>
                  <option value="articles">Tin tức (Articles)</option>
                  <option value="contact">Liên hệ (Contact)</option>
                  <option value="careers">Tuyển dụng (Careers)</option>
                </select>
                {errors.pageKey && (
                  <p className="mt-1 text-xs text-danger">{errors.pageKey.message}</p>
                )}
              </div>
              
              <FormInput
                label="Tiêu đề banner"
                placeholder="Nhập tiêu đề banner..."
                errorMessage={errors.title?.message}
                {...register("title")}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Tag (Nhãn)"
                placeholder="VD: Tuyển dụng..."
                errorMessage={errors.tag?.message}
                {...register("tag")}
              />
            </div>

            <FormTextarea
              label="Mô tả ngắn (Subtitle)"
              placeholder="Nhập mô tả banner..."
              errorMessage={errors.subtitle?.message}
              {...register("subtitle")}
            />

            <div className="flex items-end pb-1 pt-1">
              <FormCheckbox label="Hiển thị (Kích hoạt)" {...register("isActive")} />
            </div>

            {/* Image upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">
                Ảnh Banner <span className="text-danger">*</span>
              </label>

              <div className="mb-3 flex h-32 w-full max-w-md items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-muted">
                {previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewUrl}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-text-muted">Chưa có ảnh</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                  {uploading ? "Đang tải lên..." : "Chọn ảnh"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                <span className="text-xs text-text-muted">JPG, PNG, WebP • Tối đa 5MB</span>
              </div>

              {errors.imageUrl && (
                <p className="mt-1 text-xs text-danger">{errors.imageUrl.message}</p>
              )}

              <input type="hidden" {...register("imageUrl")} />
              <input type="hidden" {...register("imageFileId")} />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton type="submit" isLoading={isPending} disabled={uploading}>
            {isEditing ? "Lưu thay đổi" : "Tạo Banner"}
          </AppButton>
        </div>
      </form>
    </div>
  );
}
