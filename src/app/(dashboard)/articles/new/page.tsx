"use client";

import { useState, useMemo, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch, type FieldErrors } from "react-hook-form";
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
import { useCreateArticle, usePublishArticle } from "@/features/articles/api";
import { useProjects } from "@/features/projects/api";
import { usePrograms } from "@/features/programs/api";
import { useSolutions } from "@/features/solutions/api";
import { articleSchema, type ArticleFormData } from "@/features/articles/schema";
import { BlockEditor, BlockFormatToolbar } from "@/features/slide-detail-blogs/components/BlockEditor";
import { BlogPreviewContainer } from "@/features/slide-detail-blogs/components/BlogPreview";
import { VisualEditorCanvas } from "@/features/slide-detail-blogs/components/VisualEditor";
import { useHtmlShortcuts } from "@/features/slide-detail-blogs/hooks/useHtmlShortcuts";
import { uploadImage, validateImageFile, slugifyVietnamese, deleteUploadedImage, type UploadResult } from "@/lib/upload";
import { ImagePickerModal, type ImagePickerResult } from "@/components/shared";
import { SlideDetailBlogUploadProvider } from "@/features/slide-detail-blogs/context/SlideDetailBlogUploadContext";
import { useSanitizedPaste } from "@/features/slide-detail-blogs/hooks/useSanitizedPaste";
import { FloatingSaveBar } from "@/components/shared";
import type { SlideDetailBlogContent, SlideDetailBlogBlock } from "@/types/slide-detail-blog";

type TabMode = "editor" | "reader" | "visual";

export default function CreateArticlePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const createMutation = useCreateArticle();
  const publishMutation = usePublishArticle();
  const isSubmitting = createMutation.isPending || publishMutation.isPending;

  // Load lists for linking
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: programsData } = usePrograms({ limit: 100 });
  const { data: solutionsData } = useSolutions({ limit: 100 });

  // Tab mode
  const [activeTab, setActiveTab] = useState<TabMode>("editor");

  // Thumbnail / Hero image states
  const [thumbMode, setThumbMode] = useState<"upload" | "url">("upload");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const [failedThumbUrl, setFailedThumbUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [discardedFileIds, setDiscardedFileIds] = useState<string[]>([]);
  const [galleryFileIds, setGalleryFileIds] = useState<string[]>([]);

  const handleGalleryFileSelect = useCallback((fileId: string) => {
    if (fileId) {
      setGalleryFileIds((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
    }
  }, []);

  const handleGallerySelect = (image: ImagePickerResult) => {
    const previousFileId = getValues("thumbnailFileId");
    if (previousFileId) {
      if (!galleryFileIds.includes(previousFileId)) {
        deleteUploadedImage(previousFileId).catch((err) =>
          console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
        );
      }
      setDiscardedFileIds((prev) => prev.filter((id) => id !== previousFileId));
    }
    if (image.fileId) {
      setGalleryFileIds((prev) => (prev.includes(image.fileId!) ? prev : [...prev, image.fileId!]));
    }
    setThumbPreviewUrl(image.url);
    setThumbMode("upload");
    setFailedThumbUrl(null);
    setValue("thumbnail", image.url, { shouldValidate: true, shouldDirty: true });
    setValue("thumbnailFileId", null, { shouldDirty: true });
    toast({ title: "Đã chọn ảnh từ thư viện", color: "success" });
  };

  // SEO accordion
  const [showSeo, setShowSeo] = useState(false);

  // Paste normalization for text inputs
  const { handlePaste: handlePlainPaste } = useSanitizedPaste({ preserveLineBreaks: false });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors, isDirty },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      slug: "",
      excerpt: "",
      thumbnail: null,
      thumbnailFileId: null,
      category: "",
      tags: "",
      projectId: null,
      programId: null,
      solutionId: null,
      metaTitle: "",
      metaDescription: "",
      content: {
        version: 1,
        blocks: [],
      },
      isPublished: false,
      publishedAt: null,
    },
  });

  // Watch fields for live sync across tabs
  const watchedSlug = useWatch({ control, name: "slug" });
  const watchedTitle = useWatch({ control, name: "title" });
  const watchedSubtitle = useWatch({ control, name: "subtitle" });
  const watchedExcerpt = useWatch({ control, name: "excerpt" });
  const watchedContent = useWatch({ control, name: "content" }) as SlideDetailBlogContent;

  // Formatting shortcuts and refs for metadata fields
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const excerptInputRef = useRef<HTMLTextAreaElement>(null);

  const { handleKeyDown: handleTitleKeyDown, applyFormat: applyTitleFormat } = useHtmlShortcuts(
    (val) => setValue("title", val, { shouldDirty: true, shouldValidate: true }),
  );
  const { handleKeyDown: handleSubtitleKeyDown, applyFormat: applySubtitleFormat } = useHtmlShortcuts(
    (val) => setValue("subtitle", val, { shouldDirty: true }),
  );
  const { handleKeyDown: handleExcerptKeyDown, applyFormat: applyExcerptFormat } = useHtmlShortcuts(
    (val) => setValue("excerpt", val, { shouldDirty: true }),
  );

  const titleRegister = register("title");
  const subtitleRegister = register("subtitle");
  const excerptRegister = register("excerpt");
  const watchedProjectId = useWatch({ control, name: "projectId" });
  const watchedProgramId = useWatch({ control, name: "programId" });
  const watchedSolutionId = useWatch({ control, name: "solutionId" });

  const watchedThumbnail = useWatch({ control, name: "thumbnail" });

  const currentThumbnailPreview = thumbPreviewUrl ?? watchedThumbnail ?? null;
  const isThumbLoadError = Boolean(
    currentThumbnailPreview && failedThumbUrl === currentThumbnailPreview,
  );

  // ImageKit subfolder for article assets: slug -> title -> "" (backend generates random fallback)
  const currentSubfolder = useMemo(() => {
    const fromSlug = watchedSlug?.trim();
    if (fromSlug) return slugifyVietnamese(fromSlug);

    const fromTitle = watchedTitle?.trim();
    if (fromTitle) return slugifyVietnamese(fromTitle);

    return "";
  }, [watchedSlug, watchedTitle]);

  // Handle Thumbnail upload
  const handleThumbFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast({
        title: "File không hợp lệ",
        description: validationError,
        color: "danger",
      });
      return;
    }

    setThumbPreviewUrl(URL.createObjectURL(file));
    setThumbMode("upload");
    setFailedThumbUrl(null);
    setUploadingThumb(true);

    try {
      const result: UploadResult = await uploadImage(file, "article", {
        subfolder: currentSubfolder || undefined,
        slug: currentSubfolder || undefined,
      });
      const previousFileId = getValues("thumbnailFileId");
      if (previousFileId && previousFileId !== result.fileId) {
        if (!galleryFileIds.includes(previousFileId)) {
          deleteUploadedImage(previousFileId).catch((err) =>
            console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
          );
        }
      }
      setValue("thumbnail", result.url, { shouldValidate: true, shouldDirty: true });
      setValue("thumbnailFileId", result.fileId, { shouldDirty: true });
      setThumbPreviewUrl(result.url);
      setFailedThumbUrl(null);
      toast({ title: "Tải ảnh đại diện thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh đại diện thất bại", color: "danger" });
      setThumbPreviewUrl(null);
    } finally {
      setUploadingThumb(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // Handle Delete Thumbnail (soft-delete for gallery images, hard-delete for direct uploads)
  const handleDeleteHeroImage = () => {
    const currentFileId = getValues("thumbnailFileId");
    if (currentFileId) {
      if (!galleryFileIds.includes(currentFileId)) {
        // Direct upload from PC in unsaved new post: delete immediately from ImageKit!
        deleteUploadedImage(currentFileId).catch((err) =>
          console.warn("Lỗi xóa ảnh vừa tải lên trên ImageKit:", err),
        );
      }
      setDiscardedFileIds((prev) => prev.filter((id) => id !== currentFileId));
    }
    setValue("thumbnail", null, { shouldValidate: true, shouldDirty: true });
    setValue("thumbnailFileId", null, { shouldDirty: true });
    setThumbPreviewUrl(null);
    setFailedThumbUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const isDirectSessionUpload = currentFileId && !galleryFileIds.includes(currentFileId);
    toast({
      title: "Đã gỡ ảnh đại diện",
      description: isDirectSessionUpload
        ? "Đã xoá ảnh tải lên khỏi thư viện."
        : "Nhấn \"Lưu\" hoặc \"Xuất bản\" để hoàn tất.",
      color: "warning",
    });
  };

  // Image block discard handler (queues direct-upload fileIds for deletion on save)
  const handleImageBlockDiscard = (fileId: string) => {
    if (fileId) {
      setDiscardedFileIds((prev) =>
        prev.includes(fileId) ? prev : [...prev, fileId],
      );
    }
  };

  // Helper to scroll & highlight an error field
  const scrollToErrorField = useCallback(
    (elementId: string, targetTab: TabMode = "editor") => {
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
    [activeTab],
  );

  // Submit Handler
  const onSubmit = (data: ArticleFormData, publish = false) => {
    const payload: ArticleFormData = {
      ...data,
      isPublished: publish,
      publishedAt: publish ? data.publishedAt || new Date().toISOString() : data.publishedAt || null,
      projectId: data.projectId || null,
      programId: data.programId || null,
      solutionId: data.solutionId || null,
    };

    if (publish) {
      if (!payload.title?.trim()) {
        scrollToErrorField("field-title", "editor");
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề bài viết không được để trống (tại Tab 'Nội dung' > Mục 1).",
          color: "danger",
          duration: 8000,
          action: {
            label: "Đi tới tiêu đề",
            onClick: () => scrollToErrorField("field-title", "editor"),
          },
        });
        return;
      }
      if (!payload.content?.blocks || payload.content.blocks.length === 0) {
        scrollToErrorField("card-content-blocks", "editor");
        toast({
          title: "Không thể xuất bản",
          description: "Bài viết phải có ít nhất 1 khối nội dung (tại Tab 'Nội dung' > Mục 6).",
          color: "danger",
          duration: 8000,
          action: {
            label: "Đi tới khối nội dung",
            onClick: () => scrollToErrorField("card-content-blocks", "editor"),
          },
        });
        return;
      }
    }

    createMutation.mutate(payload, {
      onSuccess: async (createdArticle) => {
        // Clean up discarded uploaded images
        const activeBlockFileIds = new Set<string>();
        for (const b of (data.content?.blocks || []) as SlideDetailBlogBlock[]) {
          if (b.type === "image" && b.fileId) activeBlockFileIds.add(b.fileId);
          if (b.type === "section") {
            for (const child of (b as import("@/types/slide-detail-blog").SectionBlock).children || []) {
              if (child.type === "image" && child.fileId) activeBlockFileIds.add(child.fileId);
            }
          }
        }
        if (discardedFileIds.length > 0) {
          for (const fid of discardedFileIds) {
            if (
              !galleryFileIds.includes(fid) &&
              !activeBlockFileIds.has(fid) &&
              fid !== payload.thumbnailFileId
            ) {
              deleteUploadedImage(fid).catch((err) =>
                console.warn("Lỗi xóa ảnh trên ImageKit:", err),
              );
            }
          }
          setDiscardedFileIds([]);
        }

        // Nếu chọn xuất bản, đảm bảo đồng bộ trạng thái xuất bản qua endpoint /publish nếu backend chưa bật
        if (publish && createdArticle?.id && !createdArticle.isPublished) {
          try {
            await publishMutation.mutateAsync({ id: createdArticle.id, isPublished: true });
          } catch (pubErr) {
            console.warn("Lỗi đồng bộ trạng thái xuất bản:", pubErr);
          }
        }

        toast({
          title: publish ? "Đã xuất bản bài viết" : "Đã lưu bản nháp",
          color: "success",
        });
        startTransition(() => {
          router.push("/articles");
        });
      },
      onError: (error) => {
        toast({
          title: "Tạo bài viết thất bại",
          description: error.message,
          color: "danger",
        });
      },
    });
  };

  // Validation Error Handler
  const onInvalid = (fieldErrors: FieldErrors<ArticleFormData>) => {
    const contentErrors = fieldErrors.content as unknown as { blocks?: Record<string, unknown> } | undefined;
    const blockErrors = contentErrors?.blocks;

    if (blockErrors) {
      const errorKeys = Object.keys(blockErrors);
      const firstIndex = Number(errorKeys[0]);
      const currentBlocks = (watchedContent?.blocks || []) as SlideDetailBlogBlock[];
      const targetBlock = currentBlocks[firstIndex];
      const targetId = targetBlock ? `block-${targetBlock.id}` : "card-content-blocks";

      scrollToErrorField(targetId, activeTab === "visual" ? "visual" : "editor");

      toast({
        title: "Không thể lưu bài viết",
        description: "Có khối nội dung đang để trống. Vui lòng kiểm tra lại tại Tab 'Nội dung'.",
        color: "danger",
        duration: 8000,
        action: {
          label: "Đi tới khối lỗi",
          onClick: () => scrollToErrorField(targetId, activeTab === "visual" ? "visual" : "editor"),
        },
      });
      return;
    }

    if (fieldErrors.title) {
      scrollToErrorField("field-title", "editor");

      toast({
        title: "Thiếu tiêu đề bài viết",
        description: fieldErrors.title.message || "Tiêu đề bài viết không được để trống (tại Tab 'Nội dung' > Mục 1).",
        color: "danger",
        duration: 8000,
        action: {
          label: "Đi tới tiêu đề",
          onClick: () => scrollToErrorField("field-title", "editor"),
        },
      });
      return;
    }

    const firstErrorKey = Object.keys(fieldErrors)[0];
    const firstError = Object.values(fieldErrors)[0];
    const message = firstError?.message;
    const targetElementId = firstErrorKey ? `field-${firstErrorKey}` : undefined;

    if (targetElementId) {
      scrollToErrorField(targetElementId, "editor");
    }

    toast({
      title: "Không thể lưu bài viết",
      description: typeof message === "string" ? message : "Dữ liệu nhập chưa hợp lệ. Vui lòng kiểm tra lại tại Tab 'Nội dung'.",
      color: "danger",
      duration: 8000,
      ...(targetElementId
        ? {
          action: {
            label: "Đi tới vị trí lỗi",
            onClick: () => scrollToErrorField(targetElementId, "editor"),
          },
        }
        : {}),
    });
  };

  return (
    <SlideDetailBlogUploadProvider
      folder="article"
      subfolder={currentSubfolder}
      onGalleryFileSelect={handleGalleryFileSelect}
    >
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">Thêm bài viết mới</h1>
            <p className="text-sm text-text-muted">
              Tạo bài viết tin tức hoặc bài viết chuyên môn với hệ thống Block Editor.
            </p>
          </div>
          <AppButton variant="ghost" onClick={() => router.back()}>
            ← Quay lại
          </AppButton>
        </div>

        {/* Tab Switcher: [ Nội dung ] [ Đọc bài ] [ Trình chỉnh sửa trực quan ] */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === "editor"
                ? "bg-surface font-semibold text-primary shadow-xs"
                : "text-text-muted hover:text-text"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
            Nội dung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reader")}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === "reader"
                ? "bg-surface font-semibold text-primary shadow-xs"
                : "text-text-muted hover:text-text"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Đọc bài
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === "visual"
                ? "bg-surface font-semibold text-primary shadow-xs"
                : "text-text-muted hover:text-text"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm3.44-1.06a.75.75 0 111.06 1.06L14.44 10l-1.72 1.72a.75.75 0 11-1.06-1.06L13.44 10l-1.72-1.72z" clipRule="evenodd" />
            </svg>
            Trình chỉnh sửa trực quan
          </button>
        </div>

        {/* 2. Reader View Tab (Phase 08) */}
        {activeTab === "reader" && (
          <BlogPreviewContainer
            title={watchedTitle ?? ""}
            subtitle={watchedSubtitle}
            excerpt={watchedExcerpt}
            heroImageUrl={currentThumbnailPreview}
            content={watchedContent ?? { version: 1, blocks: [] }}
            slug={watchedSlug}
            urlPrefix="vdcd.vn/bai-viet/"
          />
        )}

        {/* 3. Visual Editor Tab (Phase 09) */}
        {activeTab === "visual" && (
          <VisualEditorCanvas
            title={watchedTitle ?? ""}
            subtitle={watchedSubtitle}
            excerpt={watchedExcerpt}
            heroImageUrl={currentThumbnailPreview}
            content={watchedContent ?? { version: 1, blocks: [] }}
            onContentChange={(c) => setValue("content", c, { shouldDirty: true })}
            onTitleChange={(t) => setValue("title", t, { shouldDirty: true })}
            onSubtitleChange={(s) => setValue("subtitle", s, { shouldDirty: true })}
            onExcerptChange={(e) => setValue("excerpt", e, { shouldDirty: true })}
            onHeroImageChange={(url, fileId) => {
              const prevFileId = getValues("thumbnailFileId");
              if (prevFileId && prevFileId !== fileId) {
                if (!galleryFileIds.includes(prevFileId)) {
                  deleteUploadedImage(prevFileId).catch((err) =>
                    console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
                  );
                }
                setDiscardedFileIds((prev) => prev.filter((id) => id !== prevFileId));
              }
              setValue("thumbnail", url, { shouldValidate: true, shouldDirty: true });
              setValue("thumbnailFileId", fileId ?? null, { shouldDirty: true });
              setThumbPreviewUrl(url);
              setFailedThumbUrl(null);
            }}
            onHeroImageDelete={handleDeleteHeroImage}
            onImageDiscard={handleImageBlockDiscard}
          />
        )}

        {/* 1. Form Editor Tab (Phase 07 & 10) */}
        <form className={`space-y-6 ${activeTab !== "editor" ? "hidden" : ""}`}>
          {/* Card 1: Thông tin bài viết */}
          <Card className="border border-border bg-surface shadow-xs">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                1. Thông tin bài viết
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div id="field-title" className="space-y-1.5 rounded-lg p-1 -m-1 transition-all duration-300">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-text">
                    Tiêu đề bài viết (Title) <span className="text-danger">*</span>
                  </label>
                  <BlockFormatToolbar
                    onApply={(action) => applyTitleFormat(titleInputRef.current, action)}
                    size="xs"
                  />
                </div>
                <FormInput
                  placeholder="VD: Hội nghị chuyển đổi số toàn diện tỉnh Gia Lai..."
                  errorMessage={errors.title?.message}
                  {...titleRegister}
                  ref={(el) => {
                    titleRegister.ref(el);
                    titleInputRef.current = el;
                  }}
                  onKeyDown={handleTitleKeyDown}
                  onPaste={handlePlainPaste}
                  helperText="Hỗ trợ phím tắt Ctrl+B (Đậm), Ctrl+I (Nghiêng), Ctrl+U (Gạch chân)..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-text">
                      Tiêu đề phụ (Subtitle)
                    </label>
                    <BlockFormatToolbar
                      onApply={(action) => applySubtitleFormat(subtitleInputRef.current, action)}
                      size="xs"
                    />
                  </div>
                  <FormInput
                    placeholder="VD: Hướng tới xây dựng chính quyền số và kinh tế số..."
                    errorMessage={errors.subtitle?.message}
                    {...subtitleRegister}
                    ref={(el) => {
                      subtitleRegister.ref(el);
                      subtitleInputRef.current = el;
                    }}
                    onKeyDown={handleSubtitleKeyDown}
                    onPaste={handlePlainPaste}
                  />
                </div>
                <FormInput
                  label="Đường dẫn tĩnh (Slug)"
                  placeholder="Tự sinh từ tiêu đề nếu để trống..."
                  helperText="Chỉ dùng chữ cái thường không dấu, số và dấu gạch ngang"
                  errorMessage={errors.slug?.message}
                  {...register("slug")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-text">
                    Tóm tắt bài viết (Excerpt)
                  </label>
                  <BlockFormatToolbar
                    onApply={(action) => applyExcerptFormat(excerptInputRef.current, action)}
                    size="xs"
                  />
                </div>
                <FormTextarea
                  rows={2}
                  placeholder="Mô tả ngắn hiển thị trên thẻ bài viết và mạng xã hội..."
                  errorMessage={errors.excerpt?.message}
                  {...excerptRegister}
                  ref={(el) => {
                    excerptRegister.ref(el);
                    excerptInputRef.current = el;
                  }}
                  onKeyDown={handleExcerptKeyDown}
                  onPaste={handlePlainPaste}
                  helperText="Hỗ trợ phím tắt Ctrl+B (Đậm), Ctrl+I (Nghiêng), Ctrl+U (Gạch chân)..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Ảnh đại diện / Thumbnail */}
          <Card className="border border-border bg-surface shadow-xs">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                2. Ảnh đại diện (Thumbnail / Hero Image)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text">
                  Ảnh bìa bài viết
                </label>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted p-0.5">
                  <button
                    type="button"
                    onClick={() => setThumbMode("upload")}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${thumbMode === "upload"
                        ? "bg-surface font-semibold text-primary shadow-xs"
                        : "text-text-muted hover:text-text"
                      }`}
                  >
                    Tải ảnh lên
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbMode("url")}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${thumbMode === "url"
                        ? "bg-surface font-semibold text-primary shadow-xs"
                        : "text-text-muted hover:text-text"
                      }`}
                  >
                    Nhập URL
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border bg-surface-muted">
                {currentThumbnailPreview && !isThumbLoadError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentThumbnailPreview}
                    alt="Thumbnail Preview"
                    className="h-44 w-full object-cover transition-opacity duration-200"
                    onError={() => setFailedThumbUrl(currentThumbnailPreview)}
                    onLoad={() => setFailedThumbUrl(null)}
                  />
                ) : (
                  <div className="flex min-h-36 w-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-text-muted">
                    <span>Chưa có ảnh đại diện</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                      Nhấn để chọn ảnh từ máy tính
                    </button>
                  </div>
                )}
              </div>

              {thumbMode === "upload" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-muted">
                    {uploadingThumb ? "Đang tải ảnh..." : "Chọn ảnh từ máy tính"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleThumbFileChange}
                      disabled={uploadingThumb}
                    />
                  </label>
                  {currentThumbnailPreview && (
                    <button
                      type="button"
                      onClick={handleDeleteHeroImage}
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
                      Xoá ảnh Hero
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowGallery(true)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-muted"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0L2.5 11.06z" clipRule="evenodd" />
                    </svg>
                    Chọn từ thư viện
                  </button>
                  <span className="text-xs text-text-muted">
                    JPG, PNG, WebP • Tối đa 10MB
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <FormInput
                    label="URL ảnh ImageKit / CDN"
                    placeholder="https://ik.imagekit.io/..."
                    value={watchedThumbnail || ""}
                    onChange={(e) => {
                      setFailedThumbUrl(null);
                      setValue("thumbnail", e.target.value, { shouldDirty: true });
                      setValue("thumbnailFileId", null, { shouldDirty: true });
                    }}
                  />
                  {currentThumbnailPreview && (
                    <button
                      type="button"
                      onClick={handleDeleteHeroImage}
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
                      Xoá ảnh Hero
                    </button>
                  )}
                </div>
              )}
              <ImagePickerModal
                isOpen={showGallery}
                onClose={() => setShowGallery(false)}
                onSelect={handleGallerySelect}
                defaultFolder="/vdcd/articles"
                uploadFolder="article"
                uploadOptions={{ subfolder: currentSubfolder, slug: currentSubfolder }}
                title="Chọn ảnh bài viết"
              />
            </CardContent>
          </Card>

          {/* Card 3: Phân loại & Thẻ */}
          <Card className="border border-border bg-surface shadow-xs">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                3. Phân loại & Thẻ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Danh mục (Category)"
                  placeholder="VD: Tin tức, Chuyển đổi số, Sự kiện..."
                  errorMessage={errors.category?.message}
                  {...register("category")}
                />
                <FormInput
                  label="Thẻ (Tags)"
                  placeholder="VD: cong-nghe, gia-lai, chuyen-doi-so"
                  helperText="Phân cách bằng dấu phẩy"
                  errorMessage={errors.tags?.message}
                  {...register("tags")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Liên kết thực thể (Relations) */}
          <Card className="border border-border bg-surface shadow-xs">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                4. Liên kết thực thể (Relations)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text">
                    Dự án liên kết (Project)
                  </label>
                  <DropdownSelect
                    value={watchedProjectId || ""}
                    onChange={(val) => setValue("projectId", val || null, { shouldDirty: true })}
                    placeholder="— Không liên kết —"
                    options={[
                      { value: "", label: "— Không liên kết —" },
                      ...(projectsData?.items?.map((p) => ({
                        value: p.id,
                        label: p.title,
                      })) ?? []),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text">
                    Chương trình liên kết (Program)
                  </label>
                  <DropdownSelect
                    value={watchedProgramId || ""}
                    onChange={(val) => setValue("programId", val || null, { shouldDirty: true })}
                    placeholder="— Không liên kết —"
                    options={[
                      { value: "", label: "— Không liên kết —" },
                      ...(programsData?.items?.map((p) => ({
                        value: p.id,
                        label: p.title,
                      })) ?? []),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text">
                    Giải pháp liên kết (Solution)
                  </label>
                  <DropdownSelect
                    value={watchedSolutionId || ""}
                    onChange={(val) => setValue("solutionId", val || null, { shouldDirty: true })}
                    placeholder="— Không liên kết —"
                    options={[
                      { value: "", label: "— Không liên kết —" },
                      ...(solutionsData?.items?.map((s) => ({
                        value: s.id,
                        label: s.title,
                      })) ?? []),
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Cấu hình SEO */}
          <Card className="border border-border bg-surface shadow-xs">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <div className="flex w-full items-center justify-between">
                <CardTitle className="text-base font-semibold text-text">
                  5. Tối ưu hoá SEO
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setShowSeo(!showSeo)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {showSeo ? "▼ Thu gọn" : "▶ Mở rộng"}
                </button>
              </div>
            </CardHeader>
            {showSeo && (
              <CardContent className="space-y-4 p-5">
                <FormInput
                  label="SEO Meta Title"
                  placeholder="VD: Hội nghị chuyển đổi số Gia Lai | VDCD"
                  maxLength={255}
                  errorMessage={errors.metaTitle?.message}
                  {...register("metaTitle")}
                />
                <FormTextarea
                  label="SEO Meta Description"
                  rows={2}
                  placeholder="Mô tả tóm tắt hiển thị trên kết quả tìm kiếm Google..."
                  maxLength={500}
                  errorMessage={errors.metaDescription?.message}
                  {...register("metaDescription")}
                />
              </CardContent>
            )}
          </Card>

          {/* Card 6: Nội dung bài viết (Block Editor) */}
          <Card id="card-content-blocks" className="border border-border bg-surface shadow-xs transition-all duration-300">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                6. Nội dung bài viết (Block Editor)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <BlockEditor
                    value={field.value as SlideDetailBlogContent}
                    onChange={field.onChange}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Card 7: Xuất bản & Ngày xuất bản */}
          <Card className="border border-border bg-surface shadow-xs">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                7. Xuất bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <FormCheckbox label="Xuất bản bài viết ngay" {...register("isPublished")} />
              <FormInput
                type="datetime-local"
                label="Ngày xuất bản"
                helperText="Nếu để trống, sẽ tự động lấy thời điểm hiện tại khi xuất bản"
                errorMessage={errors.publishedAt?.message}
                {...register("publishedAt")}
              />
            </CardContent>
          </Card>

          {/* Footer Form Actions */}
          <div data-bottom-save-bar className="flex items-center justify-end gap-3 pt-2">
            <AppButton variant="ghost" type="button" onClick={() => router.back()}>
              Huỷ
            </AppButton>
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
              Xuất bản bài viết
            </AppButton>
          </div>
        </form>

        {/* Floating/Fixed Footer when in Reader or Visual Tab */}
        {activeTab !== "editor" && (
          <div data-bottom-save-bar className="flex items-center justify-end gap-3 pt-2">
            <AppButton variant="ghost" type="button" onClick={() => router.back()}>
              Huỷ
            </AppButton>
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
              Xuất bản bài viết
            </AppButton>
          </div>
        )}

        {/* Floating Save Bar cố định ở góc dưới bên phải màn hình khi có thay đổi */}
        <FloatingSaveBar
          isVisible={isDirty && (activeTab === "editor" || activeTab === "visual")}
          statusText="Có thay đổi chưa lưu"
        >
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
            Xuất bản bài viết
          </AppButton>
        </FloatingSaveBar>
      </div>
    </SlideDetailBlogUploadProvider>
  );
}
