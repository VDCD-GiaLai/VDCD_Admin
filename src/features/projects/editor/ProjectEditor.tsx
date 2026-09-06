"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import {
  FormInput,
  FormTextarea,
  FormCheckbox,
  AppButton,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { ApiError } from "@/lib/api-client";
import { RichTextEditor } from "@/components/shared";
import { useOperationFields } from "@/features/operation-fields/api";
import { useProvinces } from "@/features/provinces/api";
import {
  useCreateProject,
  useUpdateProject,
  useProjects,
} from "../api";
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
} from "@/lib/upload";
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
  const { data: operationFields } = useOperationFields();
  const { data: provinces } = useProvinces();
  const { data: projectsData } = useProjects({ limit: 100 });

  const [activeTab, setActiveTab] = useState<EditorTab>("info");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    () => project?.thumbnail ?? null,
  );
  const [challengePreview, setChallengePreview] = useState<string | null>(
    () => project?.challengeImage ?? null,
  );
  const [galleryImages, setGalleryImages] = useState<ProjectImage[]>(
    () => project?.images ?? [],
  );

  const [prevProject, setPrevProject] = useState(project);
  if (project !== prevProject) {
    setPrevProject(project);
    setThumbnailPreview(project?.thumbnail ?? null);
    setChallengePreview(project?.challengeImage ?? null);
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
  const watchedChallengeImage = useWatch({ control, name: "challengeImage" }) ?? "";

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
    field: "thumbnail" | "challengeImage",
    fileIdField: "thumbnailFileId" | "challengeImageFileId",
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

  const jumpToElement = useCallback((tab: "info" | "blocks" | "gallery", elementId?: string) => {
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

  const onSubmit = (data: ProjectFormData) => {
    const submitData = serializeProjectPayload({
      ...data,
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
      let targetTab: "info" | "blocks" | "gallery" = "info";
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
      createMutation.mutate(submitData, {
        onSuccess: (newProject) => {
          toast({ title: "Tạo dự án thành công", color: "success" });
          router.push(`/projects/${newProject.id}`);
        },
        onError: (err) => handleMutationError(err),
      });
    } else {
      updateMutation.mutate(submitData, {
        onSuccess: () => {
          toast({ title: "Cập nhật dự án thành công", color: "success" });
          router.push("/projects");
        },
        onError: (err) => handleMutationError(err),
      });
    }
  };

  const onFormError = (fieldErrors: FieldErrors<ProjectFormData>) => {
    console.error("ProjectEditor form validation errors:", fieldErrors);

    const FIELD_METADATA: Record<string, { label: string; tab: "info" | "blocks" | "gallery" }> = {
      title: { label: "Tiêu đề dự án", tab: "info" },
      slug: { label: "Đường dẫn (slug)", tab: "info" },
      year: { label: "Năm thực hiện", tab: "info" },
      fieldId: { label: "Lĩnh vực hoạt động", tab: "info" },
      provinceId: { label: "Tỉnh thành", tab: "info" },
      discipline: { label: "Lĩnh vực chuyên môn", tab: "info" },
      overview: { label: "Tổng quan dự án", tab: "info" },
      challenge: { label: "Thách thức dự án", tab: "info" },
      challengeImage: { label: "Ảnh minh họa thách thức", tab: "info" },
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

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const otherProjects = projectsData?.items?.filter((p) => p.id !== project?.id) ?? [];

  return (
    <DocumentUploadProvider
      subfolder={currentSubfolder}
      folder="project"
      tempFolderKey={sessionFolderKey}
    >
      <div className="space-y-6">
        {/* Top Header & Global Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">
              {mode === "create"
                ? "Thêm dự án mới"
                : `Sửa dự án: ${project?.title || ""}`}
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
              onClick={() => router.push("/projects")}
              disabled={isSubmitting}
            >
              Hủy
            </AppButton>
            <AppButton
              color="primary"
              onClick={handleSubmit(onSubmit, onFormError)}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo dự án"
                  : "Lưu thay đổi"}
            </AppButton>
          </div>
        </div>

        {/* 5 Tabs Navigation Bar */}
        <div className="flex border-b border-border bg-surface px-2">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
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
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
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
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
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
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
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
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
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
          <form onSubmit={handleSubmit(onSubmit)}>
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
                    <FormInput
                      label="Tên dự án"
                      isRequired
                      placeholder="Nhập tên dự án..."
                      errorMessage={errors.title?.message}
                      {...register("title")}
                    />
                    <FormInput
                      label="Slug (URL)"
                      placeholder="du-an-do-thi-thong-minh"
                      helperText="Để trống để tự động tạo từ tiêu đề."
                      errorMessage={errors.slug?.message}
                      {...register("slug")}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
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
                      <FormInput
                        type="number"
                        label="Năm triển khai"
                        errorMessage={errors.year?.message}
                        {...register("year", { valueAsNumber: true })}
                      />
                    </div>
                    <FormInput
                      label="Lĩnh vực chuyên môn / Chuyên ngành"
                      placeholder="VD: Khảo sát & Giám sát số"
                      errorMessage={errors.discipline?.message}
                      {...register("discipline")}
                    />
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
                    <div>
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
                    <div>
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
                    <div>
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
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text">
                        Ảnh minh hoạ thách thức
                      </label>
                      {challengePreview && (
                        <div className="mb-2 overflow-hidden rounded-md border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={challengePreview}
                            alt="Challenge"
                            className="h-40 w-full object-cover"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(
                            e,
                            "challengeImage",
                            "challengeImageFileId",
                            setChallengePreview,
                          )
                        }
                        disabled={uploading.challengeImage}
                        className="w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
                      />
                      {uploading.challengeImage && (
                        <p className="text-xs text-primary">Đang tải ảnh...</p>
                      )}
                      <input type="hidden" {...register("challengeImage")} />
                      <input type="hidden" {...register("challengeImageFileId")} />
                    </div>
                  </CardContent>
                </Card>


                {/* ── 5. Technical Highlights ── */}
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
                    {highlightFields.length === 0 ? (
                      <p className="text-sm text-text-muted">
                        Chưa có thông số nào.
                      </p>
                    ) : (
                      highlightFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-start gap-3 rounded-lg border border-border p-3"
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
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar (1/3) */}
              <div className="space-y-6">
                {/* Publish Status */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Xuất bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <FormCheckbox
                      label="Xuất bản ngay"
                      description="Hiển thị dự án trên website công khai."
                      {...register("isPublished")}
                    />
                  </CardContent>
                </Card>

                {/* Operation Field */}
                <Card className="border border-border bg-surface shadow-sm">
                  <CardHeader className="border-b border-border px-5 py-3.5">
                    <CardTitle className="text-base font-semibold text-text">
                      Lĩnh vực
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
                      onChange={(e) =>
                        handleImageUpload(
                          e,
                          "thumbnail",
                          "thumbnailFileId",
                          setThumbnailPreview,
                        )
                      }
                      disabled={uploading.thumbnail}
                      className="w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
                    />
                    {uploading.thumbnail && (
                      <p className="text-xs text-primary">Đang tải ảnh...</p>
                    )}
                    <input type="hidden" {...register("thumbnail")} />
                    <input type="hidden" {...register("thumbnailFileId")} />
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
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: NỘI DUNG (BLOCK EDITOR VỚI 9 BLOCKS) */}
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
              heroImageUrl={currentThumbnail}
              content={currentDocumentContent}
              onContentChange={handleContentChange}
              onTitleChange={(t) => setValue("title", t, { shouldDirty: true })}
              onSubtitleChange={() => {}}
              onExcerptChange={(e) =>
                setValue("overview", e, { shouldDirty: true })
              }
              onHeroImageChange={(url, fileId) => {
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
                    challengeImage={
                      challengePreview ?? watchedChallengeImage
                    }
                    interactive
                    onChallengeChange={(val) =>
                      setValue("challenge", val, { shouldDirty: true })
                    }
                    onImageUpload={async (file) => {
                      const error = validateImageFile(file);
                      if (error) {
                        toast({
                          title: "File không hợp lệ",
                          description: error,
                          color: "danger",
                        });
                        return;
                      }
                      setUploading((prev) => ({
                        ...prev,
                        challengeImage: true,
                      }));
                      try {
                        const result = await uploadImage(file, "project", {
                          subfolder: currentSubfolder,
                          slug: currentSubfolder,
                          tempFolderKey: sessionFolderKey,
                        });
                        setValue("challengeImage", result.url, {
                          shouldDirty: true,
                          shouldValidate: true,
                          shouldTouch: true,
                        });
                        setValue(
                          "challengeImageFileId",
                          result.fileId,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                            shouldTouch: true,
                          },
                        );
                        setChallengePreview(result.url);
                        toast({
                          title: "Tải ảnh thách thức thành công",
                          color: "success",
                        });
                      } catch {
                        toast({
                          title: "Tải ảnh thất bại",
                          color: "danger",
                        });
                      } finally {
                        setUploading((prev) => ({
                          ...prev,
                          challengeImage: false,
                        }));
                      }
                    }}
                    onImageRemove={() => {
                      setValue("challengeImage", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                        shouldTouch: true,
                      });
                      setValue("challengeImageFileId", null, {
                        shouldDirty: true,
                        shouldValidate: true,
                        shouldTouch: true,
                      });
                      setChallengePreview(null);
                      toast({
                        title: "Đã xoá ảnh thách thức",
                        color: "default",
                      });
                    }}
                    isUploadingImage={Boolean(uploading.challengeImage)}
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
            challengeImage={challengePreview ?? watchedChallengeImage}
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
      </div>
    </DocumentUploadProvider>
  );
}
