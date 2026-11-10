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
import {
  FloatingSaveBar,
  ImagePickerModal,
  type ImagePickerResult,
  SidebarConfigPanel,
} from "@/components/shared";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  useCreateArticle,
  useUpdateArticle,
  usePublishArticle,
  useDeleteArticle,
  useArticles,
  articleKeys,
} from "../api";
import { useProjects } from "@/features/projects/api";
import { usePrograms } from "@/features/programs/api";
import { useSolutions } from "@/features/solutions/api";
import { useSlideDetailBlogs } from "@/features/slide-detail-blogs/api";
import { usePermission } from "@/hooks/usePermission";
import { articleSchema, type ArticleFormData } from "../schema";
import { parseArticleContent, normalizeArticlePublishedAt } from "../utils/article-content";
import { normalizeSlideDetailBlogContent } from "@/features/slide-detail-blogs/utils/blog-content";
import {
  BlockEditor,
  BlockFormatToolbar,
  VisualEditorCanvas,
  DocumentPreviewContainer,
  DocumentUploadProvider,
  createDefaultDocumentContent,
  useHtmlShortcuts,
  useSanitizedPaste,
  type DocumentContent,
  type DocumentBlock,
  type SectionBlock,
} from "@/shared/content-editor";
import {
  uploadImage,
  validateImageFile,
  slugifyVietnamese,
  deleteUploadedImage,
  type UploadResult,
} from "@/lib/upload";
import type { SidebarConfig } from "@/types/sidebar-config";
import type { Article } from "@/types/article";

type EditorTab = "info" | "blocks" | "reader" | "visual";

export interface ArticleEditorProps {
  mode: "create" | "edit";
  article?: Article;
}

export function ArticleEditor({ mode, article }: ArticleEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle(article?.id ?? "");
  const publishMutation = usePublishArticle();
  const deleteMutation = useDeleteArticle();
  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  const canDelete = usePermission("articles:delete");

  // Load lists for linking & sidebar config
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: programsData } = usePrograms({ limit: 100 });
  const { data: solutionsData } = useSolutions({ limit: 100 });
  const { data: allArticlesData } = useArticles({ limit: 100 });
  const { data: slideBlogsData } = useSlideDetailBlogs({ limit: 100 });

  const [activeTab, setActiveTab] = useState<EditorTab>("info");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Thumbnail / Hero image states
  const [thumbMode, setThumbMode] = useState<"upload" | "url">("upload");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(
    () => article?.thumbnail ?? null,
  );
  const [prevArticleThumbnail, setPrevArticleThumbnail] = useState(article?.thumbnail);
  if (article?.thumbnail !== prevArticleThumbnail) {
    setPrevArticleThumbnail(article?.thumbnail);
    setThumbPreviewUrl(article?.thumbnail ?? null);
  }
  const [failedThumbUrl, setFailedThumbUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGallery, setShowGallery] = useState(false);

  // Gallery-sourced file IDs — images picked from ImageKit gallery are NEVER deleted on ImageKit
  const [galleryFileIds, setGalleryFileIds] = useState<string[]>([]);
  // Discarded file IDs for cleanup on save
  const [discardedFileIds, setDiscardedFileIds] = useState<string[]>([]);

  const handleGalleryFileSelect = useCallback((fileId: string) => {
    if (fileId) {
      setGalleryFileIds((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
    }
  }, []);

  // Initialize initial DocumentContent from article
  const initialParsed = useMemo(() => {
    if (article?.content) {
      return parseArticleContent(article.content);
    }
    return {
      content: createDefaultDocumentContent(),
      subtitle: null,
      excerpt: null,
    };
  }, [article]);

  const initialPublishedAt = useMemo(() => {
    if (article?.publishedAt) {
      try {
        return format(new Date(article.publishedAt), "yyyy-MM-dd'T'HH:mm");
      } catch {
        return null;
      }
    }
    return null;
  }, [article]);

  // Paste normalization for text inputs
  const { handlePaste: handlePlainPaste } = useSanitizedPaste({ preserveLineBreaks: false });

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
      title: article?.title ?? "",
      subtitle: article?.subtitle || initialParsed.subtitle || "",
      slug: article?.slug ?? "",
      excerpt: article?.excerpt || initialParsed.excerpt || "",
      thumbnail: article?.thumbnail ?? null,
      thumbnailFileId: article?.thumbnailFileId ?? null,
      category: article?.category ?? "",
      tags: article?.tags ?? "",
      projectId: article?.project?.id ?? null,
      programId: article?.program?.id ?? null,
      solutionId: article?.solution?.id ?? null,
      sidebarConfig:
        article?.sidebarConfig ??
        ((article?.content as Record<string, unknown> | null)?.sidebarConfig as SidebarConfig) ??
        null,
      metaTitle: article?.metaTitle ?? "",
      metaDescription: article?.metaDescription ?? "",
      content: initialParsed.content,
      isPublished: article?.isPublished ?? false,
      publishedAt: initialPublishedAt,
    },
  });

  // Reset form when article data loads or changes
  useEffect(() => {
    if (article) {
      const parsed = parseArticleContent(article.content);
      let publishedAtValue = "";
      if (article.publishedAt) {
        try {
          publishedAtValue = format(new Date(article.publishedAt), "yyyy-MM-dd'T'HH:mm");
        } catch {
          publishedAtValue = "";
        }
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
        sidebarConfig:
          article.sidebarConfig ??
          ((article.content as Record<string, unknown> | null)?.sidebarConfig as SidebarConfig) ??
          null,
        metaTitle: article.metaTitle ?? "",
        metaDescription: article.metaDescription ?? "",
        content: parsed.content,
        isPublished: article.isPublished,
        publishedAt: publishedAtValue || null,
      });
    }
  }, [article, reset]);

  // Watch fields for live sync across all 4 tabs
  const watchedTitle = useWatch({ control, name: "title" }) ?? "";
  const watchedSubtitle = useWatch({ control, name: "subtitle" });
  const watchedExcerpt = useWatch({ control, name: "excerpt" });
  const watchedSlug = useWatch({ control, name: "slug" }) ?? "";
  const watchedCategory = useWatch({ control, name: "category" });
  const watchedThumbnail = useWatch({ control, name: "thumbnail" });
  const watchedProjectId = useWatch({ control, name: "projectId" });
  const watchedProgramId = useWatch({ control, name: "programId" });
  const watchedSolutionId = useWatch({ control, name: "solutionId" });
  const rawWatchedContent = useWatch({ control, name: "content" });
  const watchedIsPublished = useWatch({ control, name: "isPublished" });
  const watchedSidebarConfig = useWatch({ control, name: "sidebarConfig" }) as
    | SidebarConfig
    | null
    | undefined;

  const isCurrentlyPublished = watchedIsPublished ?? article?.isPublished ?? false;

  const currentDocumentContent: DocumentContent = useMemo(() => {
    if (
      typeof rawWatchedContent === "object" &&
      rawWatchedContent !== null &&
      "blocks" in rawWatchedContent
    ) {
      return rawWatchedContent as DocumentContent;
    }
    if (typeof rawWatchedContent === "string") {
      return parseArticleContent(rawWatchedContent).content;
    }
    return initialParsed.content;
  }, [rawWatchedContent, initialParsed.content]);

  // Formatting shortcuts and refs for metadata fields
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const excerptInputRef = useRef<HTMLTextAreaElement>(null);

  const { handleKeyDown: handleTitleKeyDown, applyFormat: applyTitleFormat } = useHtmlShortcuts(
    (val) => setValue("title", val, { shouldDirty: true, shouldValidate: true }),
  );
  const { handleKeyDown: handleSubtitleKeyDown, applyFormat: applySubtitleFormat } =
    useHtmlShortcuts((val) => setValue("subtitle", val, { shouldDirty: true }));
  const { handleKeyDown: handleExcerptKeyDown, applyFormat: applyExcerptFormat } =
    useHtmlShortcuts((val) => setValue("excerpt", val, { shouldDirty: true }));

  const titleRegister = register("title");
  const subtitleRegister = register("subtitle");
  const excerptRegister = register("excerpt");

  const currentThumbnailPreview = thumbPreviewUrl ?? watchedThumbnail ?? null;
  const isThumbLoadError = Boolean(
    currentThumbnailPreview && failedThumbUrl === currentThumbnailPreview,
  );

  // Generate random fallback subfolder once per editor mount if no title/slug exists
  const [randomFallbackSubfolder] = useState(
    () => `article-${Math.random().toString(36).substring(2, 10)}`,
  );

  // ImageKit subfolder for article assets: slug -> title -> randomFallbackSubfolder
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

  const handleGallerySelect = (image: ImagePickerResult) => {
    const previousFileId = getValues("thumbnailFileId");
    if (previousFileId && !galleryFileIds.includes(previousFileId)) {
      if (previousFileId !== article?.thumbnailFileId) {
        deleteUploadedImage(previousFileId).catch((err) =>
          console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
        );
        setDiscardedFileIds((prev) => prev.filter((id) => id !== previousFileId));
      }
    }
    if (image.fileId) {
      setGalleryFileIds((prev) => (prev.includes(image.fileId!) ? prev : [...prev, image.fileId!]));
    }
    setThumbPreviewUrl(image.url);
    setThumbMode("upload");
    setFailedThumbUrl(null);
    setValue("thumbnail", image.url, { shouldValidate: true, shouldDirty: true });
    setValue("thumbnailFileId", image.fileId ?? null, { shouldDirty: true });
    toast({ title: "Đã chọn ảnh từ thư viện", color: "success" });
  };

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
        title: watchedTitle || undefined,
      });
      const previousFileId = getValues("thumbnailFileId");
      if (previousFileId && previousFileId !== result.fileId) {
        if (!galleryFileIds.includes(previousFileId)) {
          if (previousFileId !== article?.thumbnailFileId) {
            deleteUploadedImage(previousFileId).catch((err) =>
              console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
            );
            setDiscardedFileIds((prev) => prev.filter((id) => id !== previousFileId));
          }
        }
      }
      setValue("thumbnail", result.url, { shouldValidate: true, shouldDirty: true });
      setValue("thumbnailFileId", result.fileId, { shouldDirty: true });
      setThumbPreviewUrl(result.url);
      setFailedThumbUrl(null);
      toast({ title: "Tải ảnh đại diện thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh đại diện thất bại", color: "danger" });
      setThumbPreviewUrl(article?.thumbnail ?? null);
    } finally {
      setUploadingThumb(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // Handle Delete Thumbnail (soft-delete for gallery/DB images, hard-delete for direct session uploads)
  const handleDeleteHeroImage = () => {
    const currentFileId = getValues("thumbnailFileId");
    const isDirectSessionUpload =
      currentFileId &&
      !galleryFileIds.includes(currentFileId) &&
      currentFileId !== article?.thumbnailFileId;

    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      if (currentFileId !== article?.thumbnailFileId) {
        deleteUploadedImage(currentFileId).catch((err) =>
          console.warn("Lỗi xóa ảnh vừa tải lên trên ImageKit:", err),
        );
        setDiscardedFileIds((prev) => prev.filter((id) => id !== currentFileId));
      }
    }
    setValue("thumbnail", null, { shouldValidate: true, shouldDirty: true });
    setValue("thumbnailFileId", null, { shouldDirty: true });
    setThumbPreviewUrl(null);
    setFailedThumbUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({
      title: "Đã gỡ ảnh đại diện",
      description: isDirectSessionUpload
        ? "Đã xoá ảnh tải lên khỏi thư viện."
        : mode === "create"
          ? 'Nhấn "Lưu" hoặc "Xuất bản" để hoàn tất.'
          : 'Nhấn "Lưu thay đổi" để hoàn tất cập nhật bài viết.',
      color: "warning",
    });
  };

  // Image block discard handler (queues direct-upload fileIds for deletion on save)
  const handleImageBlockDiscard = (fileId: string) => {
    if (fileId) {
      setDiscardedFileIds((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
    }
  };

  // Helper to jump to a specific element by DOM ID, with tab switching & glowing highlight
  const jumpToElement = useCallback(
    (targetTab: EditorTab, targetDomId?: string, fallbackBlockIdx?: number) => {
      if (activeTab !== targetTab) {
        setActiveTab(targetTab);
      }

      setTimeout(() => {
        let el = targetDomId ? document.getElementById(targetDomId) : null;
        if (!el && fallbackBlockIdx !== undefined) {
          const blockEls = document.querySelectorAll(
            targetTab === "visual" ? ".ve-block-wrapper" : ".block-card",
          );
          el = (blockEls[fallbackBlockIdx] as HTMLElement) || (blockEls[0] as HTMLElement) || null;
        }

        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-danger", "ring-offset-2", "animate-pulse");
          const focusable = el.querySelector<
            HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement
          >("button, input, select, textarea, [contenteditable='true']");
          if (focusable) {
            try {
              focusable.focus({ preventScroll: true });
            } catch {
              // Ignore focus error
            }
          }
          setTimeout(() => {
            el?.classList.remove("ring-4", "ring-danger", "ring-offset-2", "animate-pulse");
          }, 4000);
        }
      }, 150);
    },
    [activeTab],
  );

  const scrollToErrorField = useCallback(
    (elementId: string, targetTab: EditorTab = "info") => {
      jumpToElement(targetTab, elementId);
    },
    [jumpToElement],
  );

  // Parse backend mutation error and display clear error toast with jump action
  const handleMutationError = useCallback(
    (err: { message?: string }, defaultTitle = "Lưu bài viết thất bại") => {
      const rawMessage = err.message || "";
      const blocks = currentDocumentContent?.blocks || [];

      const blockMatch = rawMessage.match(/blocks\[(\d+)\]/i);
      const childMatch = rawMessage.match(/\.children\[(\d+)\]/i);
      const itemMatch = rawMessage.match(/\.items\[(\d+)\]/i);

      const blockIdx = blockMatch ? parseInt(blockMatch[1], 10) : undefined;
      const childIdx = childMatch ? parseInt(childMatch[1], 10) : undefined;
      const itemIdx = itemMatch ? parseInt(itemMatch[1], 10) : undefined;

      const isItemText = /item text/i.test(rawMessage) || itemMatch !== null;
      const isHeadingText = /heading/i.test(rawMessage);
      const isParagraphText = /paragraph/i.test(rawMessage);
      const isImageUrl = /image/i.test(rawMessage) || /\.url/i.test(rawMessage);

      let friendlyTitle = defaultTitle;
      let friendlyDescription = rawMessage;
      let targetTab: EditorTab = activeTab === "visual" ? "visual" : "blocks";
      let targetDomId: string | undefined;

      if (blockIdx !== undefined || isItemText) {
        const resolvedBlockIdx = blockIdx ?? 0;
        const parentBlock =
          blocks[resolvedBlockIdx] || blocks.find((b) => b.type === "list") || blocks[0];
        const targetBlock =
          childIdx !== undefined && parentBlock?.type === "section"
            ? (parentBlock as SectionBlock).children?.[childIdx]
            : parentBlock;
        const targetId = targetBlock?.id || parentBlock?.id;

        targetTab = activeTab === "visual" ? "visual" : "blocks";
        if (targetId) {
          targetDomId = `block-${targetId}`;
        }

        if (isItemText) {
          const parentName =
            parentBlock?.type === "section"
              ? ` trong nhóm "${(parentBlock as SectionBlock).title || "Nhóm"}"`
              : "";
          friendlyTitle = "Mục danh sách đang để trống";
          friendlyDescription = `Mục số ${Number(itemIdx ?? 0) + 1} của danh sách${parentName} (Khối ${resolvedBlockIdx + 1}) chưa có nội dung. Vui lòng nhập nội dung cho mục này hoặc xoá mục này đi.`;
        } else if (isHeadingText) {
          friendlyTitle = "Tiêu đề mục đang để trống";
          friendlyDescription = `Khối ${resolvedBlockIdx + 1} (Tiêu đề) đang bị để trống. Vui lòng nhập nội dung tiêu đề.`;
        } else if (isParagraphText) {
          friendlyTitle = "Đoạn văn đang để trống";
          friendlyDescription = `Khối ${resolvedBlockIdx + 1} (Đoạn văn) chưa có nội dung. Vui lòng nhập nội dung hoặc xoá khối này.`;
        } else if (isImageUrl) {
          friendlyTitle = "Hình ảnh chưa có đường dẫn";
          friendlyDescription = `Khối ${resolvedBlockIdx + 1} (Hình ảnh) chưa có ảnh. Vui lòng tải ảnh lên hoặc dán URL ảnh.`;
        } else {
          friendlyTitle = `Khối nội dung ${resolvedBlockIdx + 1} chưa hợp lệ`;
          friendlyDescription = rawMessage.replace(
            /Item text không được để trống/i,
            "Mục danh sách không được để trống",
          );
        }
      } else if (rawMessage.includes("title")) {
        friendlyTitle = "Tiêu đề không hợp lệ";
        friendlyDescription = "Tiêu đề bài viết không được để trống và tối đa 255 ký tự.";
        targetTab = "info";
        targetDomId = "field-title";
      } else if (rawMessage.includes("slug")) {
        friendlyTitle = "Đường dẫn không hợp lệ";
        friendlyDescription = "Đường dẫn (slug) bài viết không hợp lệ hoặc đã bị trùng lặp.";
        targetTab = "info";
        targetDomId = "field-slug";
      } else {
        friendlyDescription = rawMessage.replace(
          /Item text không được để trống/i,
          "Mục danh sách không được để trống",
        );
      }

      jumpToElement(targetTab, targetDomId, blockIdx);

      toast({
        title: friendlyTitle,
        description: friendlyDescription,
        color: "danger",
        duration: 8000,
        action: {
          label: "Đi đến vị trí lỗi →",
          onClick: () => {
            jumpToElement(targetTab, targetDomId, blockIdx);
          },
        },
      });
    },
    [currentDocumentContent, activeTab, jumpToElement, toast],
  );

  // Clean up discarded uploaded images helper
  const cleanupDiscardedImages = useCallback(
    (blocks: DocumentBlock[], currentThumbnailFileId?: string | null) => {
      if (discardedFileIds.length === 0) return;

      const activeBlockFileIds = new Set<string>();
      for (const b of blocks) {
        if (b.type === "image" && b.fileId) activeBlockFileIds.add(b.fileId);
        if (b.type === "section") {
          for (const child of (b as SectionBlock).children || []) {
            if (child.type === "image" && child.fileId) activeBlockFileIds.add(child.fileId);
          }
        }
      }

      for (const fid of discardedFileIds) {
        if (
          !galleryFileIds.includes(fid) &&
          !activeBlockFileIds.has(fid) &&
          fid !== currentThumbnailFileId
        ) {
          deleteUploadedImage(fid).catch((err) =>
            console.warn("Lỗi xóa ảnh trên ImageKit:", err),
          );
        }
      }
      setDiscardedFileIds([]);
    },
    [discardedFileIds, galleryFileIds],
  );

  // Submit Handler — supports both draft and publish in create mode, and preserves status in edit mode
  const onSubmit = (data: ArticleFormData, publish?: boolean) => {
    const targetIsPublished =
      mode === "create"
        ? Boolean(publish)
        : publish !== undefined
          ? publish
          : (article?.isPublished ?? data.isPublished ?? false);

    const normalizedContent = normalizeSlideDetailBlogContent(data.content);
    const normalizedPublishedAt =
      normalizeArticlePublishedAt(data.publishedAt) ??
      (targetIsPublished ? new Date().toISOString() : null);

    const payload: ArticleFormData = {
      ...data,
      content: {
        ...normalizedContent,
        sidebarConfig: data.sidebarConfig ?? null,
      } as DocumentContent,
      sidebarConfig: data.sidebarConfig ?? null,
      isPublished: targetIsPublished,
      publishedAt: normalizedPublishedAt,
      projectId: data.projectId || null,
      programId: data.programId || null,
      solutionId: data.solutionId || null,
      tempFolderKey: randomFallbackSubfolder,
    };

    if (targetIsPublished) {
      if (!payload.title?.trim()) {
        scrollToErrorField("field-title", "info");
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề bài viết không được để trống (tại Tab 'Thông tin').",
          color: "danger",
          duration: 8000,
          action: {
            label: "Đi tới tiêu đề",
            onClick: () => scrollToErrorField("field-title", "info"),
          },
        });
        return;
      }
      if (!payload.content?.blocks || payload.content.blocks.length === 0) {
        setActiveTab("blocks");
        toast({
          title: "Không thể xuất bản",
          description: "Bài viết phải có ít nhất 1 khối nội dung (tại Tab 'Nội dung').",
          color: "danger",
          duration: 8000,
          action: {
            label: "Đi tới khối nội dung",
            onClick: () => setActiveTab("blocks"),
          },
        });
        return;
      }
    }

    if (mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: async (createdArticle) => {
          cleanupDiscardedImages(
            (payload.content?.blocks || []) as DocumentBlock[],
            payload.thumbnailFileId,
          );

          if (publish && createdArticle?.id && !createdArticle.isPublished) {
            try {
              await publishMutation.mutateAsync({ id: createdArticle.id, isPublished: true });
            } catch (pubErr) {
              console.warn("Lỗi đồng bộ trạng thái xuất bản:", pubErr);
            }
          }

          await queryClient.invalidateQueries({ queryKey: articleKeys.all });

          toast({
            title: publish ? "Đã xuất bản bài viết" : "Đã lưu bản nháp",
            color: "success",
          });
          startTransition(() => {
            router.push("/articles");
          });
        },
        onError: (error) => {
          handleMutationError(error, "Tạo bài viết thất bại");
        },
      });
    } else {
      updateMutation.mutate(payload, {
        onSuccess: (updatedArticle) => {
          cleanupDiscardedImages(
            (payload.content?.blocks || []) as DocumentBlock[],
            payload.thumbnailFileId,
          );

          if (
            payload.content &&
            typeof payload.content === "object" &&
            "sidebarConfig" in payload.content
          ) {
            setValue(
              "sidebarConfig",
              ((payload.content as Record<string, unknown>).sidebarConfig as SidebarConfig) ?? null,
              { shouldDirty: false },
            );
          }

          const savedIso = updatedArticle?.publishedAt ?? normalizedPublishedAt;
          if (savedIso) {
            const savedDate = new Date(savedIso);
            if (!Number.isNaN(savedDate.getTime())) {
              setValue("publishedAt", format(savedDate, "yyyy-MM-dd'T'HH:mm"), {
                shouldDirty: false,
              });
            }
          } else {
            setValue("publishedAt", "", { shouldDirty: false });
          }

          toast({ title: "Đã lưu thay đổi", color: "success" });
        },
        onError: (error) => {
          handleMutationError(error, "Lưu bài viết thất bại");
        },
      });
    }
  };

  // Validation Error Handler
  const onInvalid = useCallback(
    (fieldErrors: FieldErrors<ArticleFormData>) => {
      const contentErrors = fieldErrors.content as unknown as
        | { blocks?: Record<string, unknown> }
        | undefined;
      const blockErrors = contentErrors?.blocks;

      if (blockErrors) {
        const errorKeys = Object.keys(blockErrors);
        const firstIndex = Number(errorKeys[0]);
        const currentBlocks = (currentDocumentContent?.blocks || []) as DocumentBlock[];
        const targetBlock = currentBlocks[firstIndex];
        const targetId = targetBlock ? `block-${targetBlock.id}` : undefined;
        const targetTab: EditorTab = activeTab === "visual" ? "visual" : "blocks";

        jumpToElement(targetTab, targetId, firstIndex);

        toast({
          title: "Không thể lưu bài viết",
          description: "Có khối nội dung đang để trống. Vui lòng kiểm tra lại tại Tab 'Nội dung'.",
          color: "danger",
          duration: 8000,
          action: {
            label: "Đi tới khối lỗi",
            onClick: () => jumpToElement(targetTab, targetId, firstIndex),
          },
        });
        return;
      }

      if (fieldErrors.title) {
        scrollToErrorField("field-title", "info");

        toast({
          title: "Thiếu tiêu đề bài viết",
          description:
            fieldErrors.title.message || "Tiêu đề bài viết không được để trống (tại Tab 'Thông tin').",
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
        title: "Không thể lưu bài viết",
        description:
          typeof message === "string"
            ? message
            : "Dữ liệu nhập chưa hợp lệ. Vui lòng kiểm tra lại tại Tab 'Thông tin'.",
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
    },
    [activeTab, currentDocumentContent?.blocks, jumpToElement, scrollToErrorField, toast],
  );

  // Toggle Publish (edit mode only)
  const handleTogglePublish = (publish: boolean) => {
    if (!article) return;

    if (publish) {
      const currentTitle = watchedTitle || article.title;
      if (!currentTitle?.trim()) {
        scrollToErrorField("field-title", "info");
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề bài viết không được để trống",
          color: "danger",
        });
        return;
      }
      const blocks =
        currentDocumentContent?.blocks || parseArticleContent(article.content).content?.blocks || [];
      if (!blocks || blocks.length === 0) {
        setActiveTab("blocks");
        toast({
          title: "Không thể xuất bản",
          description: "Bài viết phải có ít nhất 1 khối nội dung",
          color: "danger",
        });
        return;
      }
    }

    publishMutation.mutate(
      { id: article.id, isPublished: publish },
      {
        onSuccess: () => {
          setValue("isPublished", publish, { shouldDirty: false });
          queryClient.invalidateQueries({ queryKey: articleKeys.all });
          queryClient.invalidateQueries({ queryKey: articleKeys.detail(article.id) });
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

  // Handle Delete (edit mode only)
  const handleDelete = () => {
    if (!article) return;
    deleteMutation.mutate(article.id, {
      onSuccess: () => {
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

  return (
    <DocumentUploadProvider
      folder="article"
      subfolder={currentSubfolder}
      tempFolderKey={randomFallbackSubfolder}
      onGalleryFileSelect={handleGalleryFileSelect}
    >
      <div className="space-y-6 pb-12">
        {/* Top Header & Global Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text">
                {mode === "create"
                  ? "Thêm bài viết mới"
                  : `Sửa bài viết: ${article?.title || ""}`}
              </h1>
              {mode === "edit" && article && (
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                    isCurrentlyPublished
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-amber-200 bg-amber-50 text-amber-700"
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
            {mode === "edit" &&
              article &&
              (isCurrentlyPublished ? (
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
              ))}
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
            Nội dung
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

        {/* TAB 1: THÔNG TIN — 2-column layout consistent with SolutionEditor & ProgramEditor */}
        {activeTab === "info" && (
          <form onSubmit={handleSubmit((data) => onSubmit(data), onInvalid)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Column — Thông tin bài viết, Liên kết & SEO */}
              <div className="space-y-6 lg:col-span-2">
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Thông tin bài viết
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div
                      id="field-title"
                      className="space-y-1.5 rounded-lg p-1 -m-1 transition-all duration-300"
                    >
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
                            onApply={(action) =>
                              applySubtitleFormat(subtitleInputRef.current, action)
                            }
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
                      <div id="field-slug">
                        <FormInput
                          label="Đường dẫn tĩnh (Slug)"
                          placeholder="Tự sinh từ tiêu đề nếu để trống..."
                          helperText="Chỉ dùng chữ cái thường không dấu, số và dấu gạch ngang"
                          errorMessage={errors.slug?.message}
                          {...register("slug")}
                        />
                      </div>
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

                {/* Liên kết thực thể & Cấu hình Sidebar */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Liên kết thực thể & Cấu hình Sidebar
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
                          onChange={(val) =>
                            setValue("projectId", val || null, { shouldDirty: true })
                          }
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
                          onChange={(val) =>
                            setValue("programId", val || null, { shouldDirty: true })
                          }
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
                          onChange={(val) =>
                            setValue("solutionId", val || null, { shouldDirty: true })
                          }
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

                    <SidebarConfigPanel
                      value={watchedSidebarConfig}
                      onChange={(cfg) => setValue("sidebarConfig", cfg, { shouldDirty: true })}
                      articles={
                        allArticlesData?.items
                          ?.filter((a) => a.id !== article?.id)
                          .map((a) => ({ id: a.id, slug: a.slug, title: a.title })) ?? []
                      }
                      solutions={
                        solutionsData?.items?.map((s) => ({
                          id: s.id,
                          slug: s.slug,
                          title: s.title,
                        })) ?? []
                      }
                      programs={
                        programsData?.items?.map((p) => ({
                          id: p.id,
                          slug: p.slug,
                          title: p.title,
                        })) ?? []
                      }
                      projects={
                        projectsData?.items?.map((p) => ({
                          id: p.id,
                          slug: p.slug,
                          title: p.title,
                        })) ?? []
                      }
                      slides={
                        slideBlogsData?.items?.map((s) => ({
                          id: s.id,
                          slug: s.slug,
                          title: s.title,
                        })) ?? []
                      }
                    />
                  </CardContent>
                </Card>

                {/* SEO Settings */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Tối ưu hoá SEO
                    </CardTitle>
                  </CardHeader>
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
                </Card>
              </div>

              {/* Sidebar Column — Phân loại, Ảnh đại diện, Xuất bản */}
              <div className="space-y-6">
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Phân loại & Thẻ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
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
                  </CardContent>
                </Card>

                {/* Thumbnail / Hero Image */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <div className="flex w-full items-center justify-between">
                      <CardTitle className="text-base font-semibold text-text">
                        Ảnh đại diện (Thumbnail)
                      </CardTitle>
                      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted p-0.5">
                        <button
                          type="button"
                          onClick={() => setThumbMode("upload")}
                          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                            thumbMode === "upload"
                              ? "bg-surface font-semibold text-primary shadow-xs"
                              : "text-text-muted hover:text-text"
                          }`}
                        >
                          Tải ảnh
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbMode("url")}
                          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                            thumbMode === "url"
                              ? "bg-surface font-semibold text-primary shadow-xs"
                              : "text-text-muted hover:text-text"
                          }`}
                        >
                          Nhập URL
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
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
                            className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Nhấn để chọn ảnh từ máy tính
                          </button>
                        </div>
                      )}
                    </div>

                    {thumbMode === "upload" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-muted">
                          {uploadingThumb ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleThumbFileChange}
                            disabled={uploadingThumb}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowGallery(true)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-muted"
                        >
                          Chọn từ thư viện
                        </button>
                        {currentThumbnailPreview && (
                          <button
                            type="button"
                            onClick={handleDeleteHeroImage}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-danger/30 bg-danger/5 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
                          >
                            Xoá ảnh
                          </button>
                        )}
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
                            Xoá ảnh
                          </button>
                        )}
                      </div>
                    )}

                    <p className="text-[11px] text-text-muted">
                      Lưu vào /vdcd/articles/{currentSubfolder}
                    </p>

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

                {/* Xuất bản & Thời gian */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Thời gian & Xuất bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <FormInput
                      type="datetime-local"
                      label="Ngày xuất bản"
                      helperText="Nếu để trống, sẽ tự động lấy thời điểm hiện tại khi xuất bản"
                      errorMessage={errors.publishedAt?.message}
                      {...register("publishedAt")}
                    />
                    {mode === "edit" && article && (
                      <div className="space-y-2 border-t border-border pt-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted">Trạng thái</span>
                          <span
                            className={`font-semibold ${
                              isCurrentlyPublished ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {isCurrentlyPublished ? "Đã xuất bản" : "Bản nháp"}
                          </span>
                        </div>
                        {article.createdAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-text-muted">Ngày tạo</span>
                            <span className="text-text">
                              {new Date(article.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        )}
                        {article.updatedAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-text-muted">Cập nhật</span>
                            <span className="text-text">
                              {new Date(article.updatedAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Footer — Tab "Thông tin" */}
            <div data-bottom-save-bar className="flex items-center justify-between pt-6">
              {mode === "edit" && canDelete ? (
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
                {isDirty && <p className="text-xs text-warning">Có thay đổi chưa lưu</p>}
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
                      Xuất bản bài viết
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

        {/* TAB 2: NỘI DUNG (BLOCK EDITOR) */}
        {activeTab === "blocks" && (
          <Card className="border border-border bg-surface shadow-sm">
            <CardContent className="p-5">
              <BlockEditor value={currentDocumentContent} onChange={handleContentChange} />
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
              subtitle={watchedSubtitle}
              excerpt={watchedExcerpt}
              heroImageUrl={currentThumbnailPreview}
              content={currentDocumentContent}
              slug={watchedSlug}
              badge={watchedCategory || undefined}
              urlPrefix="vdcd.vn/bai-viet/"
            />
          </div>
        )}

        {/* TAB 4: TRÌNH CHỈNH SỬA TRỰC QUAN (VISUAL EDITOR CANVAS) */}
        {activeTab === "visual" && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <VisualEditorCanvas
              title={watchedTitle}
              subtitle={watchedSubtitle}
              excerpt={watchedExcerpt}
              heroImageUrl={currentThumbnailPreview}
              content={currentDocumentContent}
              onContentChange={handleContentChange}
              onTitleChange={(t) => setValue("title", t, { shouldDirty: true })}
              onSubtitleChange={(s) => setValue("subtitle", s, { shouldDirty: true })}
              onExcerptChange={(e) => setValue("excerpt", e, { shouldDirty: true })}
              onHeroImageChange={(url, fileId) => {
                const prevFileId = getValues("thumbnailFileId");
                if (prevFileId && prevFileId !== fileId) {
                  if (!galleryFileIds.includes(prevFileId)) {
                    if (prevFileId !== article?.thumbnailFileId) {
                      deleteUploadedImage(prevFileId).catch((err) =>
                        console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
                      );
                      setDiscardedFileIds((prev) => prev.filter((id) => id !== prevFileId));
                    }
                  }
                }
                setThumbPreviewUrl(url);
                setFailedThumbUrl(null);
                setValue("thumbnail", url, { shouldValidate: true, shouldDirty: true });
                setValue("thumbnailFileId", fileId ?? null, { shouldDirty: true });
              }}
              onHeroImageDelete={handleDeleteHeroImage}
              onImageDiscard={handleImageBlockDiscard}
              simulatedUrl={`vdcd.vn/bai-viet/${watchedSlug || "..."}`}
            />
          </div>
        )}

        {/* Footer — visible when NOT on the "Thông tin" tab */}
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
                Xoá bài viết
              </AppButton>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {isDirty && <p className="text-xs text-warning">Có thay đổi chưa lưu</p>}
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
                    Xuất bản bài viết
                  </AppButton>
                </>
              ) : (
                <AppButton
                  type="button"
                  isLoading={isSubmitting}
                  disabled={!isDirty || isSubmitting}
                  onClick={handleSubmit((data) => onSubmit(data), onInvalid)}
                >
                  Lưu thay đổi
                </AppButton>
              )}
            </div>
          </div>
        )}

        {/* Floating Save Bar */}
        <FloatingSaveBar isVisible={isDirty} statusText="Có thay đổi chưa lưu">
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
                Xuất bản bài viết
              </AppButton>
            </>
          ) : (
            <AppButton
              type="button"
              isLoading={isSubmitting}
              disabled={!isDirty || isSubmitting}
              onClick={handleSubmit((data) => onSubmit(data), onInvalid)}
              className="text-xs"
            >
              Lưu thay đổi
            </AppButton>
          )}
        </FloatingSaveBar>

        {/* Modal xác nhận xoá bài viết */}
        {mode === "edit" && article && (
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <ModalContent>
              <ModalHeader>Xác nhận xoá bài viết</ModalHeader>
              <ModalBody>
                <p>
                  Bạn có chắc muốn xoá vĩnh viễn bài viết{" "}
                  <strong>{article.title}</strong>?
                </p>
                <p className="text-sm text-text-muted">Hành động này không thể hoàn tác.</p>
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
        )}
      </div>
    </DocumentUploadProvider>
  );
}

