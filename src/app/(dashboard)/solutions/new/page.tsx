"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, FormCheckbox, AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { RichTextEditor } from "@/components/shared";
import { useCreateSolution } from "@/features/solutions/api";
import { useOperationFields } from "@/features/operation-fields/api";
import { solutionSchema, type SolutionFormData } from "@/features/solutions/schema";
import { uploadImage, validateImageFile } from "@/lib/upload";

export default function CreateSolutionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateSolution();
  const { data: operationFields } = useOperationFields();

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [richContent, setRichContent] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SolutionFormData>({
    resolver: zodResolver(solutionSchema),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      content: "",
      thumbnail: "",
      thumbnailFileId: null,
      fieldId: null,
      metaTitle: "",
      metaDescription: "",
      isPublished: false,
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast({ title: "File không hợp lệ", description: error, color: "danger" });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file, "thumbnail");
      setValue("thumbnail", result.url);
      setValue("thumbnailFileId", result.fileId);
      setPreviewUrl(result.url);
      toast({ title: "Tải ảnh thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh thất bại", color: "danger" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: SolutionFormData) => {
    createMutation.mutate(
      { ...data, content: richContent },
      {
        onSuccess: () => {
          toast({ title: "Tạo giải pháp thành công", color: "success" });
          router.push("/solutions");
        },
        onError: (error) => {
          toast({ title: "Tạo thất bại", description: error.message, color: "danger" });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Thêm giải pháp</h1>
          <p className="text-sm text-text-muted">Tạo giải pháp chuyên môn mới.</p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>← Quay lại</AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Thông tin chính</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <FormInput
                  label="Tiêu đề"
                  isRequired
                  errorMessage={errors.title?.message}
                  {...register("title")}
                />
                <FormInput
                  label="Slug (URL)"
                  helperText="Để trống để tự động tạo từ tiêu đề"
                  errorMessage={errors.slug?.message}
                  {...register("slug")}
                />
                <FormTextarea
                  label="Mô tả ngắn"
                  rows={3}
                  errorMessage={errors.shortDescription?.message}
                  {...register("shortDescription")}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Nội dung chi tiết
                  </label>
                  <RichTextEditor
                    content={richContent}
                    onChange={setRichContent}
                    placeholder="Nhập nội dung giải pháp..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Xuất bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <FormCheckbox label="Xuất bản ngay" {...register("isPublished")} />
              </CardContent>
            </Card>

            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Lĩnh vực</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <select
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                  {...register("fieldId")}
                  defaultValue=""
                >
                  <option value="">— Chọn lĩnh vực —</option>
                  {operationFields?.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Ảnh đại diện</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {previewUrl && (
                  <div className="overflow-hidden rounded-md border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="h-40 w-full object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
                />
                {uploading && <p className="text-xs text-primary">Đang tải ảnh...</p>}
                <input type="hidden" {...register("thumbnail")} />
                <input type="hidden" {...register("thumbnailFileId")} />
              </CardContent>
            </Card>

            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <FormInput
                  label="Meta Title"
                  helperText="Tối đa 60 ký tự"
                  errorMessage={errors.metaTitle?.message}
                  {...register("metaTitle")}
                />
                <FormTextarea
                  label="Meta Description"
                  rows={2}
                  helperText="Tối đa 160 ký tự"
                  errorMessage={errors.metaDescription?.message}
                  {...register("metaDescription")}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton type="submit" isLoading={createMutation.isPending}>
            Tạo giải pháp
          </AppButton>
        </div>
      </form>
    </div>
  );
}
