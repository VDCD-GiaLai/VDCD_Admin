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
  useCreateProgram,
  useUpdateProgram,
  usePublishProgram,
  useDeleteProgram,
  usePrograms,
  useReorderPrograms,
  programKeys,
} from "../api";
import { usePermission } from "@/hooks/usePermission";
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
  type DocumentBlock,
  type SectionBlock,
} from "@/shared/content-editor";
import { uploadImage, validateImageFile, slugifyVietnamese, deleteUploadedImage } from "@/lib/upload";
import { ImagePickerModal, type ImagePickerResult, SidebarConfigPanel } from "@/components/shared";
import { useSolutions } from "@/features/solutions/api";
import { useProjects } from "@/features/projects/api";
import { useArticles } from "@/features/articles/api";
import { useSlideDetailBlogs } from "@/features/slide-detail-blogs/api";
import type { SidebarConfig } from "@/types/sidebar-config";
import type { Program } from "@/types/program";

type EditorTab = "info" | "blocks" | "reader" | "visual";

export interface ProgramEditorProps {
  mode: "create" | "edit";
  program?: Program;
}

function resolveDuplicateOrders(
  currentProgramId: string,
  targetOrder: number,
  programsList: { id: string; order?: number }[],
): { id: string; order: number }[] {
  const others = programsList
    .filter((p) => p.id !== currentProgramId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const newReordered: { id: string; order: number }[] = [];
  let currentAssigned = false;
  let runningOrder = 1;

  for (const item of others) {
    if (!currentAssigned && runningOrder >= targetOrder) {
      newReordered.push({ id: currentProgramId, order: runningOrder });
      currentAssigned = true;
      runningOrder++;
    }
    newReordered.push({ id: item.id, order: runningOrder });
    runningOrder++;
  }

  if (!currentAssigned) {
    newReordered.push({ id: currentProgramId, order: runningOrder });
  }

  return newReordered;
}

export function ProgramEditor({ mode, program }: ProgramEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram(program?.id ?? "");
  const publishMutation = usePublishProgram();
  const deleteMutation = useDeleteProgram();
  const { data: allProgramsData } = usePrograms({ limit: 100 });
  const { data: solutionsData } = useSolutions({ limit: 100 });
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: articlesData } = useArticles({ limit: 100 });
  const { data: slideBlogsData } = useSlideDetailBlogs({ limit: 100 });
  const reorderProgramsMutation = useReorderPrograms();
  const { data: operationFields } = useOperationFields();

  const canDelete = usePermission("programs:delete");

  const [activeTab, setActiveTab] = useState<EditorTab>("info");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    () => program?.thumbnail ?? null,
  );
  const [prevProgramThumbnail, setPrevProgramThumbnail] = useState(program?.thumbnail);
  if (program?.thumbnail !== prevProgramThumbnail) {
    setPrevProgramThumbnail(program?.thumbnail);
    setThumbnailPreview(program?.thumbnail ?? null);
  }
  const [showGallery, setShowGallery] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Gallery-sourced file IDs — images picked from ImageKit gallery are NEVER deleted on ImageKit
  const [galleryFileIds, setGalleryFileIds] = useState<string[]>([]);

  // Discarded thumbnail file IDs for cleanup
  const [discardedThumbnailFileIds, setDiscardedThumbnailFileIds] = useState<string[]>([]);
  // Discarded content image file IDs (deleted blocks, replaced images)
  const [discardedContentFileIds, setDiscardedContentFileIds] = useState<string[]>([]);

  const handleGallerySelect = (image: ImagePickerResult) => {
    if (image.fileId) {
      setGalleryFileIds((prev) =>
        prev.includes(image.fileId) ? prev : [...prev, image.fileId],
      );
    }
    const previousFileId = getValues("thumbnailFileId");
    if (
      previousFileId &&
      !galleryFileIds.includes(previousFileId) &&
      previousFileId !== program?.thumbnailFileId
    ) {
      deleteUploadedImage(previousFileId).catch((err) =>
        console.warn("Lỗi xóa ảnh vừa tải lên trên ImageKit:", err),
      );
      setDiscardedThumbnailFileIds((prev) =>
        prev.filter((id) => id !== previousFileId),
      );
    }
    setValue("thumbnail", image.url, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
    setValue("thumbnailFileId", image.fileId || null, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
    setThumbnailPreview(image.url);
    toast({ title: "Đã chọn ảnh đại diện từ thư viện", color: "success" });
  };

  const handleDeleteThumbnail = () => {
    const currentFileId = getValues("thumbnailFileId");
    const isDirectSessionUpload =
      currentFileId &&
      !galleryFileIds.includes(currentFileId) &&
      currentFileId !== program?.thumbnailFileId;

    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      if (currentFileId !== program?.thumbnailFileId) {
        deleteUploadedImage(currentFileId).catch((err) =>
          console.warn("Lỗi xóa ảnh vừa tải lên trên ImageKit:", err),
        );
        setDiscardedThumbnailFileIds((prev) => prev.filter((id) => id !== currentFileId));
      }
      // Note: DB-persisted thumbnails are preserved in ImageKit (soft-delete from program only)
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
        : 'Nhấn "Lưu thay đổi" để hoàn tất cập nhật chương trình.',
      color: "warning",
    });
  };

  const handleImageBlockDiscard = (fileId: string) => {
    if (fileId) {
      setDiscardedContentFileIds((prev) =>
        prev.includes(fileId) ? prev : [...prev, fileId],
      );
    }
  };

  // Initialize initial DocumentContent from legacy HTML or JSON
  const initialContent = useMemo(() => {
    return program?.content ? parseProgramContent(program.content) : createDefaultDocumentContent();
  }, [program]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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
      order: program?.order ?? undefined,
      metaTitle: program?.metaTitle ?? "",
      metaDescription: program?.metaDescription ?? "",
      isPublished: program?.isPublished ?? false,
      sidebarConfig: program?.sidebarConfig ?? (program?.content as Record<string, unknown> | null)?.sidebarConfig as SidebarConfig ?? { mode: "auto" },
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
        order: program.order ?? 1,
        metaTitle: program.metaTitle ?? "",
        metaDescription: program.metaDescription ?? "",
        isPublished: program.isPublished,
        sidebarConfig: program.sidebarConfig ?? (program.content as Record<string, unknown> | null)?.sidebarConfig as SidebarConfig ?? { mode: "auto" },
      });
    }
  }, [program, reset]);

  // Live form state watching — Single Source of Truth
  const watchedTitle = useWatch({ control, name: "title" }) ?? "";
  const watchedShortDescription = useWatch({ control, name: "shortDescription" }) ?? "";
  const watchedThumbnail = useWatch({ control, name: "thumbnail" }) ?? "";
  const watchedSlug = useWatch({ control, name: "slug" }) ?? "";
  const watchedOrder = useWatch({ control, name: "order" });
  const watchedFieldId = useWatch({ control, name: "fieldId" });
  const rawWatchedContent = useWatch({ control, name: "content" });
  const watchedIsPublished = useWatch({ control, name: "isPublished" });
  const watchedSidebarConfig = useWatch({ control, name: "sidebarConfig" as never }) as SidebarConfig | null | undefined;
  const isCurrentlyPublished = watchedIsPublished ?? program?.isPublished ?? false;

  // Next available positive integer order
  const nextAvailableOrder = useMemo(() => {
    if (!allProgramsData?.items || allProgramsData.items.length === 0) return 1;
    const otherOrders = allProgramsData.items
      .filter((p) => p.id !== program?.id)
      .map((p) => p.order)
      .filter((o): o is number => typeof o === "number" && o > 0);

    if (otherOrders.length === 0) return 1;
    const maxOrder = Math.max(...otherOrders);
    for (let i = 1; i <= maxOrder; i++) {
      if (!otherOrders.includes(i)) return i;
    }
    return maxOrder + 1;
  }, [allProgramsData, program?.id]);

  // Set default order for new programs
  useEffect(() => {
    if (mode === "create" && getValues("order") === undefined && nextAvailableOrder) {
      setValue("order", nextAvailableOrder, { shouldValidate: true });
    }
  }, [mode, nextAvailableOrder, getValues, setValue]);

  // Duplicate order conflict detection
  const conflictingProgram = useMemo(() => {
    if (!watchedOrder || watchedOrder < 1 || !allProgramsData?.items) return null;
    return allProgramsData.items.find(
      (p) => p.id !== program?.id && p.order === watchedOrder,
    );
  }, [watchedOrder, allProgramsData, program?.id]);

  const totalProgramsCount = allProgramsData?.total ?? allProgramsData?.items?.length ?? 0;

  const currentThumbnail = thumbnailPreview ?? watchedThumbnail ?? program?.thumbnail ?? "";

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

  // Handle thumbnail upload
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
      const previousFileId = getValues("thumbnailFileId");
      if (previousFileId && !galleryFileIds.includes(previousFileId)) {
        if (previousFileId !== program?.thumbnailFileId) {
          deleteUploadedImage(previousFileId).catch((err) =>
            console.warn("Lỗi xóa ảnh cũ trên ImageKit:", err),
          );
          setDiscardedThumbnailFileIds((prev) => prev.filter((id) => id !== previousFileId));
        }
      }
      setValue("thumbnail", result.url, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      setValue("thumbnailFileId", result.fileId, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      setThumbnailPreview(result.url);
      toast({ title: "Tải ảnh đại diện thành công", color: "success" });
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
            el?.classList.remove("ring-4", "ring-danger", "ring-offset-2", "animate-pulse");
          }, 4000);
        }
      }, 150);
    },
    [activeTab],
  );

  // Helper to scroll & highlight an error field
  const scrollToErrorField = useCallback(
    (elementId: string, targetTab: EditorTab = "info") => {
      jumpToElement(targetTab, elementId);
    },
    [jumpToElement],
  );

  // Parse backend mutation error (e.g. blocks[43].items[0].text) and display clear error toast with jump action
  const handleMutationError = useCallback(
    (err: { message?: string }, defaultTitle = "Lưu thất bại") => {
      const rawMessage = err.message || "";
      const blocks = currentDocumentContent?.blocks || [];

      // Extract block, child, and item indices even if surrounded by other text
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
        friendlyDescription = "Tiêu đề chương trình không được để trống và tối đa 255 ký tự.";
        targetTab = "info";
        targetDomId = "field-title";
      } else if (rawMessage.includes("slug")) {
        friendlyTitle = "Đường dẫn không hợp lệ";
        friendlyDescription = "Đường dẫn (slug) chương trình không hợp lệ hoặc đã bị trùng lặp.";
        targetTab = "info";
        targetDomId = "field-slug";
      } else {
        friendlyDescription = rawMessage.replace(
          /Item text không được để trống/i,
          "Mục danh sách không được để trống",
        );
      }

      // Auto-jump to the exact element needing input
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

  // Submit Handler — supports both draft and publish in create mode, and preserves status in edit mode
  const onSubmit = (data: ProgramFormData, publish?: boolean) => {
    const targetIsPublished =
      mode === "create"
        ? Boolean(publish)
        : publish !== undefined
          ? publish
          : (data.isPublished ?? program?.isPublished ?? false);

    const submitData = serializeProgramPayload({
      ...data,
      isPublished: targetIsPublished,
    });

    if (mode === "create") {
      // Publish validation in create mode
      if (publish) {
        if (!data.title?.trim()) {
          scrollToErrorField("field-title", "info");
          toast({
            title: "Không thể xuất bản",
            description: "Tiêu đề chương trình không được để trống.",
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

      createMutation.mutate(submitData as unknown as ProgramFormData, {
        onSuccess: async (createdProgram) => {
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

          const programId =
            createdProgram?.id ||
            (createdProgram as unknown as { data?: { id?: string } })?.data?.id;

          // If publish is requested, ensure it's published via /publish endpoint
          if (publish && programId) {
            try {
              await publishMutation.mutateAsync({ id: programId, isPublished: true });
            } catch (pubErr) {
              console.warn("Lỗi đồng bộ trạng thái xuất bản:", pubErr);
            }
          }

          await queryClient.invalidateQueries({ queryKey: programKeys.all });

          if (
            conflictingProgram &&
            typeof submitData.order === "number" &&
            submitData.order >= 1 &&
            allProgramsData?.items
          ) {
            const reorderedItems = resolveDuplicateOrders(
              programId!,
              submitData.order,
              allProgramsData.items,
            );
            reorderProgramsMutation.mutate(reorderedItems);
          }

          toast({
            title: publish ? "Đã xuất bản chương trình" : "Đã lưu bản nháp",
            color: "success",
          });
          startTransition(() => {
            router.push("/programs");
          });
        },
        onError: (err) => {
          handleMutationError(err, "Tạo chương trình thất bại");
        },
      });
    } else {
      // Edit mode: save content without redirect, keep user on page
      updateMutation.mutate(submitData as unknown as ProgramFormData, {
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

          if (
            conflictingProgram &&
            typeof submitData.order === "number" &&
            submitData.order >= 1 &&
            allProgramsData?.items
          ) {
            const reorderedItems = resolveDuplicateOrders(
              program!.id,
              submitData.order,
              allProgramsData.items,
            );
            reorderProgramsMutation.mutate(reorderedItems);
          }

          if (submitData.content && typeof submitData.content === "object" && "sidebarConfig" in submitData.content) {
            setValue("sidebarConfig" as never, (submitData.content as Record<string, unknown>).sidebarConfig as never, { shouldDirty: false });
          }

          toast({ title: "Đã lưu thay đổi", color: "success" });
        },
        onError: (err) => {
          handleMutationError(err, "Lưu thất bại");
        },
      });
    }
  };

  // Validation Error Handler (for create mode forms)
  const onInvalid = useCallback(
    (fieldErrors: FieldErrors<ProgramFormData>) => {
      if (fieldErrors.title) {
        scrollToErrorField("field-title", "info");
        toast({
          title: "Thiếu tiêu đề chương trình",
          description: fieldErrors.title.message || "Tiêu đề chương trình không được để trống.",
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
        title: "Không thể lưu chương trình",
        description: typeof message === "string" ? message : "Dữ liệu nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
        color: "danger",
        duration: 8000,
        ...(targetElementId
          ? {
              action: {
                label: "Đi tới vị trí lỗi →",
                onClick: () => scrollToErrorField(targetElementId, "info"),
              },
            }
          : {}),
      });
    },
    [scrollToErrorField, toast],
  );

  // Toggle Publish (edit mode only)
  const handleTogglePublish = (publish: boolean) => {
    if (!program) return;

    if (publish) {
      if (!watchedTitle?.trim()) {
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề chương trình không được để trống",
          color: "danger",
        });
        return;
      }
    }

    publishMutation.mutate(
      { id: program.id, isPublished: publish },
      {
        onSuccess: () => {
          setValue("isPublished", publish, { shouldDirty: false });
          queryClient.setQueryData(programKeys.detail(program.id), (old: Program | undefined) =>
            old ? { ...old, isPublished: publish } : old,
          );
          queryClient.invalidateQueries({ queryKey: programKeys.all });
          queryClient.invalidateQueries({ queryKey: programKeys.detail(program.id) });
          toast({
            title: publish ? "Đã xuất bản chương trình" : "Đã chuyển về bản nháp",
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
    if (!program) return;
    deleteMutation.mutate(program.id, {
      onSuccess: () => {
        toast({ title: "Đã xoá chương trình thành công", color: "success" });
        router.push("/programs");
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
    <DocumentUploadProvider subfolder={currentSubfolder} folder="program">
      <div className="space-y-6 pb-12">
        {/* Top Header & Global Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text">
                {mode === "create" ? "Thêm chương trình mới" : `Sửa chương trình: ${program?.title || ""}`}
              </h1>
              {mode === "edit" && program && (
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
            {mode === "edit" && program && (
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
            Nội dung ({currentDocumentContent.blocks.length})
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

        {/* TAB 1: THÔNG TIN — redesigned 2-column layout without thumbnail */}
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
                        label="Tiêu đề chương trình"
                        isRequired
                        errorMessage={errors.title?.message}
                        {...register("title")}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div id="field-slug">
                        <FormInput
                          label="Slug (Đường dẫn tĩnh)"
                          placeholder="chuong-trinh-uom-tao"
                          helperText="Để trống để tự động tạo từ tiêu đề"
                          errorMessage={errors.slug?.message}
                          {...register("slug")}
                        />
                      </div>
                      <div id="field-order">
                        <FormInput
                          type="number"
                          label="Vị trí sắp xếp (Thứ tự)"
                          placeholder="1"
                          min={1}
                          step={1}
                          startContent={<span className="font-mono text-xs text-text-muted">#</span>}
                          errorMessage={errors.order?.message}
                          helperText={
                            !conflictingProgram && typeof watchedOrder === "number" && watchedOrder > 0
                              ? watchedOrder > totalProgramsCount
                                ? `Hiện có ${totalProgramsCount} chương trình. Sẽ xếp ở cuối.`
                                : "Số nhỏ hơn sẽ hiển thị trước (1 là đầu tiên)"
                              : undefined
                          }
                          {...register("order", {
                            valueAsNumber: true,
                            min: { value: 1, message: "Vị trí sắp xếp phải lớn hơn hoặc bằng 1" },
                          })}
                        />
                      </div>
                    </div>

                    {/* Cảnh báo và gợi ý khi trùng vị trí sắp xếp */}
                    {conflictingProgram && (
                      <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-text">
                        <div className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-text">
                              Vị trí #{watchedOrder} đang thuộc về chương trình &ldquo;{conflictingProgram.title}&rdquo;
                            </p>
                            <p className="text-text-muted leading-relaxed">
                              Khi lưu, hệ thống sẽ tự động chèn chương trình này vào vị trí #{watchedOrder} và dời các chương trình sau xuống để không bị trùng số.
                            </p>
                            {nextAvailableOrder && (
                              <button
                                type="button"
                                onClick={() => setValue("order", nextAvailableOrder, { shouldValidate: true })}
                                className="mt-1 text-primary hover:underline font-medium"
                              >
                                ↳ Hoặc dùng vị trí chưa ai chọn: #{nextAvailableOrder}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <FormTextarea
                      label="Mô tả ngắn (Hiển thị đầu bài & tóm tắt)"
                      rows={3}
                      errorMessage={errors.shortDescription?.message}
                      {...register("shortDescription")}
                    />
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
                    <p className="text-xs text-text-muted">
                      Tùy chỉnh nội dung hiển thị ở sidebar của trang hoạt động này (chọn hiển thị tự động hoặc tùy chọn danh sách giải pháp, bài viết, dự án liên quan).
                    </p>
                    <SidebarConfigPanel
                      value={watchedSidebarConfig}
                      onChange={(cfg) => setValue("sidebarConfig" as never, cfg as never, { shouldDirty: true })}
                      programs={allProgramsData?.items?.filter((pr) => pr.id !== program?.id).map((pr) => ({ id: pr.id, slug: pr.slug, title: pr.title })) ?? []}
                      solutions={solutionsData?.items?.map((s) => ({ id: s.id, slug: s.slug, title: s.title })) ?? []}
                      articles={articlesData?.items?.map((a) => ({ id: a.id, slug: a.slug, title: a.title })) ?? []}
                      projects={projectsData?.items?.map((p) => ({ id: p.id, slug: p.slug, title: p.title })) ?? []}
                      slides={slideBlogsData?.items?.map((s) => ({ id: s.id, slug: s.slug, title: s.title })) ?? []}
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

              {/* Sidebar Column — Lĩnh vực hoạt động */}
              <div className="space-y-6">
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
                    {selectedField && (
                      <p className="mt-2 text-xs text-text-muted">
                        Đã chọn: <span className="font-medium text-text">{selectedField.name}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Thumbnail */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-text">
                      Ảnh đại diện (Thumbnail)
                    </CardTitle>
                    <span className="text-xs text-text-muted">Tuỳ chọn</span>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    {currentThumbnail ? (
                      <div className="space-y-3">
                        <div className="group relative overflow-hidden rounded-lg border border-border bg-surface-muted/30">
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
                        <p className="text-xs text-text-muted font-mono">
                          Lưu vào /vdcd/programs/{currentSubfolder}
                        </p>
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
                        <p className="mt-3 text-xs text-text-muted font-mono">
                          Lưu vào /vdcd/programs/{currentSubfolder}
                        </p>
                      </div>
                    )}
                    <input type="hidden" {...register("thumbnail")} />
                    <input type="hidden" {...register("thumbnailFileId")} />
                    <ImagePickerModal
                      isOpen={showGallery}
                      onClose={() => setShowGallery(false)}
                      onSelect={handleGallerySelect}
                      defaultFolder="/vdcd/programs"
                      uploadFolder="program"
                      uploadOptions={{ subfolder: currentSubfolder, slug: currentSubfolder }}
                      title="Chọn ảnh chương trình"
                    />
                  </CardContent>
                </Card>

                {/* Quick Stats — only in edit mode */}
                {mode === "edit" && program && (
                  <Card className="border border-border bg-surface shadow-sm">
                    <CardHeader className="border-b border-border px-5 py-3.5">
                      <CardTitle className="text-base font-semibold text-text">
                        Thông tin bổ sung
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Số khối nội dung</span>
                        <span className="text-sm font-semibold text-text">
                          {currentDocumentContent.blocks.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Ngày tạo</span>
                        <span className="text-xs text-text">
                          {new Date(program.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Cập nhật lần cuối</span>
                        <span className="text-xs text-text">
                          {new Date(program.updatedAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
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
                  Xoá chương trình
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
              heroImageUrl={currentThumbnail}
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
              heroImageUrl={currentThumbnail}
              content={currentDocumentContent}
              onContentChange={handleContentChange}
              onTitleChange={(t) => setValue("title", t, { shouldDirty: true })}
              onSubtitleChange={() => {}}
              onExcerptChange={(e) => setValue("shortDescription", e, { shouldDirty: true })}
              onHeroImageChange={(url, fileId) => {
                if (fileId) {
                  setGalleryFileIds((prev) =>
                    prev.includes(fileId) ? prev : [...prev, fileId],
                  );
                }
                const previousFileId = getValues("thumbnailFileId");
                if (
                  previousFileId &&
                  !galleryFileIds.includes(previousFileId) &&
                  previousFileId !== program?.thumbnailFileId
                ) {
                  deleteUploadedImage(previousFileId).catch((err) =>
                    console.warn("Lỗi xóa ảnh vừa tải lên trên ImageKit:", err),
                  );
                }
                setValue("thumbnail", url, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
                setValue("thumbnailFileId", fileId ?? null, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
                setThumbnailPreview(url);
              }}
              onHeroImageDelete={handleDeleteThumbnail}
              onImageDiscard={handleImageBlockDiscard}
              simulatedUrl={`vdcd.vn/chuong-trinh/${watchedSlug || "..."}`}
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
                Xoá chương trình
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

        {/* Modal xác nhận xoá chương trình */}
        {mode === "edit" && program && (
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <ModalContent>
              <ModalHeader>Xác nhận xoá chương trình</ModalHeader>
              <ModalBody>
                <p>
                  Bạn có chắc muốn xoá vĩnh viễn chương trình{" "}
                  <strong>{program.title}</strong>?
                </p>
                <p className="mt-2 text-xs text-text-muted">
                  Lưu ý: Hành động này không thể hoàn tác.
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
        )}
      </div>
    </DocumentUploadProvider>
  );
}
