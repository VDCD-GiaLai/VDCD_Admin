"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import {
  FormInput,
  FormTextarea,
  FormCheckbox,
  AppButton,
  DropdownSelect,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useOperationFields } from "@/features/operation-fields/api";
import { useCreateSolution, useUpdateSolution } from "../api";
import { solutionSchema, type SolutionFormData } from "../schema";
import {
  parseSolutionContent,
  serializeSolutionPayload,
} from "../utils/solution-content";
import {
  BlockEditor,
  VisualEditorCanvas,
  DocumentPreviewContainer,
  DocumentUploadProvider,
  createDefaultDocumentContent,
  type DocumentContent,
} from "@/shared/content-editor";
import { uploadImage, validateImageFile, slugifyVietnamese } from "@/lib/upload";
import { ImagePickerModal, type ImagePickerResult } from "@/components/shared";
import type { Solution } from "@/types/solution";

type EditorTab = "info" | "blocks" | "reader" | "visual";

export interface SolutionEditorProps {
  mode: "create" | "edit";
  solution?: Solution;
}

export function SolutionEditor({ mode, solution }: SolutionEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateSolution();
  const updateMutation = useUpdateSolution(solution?.id ?? "");
  const { data: operationFields } = useOperationFields();

  const [activeTab, setActiveTab] = useState<EditorTab>("info");
  const [uploading, setUploading] = useState(false);
  const [prevSolutionThumbnail, setPrevSolutionThumbnail] = useState(solution?.thumbnail);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const handleGallerySelect = (image: ImagePickerResult) => {
    setThumbnailPreview(null);
    setValue("thumbnail", image.url, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
    setValue("thumbnailFileId", image.fileId, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
    toast({ title: "Đã chọn ảnh từ thư viện", color: "success" });
  };

  if (solution?.thumbnail !== prevSolutionThumbnail) {
    setPrevSolutionThumbnail(solution?.thumbnail);
    setThumbnailPreview(null);
  }

  // Initialize initial DocumentContent from legacy plain text or JSONB
  const initialContent = useMemo(() => {
    return solution?.content
      ? parseSolutionContent(solution.content)
      : createDefaultDocumentContent();
  }, [solution]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<SolutionFormData>({
    resolver: zodResolver(solutionSchema),
    defaultValues: {
      title: solution?.title ?? "",
      slug: solution?.slug ?? "",
      shortDescription: solution?.shortDescription ?? "",
      content: initialContent,
      thumbnail: solution?.thumbnail ?? "",
      thumbnailFileId: solution?.thumbnailFileId ?? null,
      fieldId: solution?.field?.id ?? null,
      websiteUrl: solution?.websiteUrl ?? "",
      metaTitle: solution?.metaTitle ?? "",
      metaDescription: solution?.metaDescription ?? "",
      isPublished: solution?.isPublished ?? false,
    },
  });

  // Reset form when solution data loads or changes
  useEffect(() => {
    if (solution) {
      const parsed = parseSolutionContent(solution.content);
      reset({
        title: solution.title,
        slug: solution.slug,
        shortDescription: solution.shortDescription ?? "",
        content: parsed,
        thumbnail: solution.thumbnail ?? "",
        thumbnailFileId: solution.thumbnailFileId ?? null,
        fieldId: solution.field?.id ?? null,
        websiteUrl: solution.websiteUrl ?? "",
        metaTitle: solution.metaTitle ?? "",
        metaDescription: solution.metaDescription ?? "",
        isPublished: solution.isPublished,
      });
    }
  }, [solution, reset]);

  // Live form state watching — Single Source of Truth
  const watchedTitle = useWatch({ control, name: "title" }) ?? "";
  const watchedShortDescription = useWatch({ control, name: "shortDescription" }) ?? "";
  const watchedThumbnail = useWatch({ control, name: "thumbnail" }) ?? "";
  const watchedSlug = useWatch({ control, name: "slug" }) ?? "";
  const watchedFieldId = useWatch({ control, name: "fieldId" });
  const rawWatchedContent = useWatch({ control, name: "content" });

  const currentThumbnail = thumbnailPreview ?? watchedThumbnail ?? solution?.thumbnail ?? "";

  const currentDocumentContent: DocumentContent = useMemo(() => {
    if (
      typeof rawWatchedContent === "object" &&
      rawWatchedContent !== null &&
      "blocks" in rawWatchedContent
    ) {
      return rawWatchedContent as DocumentContent;
    }
    if (typeof rawWatchedContent === "string") {
      return parseSolutionContent(rawWatchedContent);
    }
    return initialContent;
  }, [rawWatchedContent, initialContent]);

  // Selected Field Name for badge
  const selectedField = useMemo(() => {
    return operationFields?.find((f) => f.id === watchedFieldId);
  }, [operationFields, watchedFieldId]);

  // Generate random fallback subfolder once per editor mount if no title/slug exists
  const [randomFallbackSubfolder] = useState(
    () => `solution-${Math.random().toString(36).substring(2, 10)}`
  );

  // Compute active upload subfolder (auto tracks slug, then title, or fallback to random)
  const currentSubfolder = useMemo(() => {
    const fromSlug = watchedSlug?.trim();
    if (fromSlug) return slugifyVietnamese(fromSlug);

    const fromTitle = watchedTitle?.trim();
    if (fromTitle) return slugifyVietnamese(fromTitle);

    return randomFallbackSubfolder;
  }, [watchedSlug, watchedTitle, randomFallbackSubfolder]);

  // Handle content updates from BlockEditor or VisualEditor
  const handleContentChange = useCallback(
    (newContent: DocumentContent) => {
      setValue("content", newContent, { shouldDirty: true, shouldValidate: true });
    },
    [setValue],
  );

  // Thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast({ title: "File không hợp lệ", description: error, color: "danger" });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setThumbnailPreview(objectUrl);
    setUploading(true);
    try {
      const result = await uploadImage(file, "solution", {
        subfolder: currentSubfolder,
        slug: currentSubfolder,
        title: watchedTitle || undefined,
      });
      setThumbnailPreview(result.url);
      setValue("thumbnail", result.url, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      setValue("thumbnailFileId", result.fileId, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      toast({ title: "Tải ảnh đại diện thành công", color: "success" });
    } catch {
      setThumbnailPreview(solution?.thumbnail ?? null);
      toast({ title: "Tải ảnh thất bại", color: "danger" });
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const onSubmit = (data: SolutionFormData) => {
    const submitData = serializeSolutionPayload({
      ...data,
      tempFolderKey: randomFallbackSubfolder,
    });

    if (mode === "create") {
      createMutation.mutate(submitData as unknown as SolutionFormData, {
        onSuccess: () => {
          toast({ title: "Tạo giải pháp thành công", color: "success" });
          router.push("/solutions");
        },
        onError: (err) => {
          toast({
            title: "Tạo giải pháp thất bại",
            description: err.message,
            color: "danger",
          });
        },
      });
    } else {
      updateMutation.mutate(submitData as unknown as SolutionFormData, {
        onSuccess: () => {
          toast({ title: "Cập nhật giải pháp thành công", color: "success" });
          router.push("/solutions");
        },
        onError: (err) => {
          toast({
            title: "Cập nhật thất bại",
            description: err.message,
            color: "danger",
          });
        },
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <DocumentUploadProvider subfolder={currentSubfolder} folder="solution">
      <div className="space-y-6">
        {/* Top Header & Global Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">
              {mode === "create"
                ? "Thêm giải pháp mới"
                : `Sửa giải pháp: ${solution?.title || ""}`}
            </h1>
            <p className="text-sm text-text-muted">
              Quản lý thông tin, khối nội dung, chế độ đọc và trình chỉnh sửa trực quan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-xs font-medium text-warning">
                Có thay đổi chưa lưu
              </span>
            )}
            <AppButton
              variant="outline"
              onClick={() => router.push("/solutions")}
              disabled={isSubmitting}
            >
              Hủy
            </AppButton>
            <AppButton
              color="primary"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo giải pháp"
                  : "Lưu thay đổi"}
            </AppButton>
          </div>
        </div>

        {/* 4 Tabs Bar */}
        <div className="flex border-b border-border bg-surface px-2">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Thông tin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("blocks")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "blocks"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Nội dung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reader")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "reader"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Đọc bài
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "visual"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Chỉnh sửa trực quan
          </button>
        </div>

        {/* TAB 1: THÔNG TIN (METADATA) */}
        {activeTab === "info" && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column (2/3) */}
              <div className="space-y-6 lg:col-span-2">
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Thông tin chính
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <FormInput
                      label="Tiêu đề giải pháp"
                      isRequired
                      placeholder="Nhập tiêu đề giải pháp..."
                      errorMessage={errors.title?.message}
                      {...register("title")}
                    />

                    <FormInput
                      label="Slug (URL)"
                      placeholder="giai-phap-chuyen-doi-so"
                      helperText="Để trống để tự động tạo từ tiêu đề."
                      errorMessage={errors.slug?.message}
                      {...register("slug")}
                    />

                    <FormTextarea
                      label="Mô tả ngắn"
                      rows={3}
                      placeholder="Mô tả tóm tắt giá trị của giải pháp..."
                      errorMessage={errors.shortDescription?.message}
                      {...register("shortDescription")}
                    />

                    <FormInput
                      label="Đường dẫn Website liên kết (Website URL)"
                      placeholder="https://vdcd.vn/services/giai-phap-chuyen-doi-so"
                      helperText="Đường dẫn đến website riêng hoặc trang landing page của giải pháp (nếu có)."
                      errorMessage={errors.websiteUrl?.message}
                      {...register("websiteUrl")}
                    />
                  </CardContent>
                </Card>

                {/* SEO Settings */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Tối ưu SEO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <FormInput
                      label="Meta Title"
                      placeholder="Tiêu đề hiển thị trên kết quả tìm kiếm..."
                      helperText="Tối đa 60 ký tự"
                      errorMessage={errors.metaTitle?.message}
                      {...register("metaTitle")}
                    />

                    <FormTextarea
                      label="Meta Description"
                      rows={3}
                      placeholder="Mô tả tóm tắt giải pháp cho công cụ tìm kiếm..."
                      helperText="Tối đa 160 ký tự"
                      errorMessage={errors.metaDescription?.message}
                      {...register("metaDescription")}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column (1/3) */}
              <div className="space-y-6">
                {/* Publish status */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Xuất bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <FormCheckbox
                      label="Xuất bản ngay"
                      description="Hiển thị giải pháp trên trang chủ và danh mục giải pháp công khai."
                      {...register("isPublished")}
                    />
                  </CardContent>
                </Card>

                {/* Operation Field */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Lĩnh vực hoạt động
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      Chọn lĩnh vực
                    </label>
                    <DropdownSelect
                      placeholder="-- Chọn lĩnh vực --"
                      options={[
                        { value: "", label: "-- Không chọn --" },
                        ...(operationFields || []).map((f) => ({
                          value: f.id,
                          label: f.name,
                        })),
                      ]}
                      value={watchedFieldId || ""}
                      onChange={(val) =>
                        setValue("fieldId", val || null, { shouldDirty: true })
                      }
                      className="w-full"
                    />
                    {errors.fieldId?.message && (
                      <p className="mt-1 text-xs text-danger">
                        {errors.fieldId.message}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Thumbnail */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Ảnh đại diện (Thumbnail)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
                    {currentThumbnail && (
                      <div className="overflow-hidden rounded-md border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentThumbnail}
                          alt="Thumbnail preview"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={uploading}
                      className="w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGallery(true)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0L2.5 11.06z" clipRule="evenodd" />
                      </svg>
                      Chọn từ thư viện
                    </button>
                    {uploading && (
                      <p className="text-xs text-primary">Đang tải ảnh đại diện...</p>
                    )}
                    <input type="hidden" {...register("thumbnail")} />
                    <input type="hidden" {...register("thumbnailFileId")} />
                    <ImagePickerModal
                      isOpen={showGallery}
                      onClose={() => setShowGallery(false)}
                      onSelect={handleGallerySelect}
                      defaultFolder="/vdcd/solutions"
                      uploadFolder="solution"
                      uploadOptions={{ subfolder: currentSubfolder, slug: currentSubfolder }}
                      title="Chọn ảnh giải pháp"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: NỘI DUNG (BLOCK EDITOR VỚI INLINE LIST UX) */}
        {activeTab === "blocks" && (
          <Card className="border border-border bg-surface shadow-sm">
            <CardContent className="p-5">
              <BlockEditor
                value={currentDocumentContent}
                onChange={handleContentChange}
              />
            </CardContent>
          </Card>
        )}

        {/* TAB 3: ĐỌC BÀI (READ-ONLY ARTICLE VIEW) */}
        {activeTab === "reader" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/80 bg-surface px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-text">
                  Chế độ đọc bài viết hoàn chỉnh (Read-only View)
                </h3>
                <p className="text-xs text-text-muted">
                  Hiển thị nội dung chính xác như trên website công khai, không có viền chỉnh sửa hay công cụ thao tác.
                </p>
              </div>
            </div>

            <DocumentPreviewContainer
              title={watchedTitle}
              excerpt={watchedShortDescription}
              heroImageUrl={currentThumbnail}
              content={currentDocumentContent}
              slug={watchedSlug}
              badge={selectedField?.name}
              urlPrefix="vdcd.vn/giai-phap/"
            />
          </div>
        )}

        {/* TAB 4: TRÌNH CHỈNH SỬA TRỰC QUAN (VISUAL EDITOR CANVAS) */}
        {activeTab === "visual" && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <VisualEditorCanvas
              title={watchedTitle}
              excerpt={watchedShortDescription}
              heroImageUrl={currentThumbnail}
              content={currentDocumentContent}
              onContentChange={handleContentChange}
              onTitleChange={(t) => setValue("title", t, { shouldDirty: true })}
              onSubtitleChange={() => {}}
              onExcerptChange={(e) =>
                setValue("shortDescription", e, { shouldDirty: true })
              }
              onHeroImageChange={(url, fileId) => {
                setThumbnailPreview(url);
                setValue("thumbnail", url, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
                setValue("thumbnailFileId", fileId ?? null, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
              }}
            />
          </div>
        )}
      </div>
    </DocumentUploadProvider>
  );
}
