"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, FormCheckbox, AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useCreateSlide } from "@/features/slides/api";
import { slideSchema, type SlideFormData } from "@/features/slides/schema";
import { uploadImage, validateImageFile, type UploadResult } from "@/lib/upload";

/**
 * Create Slide page — UC-SLD-02.
 */
export default function NewSlidePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateSlide();

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register, handleSubmit, setValue, formState: { errors },
  } = useForm<SlideFormData>({
    resolver: zodResolver(slideSchema),
    defaultValues: {
      title: "", subtitle: "", description: "",
      ctaText: "", ctaUrl: "",
      imageUrl: "", imageFileId: null,
      order: 0, isActive: true,
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
      const result: UploadResult = await uploadImage(file, "slide");
      setValue("imageUrl", result.url, { shouldValidate: true });
      setValue("imageFileId", result.fileId);
      toast({ title: "Upload thành công", color: "success" });
    } catch {
      toast({ title: "Upload thất bại", color: "danger" });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: SlideFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: "Tạo thành công", description: "Slide mới đã được thêm.", color: "success" });
        router.push("/slides");
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
          <h1 className="text-xl font-bold text-text">Thêm slide</h1>
          <p className="text-sm text-text-muted">Tạo slide mới cho trang chủ.</p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>← Quay lại</AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Image upload */}
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">Ảnh slide</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {previewUrl && (
              <div className="mb-4 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Slide preview" className="h-48 w-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface-muted">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                {uploading ? "Đang tải lên..." : "Chọn ảnh slide"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} disabled={uploading} />
              </label>
              <span className="text-xs text-text-muted">JPG, PNG, WebP, GIF • Tối đa 5MB • Nên dùng 1920×800px</span>
            </div>
            {errors.imageUrl && <p className="mt-2 text-xs text-danger">{errors.imageUrl.message}</p>}
            <input type="hidden" {...register("imageUrl")} />
            <input type="hidden" {...register("imageFileId")} />
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">Nội dung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <FormInput label="Tiêu đề" isRequired errorMessage={errors.title?.message} {...register("title")} />
            <FormInput label="Phụ đề" errorMessage={errors.subtitle?.message} {...register("subtitle")} />
            <FormTextarea label="Mô tả" rows={3} errorMessage={errors.description?.message} {...register("description")} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="Nút CTA" placeholder="VD: Tìm hiểu thêm" errorMessage={errors.ctaText?.message} {...register("ctaText")} />
              <FormInput label="Link CTA" type="url" placeholder="https://..." errorMessage={errors.ctaUrl?.message} {...register("ctaUrl")} />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">Cài đặt</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="Thứ tự" type="number" {...register("order", { valueAsNumber: true })} />
              <div className="flex items-end pb-1">
                <FormCheckbox label="Hiển thị ngay" {...register("isActive")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton type="submit" isLoading={createMutation.isPending} disabled={uploading}>Tạo slide</AppButton>
        </div>
      </form>
    </div>
  );
}
