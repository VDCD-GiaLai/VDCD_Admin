"use client";

import { useState, useEffect, useMemo, useRef, useTransition, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import {
  FormInput,
  FormTextarea,
  AppButton,
  Spinner,
  DropdownSelect,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useSlides } from "@/features/slides/api";
import {
  useCreateSlideDetailBlog,
  useSlideDetailBlogs,
  useSlideDetailBlogBySlide,
} from "@/features/slide-detail-blogs/api";
import {
  slideDetailBlogSchema,
  type SlideDetailBlogFormData,
} from "@/features/slide-detail-blogs/schema";
import { BlockEditor, BlockFormatToolbar } from "@/features/slide-detail-blogs/components/BlockEditor";
import { BlogPreviewContainer } from "@/features/slide-detail-blogs/components/BlogPreview";
import { VisualEditorCanvas } from "@/features/slide-detail-blogs/components/VisualEditor";
import { BlogExportModal } from "@/features/slide-detail-blogs/components/ExportModal";
import { useHtmlShortcuts } from "@/features/slide-detail-blogs/hooks/useHtmlShortcuts";
import { uploadImage, validateImageFile, slugifyVietnamese, deleteUploadedImage, type UploadResult } from "@/lib/upload";
import { ApiError } from "@/lib/api-client";
import { ImagePickerModal, type ImagePickerResult } from "@/components/shared";
import { SlideDetailBlogUploadProvider } from "@/features/slide-detail-blogs/context/SlideDetailBlogUploadContext";
import { FloatingSaveBar } from "@/components/shared";
import type { SlideDetailBlogContent, SlideDetailBlogBlock, HeroMeta } from "@/types/slide-detail-blog";
import { normalizeSlideDetailBlogContent } from "@/features/slide-detail-blogs/utils/blog-content";

function NewSlideDetailBlogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledSlideId = searchParams.get("slideId") ?? "";

  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const { data: slides, isLoading: loadingSlides } = useSlides();
  const { data: existingBlogs } = useSlideDetailBlogs({ limit: 100 });
  const createMutation = useCreateSlideDetailBlog();

  // Hero image states
  const [heroMode, setHeroMode] = useState<"upload" | "url">("upload");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);
  const [failedHeroUrl, setFailedHeroUrl] = useState<string | null>(null);
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
    const previousFileId = getValues("heroImageFileId");
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
    setHeroPreviewUrl(image.url);
    setHeroMode("upload");
    setFailedHeroUrl(null);
    setValue("heroImageUrl", image.url, { shouldValidate: true, shouldDirty: true });
    setValue("heroImageFileId", null, { shouldDirty: true });
    toast({ title: "Đã chọn ảnh từ thư viện", color: "success" });
  };

  // SEO card toggle
  const [showSeo, setShowSeo] = useState(false);

  type TabMode = "editor" | "reader" | "visual";
  const [activeTab, setActiveTab] = useState<TabMode>("editor");
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors, isDirty },
  } = useForm<SlideDetailBlogFormData>({
    resolver: zodResolver(slideDetailBlogSchema),
    defaultValues: {
      slideId: prefilledSlideId,
      title: "",
      subtitle: "",
      slug: "",
      excerpt: "",
      heroImageUrl: null,
      heroImageFileId: null,
      seoTitle: "",
      metaDescription: "",
      content: {
        version: 1,
        blocks: [],
      },
      isPublished: false,
    },
  });

  const watchedSlideId = useWatch({ control, name: "slideId" });
  const watchedHeroUrl = useWatch({ control, name: "heroImageUrl" });
  const currentPreview = heroPreviewUrl ?? watchedHeroUrl ?? null;
  const isHeroLoadError = Boolean(currentPreview && failedHeroUrl === currentPreview);

  // Watch fields for live preview (reads form state, not saved DB data)
  const watchedSlug = useWatch({ control, name: "slug" });
  const previewTitle = useWatch({ control, name: "title" });
  const previewSubtitle = useWatch({ control, name: "subtitle" });
  const previewExcerpt = useWatch({ control, name: "excerpt" });
  const previewContent = useWatch({ control, name: "content" });

  // Find currently selected slide
  const selectedSlide = slides?.find((s) => s.id === watchedSlideId);

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

  // Compute active upload subfolder (auto tracks slug, title, or selected slide)
  const currentSubfolder = useMemo(() => {
    const fromSlug = watchedSlug?.trim();
    if (fromSlug) return slugifyVietnamese(fromSlug);

    const fromTitle = previewTitle?.trim();
    if (fromTitle) return slugifyVietnamese(fromTitle);

    const fromSlide = selectedSlide?.title?.trim();
    if (fromSlide) return slugifyVietnamese(fromSlide);

    return "detail-blogs";
  }, [watchedSlug, previewTitle, selectedSlide?.title]);

  // Sync prefilled slideId if present
  useEffect(() => {
    if (prefilledSlideId) {
      setValue("slideId", prefilledSlideId, { shouldValidate: true });
    }
  }, [prefilledSlideId, setValue]);

  // Handle slide select
  const handleSlideSelect = (slideId: string) => {
    setValue("slideId", slideId, { shouldValidate: true, shouldDirty: true });
  };

  // Map of existing blogs by slideId
  const existingBlogsMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof existingBlogs>["items"][number]>();
    existingBlogs?.items?.forEach((b) => {
      map.set(b.slideId, b);
    });
    return map;
  }, [existingBlogs]);

  const existingBlogSlideIds = useMemo(
    () => new Set(existingBlogsMap.keys()),
    [existingBlogsMap],
  );

  // Directly query the slide's detail blog if a slide is selected
  const { data: directBlogForSlide } = useSlideDetailBlogBySlide(watchedSlideId || "");

  const existingBlogForSelectedSlide =
    directBlogForSlide || (watchedSlideId ? existingBlogsMap.get(watchedSlideId) : undefined);

  // Handle Hero Image file upload
  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setHeroPreviewUrl(URL.createObjectURL(file));
    setHeroMode("upload");
    setFailedHeroUrl(null);
    setUploadingHero(true);

    try {
      const result: UploadResult = await uploadImage(file, "slide-detail-blog", {
        subfolder: currentSubfolder,
      });
      const previousFileId = getValues("heroImageFileId");
      if (previousFileId && previousFileId !== result.fileId) {
        if (!galleryFileIds.includes(previousFileId)) {
          deleteUploadedImage(previousFileId).catch((err) =>
            console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
          );
        }
      }
      setValue("heroImageUrl", result.url, { shouldValidate: true, shouldDirty: true });
      setValue("heroImageFileId", result.fileId, { shouldDirty: true });
      setHeroPreviewUrl(result.url);
      setFailedHeroUrl(null);
      toast({ title: "Tải ảnh hero thành công", color: "success" });
    } catch (err) {
      console.error("Lỗi tải ảnh hero:", err);
      const description =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Có lỗi xảy ra khi tải ảnh lên";
      toast({
        title: "Tải ảnh hero thất bại",
        description,
        color: "danger",
      });
      setHeroPreviewUrl(null);
    } finally {
      setUploadingHero(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // Handle Delete Hero Image (soft-delete for gallery images, hard-delete for direct uploads)
  const handleDeleteHeroImage = () => {
    const currentFileId = getValues("heroImageFileId");
    if (currentFileId) {
      if (!galleryFileIds.includes(currentFileId)) {
        // Direct upload from PC in unsaved new post: delete immediately from ImageKit!
        deleteUploadedImage(currentFileId).catch((err) =>
          console.warn("Lỗi xóa ảnh vừa tải lên trên ImageKit:", err),
        );
      }
      setDiscardedFileIds((prev) => prev.filter((id) => id !== currentFileId));
    }
    setValue("heroImageUrl", null, { shouldValidate: true, shouldDirty: true });
    setValue("heroImageFileId", null, { shouldDirty: true });
    setHeroPreviewUrl(null);
    setFailedHeroUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const isDirectSessionUpload = currentFileId && !galleryFileIds.includes(currentFileId);
    toast({
      title: "Đã gỡ ảnh bìa",
      description: isDirectSessionUpload
        ? "Đã xoá ảnh tải lên khỏi thư viện."
        : undefined,
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
    [activeTab, setActiveTab],
  );

  // Submit Handler
  const onSubmit = (data: SlideDetailBlogFormData, publish = false) => {
    const payload: SlideDetailBlogFormData = {
      ...data,
      content: normalizeSlideDetailBlogContent(data.content),
      isPublished: publish,
    };

    const existingConflict =
      directBlogForSlide || (payload.slideId ? existingBlogsMap.get(payload.slideId) : undefined);

    if (payload.slideId && existingConflict) {
      scrollToErrorField("field-slide-id", "editor");
      toast({
        title: "Slide đã có bài viết chi tiết",
        description: `Slide này đã liên kết với bài viết "${existingConflict.title || "Chưa đặt tên"}". Hệ thống quy định mỗi Slide chỉ có tối đa 1 bài viết chi tiết (quan hệ 1:1). Vui lòng chuyển sang chỉnh sửa bài viết đã có hoặc chọn slide khác.`,
        color: "danger",
        duration: 8000,
        action: existingConflict.id
          ? {
              label: "Đi tới bài viết",
              onClick: () => router.push(`/slide-detail-blogs/${existingConflict.id}`),
            }
          : undefined,
      });
      return;
    }

    if (publish) {
      if (!payload.title?.trim()) {
        scrollToErrorField("field-title", "editor");
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề bài viết không được để trống (tại Tab 'Nội dung' > Mục 2).",
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
          description: "Bài viết phải có ít nhất 1 khối nội dung (tại Tab 'Nội dung' > Mục 3).",
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
      onSuccess: () => {
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
              fid !== payload.heroImageFileId
            ) {
              deleteUploadedImage(fid).catch((err) =>
                console.warn("Lỗi xóa ảnh trên ImageKit:", err),
              );
            }
          }
          setDiscardedFileIds([]);
        }
        toast({
          title: publish ? "Đã xuất bản bài viết" : "Đã lưu bản nháp",
          color: "success",
        });
        startTransition(() => {
          router.push("/slide-detail-blogs");
        });
      },
      onError: (error) => {
        const rawMessage = error.message || "";

        // Handle 409 Conflict: Slide already has a blog
        if (
          rawMessage.toLowerCase().includes("bài viết chi tiết") ||
          rawMessage.toLowerCase().includes("slide d") ||
          rawMessage.toLowerCase().includes("slide đã có")
        ) {
          const existingConflict =
            directBlogForSlide || (watchedSlideId ? existingBlogsMap.get(watchedSlideId) : undefined);
          scrollToErrorField("field-slide-id", "editor");
          toast({
            title: "Slide đã có bài viết chi tiết",
            description: "Slide này đã được tạo bài viết chi tiết trước đó. Hệ thống quy định mỗi slide chỉ liên kết với tối đa 1 bài viết chi tiết (quan hệ 1:1). Vui lòng chuyển sang chỉnh sửa bài viết đã có hoặc chọn slide khác.",
            color: "danger",
            duration: 8000,
            action: existingConflict?.id
              ? {
                  label: "Đi tới bài viết",
                  onClick: () => router.push(`/slide-detail-blogs/${existingConflict.id}`),
                }
              : undefined,
          });
          return;
        }

        const blockMatch = rawMessage.match(
          /blocks\[(\d+)\](?:\.children\[(\d+)\])?(?:\.items\[(\d+)\])?(?:\.(\w+))?:?\s*(.*)/i,
        );

        let friendlyTitle = "Tạo bài viết thất bại";
        let friendlyDescription = rawMessage;
        let targetElementId: string | undefined;

        if (blockMatch) {
          const blockIdx = parseInt(blockMatch[1], 10);
          const childIdx = blockMatch[2] ? parseInt(blockMatch[2], 10) : undefined;
          const itemIdx = blockMatch[3] ? parseInt(blockMatch[3], 10) : undefined;
          const rawReason = blockMatch[5] || "";

          const currentBlocks = (data.content?.blocks || []) as SlideDetailBlogBlock[];
          const parentBlock = currentBlocks[blockIdx];
          const targetBlock =
            childIdx !== undefined && parentBlock?.type === "section"
              ? (parentBlock as import("@/types/slide-detail-blog").SectionBlock).children?.[childIdx]
              : parentBlock;
          const targetId = targetBlock?.id || parentBlock?.id;

          if (targetId) {
            targetElementId = `block-${targetId}`;
            scrollToErrorField(targetElementId, activeTab === "visual" ? "visual" : "editor");
          }

          if (itemIdx !== undefined || rawReason.toLowerCase().includes("item text")) {
            friendlyTitle = "Mục danh sách đang để trống";
            friendlyDescription = `Mục số ${Number(itemIdx ?? 0) + 1} của danh sách (Khối ${blockIdx + 1}) chưa có nội dung. Vui lòng nhập nội dung cho mục này hoặc xoá mục này đi.`;
          } else {
            friendlyTitle = `Khối nội dung ${blockIdx + 1} chưa hợp lệ`;
            friendlyDescription = rawReason.replace(
              /Item text không được để trống/i,
              "Mục danh sách không được để trống",
            );
          }
        } else {
          friendlyDescription = rawMessage.replace(
            /Item text không được để trống/i,
            "Mục danh sách không được để trống",
          );
        }

        toast({
          title: friendlyTitle,
          description: friendlyDescription,
          color: "danger",
          duration: 8000,
          ...(targetElementId
            ? {
              action: {
                label: "Đi tới khối lỗi",
                onClick: () => scrollToErrorField(targetElementId!, activeTab === "visual" ? "visual" : "editor"),
              },
            }
            : {}),
        });
      },
    });
  };

  // Validation Error Handler (triggered when form has invalid fields or empty blocks)
  const onInvalid = (fieldErrors: FieldErrors<SlideDetailBlogFormData>) => {
    // 1. Check if error comes from content blocks
    const contentErrors = fieldErrors.content as unknown as { blocks?: Record<string, unknown> } | undefined;
    const blockErrors = contentErrors?.blocks;

    if (blockErrors) {
      const errorKeys = Object.keys(blockErrors);
      const firstIndex = Number(errorKeys[0]);
      const currentBlocks = (previewContent?.blocks || []) as SlideDetailBlogBlock[];
      const targetBlock = currentBlocks[firstIndex];
      const targetId = targetBlock ? `block-${targetBlock.id}` : "card-content-blocks";

      scrollToErrorField(targetId, activeTab === "visual" ? "visual" : "editor");

      toast({
        title: "Không thể lưu bài viết",
        description: "Có khối nội dung đang để trống. Vui lòng nhập nội dung hoặc xoá khối đó đi trước khi lưu.",
        color: "danger",
        duration: 8000,
        action: {
          label: "Đi tới khối lỗi",
          onClick: () => scrollToErrorField(targetId, activeTab === "visual" ? "visual" : "editor"),
        },
      });
      return;
    }

    // 2. Check if error is missing title
    if (fieldErrors.title) {
      scrollToErrorField("field-title", "editor");

      toast({
        title: "Thiếu tiêu đề bài viết",
        description: fieldErrors.title.message || "Tiêu đề bài viết không được để trống (tại Tab 'Nội dung' > Mục 2).",
        color: "danger",
        duration: 8000,
        action: {
          label: "Đi tới tiêu đề",
          onClick: () => scrollToErrorField("field-title", "editor"),
        },
      });
      return;
    }

    // 3. Check if error is missing slideId
    if (fieldErrors.slideId) {
      scrollToErrorField("field-slide-id", "editor");

      toast({
        title: "Chưa chọn slide liên kết",
        description: "Bài viết Slide bắt buộc phải liên kết với 1 slide trên trang chủ (tại Tab 'Nội dung' > Mục 1. Slide liên kết).",
        color: "danger",
        duration: 8000,
        action: {
          label: "Đi tới mục chọn slide",
          onClick: () => scrollToErrorField("field-slide-id", "editor"),
        },
      });
      return;
    }

    // 4. Default error message
    const firstErrorKey = Object.keys(fieldErrors)[0];
    const firstError = Object.values(fieldErrors)[0];
    const message = firstError?.message;
    const targetElementId = firstErrorKey ? `field-${firstErrorKey}` : undefined;

    if (targetElementId) {
      scrollToErrorField(targetElementId, "editor");
    }

    toast({
      title: "Không thể lưu bài viết",
      description: typeof message === "string" ? message : "Có khối nội dung hoặc trường thông tin chưa hợp lệ. Vui lòng kiểm tra lại tại Tab 'Nội dung'.",
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

  if (loadingSlides) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <SlideDetailBlogUploadProvider
      subfolder={currentSubfolder}
      onGalleryFileSelect={handleGalleryFileSelect}
    >
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">Tạo bài viết Slide mới</h1>
            <p className="text-sm text-text-muted">
              Tạo bài viết chi tiết liên kết trực tiếp với slide trên trang chủ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="border-border text-text hover:border-primary hover:text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="mr-1 h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v3.69l1.22-1.22a.75.75 0 111.06 1.06l-2.5 2.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 111.06-1.06l1.22 1.22V8.75z"
                  clipRule="evenodd"
                />
              </svg>
              Xuất bài viết
            </AppButton>
            <AppButton variant="ghost" onClick={() => router.back()}>
              ← Quay lại
            </AppButton>
          </div>
        </div>

        {/* Tab Switcher: 1. Nội dung / 2. Đọc bài / 3. Trình chỉnh sửa trực quan */}
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

        {/* 2. Reader View Tab (Pure Read-Only) */}
        {activeTab === "reader" && (
          <BlogPreviewContainer
            title={previewTitle ?? ""}
            subtitle={previewSubtitle}
            excerpt={previewExcerpt}
            heroImageUrl={currentPreview}
            content={(previewContent as SlideDetailBlogContent) ?? { version: 1, blocks: [] }}
          />
        )}

        {/* 3. Visual Editor Tab (Interactive Canvas) */}
        {activeTab === "visual" && (
          <VisualEditorCanvas
            title={previewTitle ?? ""}
            subtitle={previewSubtitle}
            excerpt={previewExcerpt}
            heroImageUrl={currentPreview}
            content={(previewContent as SlideDetailBlogContent) ?? { version: 1, blocks: [] }}
            onContentChange={(c) => setValue("content", c, { shouldDirty: true })}
            onTitleChange={(t) => setValue("title", t, { shouldDirty: true })}
            onSubtitleChange={(s) => setValue("subtitle", s, { shouldDirty: true })}
            onExcerptChange={(e) => setValue("excerpt", e, { shouldDirty: true })}
            onHeroImageChange={(url, fileId) => {
              const prevFileId = getValues("heroImageFileId");
              if (prevFileId && prevFileId !== fileId) {
                if (!galleryFileIds.includes(prevFileId)) {
                  deleteUploadedImage(prevFileId).catch((err) =>
                    console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
                  );
                }
                setDiscardedFileIds((prev) => prev.filter((id) => id !== prevFileId));
              }
              setValue("heroImageUrl", url, { shouldValidate: true, shouldDirty: true });
              setValue("heroImageFileId", fileId ?? null, { shouldDirty: true });
              setHeroPreviewUrl(url);
              setFailedHeroUrl(null);
            }}
            onHeroImageDelete={handleDeleteHeroImage}
            onImageDiscard={handleImageBlockDiscard}
          />
        )}

        {/* 1. Form Editor Tab */}
        <form className={`space-y-6 ${activeTab !== "editor" ? "hidden" : ""}`}>
          {/* 1. Chọn Slide Liên Kết */}
          <Card id="card-slide-select" className="border border-border bg-surface shadow-xs transition-all duration-300">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                1. Slide liên kết (bắt buộc)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div id="field-slide-id" className="rounded-lg p-1 -m-1 transition-all duration-300">
                <label className="mb-1.5 block text-xs font-semibold text-text">
                  Chọn Slide <span className="text-danger">*</span>
                </label>
                <DropdownSelect
                  value={watchedSlideId || ""}
                  onChange={(val) => handleSlideSelect(val)}
                  placeholder="-- Chọn slide để viết bài chi tiết --"
                  options={
                    slides?.map((s) => {
                      const hasBlog = existingBlogSlideIds.has(s.id);
                      return {
                        value: s.id,
                        label: `${s.title}${hasBlog ? " (Đã có bài viết - Không thể tạo thêm)" : ""}`,
                        disabled: hasBlog && s.id !== watchedSlideId,
                      };
                    }) ?? []
                  }
                />
                {errors.slideId && (
                  <p className="mt-1 text-xs text-danger">{errors.slideId.message}</p>
                )}
              </div>

              {/* Selected slide preview */}
              {selectedSlide && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/50 p-3">
                  <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedSlide.imageUrl}
                      alt={selectedSlide.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text">{selectedSlide.title}</p>
                    {selectedSlide.subtitle && (
                      <p className="text-xs text-text-muted">{selectedSlide.subtitle}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Prominent warning when selected slide already has a blog */}
              {existingBlogForSelectedSlide && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-text dark:border-amber-700/60 dark:bg-amber-950/40">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Slide này đã có bài viết chi tiết!
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Hệ thống quy định mỗi Slide chỉ liên kết với tối đa 1 bài viết chi tiết duy nhất (quan hệ 1:1). Bạn không thể tạo thêm bài viết mới cho slide này.
                      </p>
                      <div className="pt-2">
                        <AppButton
                          type="button"
                          size="sm"
                          onClick={() => router.push(`/slide-detail-blogs/${existingBlogForSelectedSlide.id}`)}
                          className="bg-amber-600 text-white hover:bg-amber-700"
                        >
                          Chuyển đến chỉnh sửa bài viết: &quot;{existingBlogForSelectedSlide.title || "Bài viết chi tiết"}&quot; →
                        </AppButton>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Thông tin bài viết (Metadata) */}
          <Card className="border border-border bg-surface shadow-xs">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                2. Thông tin bài viết (Metadata)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div id="field-title" className="space-y-1.5 rounded-lg p-1 -m-1 transition-all duration-300">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-text">
                    Tiêu đề bài viết (H1) <span className="text-danger">*</span>
                  </label>
                  <BlockFormatToolbar
                    onApply={(action) => applyTitleFormat(titleInputRef.current, action)}
                    size="xs"
                  />
                </div>
                <FormInput
                  placeholder="VD: Số hoá dữ liệu đất đai toàn diện..."
                  errorMessage={errors.title?.message}
                  {...titleRegister}
                  ref={(el) => {
                    titleRegister.ref(el);
                    titleInputRef.current = el;
                  }}
                  onKeyDown={handleTitleKeyDown}
                  helperText="Hỗ trợ phím tắt Ctrl+B (Đậm), Ctrl+I (Nghiêng), Ctrl+U (Gạch chân)..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-text">
                      Phụ đề / Tagline
                    </label>
                    <BlockFormatToolbar
                      onApply={(action) => applySubtitleFormat(subtitleInputRef.current, action)}
                      size="xs"
                    />
                  </div>
                  <FormInput
                    placeholder="VD: Từ hiện trạng ngoài thực địa đến bản đồ số..."
                    errorMessage={errors.subtitle?.message}
                    {...subtitleRegister}
                    ref={(el) => {
                      subtitleRegister.ref(el);
                      subtitleInputRef.current = el;
                    }}
                    onKeyDown={handleSubtitleKeyDown}
                  />
                </div>
                <div id="field-slug" className="rounded-lg p-1 -m-1 transition-all duration-300">
                  <FormInput
                    label="Đường dẫn tĩnh (Slug)"
                    placeholder="Tự sinh từ tiêu đề nếu để trống..."
                    helperText="Chỉ dùng chữ cái thường không dấu, số và dấu gạch ngang"
                    errorMessage={errors.slug?.message}
                    {...register("slug")}
                  />
                </div>
              </div>

              {/* Subfolder ImageKit Preview */}
              <div className="rounded-md border border-border/80 bg-surface-muted/50 px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">📁 Thư mục lưu ảnh ImageKit:</span>
                  <code className="rounded bg-surface px-1.5 py-0.5 font-mono font-medium text-primary">
                    /vdcd/slides/{currentSubfolder}/
                  </code>
                </div>
                <p className="mt-1 text-[11px] text-text-muted">
                  Tất cả ảnh bìa Hero và ảnh nội dung bài viết sẽ tự động được lưu vào thư mục này.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-text">
                    Mô tả ngắn (Excerpt)
                  </label>
                  <BlockFormatToolbar
                    onApply={(action) => applyExcerptFormat(excerptInputRef.current, action)}
                    size="xs"
                  />
                </div>
                <FormTextarea
                  rows={2}
                  placeholder="Mô tả ngắn hiển thị cho danh sách bài viết và thẻ tóm tắt..."
                  errorMessage={errors.excerpt?.message}
                  {...excerptRegister}
                  ref={(el) => {
                    excerptRegister.ref(el);
                    excerptInputRef.current = el;
                  }}
                  onKeyDown={handleExcerptKeyDown}
                  helperText="Hỗ trợ phím tắt Ctrl+B (Đậm), Ctrl+I (Nghiêng), Ctrl+U (Gạch chân)..."
                />
              </div>

              {/* Hero Image Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text">
                    Ảnh bìa Hero (Hero Image)
                  </label>
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted p-0.5">
                    <button
                      type="button"
                      onClick={() => setHeroMode("upload")}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${heroMode === "upload"
                        ? "bg-surface font-semibold text-primary shadow-xs"
                        : "text-text-muted hover:text-text"
                        }`}
                    >
                      Tải ảnh lên
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroMode("url")}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${heroMode === "url"
                        ? "bg-surface font-semibold text-primary shadow-xs"
                        : "text-text-muted hover:text-text"
                        }`}
                    >
                      Nhập URL
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="overflow-hidden rounded-lg border border-border bg-surface-muted">
                  {currentPreview && !isHeroLoadError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={currentPreview}
                      alt="Hero Preview"
                      className="h-44 w-full object-cover transition-opacity duration-200"
                      onError={() => setFailedHeroUrl(currentPreview)}
                      onLoad={() => setFailedHeroUrl(null)}
                    />
                  ) : (
                    <div className="flex min-h-36 w-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-text-muted">
                      {currentPreview && isHeroLoadError ? (
                        <>
                          <div className="flex items-center gap-1.5 font-medium text-amber-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            <span>Không tải được ảnh từ đường dẫn hiện tại</span>
                          </div>
                          <p className="max-w-md truncate font-mono text-[11px] text-text-muted bg-surface px-2 py-0.5 rounded border border-border">
                            {currentPreview}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                              </svg>
                              Tải ảnh mới từ máy tính
                            </button>
                            <button
                              type="button"
                              onClick={() => setHeroMode("url")}
                              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-all cursor-pointer"
                            >
                              Dán link ảnh ImageKit đã có →
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span>Chưa có ảnh Hero</span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer"
                          >
                            Nhấn để tải ảnh lên từ máy tính
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Hero Caption (stored in content.heroMeta.caption) */}
                {currentPreview && !isHeroLoadError && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted">
                      Chú thích ảnh bìa
                    </label>
                    <FormInput
                      placeholder="VD: Ảnh minh hoạ quá trình số hoá dữ liệu..."
                      value={(previewContent as SlideDetailBlogContent)?.heroMeta?.caption ?? ""}
                      onChange={(e) => {
                        const currentContent = getValues("content") as SlideDetailBlogContent;
                        const updatedContent: SlideDetailBlogContent = {
                          ...currentContent,
                          heroMeta: {
                            ...currentContent?.heroMeta,
                            caption: e.target.value,
                          } as HeroMeta,
                        };
                        setValue("content", updatedContent, { shouldDirty: true });
                      }}
                    />
                  </div>
                )}

                {heroMode === "upload" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-muted">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4 text-primary"
                        >
                          <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                        </svg>
                        {uploadingHero ? "Đang tải lên..." : "Tải ảnh Hero lên"}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleHeroFileChange}
                          disabled={uploadingHero}
                        />
                      </label>
                      {
                        currentPreview && (
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
                        JPG, PNG, WebP • Tối đa 10MB • Lưu vào /vdcd/slides/{currentSubfolder}
                      </span>
                    </div>
                    {watchedHeroUrl && (
                      <p className="truncate text-xs text-text-muted">
                        <span className="font-medium text-text">URL hiện tại:</span> {watchedHeroUrl}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FormInput
                      label="URL ảnh Hero"
                      placeholder="https://ik.imagekit.io/..."
                      value={watchedHeroUrl || ""}
                      onChange={(e) => {
                        setFailedHeroUrl(null);
                        setValue("heroImageUrl", e.target.value, { shouldDirty: true });
                        setValue("heroImageFileId", null, { shouldDirty: true });
                      }}
                    />
                    {currentPreview && (
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
                  defaultFolder="/vdcd/slides"
                  uploadFolder="slide-detail-blog"
                  uploadOptions={{ subfolder: currentSubfolder, slug: currentSubfolder }}
                  title="Chọn ảnh Hero"
                />
              </div>

              {/* SEO Settings Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSeo(!showSeo)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>{showSeo ? "▼ Thu gọn cấu hình SEO" : "▶ Mở rộng cấu hình SEO (tuỳ chọn)"}</span>
                </button>

                {showSeo && (
                  <div className="mt-3 space-y-3 rounded-lg border border-border bg-surface-muted/40 p-4">
                    <FormInput
                      label="SEO Title Tag"
                      placeholder="VD: Số hoá dữ liệu đất đai | VDCD Gia Lai"
                      maxLength={255}
                      {...register("seoTitle")}
                    />
                    <FormTextarea
                      label="SEO Meta Description"
                      rows={2}
                      placeholder="Mô tả tóm tắt hiển thị trên kết quả tìm kiếm Google..."
                      maxLength={500}
                      {...register("metaDescription")}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3. Nội dung theo Block */}
          <Card id="card-content-blocks" className="border border-border bg-surface shadow-xs transition-all duration-300">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                3. Nội dung chi tiết (Visual Block Editor)
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

          {/* Footer Actions */}
          <div data-bottom-save-bar className="flex items-center justify-end gap-3 pt-2">
            <AppButton
              variant="ghost"
              type="button"
              onClick={() => router.back()}
            >
              Huỷ
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              isLoading={createMutation.isPending}
              disabled={Boolean(existingBlogForSelectedSlide)}
              title={existingBlogForSelectedSlide ? "Slide này đã có bài viết chi tiết" : undefined}
              onClick={handleSubmit((data: SlideDetailBlogFormData) => onSubmit(data, false), onInvalid)}
              className="border border-border"
            >
              Lưu bản nháp
            </AppButton>
            <AppButton
              type="button"
              isLoading={createMutation.isPending}
              disabled={Boolean(existingBlogForSelectedSlide)}
              title={existingBlogForSelectedSlide ? "Slide này đã có bài viết chi tiết" : undefined}
              onClick={handleSubmit((data: SlideDetailBlogFormData) => onSubmit(data, true), onInvalid)}
            >
              Xuất bản ngay
            </AppButton>
          </div>
        </form>

        {/* Footer Actions (visible when Reader or Visual tab is active — form footer is hidden with the form) */}
        {activeTab !== "editor" && (
          <div data-bottom-save-bar className="flex items-center justify-end gap-3 pt-2">
            <AppButton
              variant="ghost"
              type="button"
              onClick={() => router.back()}
            >
              Huỷ
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              isLoading={createMutation.isPending}
              disabled={Boolean(existingBlogForSelectedSlide)}
              title={existingBlogForSelectedSlide ? "Slide này đã có bài viết chi tiết" : undefined}
              onClick={handleSubmit((data: SlideDetailBlogFormData) => onSubmit(data, false), onInvalid)}
              className="border border-border"
            >
              Lưu bản nháp
            </AppButton>
            <AppButton
              type="button"
              isLoading={createMutation.isPending}
              disabled={Boolean(existingBlogForSelectedSlide)}
              title={existingBlogForSelectedSlide ? "Slide này đã có bài viết chi tiết" : undefined}
              onClick={handleSubmit((data: SlideDetailBlogFormData) => onSubmit(data, true), onInvalid)}
            >
              Xuất bản ngay
            </AppButton>
          </div>
        )}

        <BlogExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title={previewTitle}
          subtitle={previewSubtitle}
          slug={watchedSlug}
          content={(previewContent as SlideDetailBlogContent) ?? { version: 1, blocks: [] }}
          heroImageUrl={currentPreview}
        />

        {/* Floating Save Bar cố định ở góc dưới bên phải màn hình khi có thay đổi */}
        <FloatingSaveBar
          isVisible={isDirty && (activeTab === "editor" || activeTab === "visual")}
          statusText="Có thay đổi chưa lưu"
        >
          <AppButton
            type="button"
            variant="ghost"
            isLoading={createMutation.isPending}
            disabled={Boolean(existingBlogForSelectedSlide)}
            title={existingBlogForSelectedSlide ? "Slide này đã có bài viết chi tiết" : undefined}
            onClick={handleSubmit((data: SlideDetailBlogFormData) => onSubmit(data, false), onInvalid)}
            className="border border-border bg-surface text-xs"
          >
            Lưu bản nháp
          </AppButton>
          <AppButton
            type="button"
            isLoading={createMutation.isPending}
            disabled={Boolean(existingBlogForSelectedSlide)}
            title={existingBlogForSelectedSlide ? "Slide này đã có bài viết chi tiết" : undefined}
            onClick={handleSubmit((data: SlideDetailBlogFormData) => onSubmit(data, true), onInvalid)}
            className="text-xs"
          >
            Xuất bản ngay
          </AppButton>
        </FloatingSaveBar>
      </div>
    </SlideDetailBlogUploadProvider>
  );
}

export default function NewSlideDetailBlogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <NewSlideDetailBlogContent />
    </Suspense>
  );
}
