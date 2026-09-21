"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
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
import { ApiError } from "@/lib/api-client";
import { RichTextEditor, FloatingSaveBar } from "@/components/shared";
import { useOperationFields } from "@/features/operation-fields/api";
import { useProvinces } from "@/features/provinces/api";
import {
  useCreateProject,
  useUpdateProject,
  usePublishProject,
  useDeleteProject,
  useProjects,
} from "../api";
import { usePermission } from "@/hooks/usePermission";
import { projectSchema, type ProjectFormData } from "../schema";
import {
  parseProjectContent,
  serializeProjectPayload,
} from "../utils/project-content";
import {
  BlockEditor,
  VisualEditorCanvas,
  DocumentUploadProvider,
  createDefaultDocumentContent,
  type DocumentContent,
  type SectionBlock,
} from "@/shared/content-editor";
import {
  uploadImage,
  validateImageFile,
  slugifyVietnamese,
  deleteUploadedImage,
} from "@/lib/upload";
import { ImagePickerModal, type ImagePickerResult } from "@/components/shared";
import type { DocumentBlock } from "@/shared/content-editor";
import { generateProjectSessionKey } from "../context/ProjectUploadContext";
import {
  ProjectGallery,
  ProjectReader,
  ProjectHeaderBadges,
  ProjectSpecsSection,
  ProjectChallengeSection,
  ProjectGallerySection,
} from "../components";
import type { Project, ProjectImage } from "@/types/project";

type EditorTab = "info" | "blocks" | "visual" | "reader" | "gallery";

export interface ProjectEditorProps {
  mode: "create" | "edit";
  project?: Project;
}

export function ProjectEditor({ mode, project }: ProjectEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(project?.id ?? "");
  const publishMutation = usePublishProject();
  const deleteMutation = useDeleteProject();
  const { data: operationFields } = useOperationFields();
  const { data: provinces } = useProvinces();
  const { data: projectsData } = useProjects({ limit: 100 });

  const canDelete = usePermission("projects:delete");
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<EditorTab>("info");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    () => project?.thumbnail ?? null,
  );
  const [transformationBeforePreview, setTransformationBeforePreview] = useState<string | null>(
    () => project?.transformationBefore ?? null,
  );
  const [transformationAfterPreview, setTransformationAfterPreview] = useState<string | null>(
    () => project?.transformationAfter ?? null,
  );
  const [galleryImages, setGalleryImages] = useState<ProjectImage[]>(
    () => project?.images ?? [],
  );

  const [showThumbnailGallery, setShowThumbnailGallery] = useState(false);
  const [discardedThumbnailFileIds, setDiscardedThumbnailFileIds] = useState<string[]>([]);
  const [discardedContentFileIds, setDiscardedContentFileIds] = useState<string[]>([]);
  const [galleryFileIds, setGalleryFileIds] = useState<string[]>([]);

  const handleGalleryFileSelect = useCallback((fileId: string) => {
    if (fileId) {
      setGalleryFileIds((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
    }
  }, []);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [prevProject, setPrevProject] = useState(project);
  if (project !== prevProject) {
    setPrevProject(project);
    setThumbnailPreview(project?.thumbnail ?? null);
    setTransformationBeforePreview(project?.transformationBefore ?? null);
    setTransformationAfterPreview(project?.transformationAfter ?? null);
    setGalleryImages(project?.images ?? []);
  }

  // Stable session folder key for all project image uploads
  const [sessionFolderKey] = useState(() => {
    return project?.slug?.trim() || generateProjectSessionKey();
  });

  // Canonical DocumentContent initialization — Single Source of Truth
  const initialContent = useMemo(() => {
    return project
      ? parseProjectContent(project.content, project.overview)
      : createDefaultDocumentContent();
  }, [project]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title ?? "",
      slug: project?.slug ?? "",
      tempFolderKey: sessionFolderKey,
      content: initialContent,
      overview: project?.overview ?? "",
      thumbnail: project?.thumbnail ?? "",
      thumbnailFileId: project?.thumbnailFileId ?? null,
      fieldId: project?.field?.id ?? null,
      provinceId: project?.province?.id ?? null,
      year: project?.year ?? new Date().getFullYear(),
      challenge: project?.challenge ?? "",
      challengeImage: project?.challengeImage ?? "",
      challengeImageFileId: project?.challengeImageFileId ?? null,
      services: project?.services ?? [],
      discipline: project?.discipline ?? "",
      transformationBefore: project?.transformationBefore ?? "",
      transformationBeforeFileId: project?.transformationBeforeFileId ?? null,
      transformationAfter: project?.transformationAfter ?? "",
      transformationAfterFileId: project?.transformationAfterFileId ?? null,
      technicalHighlights: project?.technicalHighlights ?? [],
      nextProjectSlug: project?.nextProjectSlug ?? "",
      metaTitle: project?.metaTitle ?? "",
      metaDescription: project?.metaDescription ?? "",
      isPublished: project?.isPublished ?? false,
    },
  });

  // Dynamic arrays
  const {
    fields: serviceFields,
    append: appendService,
    remove: removeService,
    replace: replaceServices,
  } = useFieldArray({
    control,
    name: "services" as never,
  });

  const {
    fields: highlightFields,
    append: appendHighlight,
    remove: removeHighlight,
    replace: replaceHighlights,
  } = useFieldArray({
    control,
    name: "technicalHighlights",
  });

  // Reset form when project data loads or changes
  useEffect(() => {
    if (project) {
      const parsed = parseProjectContent(project.content, project.overview);
      reset({
        title: project.title,
        slug: project.slug,
        tempFolderKey: project.slug || sessionFolderKey,
        content: parsed,
        overview: project.overview ?? "",
        thumbnail: project.thumbnail ?? "",
        thumbnailFileId: project.thumbnailFileId ?? null,
        fieldId: project.field?.id ?? null,
        provinceId: project.province?.id ?? null,
        year: project.year ?? new Date().getFullYear(),
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
    }
  }, [project, reset, sessionFolderKey]);

  // Live form state watching — Single Source of Truth
  const watchedTitle = useWatch({ control, name: "title" }) ?? "";
  const watchedThumbnail = useWatch({ control, name: "thumbnail" }) ?? "";
  const watchedSlug = useWatch({ control, name: "slug" }) ?? "";
  const watchedFieldId = useWatch({ control, name: "fieldId" });
  const watchedOverview = useWatch({ control, name: "overview" }) ?? "";
  const watchedChallenge = useWatch({ control, name: "challenge" }) ?? "";
  const rawWatchedContent = useWatch({ control, name: "content" });

  const currentThumbnail = thumbnailPreview ?? watchedThumbnail ?? project?.thumbnail ?? "";

  const currentDocumentContent: DocumentContent = useMemo(() => {
    if (
      typeof rawWatchedContent === "object" &&
      rawWatchedContent !== null &&
      "blocks" in rawWatchedContent
    ) {
      return rawWatchedContent as DocumentContent;
    }
    if (typeof rawWatchedContent === "string") {
      return parseProjectContent(rawWatchedContent, watchedOverview);
    }
    return initialContent;
  }, [rawWatchedContent, watchedOverview, initialContent]);

  // Selected Field Name for badge
  const selectedField = useMemo(() => {
    return operationFields?.find((f) => f.id === watchedFieldId);
  }, [operationFields, watchedFieldId]);

  const watchedProvinceId = useWatch({ control, name: "provinceId" });
  const watchedYear = useWatch({ control, name: "year" });
  const watchedDiscipline = useWatch({ control, name: "discipline" }) ?? "";
  const watchedServices = useWatch({ control, name: "services" }) ?? [];
  const watchedHighlights = useWatch({ control, name: "technicalHighlights" }) ?? [];
  const watchedMetaTitle = useWatch({ control, name: "metaTitle" }) ?? "";
  const watchedMetaDescription = useWatch({ control, name: "metaDescription" }) ?? "";
  const watchedTransBefore = useWatch({ control, name: "transformationBefore" }) ?? "";
  const watchedTransAfter = useWatch({ control, name: "transformationAfter" }) ?? "";

  const selectedProvince = useMemo(() => {
    return provinces?.find((p) => p.id === watchedProvinceId);
  }, [provinces, watchedProvinceId]);

  // Active subfolder for image upload (prioritize slug, then sessionFolderKey)
  const currentSubfolder = useMemo(() => {
    const fromSlug = watchedSlug?.trim();
    if (fromSlug) return slugifyVietnamese(fromSlug);
    return sessionFolderKey;
  }, [watchedSlug, sessionFolderKey]);

  // Handle content updates from BlockEditor or VisualEditor
  const handleContentChange = useCallback(
    (newContent: DocumentContent) => {
      setValue("content", newContent, { shouldDirty: true, shouldValidate: true });
    },
    [setValue],
  );

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "thumbnail",
    fileIdField: "thumbnailFileId",
    setPreview: (url: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast({ title: "File không hợp lệ", description: error, color: "danger" });
      return;
    }

    setUploading((prev) => ({ ...prev, [field]: true }));
    try {
      const result = await uploadImage(file, "project", {
        subfolder: currentSubfolder,
        slug: currentSubfolder,
        tempFolderKey: sessionFolderKey,
      });
      const previousFileId = getValues(fileIdField);
      if (previousFileId) {
        setDiscardedThumbnailFileIds((prev) =>
          prev.includes(previousFileId) ? prev : [...prev, previousFileId],
        );
      }
      setValue(field, result.url, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      setValue(fileIdField, result.fileId, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      setPreview(result.url);
      toast({ title: "Tải ảnh thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh thất bại", color: "danger" });
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleGallerySelectThumbnail = (image: ImagePickerResult) => {
    const previousFileId = getValues("thumbnailFileId");
    if (
      previousFileId &&
      !galleryFileIds.includes(previousFileId) &&
      previousFileId !== project?.thumbnailFileId
    ) {
      deleteUploadedImage(previousFileId).catch((err) =>
        console.warn("Lỗi xóa ảnh cũ vừa tải lên trên ImageKit:", err),
      );
      setDiscardedThumbnailFileIds((prev) => prev.filter((id) => id !== previousFileId));
    }
    if (image.fileId) {
      setGalleryFileIds((prev) => (prev.includes(image.fileId!) ? prev : [...prev, image.fileId!]));
    }
    setThumbnailPreview(image.url);
    setValue("thumbnail", image.url, { shouldValidate: true, shouldDirty: true });
    setValue("thumbnailFileId", null, { shouldDirty: true });
    toast({ title: "Đã chọn ảnh đại diện từ thư viện", color: "success" });
  };

  // Handle Soft-Delete Thumbnail (like Hero in slide-detail-blogs)
  const handleDeleteThumbnail = () => {
    const currentFileId = getValues("thumbnailFileId");
    const isDirectSessionUpload =
      currentFileId &&
      !galleryFileIds.includes(currentFileId) &&
      currentFileId !== project?.thumbnailFileId;

    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      if (currentFileId !== project?.thumbnailFileId) {
        // Direct upload in this session not yet saved to DB: delete immediately from ImageKit!
        deleteUploadedImage(currentFileId).catch((err) =>
          console.warn("Lỗi xóa ảnh vừa tải lên trên ImageKit:", err),
        );
        setDiscardedThumbnailFileIds((prev) => prev.filter((id) => id !== currentFileId));
      }
      // DB-persisted thumbnail: preserved in ImageKit (soft-delete from project only)
    }
    setValue("thumbnail", "", { shouldDirty: true, shouldValidate: true });
    setValue("thumbnailFileId", null, { shouldDirty: true });
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
    toast({
      title: "Đã gỡ ảnh đại diện",
      description: isDirectSessionUpload
        ? "Đã xoá ảnh tải lên khỏi thư viện."
        : 'Nhấn "Lưu thay đổi" để hoàn tất cập nhật dự án.',
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

  const jumpToElement = useCallback((tab: EditorTab, elementId?: string) => {
    setActiveTab(tab);

    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-danger", "ring-offset-2", "animate-pulse");

          const focusable = el.querySelector<HTMLElement>("input, textarea, [contenteditable='true'], button");
          focusable?.focus();

          setTimeout(() => {
            el.classList.remove("ring-4", "ring-danger", "ring-offset-2", "animate-pulse");
          }, 4000);
        }
      }, 200);
    }
  }, []);

  const scrollToErrorField = useCallback(
    (elementId: string, targetTab: EditorTab = "info") => {
      if (activeTab !== targetTab) {
        setActiveTab(targetTab);
      }

      setTimeout(() => {
        const el = document.getElementById(elementId);
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
            el.classList.remove("ring-4", "ring-danger", "ring-offset-2", "animate-pulse");
          }, 3000);
        }
      }, 100);
    },
    [activeTab],
  );

  const onSubmit = (data: ProjectFormData, publish = false) => {
    const submitData = serializeProjectPayload({
      ...data,
      isPublished: mode === "create" ? publish : data.isPublished,
      tempFolderKey: sessionFolderKey,
      content: currentDocumentContent,
    });

    const handleMutationError = (err: ApiError) => {
      const rawMessage = err.message || "";
      const blocks = currentDocumentContent?.blocks || [];

      // Parse technical backend messages like blocks[0].children[2].items[0].text
      const blockMatch = rawMessage.match(
        /blocks\[(\d+)\](?:\.children\[(\d+)\])?(?:\.items\[(\d+)\])?(?:\.(\w+))?:?\s*(.*)/i,
      );

      let friendlyTitle = "Lưu dự án thất bại";
      let friendlyDescription = rawMessage;
      let targetTab: EditorTab = "info";
      let targetDomId: string | undefined;

      if (blockMatch) {
        const blockIdx = parseInt(blockMatch[1], 10);
        const childIdx = blockMatch[2] ? parseInt(blockMatch[2], 10) : undefined;
        const itemIdx = blockMatch[3] ? parseInt(blockMatch[3], 10) : undefined;
        const field = blockMatch[4];
        const rawReason = blockMatch[5] || "";

        const parentBlock = blocks[blockIdx];
        const targetBlock =
          childIdx !== undefined && parentBlock?.type === "section"
            ? (parentBlock as SectionBlock).children?.[childIdx]
            : parentBlock;
        const targetId = targetBlock?.id || parentBlock?.id;

        targetTab = "blocks";
        if (targetId) {
          targetDomId = `block-${targetId}`;
        }

        if (itemIdx !== undefined || rawReason.toLowerCase().includes("item text")) {
          const parentName =
            parentBlock?.type === "section"
              ? ` trong nhóm "${(parentBlock as SectionBlock).title || "Nhóm"}"`
              : "";
          friendlyTitle = "Mục danh sách đang để trống";
          friendlyDescription = `Mục số ${Number(itemIdx ?? 0) + 1} của danh sách${parentName} (Khối ${blockIdx + 1}) chưa có nội dung. Vui lòng nhập nội dung cho mục này hoặc xoá mục này đi.`;
        } else if (field === "text") {
          if (targetBlock?.type === "heading") {
            friendlyTitle = "Tiêu đề mục đang để trống";
            friendlyDescription = `Khối ${blockIdx + 1} (Tiêu đề) đang bị để trống. Vui lòng nhập tiêu đề bài viết.`;
          } else {
            friendlyTitle = "Đoạn văn đang để trống";
            friendlyDescription = `Khối ${blockIdx + 1} (Đoạn văn) chưa có nội dung. Vui lòng nhập nội dung hoặc xoá khối này.`;
          }
        } else if (field === "url") {
          friendlyTitle = "Hình ảnh chưa có đường dẫn";
          friendlyDescription = `Khối ${blockIdx + 1} (Hình ảnh) chưa có ảnh. Vui lòng tải ảnh lên hoặc dán URL ảnh.`;
        } else {
          friendlyTitle = `Khối nội dung ${blockIdx + 1} chưa hợp lệ`;
          friendlyDescription = rawReason.replace(
            /Item text không được để trống/i,
            "Mục danh sách không được để trống",
          );
        }
      } else if (rawMessage.includes("title")) {
        friendlyTitle = "Tiêu đề không hợp lệ";
        friendlyDescription = "Tiêu đề dự án không được để trống và tối đa 255 ký tự.";
        targetTab = "info";
        targetDomId = "field-title";
      } else if (rawMessage.includes("slug")) {
        friendlyTitle = "Đường dẫn không hợp lệ";
        friendlyDescription = "Đường dẫn (slug) dự án không hợp lệ hoặc đã bị trùng lặp.";
        targetTab = "info";
        targetDomId = "field-slug";
      } else if (rawMessage.includes("year")) {
        friendlyTitle = "Năm thực hiện không hợp lệ";
        friendlyDescription = "Năm thực hiện dự án phải từ 1990 đến 2100.";
        targetTab = "info";
        targetDomId = "field-year";
      } else {
        friendlyDescription = rawMessage.replace(
          /Item text không được để trống/i,
          "Mục danh sách không được để trống",
        );
      }

      // Auto-jump to the exact element needing input
      if (targetDomId) {
        jumpToElement(targetTab, targetDomId);
      } else {
        setActiveTab(targetTab);
      }

      toast({
        title: friendlyTitle,
        description: friendlyDescription,
        color: "danger",
        duration: 8000,
        action: targetDomId
          ? {
              label: "Đi đến vị trí cần điền →",
              onClick: () => {
                jumpToElement(targetTab, targetDomId);
              },
            }
          : undefined,
      });
    };

    if (mode === "create") {
      if (publish && !data.title?.trim()) {
        scrollToErrorField("field-title", "info");
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề dự án không được để trống.",
          color: "danger",
          duration: 8000,
          action: {
            label: "Đi tới tiêu đề",
            onClick: () => scrollToErrorField("field-title", "info"),
          },
        });
        return;
      }

      createMutation.mutate(submitData as unknown as ProjectFormData, {
        onSuccess: async (createdProject) => {
          const activeBlockFileIds = new Set<string>();
          for (const b of (submitData.content?.blocks || []) as DocumentBlock[]) {
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

          if (publish && createdProject?.id && !createdProject.isPublished) {
            try {
              await publishMutation.mutateAsync({ id: createdProject.id, isPublished: true });
            } catch (pubErr) {
              console.warn("Lỗi đồng bộ trạng thái xuất bản:", pubErr);
            }
          }

          toast({
            title: publish ? "Đã xuất bản dự án" : "Đã lưu bản nháp",
            color: "success",
          });
          startTransition(() => {
            router.push("/projects");
          });
        },
        onError: (err) => handleMutationError(err),
      });
    } else {
      updateMutation.mutate(submitData as unknown as Partial<ProjectFormData>, {
        onSuccess: () => {
          const activeBlockFileIds = new Set<string>();
          for (const b of (submitData.content?.blocks || []) as DocumentBlock[]) {
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
        onError: (err) => handleMutationError(err),
      });
    }
  };

  // Toggle Publish (edit mode only)
  const handleTogglePublish = (publish: boolean) => {
    if (!project) return;

    if (publish && !watchedTitle?.trim()) {
      toast({
        title: "Không thể xuất bản",
        description: "Tiêu đề dự án không được để trống",
        color: "danger",
      });
      return;
    }

    publishMutation.mutate(
      { id: project.id, isPublished: publish },
      {
        onSuccess: () => {
          setValue("isPublished", publish);
          toast({
            title: publish ? "Đã xuất bản dự án" : "Đã chuyển về bản nháp",
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
    if (!project) return;
    deleteMutation.mutate(project.id, {
      onSuccess: () => {
        toast({ title: "Đã xoá dự án thành công", color: "success" });
        router.push("/projects");
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

  const onFormError = (fieldErrors: FieldErrors<ProjectFormData>) => {
    console.error("ProjectEditor form validation errors:", fieldErrors);

    if (fieldErrors.title) {
      scrollToErrorField("field-title", "info");
      toast({
        title: "Thiếu tiêu đề dự án",
        description: fieldErrors.title.message || "Tiêu đề dự án không được để trống.",
        color: "danger",
        duration: 8000,
        action: {
          label: "Đi tới tiêu đề",
          onClick: () => scrollToErrorField("field-title", "info"),
        },
      });
      return;
    }

    const FIELD_METADATA: Record<string, { label: string; tab: "info" | "blocks" | "gallery" }> = {
      title: { label: "Tiêu đề dự án", tab: "info" },
      slug: { label: "Đường dẫn (slug)", tab: "info" },
      year: { label: "Năm thực hiện", tab: "info" },
      fieldId: { label: "Lĩnh vực hoạt động", tab: "info" },
      provinceId: { label: "Tỉnh thành", tab: "info" },
      discipline: { label: "Lĩnh vực chuyên môn", tab: "info" },
      overview: { label: "Tổng quan dự án", tab: "info" },
      challenge: { label: "Thách thức dự án", tab: "info" },
      thumbnail: { label: "Ảnh đại diện (thumbnail)", tab: "info" },
      metaTitle: { label: "Thẻ tiêu đề SEO (Meta Title)", tab: "info" },
      metaDescription: { label: "Thẻ mô tả SEO (Meta Description)", tab: "info" },
      technicalHighlights: { label: "Thông số kỹ thuật", tab: "info" },
      services: { label: "Dịch vụ cung cấp", tab: "info" },
      content: { label: "Khối nội dung bài viết", tab: "blocks" },
    };

    interface FormErrorItem {
      tab: "info" | "blocks" | "gallery";
      tabLabel: string;
      fieldLabel: string;
      message: string;
      blockId?: string;
    }

    const errorDetails: FormErrorItem[] = [];
    const currentBlocks = currentDocumentContent?.blocks || [];

    for (const [key, val] of Object.entries(fieldErrors)) {
      if (!val) continue;

      if (key === "content") {
        const contentErr = val as Record<string, unknown>;
        const rawBlocks = contentErr?.blocks as Record<string, unknown> | undefined;

        if (rawBlocks && typeof rawBlocks === "object") {
          for (const [idxStr, blockErr] of Object.entries(rawBlocks)) {
            const idx = Number(idxStr);
            const targetBlock = currentBlocks[idx];
            const blockTypeLabel =
              targetBlock?.type === "section"
                ? `Nhóm: ${targetBlock.title || targetBlock.number || "Mục"}`
                : targetBlock?.type === "paragraph"
                  ? "Đoạn văn"
                  : targetBlock?.type === "heading"
                    ? "Tiêu đề"
                    : targetBlock?.type === "image"
                      ? "Ảnh"
                      : targetBlock?.type === "list"
                        ? "Danh sách"
                        : targetBlock?.type || "Khối";

            const blockTitle = `Khối ${idx + 1} (${blockTypeLabel})`;

            const extractDeepMsg = (err: unknown): string[] => {
              if (!err || typeof err !== "object") return [];
              const errRecord = err as Record<string, unknown>;
              if (typeof errRecord.message === "string" && errRecord.message) {
                return [errRecord.message];
              }
              const msgs: string[] = [];
              for (const [k, v] of Object.entries(errRecord)) {
                if (k === "ref" || k === "type") continue;
                msgs.push(...extractDeepMsg(v));
              }
              return msgs;
            };

            const deepMsgs = extractDeepMsg(blockErr);
            const cleanMsg =
              deepMsgs.length > 0 ? deepMsgs.join("; ") : "Dữ liệu khối chưa hợp lệ";

            errorDetails.push({
              tab: "blocks",
              tabLabel: "Nội dung",
              fieldLabel: blockTitle,
              message: cleanMsg,
              blockId: targetBlock?.id,
            });
          }
        }

        if (errorDetails.length === 0) {
          errorDetails.push({
            tab: "blocks",
            tabLabel: "Nội dung",
            fieldLabel: "Khối nội dung bài viết",
            message:
              (typeof contentErr?.message === "string" && contentErr.message) ||
              "Có khối nội dung bị để trống hoặc sai định dạng",
          });
        }
        continue;
      }

      const meta = FIELD_METADATA[key] || { label: key, tab: "info" };
      const tabLabel =
        meta.tab === "info" ? "Thông tin" : meta.tab === "blocks" ? "Nội dung" : "Gallery";

      const errObj = val as Record<string, unknown>;
      if (typeof errObj.message === "string" && errObj.message) {
        errorDetails.push({
          tab: meta.tab,
          tabLabel,
          fieldLabel: meta.label,
          message: errObj.message,
        });
      } else if (Array.isArray(errObj)) {
        errObj.forEach((itemErr: unknown, idx: number) => {
          if (!itemErr) return;
          const rec = itemErr as Record<string, unknown>;
          if (typeof rec.message === "string" && rec.message) {
            errorDetails.push({
              tab: meta.tab,
              tabLabel,
              fieldLabel: `${meta.label} [dòng ${idx + 1}]`,
              message: rec.message,
            });
          } else if (typeof rec === "object") {
            for (const [subKey, subErr] of Object.entries(rec)) {
              const msg =
                (subErr && typeof (subErr as Record<string, unknown>).message === "string"
                  ? (subErr as Record<string, unknown>).message
                  : "Không hợp lệ") as string;
              const subLabel =
                subKey === "label" ? "Nhãn" : subKey === "value" ? "Giá trị" : subKey;
              errorDetails.push({
                tab: meta.tab,
                tabLabel,
                fieldLabel: `${meta.label} [dòng ${idx + 1} - ${subLabel}]`,
                message: msg,
              });
            }
          }
        });
      } else {
        errorDetails.push({
          tab: meta.tab,
          tabLabel,
          fieldLabel: meta.label,
          message: "Thông tin chưa hợp lệ",
        });
      }
    }

    if (errorDetails.length > 0) {
      const firstError = errorDetails[0];

      // Auto-jump to the invalid element
      jumpToElement(
        firstError.tab,
        firstError.blockId ? `block-${firstError.blockId}` : undefined,
      );

      const errorLines = errorDetails
        .slice(0, 3)
        .map((e) => `[Tab ${e.tabLabel}] ${e.fieldLabel}: ${e.message}`);

      if (errorDetails.length > 3) {
        errorLines.push(`...và ${errorDetails.length - 3} mục khác`);
      }

      toast({
        title: `Có ${errorDetails.length} mục thông tin chưa hợp lệ`,
        description: errorLines.join(" • "),
        color: "danger",
        duration: 8000,
        action: {
          label: "Đi đến vị trí cần điền →",
          onClick: () => {
            jumpToElement(
              firstError.tab,
              firstError.blockId ? `block-${firstError.blockId}` : undefined,
            );
          },
        },
      });
    } else {
      toast({
        title: "Không thể lưu thông tin dự án",
        description: "Vui lòng kiểm tra lại các trường thông tin bắt buộc.",
        color: "danger",
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || publishMutation.isPending;
  const otherProjects = projectsData?.items?.filter((p) => p.id !== project?.id) ?? [];

  return (
    <DocumentUploadProvider
      subfolder={currentSubfolder}
      folder="project"
      tempFolderKey={sessionFolderKey}
      onGalleryFileSelect={handleGalleryFileSelect}
    >
      <div className="space-y-6 pb-12">
        {/* Top Header & Global Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text">
                {mode === "create"
                  ? "Thêm dự án mới"
                  : `Sửa dự án: ${project?.title || ""}`}
              </h1>
              {mode === "edit" && project && (
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                    project.isPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {project.isPublished ? "Đã xuất bản" : "Bản nháp"}
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted">
              Quản lý thông tin, khối nội dung, chế độ đọc và trình chỉnh sửa trực quan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {mode === "edit" && project && (
              project.isPublished ? (
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

        {/* 5 Tabs Navigation Bar */}
        <div className="flex items-center border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
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
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "blocks"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Nội dung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "visual"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Trình chỉnh sửa trực quan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reader")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "reader"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Đọc bài
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gallery")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "gallery"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Gallery
          </button>
        </div>

        {/* TAB 1: THÔNG TIN DỰ ÁN (METADATA) */}
        {activeTab === "info" && (
          <form onSubmit={handleSubmit((data) => onSubmit(data))}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column (2/3) */}
              <div className="space-y-6 lg:col-span-2">
                {/* ── 1. Basic Info ── */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Thông tin chính
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div id="field-title" className="rounded-lg p-1 -m-1 transition-all duration-300">
                      <FormInput
                        label="Tên dự án"
                        isRequired
                        placeholder="Nhập tên dự án..."
                        errorMessage={errors.title?.message}
                        {...register("title")}
                      />
                    </div>
                    <div id="field-slug">
                      <FormInput
                        label="Slug (URL)"
                        placeholder="du-an-do-thi-thong-minh"
                        helperText="Để trống để tự động tạo từ tiêu đề."
                        errorMessage={errors.slug?.message}
                        {...register("slug")}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div id="field-provinceId">
                        <label className="mb-1.5 block text-sm font-medium text-text">
                          Tỉnh / Thành phố
                        </label>
                        <select
                          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                          {...register("provinceId")}
                          defaultValue=""
                        >
                          <option value="">— Chọn tỉnh thành —</option>
                          {provinces?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div id="field-year">
                        <FormInput
                          type="number"
                          label="Năm triển khai"
                          errorMessage={errors.year?.message}
                          {...register("year", { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    <div id="field-discipline">
                      <FormInput
                        label="Lĩnh vực chuyên môn / Chuyên ngành"
                        placeholder="VD: Khảo sát & Giám sát số"
                        errorMessage={errors.discipline?.message}
                        {...register("discipline")}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ── 2. Overview & Services ── */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Tổng quan & Dịch vụ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div id="field-overview">
                      <label className="mb-1.5 block text-sm font-medium text-text">
                        Tổng quan dự án
                      </label>
                      <RichTextEditor
                        content={watchedOverview}
                        onChange={(val) =>
                          setValue("overview", val, { shouldDirty: true })
                        }
                        placeholder="Nhập tổng quan dự án..."
                      />
                    </div>
                    <div id="field-services">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-text">
                          Dịch vụ cung cấp
                        </label>
                        <button
                          type="button"
                          className="text-xs font-medium text-primary hover:underline cursor-pointer"
                          onClick={() => appendService("" as never)}
                        >
                          + Thêm dịch vụ
                        </button>
                      </div>
                      <div className="space-y-2">
                        {serviceFields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                            <FormInput
                              placeholder="VD: Khảo sát 2D & 3D"
                              wrapperClassName="flex-1"
                              {...register(`services.${index}` as const)}
                            />
                            <button
                              type="button"
                              onClick={() => removeService(index)}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10 cursor-pointer"
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
                    <CardTitle className="text-base font-semibold text-text">
                      Thách thức dự án
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div id="field-challenge">
                      <label className="mb-1.5 block text-sm font-medium text-text">
                        Mô tả thách thức
                      </label>
                      <RichTextEditor
                        content={watchedChallenge}
                        onChange={(val) =>
                          setValue("challenge", val, { shouldDirty: true })
                        }
                        placeholder="Bài toán thực tế của dự án..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ── 4. Technical Highlights ── */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <div className="flex w-full flex-row items-center justify-between">
                      <CardTitle className="text-base font-semibold text-text">
                        Thông số kỹ thuật
                      </CardTitle>
                      <AppButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          appendHighlight({ label: "", value: "" })
                        }
                      >
                        + Thêm thông số
                      </AppButton>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
                    <div id="field-technicalHighlights">
                      {highlightFields.length === 0 ? (
                        <p className="text-sm text-text-muted">
                          Chưa có thông số nào.
                        </p>
                      ) : (
                        highlightFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="mb-3 flex items-start gap-3 rounded-lg border border-border p-3"
                          >
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FormInput
                                label="Tên thông số"
                                placeholder="VD: Diện tích khảo sát"
                                errorMessage={
                                  errors.technicalHighlights?.[index]?.label?.message
                                }
                                {...register(`technicalHighlights.${index}.label`)}
                              />
                              <FormInput
                                label="Giá trị"
                                placeholder="VD: 120 ha"
                                errorMessage={
                                  errors.technicalHighlights?.[index]?.value?.message
                                }
                                {...register(`technicalHighlights.${index}.value`)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeHighlight(index)}
                              className="mt-7 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar (1/3) */}
              <div className="space-y-6">
                {/* Operation Field */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Lĩnh vực hoạt động
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div id="field-fieldId">
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
                    </div>
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
                            {uploading.thumbnail ? "Đang tải..." : "Thay đổi ảnh"}
                            <input
                              ref={thumbnailInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) =>
                                handleImageUpload(
                                  e,
                                  "thumbnail",
                                  "thumbnailFileId",
                                  setThumbnailPreview,
                                )
                              }
                              disabled={uploading.thumbnail}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowThumbnailGallery(true)}
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
                          {uploading.thumbnail ? "Đang tải ảnh lên..." : "Chưa có ảnh đại diện"}
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
                              onChange={(e) =>
                                handleImageUpload(
                                  e,
                                  "thumbnail",
                                  "thumbnailFileId",
                                  setThumbnailPreview,
                                )
                              }
                              disabled={uploading.thumbnail}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowThumbnailGallery(true)}
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
                        <span className="text-[11px] text-text-muted mt-2">
                          JPG, PNG, WebP • Tối đa 10MB (Tuỳ chọn)
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-text-muted">
                      Lưu vào /vdcd/projects/{currentSubfolder}
                    </p>
                    <input type="hidden" {...register("thumbnail")} />
                    <input type="hidden" {...register("thumbnailFileId")} />
                    <input type="hidden" {...register("isPublished")} />
                  </CardContent>
                </Card>

                {/* Next Project */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Dự án tiếp theo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <select
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                      {...register("nextProjectSlug")}
                      defaultValue=""
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

                {/* SEO */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Tối ưu SEO
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
                      rows={3}
                      helperText="Tối đa 160 ký tự"
                      errorMessage={errors.metaDescription?.message}
                      {...register("metaDescription")}
                    />
                  </CardContent>
                </Card>

                {/* Quick Stats — only in edit mode */}
                {mode === "edit" && project && (
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
                          {new Date(project.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Cập nhật lần cuối</span>
                        <span className="text-xs text-text">
                          {new Date(project.updatedAt).toLocaleDateString("vi-VN")}
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
                  Xoá dự án
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
                      onClick={handleSubmit((data) => onSubmit(data, false), onFormError)}
                      className="border border-border"
                    >
                      Lưu bản nháp
                    </AppButton>
                    <AppButton
                      type="button"
                      isLoading={isSubmitting}
                      onClick={handleSubmit((data) => onSubmit(data, true), onFormError)}
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

        {/* TAB 3: TRÌNH CHỈNH SỬA TRỰC QUAN (VISUAL EDITOR CANVAS) */}
        {activeTab === "visual" && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <VisualEditorCanvas
              title={watchedTitle}
              excerpt={watchedOverview}
              heroImageUrl={currentThumbnail || null}
              content={currentDocumentContent}
              onContentChange={handleContentChange}
              onTitleChange={(t) => setValue("title", t, { shouldDirty: true })}
              onSubtitleChange={() => {}}
              onExcerptChange={(e) =>
                setValue("overview", e, { shouldDirty: true })
              }
              onHeroImageChange={(url, fileId) => {
                const prevFileId = getValues("thumbnailFileId");
                if (prevFileId && prevFileId !== fileId) {
                  if (!galleryFileIds.includes(prevFileId)) {
                    if (prevFileId !== project?.thumbnailFileId) {
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
              simulatedUrl={
                watchedSlug
                  ? `vdcd.vn/du-an/${watchedSlug}`
                  : "vdcd.vn/du-an/(chua-co-slug)"
              }
              headerSlot={
                <ProjectHeaderBadges
                  fieldName={selectedField?.name}
                  provinceName={selectedProvince?.name}
                  year={watchedYear}
                />
              }
              beforeContentSlot={
                <div className="space-y-6">
                  {/* Khối Thông số dự án & Dịch vụ */}
                  <ProjectSpecsSection
                    discipline={watchedDiscipline}
                    provinceId={watchedProvinceId}
                    provinceName={selectedProvince?.name}
                    provinces={provinces}
                    year={watchedYear}
                    services={watchedServices}
                    technicalHighlights={watchedHighlights}
                    interactive
                    onDisciplineChange={(val) =>
                      setValue("discipline", val, { shouldDirty: true })
                    }
                    onProvinceChange={(pId) =>
                      setValue("provinceId", pId || null, { shouldDirty: true })
                    }
                    onYearChange={(y) =>
                      setValue("year", y, { shouldDirty: true })
                    }
                    onServicesChange={(newServices) => {
                      setValue("services", newServices, { shouldDirty: true });
                      replaceServices(newServices as never);
                    }}
                    onHighlightsChange={(newHighlights) => {
                      setValue("technicalHighlights", newHighlights, {
                        shouldDirty: true,
                      });
                      replaceHighlights(newHighlights);
                    }}
                  />

                  {/* Thách thức dự án (hỗ trợ chỉnh sửa trực tiếp trên Canvas) */}
                  <ProjectChallengeSection
                    challenge={watchedChallenge}
                    interactive
                    onChallengeChange={(val) =>
                      setValue("challenge", val, { shouldDirty: true })
                    }
                    className="border-b border-border/50 rounded-none border-x-0 border-t-0"
                  />
                </div>
              }
              afterContentSlot={
                <ProjectGallerySection
                  galleryImages={galleryImages}
                  interactive
                  onManageClick={() => setActiveTab("gallery")}
                  className="border-t border-border/50 rounded-none border-x-0 border-b-0"
                />
              }
            />
          </div>
        )}

        {/* TAB 4: ĐỌC BÀI (READ-ONLY ARTICLE VIEW — PROJECT READER) */}
        {activeTab === "reader" && (
          <ProjectReader
            title={watchedTitle}
            slug={watchedSlug}
            thumbnail={currentThumbnail}
            overview={watchedOverview}
            fieldName={selectedField?.name}
            provinceName={selectedProvince?.name}
            year={watchedYear}
            discipline={watchedDiscipline}
            services={watchedServices}
            technicalHighlights={watchedHighlights}
            challenge={watchedChallenge}
            transformationBefore={transformationBeforePreview ?? watchedTransBefore}
            transformationAfter={transformationAfterPreview ?? watchedTransAfter}
            createdAt={project?.createdAt}
            publishedAt={project?.isPublished ? (project?.updatedAt || project?.createdAt) : undefined}
            metaTitle={watchedMetaTitle}
            metaDescription={watchedMetaDescription}
            heroMeta={currentDocumentContent.heroMeta}
            content={currentDocumentContent}
            galleryImages={galleryImages}
          />
        )}

        {/* TAB 5: GALLERY (THƯ VIỆN ẢNH) */}
        {activeTab === "gallery" && (
          <ProjectGallery
            projectId={project?.id}
            images={galleryImages}
            onUpdateCache={setGalleryImages}
          />
        )}

        {/* Footer — visible when NOT on the "Thông tin" tab */}
        {activeTab !== "info" && (
          <div data-bottom-save-bar className="flex items-center justify-between pt-4">
            {mode === "edit" && canDelete ? (
              <AppButton
                type="button"
                variant="ghost"
                color="danger"
                onClick={() => setShowDeleteModal(true)}
                className="text-xs text-danger hover:bg-danger/10"
              >
                Xoá dự án
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
                    onClick={handleSubmit((data) => onSubmit(data, false), onFormError)}
                    className="border border-border"
                  >
                    Lưu bản nháp
                  </AppButton>
                  <AppButton
                    type="button"
                    isLoading={isSubmitting}
                    onClick={handleSubmit((data) => onSubmit(data, true), onFormError)}
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
                onClick={handleSubmit((data) => onSubmit(data, false), onFormError)}
                className="border border-border bg-surface text-xs"
              >
                Lưu bản nháp
              </AppButton>
              <AppButton
                type="button"
                isLoading={isSubmitting}
                onClick={handleSubmit((data) => onSubmit(data, true), onFormError)}
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

        {/* Modal xác nhận xoá dự án */}
        {mode === "edit" && project && (
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <ModalContent>
              <ModalHeader>Xác nhận xoá dự án</ModalHeader>
              <ModalBody>
                <p>
                  Bạn có chắc muốn xoá vĩnh viễn dự án{" "}
                  <strong>{project.title}</strong>?
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

        {showThumbnailGallery && (
          <ImagePickerModal
            isOpen={showThumbnailGallery}
            onClose={() => setShowThumbnailGallery(false)}
            onSelect={handleGallerySelectThumbnail}
            defaultFolder="/vdcd/projects"
            uploadFolder="project"
            uploadOptions={{ subfolder: currentSubfolder, slug: currentSubfolder }}
            title="Chọn ảnh đại diện dự án"
          />
        )}
      </div>
    </DocumentUploadProvider>
  );
}
