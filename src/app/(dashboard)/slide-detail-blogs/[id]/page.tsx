"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import {
  FormInput,
  FormTextarea,
  AppButton,
  Spinner,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import {
  useSlideDetailBlog,
  useUpdateSlideDetailBlog,
  usePublishSlideDetailBlog,
  useDeleteSlideDetailBlog,
} from "@/features/slide-detail-blogs/api";
import {
  slideDetailBlogSchema,
  type SlideDetailBlogFormData,
} from "@/features/slide-detail-blogs/schema";
import { BlockEditor } from "@/features/slide-detail-blogs/components/BlockEditor";
import { BlogPreviewContainer } from "@/features/slide-detail-blogs/components/BlogPreview";
import { VisualEditorCanvas } from "@/features/slide-detail-blogs/components/VisualEditor";
import { BlogExportModal } from "@/features/slide-detail-blogs/components/ExportModal";
import { uploadImage, validateImageFile, slugifyVietnamese, type UploadResult } from "@/lib/upload";
import { SlideDetailBlogUploadProvider } from "@/features/slide-detail-blogs/context/SlideDetailBlogUploadContext";
import { usePermission } from "@/hooks/usePermission";
import type { SlideDetailBlogContent, SlideDetailBlogBlock } from "@/types/slide-detail-blog";

export default function EditSlideDetailBlogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const canDelete = usePermission("slide-detail-blogs:delete");

  const { data: blog, isLoading } = useSlideDetailBlog(id);
  const updateMutation = useUpdateSlideDetailBlog(id);
  const publishMutation = usePublishSlideDetailBlog();
  const deleteMutation = useDeleteSlideDetailBlog();

  // Hero image states
  const [userSelectedMode, setUserSelectedMode] = useState<"upload" | "url" | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);
  const [failedHeroUrl, setFailedHeroUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const heroMode = userSelectedMode ?? (blog && !blog.heroImageFileId && blog.heroImageUrl ? "url" : "upload");

  // SEO card toggle
  const [showSeo, setShowSeo] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  type TabMode = "editor" | "reader" | "visual";
  const [activeTab, setActiveTab] = useState<TabMode>("editor");
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<SlideDetailBlogFormData>({
    resolver: zodResolver(slideDetailBlogSchema),
    defaultValues: {
      slideId: "",
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

  const watchedHeroUrl = useWatch({ control, name: "heroImageUrl" });
  const currentPreview = heroPreviewUrl ?? watchedHeroUrl ?? blog?.heroImageUrl ?? null;
  const isHeroLoadError = Boolean(currentPreview && failedHeroUrl === currentPreview);

  // Watch fields for live preview (reads form state, not saved DB data)
  const watchedSlug = useWatch({ control, name: "slug" });
  const previewTitle = useWatch({ control, name: "title" });
  const previewSubtitle = useWatch({ control, name: "subtitle" });
  const previewExcerpt = useWatch({ control, name: "excerpt" });
  const previewContent = useWatch({ control, name: "content" });

  // Compute active upload subfolder (auto tracks slug, blog slug, or title)
  const currentSubfolder = useMemo(() => {
    const fromSlug = watchedSlug?.trim();
    if (fromSlug) return slugifyVietnamese(fromSlug);

    const fromBlogSlug = blog?.slug?.trim();
    if (fromBlogSlug) return slugifyVietnamese(fromBlogSlug);

    const fromTitle = previewTitle?.trim();
    if (fromTitle) return slugifyVietnamese(fromTitle);

    return "detail-blogs";
  }, [watchedSlug, blog?.slug, previewTitle]);

  useEffect(() => {
    if (blog) {
      reset({
        slideId: blog.slideId,
        title: blog.title,
        subtitle: blog.subtitle ?? "",
        slug: blog.slug,
        excerpt: blog.excerpt ?? "",
        heroImageUrl: blog.heroImageUrl,
        heroImageFileId: blog.heroImageFileId,
        seoTitle: blog.seoTitle ?? "",
        metaDescription: blog.metaDescription ?? "",
        content: blog.content ?? { version: 1, blocks: [] },
        isPublished: blog.isPublished,
      });
    }
  }, [blog, reset]);

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
    setUserSelectedMode("upload");
    setFailedHeroUrl(null);
    setUploadingHero(true);

    try {
      const result: UploadResult = await uploadImage(file, "slide-detail-blog", {
        subfolder: currentSubfolder,
      });
      setValue("heroImageUrl", result.url, { shouldValidate: true, shouldDirty: true });
      setValue("heroImageFileId", result.fileId, { shouldDirty: true });
      setHeroPreviewUrl(result.url);
      setFailedHeroUrl(null);
      toast({ title: "Tải ảnh hero thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh hero thất bại", color: "danger" });
      setHeroPreviewUrl(null);
    } finally {
      setUploadingHero(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // Submit Handler
  const onSubmit = (data: SlideDetailBlogFormData) => {
    // Exclude slideId as backend does not allow slideId updates
    const updatePayload: Partial<Omit<SlideDetailBlogFormData, "slideId">> = {
      title: data.title,
      subtitle: data.subtitle,
      slug: data.slug,
      excerpt: data.excerpt,
      heroImageUrl: data.heroImageUrl,
      heroImageFileId: data.heroImageFileId,
      seoTitle: data.seoTitle,
      metaDescription: data.metaDescription,
      content: data.content,
      isPublished: data.isPublished,
    };

    updateMutation.mutate(updatePayload, {
      onSuccess: () => {
        toast({ title: "Lưu thay đổi thành công", color: "success" });
      },
      onError: (error) => {
        toast({
          title: "Cập nhật thất bại",
          description: error.message,
          color: "danger",
        });
      },
    });
  };

  // Validation Error Handler (triggered when form has invalid fields or empty blocks)
  const onInvalid = (fieldErrors: FieldErrors<SlideDetailBlogFormData>) => {
    // Check if error comes from content blocks
    const contentErrors = fieldErrors.content as unknown as { blocks?: Record<string, unknown> } | undefined;
    const blockErrors = contentErrors?.blocks;

    if (blockErrors) {
      // Find the first invalid block to scroll to it
      const errorKeys = Object.keys(blockErrors);
      const firstIndex = Number(errorKeys[0]);
      const currentBlocks = (previewContent?.blocks || []) as SlideDetailBlogBlock[];
      const targetBlock = currentBlocks[firstIndex];

      if (targetBlock) {
        const el = document.getElementById(`block-${targetBlock.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      toast({
        title: "Không thể lưu thay đổi",
        description: "Có khối nội dung đang để trống. Vui lòng nhập nội dung hoặc xoá khối đó đi trước khi lưu.",
        color: "danger",
      });
      return;
    }

    if (fieldErrors.title) {
      toast({
        title: "Thiếu tiêu đề bài viết",
        description: fieldErrors.title.message || "Tiêu đề bài viết không được để trống.",
        color: "danger",
      });
      return;
    }

    if (fieldErrors.slideId) {
      toast({
        title: "Chưa chọn slide liên kết",
        description: fieldErrors.slideId.message || "Vui lòng chọn slide để liên kết bài viết.",
        color: "danger",
      });
      return;
    }

    // Default error message
    const firstError = Object.values(fieldErrors)[0];
    const message = firstError?.message;
    toast({
      title: "Không thể lưu thay đổi",
      description: typeof message === "string" ? message : "Có khối nội dung hoặc trường thông tin chưa hợp lệ. Vui lòng kiểm tra lại.",
      color: "danger",
    });
  };

  // Toggle Publish
  const handleTogglePublish = (publish: boolean) => {
    if (publish) {
      if (!blog?.title?.trim()) {
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề bài viết không được để trống",
          color: "danger",
        });
        return;
      }
      if (!blog?.content?.blocks || blog.content.blocks.length === 0) {
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
    if (!blog) return;
    deleteMutation.mutate(
      { id, slideId: blog.slideId },
      {
        onSuccess: () => {
          toast({ title: "Đã xoá bài viết thành công", color: "success" });
          startTransition(() => {
            router.push("/slide-detail-blogs");
          });
        },
        onError: (error) => {
          toast({
            title: "Xoá thất bại",
            description: error.message,
            color: "danger",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-lg font-bold text-text">Không tìm thấy bài viết</h2>
        <p className="mt-1 text-sm text-text-muted">
          Bài viết không tồn tại hoặc đã bị xoá.
        </p>
        <AppButton
          onClick={() => router.push("/slide-detail-blogs")}
          className="mt-4"
        >
          Quay lại danh sách
        </AppButton>
      </div>
    );
  }

  return (
    <SlideDetailBlogUploadProvider subfolder={currentSubfolder}>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text">Sửa bài viết Slide</h1>
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                blog.isPublished
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {blog.isPublished ? "Đã xuất bản" : "Bản nháp"}
            </span>
          </div>
          <p className="text-sm text-text-muted">
            Chỉnh sửa metadata và cấu trúc khối nội dung chi tiết.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {blog.isPublished ? (
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
            setValue("heroImageUrl", url, { shouldValidate: true, shouldDirty: true });
            if (fileId) setValue("heroImageFileId", fileId, { shouldDirty: true });
            setHeroPreviewUrl(url);
            setFailedHeroUrl(null);
          }}
        />
      )}

      {/* 1. Form Editor Tab */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className={`space-y-6 ${activeTab !== "editor" ? "hidden" : ""}`}>
        {/* 1. Slide Liên Kết (Read-Only) */}
        <Card className="border border-border bg-surface shadow-xs">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              1. Slide liên kết
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {blog.slide ? (
              <div className="flex items-center gap-4 rounded-lg border border-border bg-surface-muted/50 p-3.5">
                <div className="h-16 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blog.slide.imageUrl}
                    alt={blog.slide.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text">{blog.slide.title}</p>
                  {blog.slide.subtitle && (
                    <p className="text-xs text-text-muted">{blog.slide.subtitle}</p>
                  )}
                  <p className="mt-1 text-[11px] text-text-muted">
                    Slide ID: <code className="rounded bg-surface px-1 py-0.5">{blog.slideId}</code>
                  </p>
                </div>
                <AppButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/slides/${blog.slideId}`)}
                  className="text-xs text-primary"
                >
                  Xem Slide →
                </AppButton>
              </div>
            ) : (
              <p className="text-xs text-text-muted">Slide ID: {blog.slideId}</p>
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
            <FormInput
              label="Tiêu đề bài viết (H1)"
              isRequired
              placeholder="VD: Số hoá dữ liệu đất đai toàn diện..."
              errorMessage={errors.title?.message}
              {...register("title")}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Phụ đề / Tagline"
                placeholder="VD: Từ hiện trạng ngoài thực địa đến bản đồ số..."
                errorMessage={errors.subtitle?.message}
                {...register("subtitle")}
              />
              <FormInput
                label="Đường dẫn tĩnh (Slug)"
                placeholder="Tự sinh từ tiêu đề nếu để trống..."
                helperText="Chỉ dùng chữ cái thường không dấu, số và dấu gạch ngang"
                errorMessage={errors.slug?.message}
                {...register("slug")}
              />
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

            <FormTextarea
              label="Mô tả ngắn (Excerpt)"
              rows={2}
              placeholder="Mô tả ngắn hiển thị cho danh sách bài viết và thẻ tóm tắt..."
              errorMessage={errors.excerpt?.message}
              {...register("excerpt")}
            />

            {/* Hero Image Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text">
                  Ảnh bìa Hero (Hero Image)
                </label>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted p-0.5">
                  <button
                    type="button"
                    onClick={() => setUserSelectedMode("upload")}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                      heroMode === "upload"
                        ? "bg-surface font-semibold text-primary shadow-xs"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    Tải ảnh lên
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserSelectedMode("url")}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                      heroMode === "url"
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
                          <span>Không tải được ảnh từ đường dẫn hiện tại (Lỗi 404 hoặc ảnh bị xóa khỏi ImageKit)</span>
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
                            onClick={() => setUserSelectedMode("url")}
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
                      {uploadingHero ? "Đang tải lên..." : "Thay đổi ảnh Hero"}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleHeroFileChange}
                        disabled={uploadingHero}
                      />
                    </label>
                    <span className="text-xs text-text-muted">
                      JPG, PNG, WebP • Tối đa 10MB • Lưu vào /vdcd/slides/{currentSubfolder}
                    </span>
                  </div>
                  {watchedHeroUrl && (
                    <div className="space-y-2">
                      <p className="truncate text-xs text-text-muted">
                        <span className="font-medium text-text">URL hiện tại:</span> {watchedHeroUrl}
                      </p>
                      {isDirty && watchedHeroUrl !== blog?.heroImageUrl && (
                        <div className="flex items-center justify-between rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs">
                          <span className="font-medium text-amber-800">
                            ⚠️ Đã chọn ảnh mới — Hãy nhấn &ldquo;Lưu ngay&rdquo; để hoàn tất:
                          </span>
                          <AppButton
                            size="sm"
                            type="button"
                            isLoading={updateMutation.isPending}
                            onClick={handleSubmit(onSubmit, onInvalid)}
                          >
                            Lưu ngay
                          </AppButton>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
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
              )}
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
        <Card className="border border-border bg-surface shadow-xs">
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
        <div className="flex items-center justify-between pt-2">
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
            <AppButton
              variant="ghost"
              type="button"
              onClick={() => router.back()}
            >
              Huỷ
            </AppButton>
            <AppButton
              type="submit"
              isLoading={updateMutation.isPending}
              disabled={!isDirty || uploadingHero}
            >
              Lưu thay đổi
            </AppButton>
          </div>
        </div>
      </form>

      {/* Footer Actions (visible when Reader or Visual tab is active — form footer is hidden with the form) */}
      {activeTab !== "editor" && (
        <div className="flex items-center justify-between pt-2">
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
            <AppButton
              variant="ghost"
              type="button"
              onClick={() => router.back()}
            >
              Huỷ
            </AppButton>
            <AppButton
              type="button"
              isLoading={updateMutation.isPending}
              disabled={!isDirty || uploadingHero}
              onClick={handleSubmit(onSubmit, onInvalid)}
            >
              Lưu thay đổi
            </AppButton>
          </div>
        </div>
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá bài viết</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá vĩnh viễn bài viết{" "}
              <strong>{blog.title}</strong>?
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

      <BlogExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={previewTitle}
        subtitle={previewSubtitle}
        slug={watchedSlug}
        content={(previewContent as SlideDetailBlogContent) ?? { version: 1, blocks: [] }}
        heroImageUrl={currentPreview}
      />
      </div>
    </SlideDetailBlogUploadProvider>
  );
}
