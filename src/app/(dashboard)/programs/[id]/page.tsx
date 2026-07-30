"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, FormCheckbox, AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import { RichTextEditor } from "@/components/shared";
import { useProgram, useUpdateProgram } from "@/features/programs/api";
import { useOperationFields } from "@/features/operation-fields/api";
import { programSchema, type ProgramFormData } from "@/features/programs/schema";
import { uploadImage, validateImageFile } from "@/lib/upload";

/**
 * Edit Program page — UC-PRG-03.
 */
export default function EditProgramPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: program, isLoading } = useProgram(id);
  const updateMutation = useUpdateProgram(id);
  const { data: operationFields } = useOperationFields();

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [richContent, setRichContent] = useState("");
  const [contentInitialized, setContentInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
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

  useEffect(() => {
    if (program) {
      reset({
        title: program.title,
        slug: program.slug,
        shortDescription: program.shortDescription ?? "",
        content: program.content ?? "",
        thumbnail: program.thumbnail ?? "",
        thumbnailFileId: program.thumbnailFileId ?? null,
        fieldId: program.field?.id ?? null,
        metaTitle: program.metaTitle ?? "",
        metaDescription: program.metaDescription ?? "",
        isPublished: program.isPublished,
      });
      const timer = setTimeout(() => {
        setPreviewUrl(program.thumbnail ?? null);
        if (!contentInitialized) {
          setRichContent(program.content ?? "");
          setContentInitialized(true);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [program, reset, contentInitialized]);

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
      setValue("thumbnail", result.url, { shouldDirty: true });
      setValue("thumbnailFileId", result.fileId, { shouldDirty: true });
      setPreviewUrl(result.url);
      toast({ title: "Tải ảnh thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh thất bại", color: "danger" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: ProgramFormData) => {
    updateMutation.mutate(
      { ...data, content: richContent },
      {
        onSuccess: () => {
          toast({ title: "Cập nhật thành công", color: "success" });
          router.push("/programs");
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
          <h1 className="text-xl font-bold text-text">Sửa chương trình</h1>
          <p className="text-sm text-text-muted">
            Cập nhật thông tin chương trình {program?.title}.
          </p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>← Quay lại</AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content */}
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
                    placeholder="Nhập nội dung chương trình..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish */}
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Xuất bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <FormCheckbox label="Xuất bản ngay" {...register("isPublished")} />
              </CardContent>
            </Card>

            {/* Operation field */}
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Lĩnh vực</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <select
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                  {...register("fieldId")}
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

            {/* Thumbnail */}
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

            {/* SEO */}
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
          {isDirty && <p className="text-xs text-warning">Có thay đổi chưa lưu</p>}
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton
            type="submit"
            isLoading={updateMutation.isPending}
            disabled={!isDirty && richContent === (program?.content ?? "")}
          >
            Lưu thay đổi
          </AppButton>
        </div>
      </form>
    </div>
  );
}
