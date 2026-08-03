"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, FormCheckbox, AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import { RichTextEditor } from "@/components/shared";
import { useProject, useUpdateProject, useProjects } from "@/features/projects/api";
import { useOperationFields } from "@/features/operation-fields/api";
import { useProvinces } from "@/features/provinces/api";
import { projectSchema, type ProjectFormData } from "@/features/projects/schema";
import { uploadImage, validateImageFile } from "@/lib/upload";
import { ProjectGallery } from "@/features/projects/components/ProjectGallery";
import type { ProjectImage } from "@/types/project";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  
  const { data: project, isLoading } = useProject(id);
  const updateMutation = useUpdateProject(id);
  const { data: projectsData } = useProjects({ limit: 100 });
  
  const { data: operationFields } = useOperationFields();
  const { data: provinces } = useProvinces();

  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [challengePreview, setChallengePreview] = useState<string | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [richContent, setRichContent] = useState("");
  const [challengeContent, setChallengeContent] = useState("");
  const [contentInitialized, setContentInitialized] = useState(false);

  // Local state for gallery to allow optimistic updates
  const [galleryImages, setGalleryImages] = useState<ProjectImage[]>([]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      slug: "",
      overview: "",
      thumbnail: "",
      thumbnailFileId: null,
      fieldId: null,
      provinceId: null,
      year: new Date().getFullYear(),
      challenge: "",
      challengeImage: "",
      challengeImageFileId: null,
      services: [],
      discipline: "",
      transformationBefore: "",
      transformationBeforeFileId: null,
      transformationAfter: "",
      transformationAfterFileId: null,
      technicalHighlights: [],
      nextProjectSlug: "",
      metaTitle: "",
      metaDescription: "",
      isPublished: false,
    },
  });

  // Dynamic arrays
  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control,
    name: "services" as never,
  });

  const { fields: highlightFields, append: appendHighlight, remove: removeHighlight } = useFieldArray({
    control,
    name: "technicalHighlights",
  });

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        slug: project.slug,
        overview: project.overview ?? "",
        thumbnail: project.thumbnail ?? "",
        thumbnailFileId: project.thumbnailFileId ?? null,
        fieldId: project.field?.id ?? null,
        provinceId: project.province?.id ?? null,
        year: project.year,
        challenge: project.challenge ?? "",
        challengeImage: project.challengeImage ?? "",
        challengeImageFileId: project.challengeImageFileId ?? null,
        services: project.services ?? [],
        discipline: project.discipline ?? "",
        transformationBefore: project.transformationBefore ?? "",
        transformationBeforeFileId: project.transformationBeforeFileId ?? null,
        transformationAfter: project.transformationAfter ?? "",
        transformationAfterFileId: project.transformationAfterFileId ?? null,
        technicalHighlights: project.technicalHighlights ?? [],
        nextProjectSlug: project.nextProjectSlug ?? "",
        metaTitle: project.metaTitle ?? "",
        metaDescription: project.metaDescription ?? "",
        isPublished: project.isPublished,
      });
      const timer = setTimeout(() => {
        setPreviewUrl(project.thumbnail ?? null);
        setChallengePreview(project.challengeImage ?? null);
        setBeforePreview(project.transformationBefore ?? null);
        setAfterPreview(project.transformationAfter ?? null);
        setGalleryImages(project.images ?? []);
        
        if (!contentInitialized) {
          setRichContent(project.overview ?? "");
          setChallengeContent(project.challenge ?? "");
          setContentInitialized(true);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [project, reset, contentInitialized]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "thumbnail" | "challengeImage" | "transformationBefore" | "transformationAfter",
    fileIdField: "thumbnailFileId" | "challengeImageFileId" | "transformationBeforeFileId" | "transformationAfterFileId",
    setPreview: (url: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast({ title: "File không hợp lệ", description: error, color: "danger" });
      return;
    }

    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const result = await uploadImage(file, "project");
      setValue(field, result.url, { shouldDirty: true });
      setValue(fileIdField, result.fileId, { shouldDirty: true });
      setPreview(result.url);
      toast({ title: "Tải ảnh thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh thất bại", color: "danger" });
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const onSubmit = (data: ProjectFormData) => {
    updateMutation.mutate(
      { ...data, overview: richContent, challenge: challengeContent },
      {
        onSuccess: () => {
          toast({ title: "Cập nhật thành công", color: "success" });
          router.push("/projects");
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

  // Other projects for "next project" selector
  const otherProjects = projectsData?.items?.filter(p => p.id !== id) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Sửa dự án</h1>
          <p className="text-sm text-text-muted">
            Cập nhật thông tin dự án {project?.title}.
          </p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>← Quay lại</AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* ── 1. Basic Info ── */}
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">Tỉnh thành</label>
                    <select
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                      {...register("provinceId")}
                    >
                      <option value="">— Chọn tỉnh thành —</option>
                      {provinces?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <FormInput
                    type="number"
                    label="Năm triển khai"
                    errorMessage={errors.year?.message}
                    {...register("year", { valueAsNumber: true })}
                  />
                </div>
                <FormInput
                  label="Lĩnh vực chuyên môn"
                  placeholder="VD: Khảo sát & Giám sát số"
                  errorMessage={errors.discipline?.message}
                  {...register("discipline")}
                />
              </CardContent>
            </Card>

            {/* ── 2. Overview & Services ── */}
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Tổng quan & Dịch vụ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Tổng quan dự án
                  </label>
                  <RichTextEditor
                    content={richContent}
                    onChange={setRichContent}
                    placeholder="Nhập tổng quan dự án..."
                  />
                </div>

                {/* Services dynamic list */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-text">Dịch vụ cung cấp</label>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => appendService("" as never)}
                    >
                      + Thêm dịch vụ
                    </button>
                  </div>
                  <div className="space-y-2">
                    {serviceFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormInput
                          placeholder={`VD: Khảo sát 2D & 3D`}
                          wrapperClassName="flex-1"
                          {...register(`services.${index}` as const)}
                        />
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
                          title="Xoá"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {serviceFields.length === 0 && (
                      <p className="text-xs text-text-muted">Chưa có dịch vụ nào.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 3. Challenge ── */}
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Thách thức dự án</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Mô tả thách thức
                  </label>
                  <RichTextEditor
                    content={challengeContent}
                    onChange={setChallengeContent}
                    placeholder="Bài toán thực tế của dự án..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">Ảnh minh hoạ</label>
                  {challengePreview && (
                    <div className="mb-2 overflow-hidden rounded-md border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={challengePreview} alt="Challenge" className="h-40 w-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "challengeImage", "challengeImageFileId", setChallengePreview)}
                    disabled={uploading.challengeImage}
                    className="w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
                  />
                  {uploading.challengeImage && <p className="text-xs text-primary">Đang tải ảnh...</p>}
                  <input type="hidden" {...register("challengeImage")} />
                  <input type="hidden" {...register("challengeImageFileId")} />
                </div>
              </CardContent>
            </Card>

            {/* ── 4. Transformation (Before/After) ── */}
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Chuyển đổi số (Before / After)</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Before */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text">Ảnh thực tế (Before)</label>
                    {beforePreview && (
                      <div className="overflow-hidden rounded-md border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={beforePreview} alt="Before" className="h-40 w-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "transformationBefore", "transformationBeforeFileId", setBeforePreview)}
                      disabled={uploading.transformationBefore}
                      className="w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
                    />
                    {uploading.transformationBefore && <p className="text-xs text-primary">Đang tải...</p>}
                    <input type="hidden" {...register("transformationBefore")} />
                    <input type="hidden" {...register("transformationBeforeFileId")} />
                  </div>
                  {/* After */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text">Mô hình số (After)</label>
                    {afterPreview && (
                      <div className="overflow-hidden rounded-md border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={afterPreview} alt="After" className="h-40 w-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "transformationAfter", "transformationAfterFileId", setAfterPreview)}
                      disabled={uploading.transformationAfter}
                      className="w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
                    />
                    {uploading.transformationAfter && <p className="text-xs text-primary">Đang tải...</p>}
                    <input type="hidden" {...register("transformationAfter")} />
                    <input type="hidden" {...register("transformationAfterFileId")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 5. Technical Highlights ── */}
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <div className="flex w-full flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-text">Thông số kỹ thuật</CardTitle>
                  <AppButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendHighlight({ label: "", value: "" })}
                  >
                    + Thêm thông số
                  </AppButton>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {highlightFields.length === 0 ? (
                  <p className="text-sm text-text-muted">Chưa có thông số nào.</p>
                ) : (
                  highlightFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormInput
                          label="Tên thông số"
                          placeholder="VD: Diện tích khảo sát"
                          errorMessage={errors.technicalHighlights?.[index]?.label?.message}
                          {...register(`technicalHighlights.${index}.label`)}
                        />
                        <FormInput
                          label="Giá trị"
                          placeholder="VD: 120 ha"
                          errorMessage={errors.technicalHighlights?.[index]?.value?.message}
                          {...register(`technicalHighlights.${index}.value`)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHighlight(index)}
                        className="mt-7 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
                        title="Xoá"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* ── 6. Gallery ── */}
            <ProjectGallery
              projectId={id}
              images={galleryImages}
              onUpdateCache={setGalleryImages}
            />
          </div>

          {/* ── Sidebar ── */}
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
                  onChange={(e) => handleImageUpload(e, "thumbnail", "thumbnailFileId", setPreviewUrl)}
                  disabled={uploading.thumbnail}
                  className="w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
                />
                {uploading.thumbnail && <p className="text-xs text-primary">Đang tải ảnh...</p>}
                <input type="hidden" {...register("thumbnail")} />
                <input type="hidden" {...register("thumbnailFileId")} />
              </CardContent>
            </Card>

            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Dự án tiếp theo</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <select
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                  {...register("nextProjectSlug")}
                >
                  <option value="">— Không chọn —</option>
                  {otherProjects.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </select>
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
          {isDirty && <p className="text-xs text-warning">Có thay đổi chưa lưu</p>}
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton
            type="submit"
            isLoading={updateMutation.isPending}
            disabled={!isDirty && richContent === (project?.overview ?? "") && challengeContent === (project?.challenge ?? "")}
          >
            Lưu thay đổi
          </AppButton>
        </div>
      </form>
    </div>
  );
}
