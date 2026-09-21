"use client";

import React, { useState, useEffect, useMemo, useCallback, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import {
  FormInput,
  FormTextarea,
  AppButton,
  useToast,
  DropdownSelect,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui";
import { FloatingSaveBar } from "@/components/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useOperationFields } from "@/features/operation-fields/api";
import {
  useCreateSolution,
  useUpdateSolution,
  usePublishSolution,
  useDeleteSolution,
  solutionKeys,
} from "../api";
import { usePermission } from "@/hooks/usePermission";
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
  type DocumentBlock,
  type SectionBlock,
} from "@/shared/content-editor";
import { uploadImage, validateImageFile, slugifyVietnamese, deleteUploadedImage } from "@/lib/upload";
import { ImagePickerModal, type ImagePickerResult } from "@/components/shared";
import type { Solution } from "@/types/solution";

type EditorTab = "info" | "blocks" | "reader" | "visual";

export interface SolutionEditorProps {
  mode: "create" | "edit";
  solution?: Solution;
}

export function SolutionEditor({ mode, solution }: SolutionEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateSolution();
  const updateMutation = useUpdateSolution(solution?.id ?? "");
  const publishMutation = usePublishSolution();
  const deleteMutation = useDeleteSolution();
  const { data: operationFields } = useOperationFields();

  const canDelete = usePermission("solutions:delete");
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    () => solution?.thumbnail ?? null,
  );
  const [prevSolutionThumbnail, setPrevSolutionThumbnail] = useState(solution?.thumbnail);
  if (solution?.thumbnail !== prevSolutionThumbnail) {
    setPrevSolutionThumbnail(solution?.thumbnail);
    setThumbnailPreview(solution?.thumbnail ?? null);
  }
  const [showGallery, setShowGallery] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Gallery-sourced file IDs — images picked from ImageKit gallery are NEVER deleted on ImageKit
  const [galleryFileIds, setGalleryFileIds] = useState<string[]>([]);

  // Discarded thumbnail file IDs for cleanup
  const [discardedThumbnailFileIds, setDiscardedThumbnailFileIds] = useState<string[]>([]);
  // Discarded content image file IDs (deleted blocks, replaced images)
  const [discardedContentFileIds, setDiscardedContentFileIds] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<EditorTab>("info");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    getValues,
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

  const handleGallerySelect = (image: ImagePickerResult) => {
    const previousFileId = getValues("thumbnailFileId");
    if (previousFileId && !galleryFileIds.includes(previousFileId)) {
      if (previousFileId !== solution?.thumbnailFileId) {
        deleteUploadedImage(previousFileId).catch((err) =>
          console.warn("Lỗi xóa ảnh cũ vừa tải lên trên ImageKit:", err),
        );
        setDiscardedThumbnailFileIds((prev) => prev.filter((id) => id !== previousFileId));
      }
    }
    if (image.fileId) {
      setGalleryFileIds((prev) => (prev.includes(image.fileId!) ? prev : [...prev, image.fileId!]));
    }
    setThumbnailPreview(image.url);
    setValue("thumbnail", image.url, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue("thumbnailFileId", image.fileId ?? null, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
    toast({ title: "Đã chọn ảnh đại diện từ thư viện", color: "success" });
  };

  // Handle Soft-Delete Thumbnail (like Hero in slide-detail-blogs and ProjectEditor)
  const handleDeleteThumbnail = () => {
    const currentFileId = getValues("thumbnailFileId");
    const isDirectSessionUpload =
      currentFileId &&
      !galleryFileIds.includes(currentFileId) &&
      currentFileId !== solution?.thumbnailFileId;

    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      if (currentFileId !== solution?.thumbnailFileId) {
        // Direct upload in this session not yet saved to DB: delete immediately from ImageKit!
        deleteUploadedImage(currentFileId).catch((err) =>
          console.warn("Lỗi xóa ảnh vừa tải lên trên ImageKit:", err),
        );
        setDiscardedThumbnailFileIds((prev) => prev.filter((id) => id !== currentFileId));
      }
      // DB-persisted thumbnail: preserved in ImageKit (soft-delete from solution only)
    }
    setValue("thumbnail", "", { shouldDirty: true, shouldValidate: true, shouldTouch: true });
    setValue("thumbnailFileId", null, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
    toast({
      title: "Đã gỡ ảnh đại diện",
      description: isDirectSessionUpload
        ? "Đã xoá ảnh tải lên khỏi thư viện."
        : 'Nhấn "Lưu thay đổi" để hoàn tất cập nhật giải pháp.',
      color: "warning",
    });
  };

  // Image block discard handler (queues direct-upload fileIds for deletion on save)
  const handleImageBlockDiscard = (fileId: string) => {
    if (fileId) {
      setDiscardedContentFileIds((prev) =>
        prev.includes(fileId) ? prev : [...prev, fileId],
      );
    }
  };

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
  const watchedIsPublished = useWatch({ control, name: "isPublished" });
  const isCurrentlyPublished = watchedIsPublished ?? solution?.isPublished ?? false;

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

    setUploading(true);
    try {
      const result = await uploadImage(file, "solution", {
        subfolder: currentSubfolder,
        slug: currentSubfolder,
        title: watchedTitle || undefined,
      });
      const previousFileId = getValues("thumbnailFileId");
      if (previousFileId && !galleryFileIds.includes(previousFileId)) {
        if (previousFileId !== solution?.thumbnailFileId) {
          deleteUploadedImage(previousFileId).catch((err) =>
            console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
          );
          setDiscardedThumbnailFileIds((prev) => prev.filter((id) => id !== previousFileId));
        }
      }
      setValue("thumbnail", result.url, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      setValue("thumbnailFileId", result.fileId, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      setThumbnailPreview(result.url);
      toast({ title: "Tải ảnh thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh thất bại", color: "danger" });
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const [, startTransition] = useTransition();
  const isSubmitting = createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  // Helper to scroll & highlight an error field
  const scrollToErrorField = useCallback(
    (elementId: string, targetTab: EditorTab = "info") => {
      if (activeTab !== targetTab) {
        setActiveTab(targetTab);
      }

      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("field-error-highlight");
          const focusable = el.querySelector<HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement>(
            "button, input, select, textarea, [contenteditable='true']",
          );
          if (focusable) {
            try {
              focusable.focus({ preventScroll: true });
            } catch {
              // Ignore focus error
            }
          }
          setTimeout(() => {
            el.classList.remove("field-error-highlight");
          }, 3000);
        }
      }, 100);
    },
    [activeTab, setActiveTab],
  );

  // Submit Handler — supports both draft and publish in create mode, and preserves status in edit mode
  const onSubmit = (data: SolutionFormData, publish?: boolean) => {
    const targetIsPublished =
      mode === "create"
        ? Boolean(publish)
        : publish !== undefined
          ? publish
          : (data.isPublished ?? solution?.isPublished ?? false);

    const submitData = serializeSolutionPayload({
      ...data,
      isPublished: targetIsPublished,
      tempFolderKey: randomFallbackSubfolder,
    });

    if (mode === "create") {
      // Publish validation in create mode
      if (publish) {
        if (!data.title?.trim()) {
          scrollToErrorField("field-title", "info");
          toast({
            title: "Không thể xuất bản",
            description: "Tiêu đề giải pháp không được để trống.",
            color: "danger",
            duration: 8000,
            action: {
              label: "Đi tới tiêu đề",
              onClick: () => scrollToErrorField("field-title", "info"),
            },
          });
          return;
        }
      }

      createMutation.mutate(submitData as unknown as SolutionFormData, {
        onSuccess: async (createdSolution) => {
          // Clean up discarded images on successful save
          const activeBlockFileIds = new Set<string>();
          for (const b of ((submitData.content as DocumentContent)?.blocks || []) as DocumentBlock[]) {
            if (b.type === "image" && b.fileId) activeBlockFileIds.add(b.fileId);
            if (b.type === "section") {
              for (const child of (b as SectionBlock).children || []) {
                if (child.type === "image" && child.fileId) activeBlockFileIds.add(child.fileId);
              }
            }
          }
          const allDiscarded = [...discardedThumbnailFileIds, ...discardedContentFileIds];
          if (allDiscarded.length > 0) {
            for (const fid of allDiscarded) {
              if (
                !galleryFileIds.includes(fid) &&
                !activeBlockFileIds.has(fid) &&
                fid !== submitData.thumbnailFileId
              ) {
                deleteUploadedImage(fid).catch((err) =>
                  console.warn("Lỗi dọn rác ảnh ImageKit:", err),
                );
              }
            }
            setDiscardedThumbnailFileIds([]);
            setDiscardedContentFileIds([]);
          }

          const solutionId =
            createdSolution?.id ||
            (createdSolution as unknown as { data?: { id?: string } })?.data?.id;

          // If publish is requested, ensure it's published via /publish endpoint
          if (publish && solutionId) {
            try {
              await publishMutation.mutateAsync({ id: solutionId, isPublished: true });
            } catch (pubErr) {
              console.warn("Lỗi đồng bộ trạng thái xuất bản:", pubErr);
            }
          }

          await queryClient.invalidateQueries({ queryKey: solutionKeys.all });

          toast({
            title: publish ? "Đã xuất bản giải pháp" : "Đã lưu bản nháp",
            color: "success",
          });
          startTransition(() => {
            router.push("/solutions");
          });
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
      // Edit mode: save content without redirect, keep user on page
      updateMutation.mutate(submitData as unknown as SolutionFormData, {
        onSuccess: () => {
          // Clean up discarded images on successful update
          const activeBlockFileIds = new Set<string>();
          for (const b of ((submitData.content as DocumentContent)?.blocks || []) as DocumentBlock[]) {
            if (b.type === "image" && b.fileId) activeBlockFileIds.add(b.fileId);
            if (b.type === "section") {
              for (const child of (b as SectionBlock).children || []) {
                if (child.type === "image" && child.fileId) activeBlockFileIds.add(child.fileId);
              }
            }
          }
          const allDiscarded = [...discardedThumbnailFileIds, ...discardedContentFileIds];
          if (allDiscarded.length > 0) {
            for (const fid of allDiscarded) {
              if (
                !galleryFileIds.includes(fid) &&
                !activeBlockFileIds.has(fid) &&
                fid !== submitData.thumbnailFileId
              ) {
                deleteUploadedImage(fid).catch((err) =>
                  console.warn("Lỗi dọn rác ảnh ImageKit:", err),
                );
              }
            }
            setDiscardedThumbnailFileIds([]);
            setDiscardedContentFileIds([]);
          }
          toast({ title: "Đã lưu thay đổi", color: "success" });
        },
        onError: (err) => {
          toast({
            title: "Lưu thất bại",
            description: err.message,
            color: "danger",
          });
        },
      });
    }
  };

  // Validation Error Handler (for create mode forms)
  const onInvalid = useCallback((fieldErrors: FieldErrors<SolutionFormData>) => {
    if (fieldErrors.title) {
      scrollToErrorField("field-title", "info");
      toast({
        title: "Thiếu tiêu đề giải pháp",
        description: fieldErrors.title.message || "Tiêu đề giải pháp không được để trống.",
        color: "danger",
        duration: 8000,
        action: {
          label: "Đi tới tiêu đề",
          onClick: () => scrollToErrorField("field-title", "info"),
        },
      });
      return;
    }

    const firstErrorKey = Object.keys(fieldErrors)[0];
    const firstError = Object.values(fieldErrors)[0];
    const message = firstError?.message;
    const targetElementId = firstErrorKey ? `field-${firstErrorKey}` : undefined;

    if (targetElementId) {
      scrollToErrorField(targetElementId, "info");
    }

    toast({
      title: "Không thể lưu giải pháp",
      description: typeof message === "string" ? message : "Dữ liệu nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
      color: "danger",
      duration: 8000,
      ...(targetElementId
        ? {
          action: {
            label: "Đi tới vị trí lỗi",
            onClick: () => scrollToErrorField(targetElementId, "info"),
          },
        }
        : {}),
    });
  }, [scrollToErrorField, toast]);

  // Toggle Publish (edit mode only)
  const handleTogglePublish = (publish: boolean) => {
    if (!solution) return;

    if (publish) {
      if (!watchedTitle?.trim()) {
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề giải pháp không được để trống",
          color: "danger",
        });
        return;
      }
    }

    publishMutation.mutate(
      { id: solution.id, isPublished: publish },
      {
        onSuccess: () => {
          setValue("isPublished", publish, { shouldDirty: false });
          queryClient.setQueryData(solutionKeys.detail(solution.id), (old: Solution | undefined) =>
            old ? { ...old, isPublished: publish } : old,
          );
          queryClient.invalidateQueries({ queryKey: solutionKeys.all });
          queryClient.invalidateQueries({ queryKey: solutionKeys.detail(solution.id) });
          toast({
            title: publish ? "Đã xuất bản giải pháp" : "Đã chuyển về bản nháp",
            color: "success",
          });
        },
        onError: (error) => {
          toast({
            title: "Thao tác thất bại",
            description: error.message,
            color: "danger",
          });
        },
      },
    );
  };

  // Handle Delete (edit mode only)
  const handleDelete = () => {
    if (!solution) return;
    deleteMutation.mutate(solution.id, {
      onSuccess: () => {
        toast({ title: "Đã xoá giải pháp thành công", color: "success" });
        router.push("/solutions");
      },
      onError: (error) => {
        toast({
          title: "Xoá thất bại",
          description: error.message,
          color: "danger",
        });
      },
    });
  };

  return (
    <DocumentUploadProvider subfolder={currentSubfolder} folder="solution">
      <div className="space-y-6 pb-12">
        {/* Top Header & Global Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text">
                {mode === "create" ? "Thêm giải pháp mới" : `Sửa giải pháp: ${solution?.title || ""}`}
              </h1>
              {mode === "edit" && solution && (
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${isCurrentlyPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                >
                  {isCurrentlyPublished ? "Đã xuất bản" : "Bản nháp"}
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted">
              Quản lý thông tin, khối nội dung, chế độ đọc và trình chỉnh sửa trực quan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {mode === "edit" && solution && (
              isCurrentlyPublished ? (
                <AppButton
                  variant="ghost"
                  isLoading={publishMutation.isPending}
                  onClick={() => handleTogglePublish(false)}
                  className="border border-border text-xs"
                >
                  Gỡ xuất bản (Về nháp)
                </AppButton>
              ) : (
                <AppButton
                  color="success"
                  isLoading={publishMutation.isPending}
                  onClick={() => handleTogglePublish(true)}
                  className="text-xs text-white"
                >
                  Xuất bản
                </AppButton>
              )
            )}
            <AppButton variant="ghost" onClick={() => router.back()}>
              ← Quay lại
            </AppButton>
          </div>
        </div>

        {/* 4 Tabs Navigation Bar */}
        <div className="flex items-center border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "info"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
              }`}
          >
            Thông tin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("blocks")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "blocks"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
              }`}
          >
            Nội dung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reader")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "reader"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
              }`}
          >
            Đọc bài
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "visual"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
              }`}
          >
            Trình chỉnh sửa trực quan
          </button>
        </div>

        {/* TAB 1: THÔNG TIN — 2-column layout without thumbnail */}
        {activeTab === "info" && (
          <form onSubmit={handleSubmit((data) => onSubmit(data))}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Column — Thông tin cơ bản */}
              <div className="space-y-6 lg:col-span-2">
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div id="field-title" className="rounded-lg p-1 -m-1 transition-all duration-300">
                      <FormInput
                        label="Tiêu đề giải pháp"
                        isRequired
                        placeholder="Nhập tiêu đề giải pháp..."
                        errorMessage={errors.title?.message}
                        {...register("title")}
                      />
                    </div>

                    <FormInput
                      label="Slug (Đường dẫn tĩnh)"
                      placeholder="giai-phap-chuyen-doi-so"
                      helperText="Để trống để tự động tạo từ tiêu đề"
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
                      rows={2}
                      helperText="Tối đa 160 ký tự"
                      errorMessage={errors.metaDescription?.message}
                      {...register("metaDescription")}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Column — Lĩnh vực + Thống kê */}
              <div className="space-y-6">
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Lĩnh vực hoạt động
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
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

                {/* Thumbnail — Optional with Delete mechanism */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="text-base font-semibold text-text">
                        Ảnh đại diện (Thumbnail)
                      </CardTitle>
                      <span className="text-xs text-text-muted">Tuỳ chọn</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
                    {currentThumbnail ? (
                      <div className="space-y-3">
                        <div className="group relative overflow-hidden rounded-lg border border-border bg-surface-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentThumbnail}
                            alt="Thumbnail preview"
                            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-muted">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3.5 w-3.5 text-primary"
                            >
                              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                            </svg>
                            {uploading ? "Đang tải..." : "Thay đổi ảnh"}
                            <input
                              ref={thumbnailInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={handleThumbnailUpload}
                              disabled={uploading}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowGallery(true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text shadow-xs transition-colors hover:bg-surface-muted"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3.5 w-3.5 text-primary"
                            >
                              <path
                                fillRule="evenodd"
                                d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0L2.5 11.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Chọn từ thư viện
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteThumbnail}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-danger/30 bg-danger/5 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3.5 w-3.5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Xoá ảnh đại diện
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center bg-surface-muted/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-8 w-8 text-text-muted mb-2"
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <span className="text-xs font-medium text-text">
                          {uploading ? "Đang tải ảnh lên..." : "Chưa có ảnh đại diện"}
                        </span>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text shadow-xs transition-colors hover:bg-surface-muted">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3.5 w-3.5 text-primary"
                            >
                              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                            </svg>
                            Tải lên ảnh đại diện
                            <input
                              ref={thumbnailInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={handleThumbnailUpload}
                              disabled={uploading}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowGallery(true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text shadow-xs transition-colors hover:bg-surface-muted"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3.5 w-3.5 text-primary"
                            >
                              <path
                                fillRule="evenodd"
                                d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0L2.5 11.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Chọn từ thư viện
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-text-muted">
                      Lưu vào /vdcd/solutions/{currentSubfolder}
                    </p>
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

                {/* Stats Card (edit mode) */}
                {mode === "edit" && solution && (
                  <Card className="border border-border bg-surface shadow-sm">
                    <CardHeader className="border-b border-border px-5 py-3.5">
                      <CardTitle className="text-base font-semibold text-text">
                        Thông tin bổ sung
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Trạng thái</span>
                        <span className={`font-semibold ${solution.isPublished ? "text-emerald-600" : "text-amber-600"}`}>
                          {solution.isPublished ? "Đã xuất bản" : "Bản nháp"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Slug</span>
                        <span className="font-mono text-xs text-text">{watchedSlug || "—"}</span>
                      </div>
                      {solution.createdAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-muted">Ngày tạo</span>
                          <span className="text-text">{new Date(solution.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                      )}
                      {solution.updatedAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-muted">Cập nhật</span>
                          <span className="text-text">{new Date(solution.updatedAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Footer — Tab "Thông tin" (inside <form>) */}
            <div data-bottom-save-bar className="flex items-center justify-between pt-6">
              {mode === "edit" && canDelete ? (
                <AppButton
                  type="button"
                  variant="ghost"
                  color="danger"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-xs text-danger hover:bg-danger/10"
                >
                  Xoá giải pháp
                </AppButton>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                {isDirty && (
                  <p className="text-xs text-warning">Có thay đổi chưa lưu</p>
                )}
                <AppButton variant="ghost" type="button" onClick={() => router.back()}>
                  Huỷ
                </AppButton>
                {mode === "create" ? (
                  <>
                    <AppButton
                      type="button"
                      variant="ghost"
                      isLoading={isSubmitting}
                      onClick={handleSubmit((data) => onSubmit(data, false), onInvalid)}
                      className="border border-border"
                    >
                      Lưu bản nháp
                    </AppButton>
                    <AppButton
                      type="button"
                      isLoading={isSubmitting}
                      onClick={handleSubmit((data) => onSubmit(data, true), onInvalid)}
                    >
                      Xuất bản
                    </AppButton>
                  </>
                ) : (
                  <AppButton
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={!isDirty || isSubmitting}
                  >
                    Lưu thay đổi
                  </AppButton>
                )}
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
                const prevFileId = getValues("thumbnailFileId");
                if (prevFileId && prevFileId !== fileId) {
                  if (!galleryFileIds.includes(prevFileId)) {
                    if (prevFileId !== solution?.thumbnailFileId) {
                      deleteUploadedImage(prevFileId).catch((err) =>
                        console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
                      );
                      setDiscardedThumbnailFileIds((prev) => prev.filter((id) => id !== prevFileId));
                    }
                  }
                }
                setThumbnailPreview(url);
                setValue("thumbnail", url, {
                  shouldDirty: true,
                  shouldValidate: true,
                  shouldTouch: true,
                });
                setValue("thumbnailFileId", fileId ?? null, {
                  shouldDirty: true,
                  shouldValidate: true,
                  shouldTouch: true,
                });
              }}
              onHeroImageDelete={handleDeleteThumbnail}
              onImageDiscard={handleImageBlockDiscard}
              simulatedUrl={`vdcd.vn/giai-phap/${watchedSlug || "..."}`}
            />
          </div>
        )}

        {/* Footer — visible when NOT on the "Thông tin" tab (which has its own footer inside <form>) */}
        {activeTab !== "info" && (
          <div data-bottom-save-bar className="flex items-center justify-between pt-2">
            {mode === "edit" && canDelete ? (
              <AppButton
                type="button"
                variant="ghost"
                color="danger"
                onClick={() => setShowDeleteModal(true)}
                className="text-xs text-danger hover:bg-danger/10"
              >
                Xoá giải pháp
              </AppButton>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {isDirty && (
                <p className="text-xs text-warning">Có thay đổi chưa lưu</p>
              )}
              <AppButton variant="ghost" type="button" onClick={() => router.back()}>
                Huỷ
              </AppButton>
              {mode === "create" ? (
                <>
                  <AppButton
                    type="button"
                    variant="ghost"
                    isLoading={isSubmitting}
                    onClick={handleSubmit((data) => onSubmit(data, false), onInvalid)}
                    className="border border-border"
                  >
                    Lưu bản nháp
                  </AppButton>
                  <AppButton
                    type="button"
                    isLoading={isSubmitting}
                    onClick={handleSubmit((data) => onSubmit(data, true), onInvalid)}
                  >
                    Xuất bản
                  </AppButton>
                </>
              ) : (
                <AppButton
                  type="button"
                  isLoading={isSubmitting}
                  disabled={!isDirty || isSubmitting}
                  onClick={handleSubmit((data) => onSubmit(data))}
                >
                  Lưu thay đổi
                </AppButton>
              )}
            </div>
          </div>
        )}

        {/* Floating Save Bar — visible in both create and edit mode when isDirty */}
        <FloatingSaveBar
          isVisible={isDirty}
          statusText="Có thay đổi chưa lưu"
        >
          {mode === "create" ? (
            <>
              <AppButton
                type="button"
                variant="ghost"
                isLoading={isSubmitting}
                onClick={handleSubmit((data) => onSubmit(data, false), onInvalid)}
                className="border border-border bg-surface text-xs"
              >
                Lưu bản nháp
              </AppButton>
              <AppButton
                type="button"
                isLoading={isSubmitting}
                onClick={handleSubmit((data) => onSubmit(data, true), onInvalid)}
                className="text-xs"
              >
                Xuất bản
              </AppButton>
            </>
          ) : (
            <AppButton
              type="button"
              isLoading={updateMutation.isPending}
              disabled={!isDirty || isSubmitting}
              onClick={handleSubmit((data) => onSubmit(data))}
              className="text-xs"
            >
              Lưu thay đổi
            </AppButton>
          )}
        </FloatingSaveBar>

        {/* Modal xác nhận xoá giải pháp */}
        {mode === "edit" && solution && (
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <ModalContent>
              <ModalHeader>Xác nhận xoá giải pháp</ModalHeader>
              <ModalBody>
                <p>
                  Bạn có chắc muốn xoá vĩnh viễn giải pháp{" "}
                  <strong>{solution.title}</strong>?
                </p>
                <p className="text-sm text-text-muted">
                  Hành động này không thể hoàn tác.
                </p>
              </ModalBody>
              <ModalFooter>
                <AppButton
                  variant="ghost"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Huỷ
                </AppButton>
                <AppButton
                  color="danger"
                  isLoading={deleteMutation.isPending}
                  onClick={handleDelete}
                >
                  Xoá vĩnh viễn
                </AppButton>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </div>
    </DocumentUploadProvider>
  );
}
