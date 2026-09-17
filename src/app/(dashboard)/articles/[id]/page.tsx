"use client";

import { useState, useEffect, useMemo, useRef, useTransition, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@heroui/react";
import {
  FormInput,
  FormTextarea,
  AppButton,
  Spinner,
  DropdownSelect,
  useToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui";
import { useArticle, useUpdateArticle, usePublishArticle, useDeleteArticle } from "@/features/articles/api";
import { usePermission } from "@/hooks/usePermission";
import { useProjects } from "@/features/projects/api";
import { usePrograms } from "@/features/programs/api";
import { useSolutions } from "@/features/solutions/api";
import { articleSchema, type ArticleFormData } from "@/features/articles/schema";
import { parseArticleContent } from "@/features/articles/utils/article-content";
import { BlockEditor, BlockFormatToolbar } from "@/features/slide-detail-blogs/components/BlockEditor";
import { BlogPreviewContainer } from "@/features/slide-detail-blogs/components/BlogPreview";
import { VisualEditorCanvas } from "@/features/slide-detail-blogs/components/VisualEditor";
import { useHtmlShortcuts } from "@/features/slide-detail-blogs/hooks/useHtmlShortcuts";
import { uploadImage, validateImageFile, slugifyVietnamese, deleteUploadedImage, type UploadResult } from "@/lib/upload";
import { SlideDetailBlogUploadProvider } from "@/features/slide-detail-blogs/context/SlideDetailBlogUploadContext";
import { useSanitizedPaste } from "@/features/slide-detail-blogs/hooks/useSanitizedPaste";
import { FloatingSaveBar } from "@/components/shared";
import { format } from "date-fns";
import type { SlideDetailBlogContent, SlideDetailBlogBlock } from "@/types/slide-detail-blog";

type TabMode = "editor" | "reader" | "visual";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const canDelete = usePermission("articles:delete");

  const { data: article, isLoading } = useArticle(id);
  const updateMutation = useUpdateArticle(id);
  const publishMutation = usePublishArticle();
  const deleteMutation = useDeleteArticle();
  const isSubmitting = updateMutation.isPending || publishMutation.isPending;

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // SEO accordion
  const [showSeo, setShowSeo] = useState(false);

  // Paste normalization for text inputs
  const { handlePaste: handlePlainPaste } = useSanitizedPaste({ preserveLineBreaks: false });

  // Soft-delete tracking: fileIds staged for deletion on successful save
  const [discardedThumbFileIds, setDiscardedThumbFileIds] = useState<string[]>([]);
  const [discardedBlockFileIds, setDiscardedBlockFileIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
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

  // Populate form when article loads
  useEffect(() => {
    if (article) {
      const parsed = parseArticleContent(article.content);

      let publishedAtValue = "";
      if (article.publishedAt) {
        const date = new Date(article.publishedAt);
        publishedAtValue = format(date, "yyyy-MM-dd'T'HH:mm");
      }

      reset({
        title: article.title,
        subtitle: article.subtitle || parsed.subtitle || "",
        slug: article.slug,
        excerpt: article.excerpt || parsed.excerpt || "",
        thumbnail: article.thumbnail ?? null,
        thumbnailFileId: article.thumbnailFileId ?? null,
        category: article.category ?? "",
        tags: article.tags ?? "",
        projectId: article.project?.id ?? null,
        programId: article.program?.id ?? null,
        solutionId: article.solution?.id ?? null,
        metaTitle: article.metaTitle ?? "",
        metaDescription: article.metaDescription ?? "",
        content: parsed.content,
        isPublished: article.isPublished,
        publishedAt: publishedAtValue || null,
      });
    }
  }, [article, reset]);

  // Watch fields for live sync across tabs
  const watchedTitle = useWatch({ control, name: "title" });
  const watchedSubtitle = useWatch({ control, name: "subtitle" });
  const watchedExcerpt = useWatch({ control, name: "excerpt" });
  const watchedSlug = useWatch({ control, name: "slug" });
  const watchedThumbnail = useWatch({ control, name: "thumbnail" });
  const watchedProjectId = useWatch({ control, name: "projectId" });
  const watchedProgramId = useWatch({ control, name: "programId" });
  const watchedSolutionId = useWatch({ control, name: "solutionId" });
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

    // Soft-delete: track old thumbnail fileId before replacing
    const previousFileId = getValues("thumbnailFileId");
    if (previousFileId) {
      setDiscardedThumbFileIds((prev) =>
        prev.includes(previousFileId) ? prev : [...prev, previousFileId],
      );
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

  // Handle Soft-Delete Thumbnail (from Visual Editor hero image delete button)
  const handleDeleteHeroImage = () => {
    const currentFileId = getValues("thumbnailFileId");
    if (currentFileId) {
      setDiscardedThumbFileIds((prev) =>
        prev.includes(currentFileId) ? prev : [...prev, currentFileId],
      );
    }
    setValue("thumbnail", null, { shouldValidate: true, shouldDirty: true });
    setValue("thumbnailFileId", null, { shouldDirty: true });
    setThumbPreviewUrl(null);
    setFailedThumbUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({
      title: "Đã gỡ ảnh đại diện",
      description: "Nhấn \"Lưu thay đổi\" để hoàn tất gỡ bỏ trên ImageKit.",
      color: "warning",
    });
  };

  // Handle Soft-Delete of Image Blocks (image block removed or image replaced)
  const handleImageBlockDiscard = (fileId: string) => {
    setDiscardedBlockFileIds((prev) =>
      prev.includes(fileId) ? prev : [...prev, fileId],
    );
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
  const onSubmit = (data: ArticleFormData) => {
    const payload: ArticleFormData = {
      ...data,
      isPublished: article?.isPublished ?? data.isPublished ?? false,
      publishedAt: data.publishedAt || (article?.isPublished ? new Date().toISOString() : null),
      projectId: data.projectId || null,
      programId: data.programId || null,
      solutionId: data.solutionId || null,
    };

    // Collect all fileIds currently in the content blocks to protect them from deletion
    const activeBlockFileIds = new Set<string>();
    for (const b of (data.content?.blocks || []) as SlideDetailBlogBlock[]) {
      if (b.type === "image" && b.fileId) activeBlockFileIds.add(b.fileId);
      if (b.type === "section") {
        for (const child of (b as import("@/types/slide-detail-blog").SectionBlock).children || []) {
          if (child.type === "image" && child.fileId) activeBlockFileIds.add(child.fileId);
        }
      }
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        // Cleanup discarded thumbnail files
        for (const fid of discardedThumbFileIds) {
          deleteUploadedImage(fid).catch((err) =>
            console.warn("Lỗi dọn rác thumbnail ImageKit:", err),
          );
        }
        setDiscardedThumbFileIds([]);

        // Cleanup discarded image block files
        for (const fid of discardedBlockFileIds) {
          if (!activeBlockFileIds.has(fid)) {
            deleteUploadedImage(fid).catch((err) =>
              console.warn("Lỗi dọn rác image block ImageKit:", err),
            );
          }
        }
        setDiscardedBlockFileIds([]);

        toast({ title: "Đã lưu thay đổi", color: "success" });
      },
      onError: (error) => {
        const rawMessage = error.message || "";
        const blockMatch = rawMessage.match(
          /blocks\[(\d+)\](?:\.children\[(\d+)\])?(?:\.items\[(\d+)\])?(?:\.(\w+))?:?\s*(.*)/i,
        );

        let friendlyTitle = "Lưu bài viết thất bại";
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

  // Toggle Publish
  const handleTogglePublish = (publish: boolean) => {
    if (publish) {
      const currentTitle = watchedTitle || article?.title;
      if (!currentTitle?.trim()) {
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề bài viết không được để trống",
          color: "danger",
        });
        return;
      }
      const blocks = watchedContent?.blocks || parseArticleContent(article?.content).content?.blocks || [];
      if (!blocks || blocks.length === 0) {
        toast({
          title: "Không thể xuất bản",
          description: "Bài viết phải có ít nhất 1 khối nội dung",
          color: "danger",
        });
        return;
      }
    }

    publishMutation.mutate(
      { id, isPublished: publish },
      {
        onSuccess: () => {
          setValue("isPublished", publish);
          toast({
            title: publish ? "Đã xuất bản bài viết" : "Đã chuyển về bản nháp",
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

  // Handle Delete
  const handleDelete = () => {
    if (!article) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        const thumbFileId = getValues("thumbnailFileId") || article.thumbnailFileId;
        if (thumbFileId) {
          deleteUploadedImage(thumbFileId).catch((err) =>
            console.warn("Lỗi dọn rác thumbnail ImageKit:", err),
          );
        }
        toast({ title: "Đã xoá bài viết thành công", color: "success" });
        startTransition(() => {
          router.push("/articles");
        });
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

  if (isLoading || !article) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <SlideDetailBlogUploadProvider folder="article" subfolder={currentSubfolder}>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text">Chỉnh sửa bài viết</h1>
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                  article.isPublished
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {article.isPublished ? "Đã xuất bản" : "Bản nháp"}
              </span>
            </div>
            <p className="text-sm text-text-muted">
              Cập nhật nội dung bài viết bằng hệ thống Block Editor.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {article.isPublished ? (
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
                Xuất bản bài viết
              </AppButton>
            )}
            <AppButton variant="ghost" onClick={() => router.back()}>
              ← Quay lại
            </AppButton>
          </div>
        </div>

        {/* Tab Switcher: [ Nội dung ] [ Đọc bài ] [ Trình chỉnh sửa trực quan ] */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "editor"
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
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "reader"
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
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "visual"
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
              // Soft-delete: track old thumbnail fileId before replacing
              const oldFileId = getValues("thumbnailFileId");
              if (oldFileId && oldFileId !== fileId) {
                setDiscardedThumbFileIds((prev) =>
                  prev.includes(oldFileId) ? prev : [...prev, oldFileId],
                );
              }
              setValue("thumbnail", url, { shouldValidate: true, shouldDirty: true });
              if (fileId) setValue("thumbnailFileId", fileId, { shouldDirty: true });
              setThumbPreviewUrl(url);
              setFailedThumbUrl(null);
            }}
            onHeroImageDelete={handleDeleteHeroImage}
            onImageDiscard={handleImageBlockDiscard}
          />
        )}

        {/* 1. Form Editor Tab (Phase 07 & 10) */}
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className={`space-y-6 ${activeTab !== "editor" ? "hidden" : ""}`}
        >
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
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                      thumbMode === "upload"
                        ? "bg-surface font-semibold text-primary shadow-xs"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    Tải ảnh lên
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbMode("url")}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                      thumbMode === "url"
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
                <div className="flex items-center gap-3">
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
                  <span className="text-xs text-text-muted">
                    JPG, PNG, WebP • Tối đa 10MB
                  </span>
                </div>
              ) : (
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
              )}
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

          {/* Card 6: Khối nội dung chi tiết (Block Editor) */}
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

          {/* Card 7: Thời gian xuất bản */}
          <Card className="border border-border bg-surface shadow-xs">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                7. Thời gian xuất bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <FormInput
                type="datetime-local"
                label="Ngày giờ xuất bản"
                helperText="Tuỳ chỉnh ngày giờ xuất bản (nếu để trống, hệ thống sẽ lấy thời điểm hiện tại khi xuất bản)."
                errorMessage={errors.publishedAt?.message}
                {...register("publishedAt")}
              />
            </CardContent>
          </Card>

          {/* Footer Form Actions */}
          <div data-bottom-save-bar className="flex items-center justify-between pt-2">
            {canDelete ? (
              <AppButton
                type="button"
                variant="ghost"
                color="danger"
                onClick={() => setShowDeleteModal(true)}
                className="text-xs text-danger hover:bg-danger/10"
              >
                Xoá bài viết
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
              <AppButton
                type="submit"
                isLoading={updateMutation.isPending}
                disabled={!isDirty || isSubmitting || uploadingThumb}
              >
                Lưu thay đổi
              </AppButton>
            </div>
          </div>
        </form>

        {/* Floating/Fixed Footer when in Reader or Visual Tab */}
        {activeTab !== "editor" && (
          <div data-bottom-save-bar className="flex items-center justify-between pt-2">
            {canDelete ? (
              <AppButton
                type="button"
                variant="ghost"
                color="danger"
                onClick={() => setShowDeleteModal(true)}
                className="text-xs text-danger hover:bg-danger/10"
              >
                Xoá bài viết
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
              <AppButton
                type="button"
                isLoading={updateMutation.isPending}
                disabled={!isDirty || isSubmitting || uploadingThumb}
                onClick={handleSubmit(onSubmit, onInvalid)}
              >
                Lưu thay đổi
              </AppButton>
            </div>
          </div>
        )}

        {/* Floating Save Bar cố định ở góc dưới bên phải màn hình khi có thay đổi */}
        <FloatingSaveBar
          isVisible={isDirty && (activeTab === "editor" || activeTab === "visual")}
          statusText="Có thay đổi chưa lưu"
        >
          <AppButton
            type="button"
            isLoading={updateMutation.isPending}
            disabled={!isDirty || isSubmitting || uploadingThumb}
            onClick={handleSubmit(onSubmit, onInvalid)}
            className="text-xs"
          >
            Lưu thay đổi
          </AppButton>
        </FloatingSaveBar>

        {/* Modal xác nhận xoá bài viết */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <ModalContent>
            <ModalHeader>Xác nhận xoá bài viết</ModalHeader>
            <ModalBody>
              <p>
                Bạn có chắc muốn xoá vĩnh viễn bài viết{" "}
                <strong>{article.title}</strong>?
              </p>
              <p className="mt-2 text-xs text-text-muted">
                Lưu ý: Hành động này không thể hoàn tác. Tất cả ảnh trên ImageKit thuộc bài viết sẽ được tự động dọn dẹp.
              </p>
            </ModalBody>
            <ModalFooter>
              <AppButton variant="ghost" onClick={() => setShowDeleteModal(false)}>
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
      </div>
    </SlideDetailBlogUploadProvider>
  );
}
