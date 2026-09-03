"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, FormCheckbox, AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useCreateSlide } from "@/features/slides/api";
import { SlideCtaLinkInput } from "@/features/slides/components";
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
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const [imageLoadError, setImageLoadError] = useState(false);

  const {
    register, handleSubmit, setValue, control, formState: { errors },
  } = useForm<SlideFormData>({
    resolver: zodResolver(slideSchema),
    defaultValues: {
      title: "", subtitle: "", description: "",
      ctaText: "", ctaUrl: "",
      imageUrl: "", imageFileId: null,
      order: 0, isActive: true,
    },
  });

  const watchedImageUrl = useWatch({ control, name: "imageUrl" });
  const watchedCtaUrl = useWatch({ control, name: "ctaUrl" });
  const watchedCtaText = useWatch({ control, name: "ctaText" });

  // Derive preview URL: use uploaded preview if available, otherwise use form imageUrl
  const previewUrl = uploadedPreviewUrl ?? watchedImageUrl ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast({ title: "File không hợp lệ", description: validationError, color: "danger" });
      return;
    }

    setUploadedPreviewUrl(URL.createObjectURL(file));
    setImageLoadError(false);
    setUploading(true);

    try {
      const result: UploadResult = await uploadImage(file, "slide");
      setValue("imageUrl", result.url, { shouldValidate: true });
      setValue("imageFileId", result.fileId);
      toast({ title: "Upload thành công", color: "success" });
    } catch {
      toast({ title: "Upload thất bại", color: "danger" });
      setUploadedPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUploadedPreviewUrl(null);
    setImageLoadError(false);
    setValue("imageUrl", url, { shouldValidate: true });
    setValue("imageFileId", null);
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
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">Ảnh slide</CardTitle>
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => setImageInputMode("upload")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  imageInputMode === "upload"
                    ? "bg-surface font-semibold text-primary shadow-xs"
                    : "text-text-muted hover:text-text"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                Tải ảnh lên
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode("url")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  imageInputMode === "url"
                    ? "bg-surface font-semibold text-primary shadow-xs"
                    : "text-text-muted hover:text-text"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                  <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                </svg>
                Nhập URL ảnh
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {/* Image preview */}
            <div className="overflow-hidden rounded-lg border border-border bg-surface-muted">
              {previewUrl && !imageLoadError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt="Slide preview"
                  className="h-48 md:h-56 w-full object-cover transition-opacity duration-200"
                  onError={() => setImageLoadError(true)}
                  onLoad={() => setImageLoadError(false)}
                />
              ) : previewUrl && imageLoadError ? (
                <div className="flex h-48 w-full flex-col items-center justify-center gap-2 p-4 text-center text-text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-warning">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm font-medium text-text">Không thể tải xem trước ảnh</p>
                  <p className="text-xs text-text-muted">Vui lòng kiểm tra lại liên kết hình ảnh hoặc quyền truy cập của ảnh.</p>
                </div>
              ) : (
                <div className="flex h-48 w-full items-center justify-center text-sm text-text-muted">
                  Chưa có ảnh slide
                </div>
              )}
            </div>

            {/* Input controls based on mode */}
            {imageInputMode === "upload" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                    {uploading ? "Đang tải lên..." : "Chọn ảnh slide"}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} disabled={uploading} />
                  </label>
                  <span className="text-xs text-text-muted">JPG, PNG, WebP, GIF • Tối đa 10MB • Nên dùng 1920×800px</span>
                </div>
                {watchedImageUrl && (
                  <p className="truncate text-xs text-text-muted">
                    <span className="font-medium text-text">Đường dẫn hiện tại:</span> {watchedImageUrl}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <FormInput
                  label="Đường dẫn URL ảnh"
                  isRequired
                  placeholder="https://example.com/slide-banner.jpg"
                  value={watchedImageUrl || ""}
                  onChange={handleUrlChange}
                  errorMessage={errors.imageUrl?.message}
                  helperText="Nhập đường dẫn trực tiếp (URL) đến file ảnh trên internet (JPG, PNG, WebP...)"
                  startContent={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-text-muted">
                      <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                      <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                    </svg>
                  }
                />
              </div>
            )}

            {imageInputMode === "upload" && errors.imageUrl && (
              <p className="text-xs text-danger">{errors.imageUrl.message}</p>
            )}
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
              <FormInput
                label="Nút CTA"
                placeholder="VD: Tìm hiểu thêm"
                errorMessage={errors.ctaText?.message}
                {...register("ctaText")}
              />
              <SlideCtaLinkInput
                value={watchedCtaUrl}
                onChange={(url) => {
                  setValue("ctaUrl", url, { shouldDirty: true, shouldValidate: true });
                }}
                onBlogSelect={() => {
                  if (!watchedCtaText) {
                    setValue("ctaText", "Tìm hiểu thêm", { shouldDirty: true });
                  }
                }}
                errorMessage={errors.ctaUrl?.message}
              />
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
