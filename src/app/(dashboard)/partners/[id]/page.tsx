"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormCheckbox, AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import { usePartner, useUpdatePartner } from "@/features/partners/api";
import {
  partnerSchema,
  type PartnerFormData,
} from "@/features/partners/schema";
import { uploadImage, validateImageFile, type UploadResult } from "@/lib/upload";
import { ImagePickerModal, type ImagePickerResult } from "@/components/shared";

/**
 * Edit Partner page — UC-PTN-03.
 */
export default function EditPartnerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: partner, isLoading } = usePartner(id);
  const updateMutation = useUpdatePartner(id);

  const [uploading, setUploading] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const handleGallerySelect = (image: ImagePickerResult) => {
    setUploadedPreviewUrl(null);
    setValue("logo", image.url, { shouldValidate: true, shouldDirty: true });
    setValue("logoFileId", image.fileId, { shouldDirty: true });
    toast({ title: "Đã chọn ảnh từ thư viện", color: "success" });
  };

  // Derive preview URL: uploaded preview takes priority, then partner logo, then default
  const previewUrl = uploadedPreviewUrl ?? partner?.logo ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: { name: "", logo: "", logoFileId: null, websiteUrl: "", order: 0, isActive: true },
  });

  const currentName = useWatch({ name: "name", control });

  useEffect(() => {
    if (partner) {
      reset({
        name: partner.name,
        logo: partner.logo,
        logoFileId: partner.logoFileId,
        websiteUrl: partner.websiteUrl ?? "",
        order: partner.order,
        isActive: partner.isActive,
      });
    }
  }, [partner, reset]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast({ title: "File không hợp lệ", description: validationError, color: "danger" });
      return;
    }

    setUploadedPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const result: UploadResult = await uploadImage(file, "partner");
      setValue("logo", result.url, { shouldValidate: true, shouldDirty: true });
      setValue("logoFileId", result.fileId, { shouldDirty: true });
      toast({ title: "Upload thành công", color: "success" });
    } catch {
      toast({ title: "Upload thất bại", color: "danger" });
      setUploadedPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: PartnerFormData) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: "Cập nhật thành công", color: "success" });
        router.push("/partners");
      },
      onError: (error) => {
        toast({ title: "Cập nhật thất bại", description: error.message, color: "danger" });
      },
    });
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Sửa đối tác</h1>
          <p className="text-sm text-text-muted">Chỉnh sửa thông tin đối tác.</p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>← Quay lại</AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">Thông tin đối tác</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="Tên đối tác" isRequired errorMessage={errors.name?.message} {...register("name")} />
              <FormInput label="Website" type="url" placeholder="https://..." errorMessage={errors.websiteUrl?.message} {...register("websiteUrl")} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="Thứ tự" type="number" errorMessage={errors.order?.message} {...register("order", { valueAsNumber: true })} />
              <div className="flex items-end pb-1">
                <FormCheckbox label="Hiển thị" {...register("isActive")} />
              </div>
            </div>

            {/* Logo upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">Logo</label>

              {/* Preview — show uploaded image, partner logo, or fallback */}
              <div className="mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary/10 text-4xl font-bold text-primary">
                {previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewUrl}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  currentName ? currentName.charAt(0).toUpperCase() : "?"
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                  {uploading ? "Đang tải lên..." : "Thay đổi logo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} disabled={uploading} />
                </label>
                <button
                  type="button"
                  onClick={() => setShowGallery(true)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface-muted"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0L2.5 11.06z" clipRule="evenodd" />
                  </svg>
                  Chọn từ thư viện
                </button>
                <span className="text-xs text-text-muted">JPG, PNG, WebP, GIF • Tối đa 10MB</span>
              </div>
              {errors.logo && <p className="mt-1 text-xs text-danger">{errors.logo.message}</p>}
              <input type="hidden" {...register("logo")} />
              <input type="hidden" {...register("logoFileId")} />
              <ImagePickerModal
                isOpen={showGallery}
                onClose={() => setShowGallery(false)}
                onSelect={handleGallerySelect}
                defaultFolder="/vdcd/partners"
                uploadFolder="partner"
                title="Chọn logo đối tác"
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-end gap-3">
          {isDirty && <p className="text-xs text-warning">Có thay đổi chưa lưu</p>}
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton type="submit" isLoading={updateMutation.isPending} disabled={!isDirty || uploading}>Lưu thay đổi</AppButton>
        </div>
      </form>
    </div>
  );
}
