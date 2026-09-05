"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, FormCheckbox, AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useOperationFields } from "@/features/operation-fields/api";
import { useCreateProgram, useUpdateProgram } from "../api";
import { programSchema, type ProgramFormData } from "../schema";
import {
  parseProgramContent,
  serializeProgramPayload,
} from "../utils/program-content";
import {
  BlockEditor,
  VisualEditorCanvas,
  DocumentPreviewContainer,
  DocumentUploadProvider,
  createDefaultDocumentContent,
  type DocumentContent,
} from "@/shared/content-editor";
import { uploadImage, validateImageFile, slugifyVietnamese } from "@/lib/upload";
import type { Program } from "@/types/program";

type EditorTab = "info" | "blocks" | "reader" | "visual";

export interface ProgramEditorProps {
  mode: "create" | "edit";
  program?: Program;
}

export function ProgramEditor({ mode, program }: ProgramEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram(program?.id ?? "");
  const { data: operationFields } = useOperationFields();

  const [activeTab, setActiveTab] = useState<EditorTab>("info");
  const [uploading, setUploading] = useState(false);

  // Initialize initial DocumentContent from legacy HTML or JSON
  const initialContent = useMemo(() => {
    return program?.content ? parseProgramContent(program.content) : createDefaultDocumentContent();
  }, [program]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: program?.title ?? "",
      slug: program?.slug ?? "",
      shortDescription: program?.shortDescription ?? "",
      content: initialContent,
      thumbnail: program?.thumbnail ?? "",
      thumbnailFileId: program?.thumbnailFileId ?? null,
      fieldId: program?.field?.id ?? null,
      metaTitle: program?.metaTitle ?? "",
      metaDescription: program?.metaDescription ?? "",
      isPublished: program?.isPublished ?? false,
    },
  });

  // Reset form when program data loads
  useEffect(() => {
    if (program) {
      const parsed = parseProgramContent(program.content);
      reset({
        title: program.title,
        slug: program.slug,
        shortDescription: program.shortDescription ?? "",
        content: parsed,
        thumbnail: program.thumbnail ?? "",
        thumbnailFileId: program.thumbnailFileId ?? null,
        fieldId: program.field?.id ?? null,
        metaTitle: program.metaTitle ?? "",
        metaDescription: program.metaDescription ?? "",
        isPublished: program.isPublished,
      });
    }
  }, [program, reset]);

  // Live form state watching — Single Source of Truth
  const watchedTitle = useWatch({ control, name: "title" }) ?? "";
  const watchedShortDescription = useWatch({ control, name: "shortDescription" }) ?? "";
  const watchedThumbnail = useWatch({ control, name: "thumbnail" }) ?? "";
  const watchedSlug = useWatch({ control, name: "slug" }) ?? "";
  const watchedFieldId = useWatch({ control, name: "fieldId" });
  const rawWatchedContent = useWatch({ control, name: "content" });

  const currentDocumentContent: DocumentContent = useMemo(() => {
    if (typeof rawWatchedContent === "object" && rawWatchedContent !== null && "blocks" in rawWatchedContent) {
      return rawWatchedContent as DocumentContent;
    }
    if (typeof rawWatchedContent === "string") {
      return parseProgramContent(rawWatchedContent);
    }
    return initialContent;
  }, [rawWatchedContent, initialContent]);

  // Selected Field Name for badge
  const selectedField = useMemo(() => {
    return operationFields?.find((f) => f.id === watchedFieldId);
  }, [operationFields, watchedFieldId]);

  // Generate random fallback subfolder once per editor mount if no title/slug exists
  const [randomFallbackSubfolder] = useState(
    () => `prog-${Math.random().toString(36).substring(2, 10)}`
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

    setUploading(true);
    try {
      const result = await uploadImage(file, "program", {
        subfolder: currentSubfolder,
        slug: currentSubfolder,
        title: watchedTitle || undefined,
      });
      setValue("thumbnail", result.url, { shouldDirty: true });
      setValue("thumbnailFileId", result.fileId, { shouldDirty: true });
      toast({ title: "Tải ảnh đại diện thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh thất bại", color: "danger" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: ProgramFormData) => {
    const submitData = serializeProgramPayload(data);

    if (mode === "create") {
      createMutation.mutate(submitData as unknown as ProgramFormData, {
        onSuccess: () => {
          toast({ title: "Tạo chương trình thành công", color: "success" });
          router.push("/programs");
        },
        onError: (err) => {
          toast({
            title: "Tạo chương trình thất bại",
            description: err.message,
            color: "danger",
          });
        },
      });
    } else {
      updateMutation.mutate(submitData as unknown as ProgramFormData, {
        onSuccess: () => {
          toast({ title: "Cập nhật chương trình thành công", color: "success" });
          router.push("/programs");
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
    <DocumentUploadProvider subfolder={currentSubfolder} folder="program">
      <div className="space-y-6">
        {/* Top Header & Global Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">
              {mode === "create" ? "Thêm chương trình mới" : `Sửa chương trình: ${program?.title || ""}`}
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
            <AppButton variant="ghost" onClick={() => router.back()}>
              Huỷ
            </AppButton>
            <AppButton
              type="button"
              onClick={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
            >
              {mode === "create" ? "Tạo chương trình" : "Lưu thay đổi"}
            </AppButton>
          </div>
        </div>

        {/* 4 Tabs Navigation Bar */}
        <div className="flex items-center border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
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
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "blocks"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Nội dung ({currentDocumentContent.blocks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reader")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
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
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "visual"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Trình chỉnh sửa trực quan
          </button>
        </div>

        {/* TAB 1: THÔNG TIN */}
        {activeTab === "info" && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Column */}
              <div className="space-y-6 lg:col-span-2">
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <FormInput
                      label="Tiêu đề chương trình"
                      isRequired
                      errorMessage={errors.title?.message}
                      {...register("title")}
                    />
                    <FormInput
                      label="Slug (Đường dẫn tĩnh)"
                      helperText="Để trống để tự động tạo từ tiêu đề"
                      errorMessage={errors.slug?.message}
                      {...register("slug")}
                    />
                    <FormTextarea
                      label="Mô tả ngắn (Hiển thị đầu bài & tóm tắt)"
                      rows={3}
                      errorMessage={errors.shortDescription?.message}
                      {...register("shortDescription")}
                    />
                  </CardContent>
                </Card>

                {/* SEO */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Tối ưu hoá SEO
                    </CardTitle>
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

              {/* Sidebar Column */}
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
                      label="Xuất bản công khai"
                      {...register("isPublished")}
                    />
                  </CardContent>
                </Card>

                {/* Operation field */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Lĩnh vực hoạt động
                    </CardTitle>
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

                {/* Thumbnail */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Ảnh đại diện (Thumbnail)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
                    {watchedThumbnail && (
                      <div className="overflow-hidden rounded-md border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={watchedThumbnail}
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
                    {uploading && (
                      <p className="text-xs text-primary">Đang tải ảnh đại diện...</p>
                    )}
                    <input type="hidden" {...register("thumbnail")} />
                    <input type="hidden" {...register("thumbnailFileId")} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: NỘI DUNG (BLOCK EDITOR) */}
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

        {/* TAB 3: ĐỌC BÀI (PHASE 08: READ-ONLY ARTICLE VIEW) */}
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
              heroImageUrl={watchedThumbnail}
              content={currentDocumentContent}
              slug={watchedSlug}
              badge={selectedField?.name}
              urlPrefix="vdcd.vn/chuong-trinh/"
            />
          </div>
        )}

        {/* TAB 4: TRÌNH CHỈNH SỬA TRỰC QUAN (VISUAL EDITOR) */}
        {activeTab === "visual" && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <VisualEditorCanvas
              title={watchedTitle}
              excerpt={watchedShortDescription}
              heroImageUrl={watchedThumbnail}
              content={currentDocumentContent}
              onContentChange={handleContentChange}
              onTitleChange={(t) => setValue("title", t, { shouldDirty: true })}
              onSubtitleChange={() => {}}
              onExcerptChange={(e) => setValue("shortDescription", e, { shouldDirty: true })}
              onHeroImageChange={(url, fileId) => {
                setValue("thumbnail", url, { shouldDirty: true });
                setValue("thumbnailFileId", fileId ?? null, { shouldDirty: true });
              }}
            />
          </div>
        )}
      </div>
    </DocumentUploadProvider>
  );
}
