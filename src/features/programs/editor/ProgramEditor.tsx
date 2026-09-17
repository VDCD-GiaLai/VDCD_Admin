"use client";

import React, { useState, useEffect, useMemo, useCallback, useTransition } from "react";
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
import { useOperationFields } from "@/features/operation-fields/api";
import { useCreateProgram, useUpdateProgram, usePublishProgram, useDeleteProgram } from "../api";
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
} from "@/shared/content-editor";
import { slugifyVietnamese } from "@/lib/upload";
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
  const publishMutation = usePublishProgram();
  const deleteMutation = useDeleteProgram();
  const { data: operationFields } = useOperationFields();

  const canDelete = usePermission("programs:delete");

  const [activeTab, setActiveTab] = useState<EditorTab>("info");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      thumbnail: "",
      thumbnailFileId: null,
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
        thumbnail: "",
        thumbnailFileId: null,
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
    [activeTab],
  );

  // Submit Handler — supports both draft and publish in create mode
  const onSubmit = (data: ProgramFormData, publish = false) => {
    const submitData = serializeProgramPayload({
      ...data,
      isPublished: publish,
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
          // If publish is requested, ensure it's published via /publish endpoint
          if (publish && createdProgram?.id && !createdProgram.isPublished) {
            try {
              await publishMutation.mutateAsync({ id: createdProgram.id, isPublished: true });
            } catch (pubErr) {
              console.warn("Lỗi đồng bộ trạng thái xuất bản:", pubErr);
            }
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
          toast({
            title: "Tạo chương trình thất bại",
            description: err.message,
            color: "danger",
          });
        },
      });
    } else {
      // Edit mode: save content without redirect, keep user on page
      updateMutation.mutate(submitData as unknown as ProgramFormData, {
        onSuccess: () => {
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
  const onInvalid = useCallback((fieldErrors: FieldErrors<ProgramFormData>) => {
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
              label: "Đi tới vị trí lỗi",
              onClick: () => scrollToErrorField(targetElementId, "info"),
            },
          }
        : {}),
    });
  }, [scrollToErrorField, toast]);

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
          setValue("isPublished", publish);
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
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                    program.isPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {program.isPublished ? "Đã xuất bản" : "Bản nháp"}
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted">
              Quản lý thông tin, khối nội dung, chế độ đọc và trình chỉnh sửa trực quan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {mode === "edit" && program && (
              program.isPublished ? (
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
              content={currentDocumentContent}
              onContentChange={handleContentChange}
              onTitleChange={(t) => setValue("title", t, { shouldDirty: true })}
              onSubtitleChange={() => {}}
              onExcerptChange={(e) => setValue("shortDescription", e, { shouldDirty: true })}
              onHeroImageChange={() => {}}
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
