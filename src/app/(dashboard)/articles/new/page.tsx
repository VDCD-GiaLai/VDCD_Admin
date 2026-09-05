"use client";

import { useState, useMemo, useRef, useTransition } from "react";
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
import { useCreateArticle } from "@/features/articles/api";
import { useProjects } from "@/features/projects/api";
import { usePrograms } from "@/features/programs/api";
import { useSolutions } from "@/features/solutions/api";
import { articleSchema, type ArticleFormData } from "@/features/articles/schema";
import { BlockEditor } from "@/features/slide-detail-blogs/components/BlockEditor";
import { BlogPreviewContainer } from "@/features/slide-detail-blogs/components/BlogPreview";
import { VisualEditorCanvas } from "@/features/slide-detail-blogs/components/VisualEditor";
import { uploadImage, validateImageFile, slugifyVietnamese, type UploadResult } from "@/lib/upload";
import { SlideDetailBlogUploadProvider } from "@/features/slide-detail-blogs/context/SlideDetailBlogUploadContext";
import { useSanitizedPaste } from "@/features/slide-detail-blogs/hooks/useSanitizedPaste";
import type { SlideDetailBlogContent, SlideDetailBlogBlock } from "@/types/slide-detail-blog";

type TabMode = "editor" | "reader" | "visual";

export default function CreateArticlePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const createMutation = useCreateArticle();

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

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
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
  const watchedTitle = useWatch({ control, name: "title" });
  const watchedSubtitle = useWatch({ control, name: "subtitle" });
  const watchedExcerpt = useWatch({ control, name: "excerpt" });
  const watchedSlug = useWatch({ control, name: "slug" });
  const watchedThumbnail = useWatch({ control, name: "thumbnail" });
  const watchedProjectId = useWatch({ control, name: "projectId" });
  const watchedProgramId = useWatch({ control, name: "programId" });
  const watchedSolutionId = useWatch({ control, name: "solutionId" });
  const watchedContent = useWatch({ control, name: "content" }) as SlideDetailBlogContent;

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
        toast({
          title: "Không thể xuất bản",
          description: "Tiêu đề bài viết không được để trống",
          color: "danger",
        });
        return;
      }
      if (!payload.content?.blocks || payload.content.blocks.length === 0) {
        toast({
          title: "Không thể xuất bản",
          description: "Bài viết phải có ít nhất 1 khối nội dung",
          color: "danger",
        });
        return;
      }
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
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

      if (targetBlock) {
        const el = document.getElementById(`block-${targetBlock.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      toast({
        title: "Không thể lưu bài viết",
        description: "Có khối nội dung đang để trống. Vui lòng kiểm tra lại.",
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

    const firstError = Object.values(fieldErrors)[0];
    const message = firstError?.message;
    toast({
      title: "Không thể lưu bài viết",
      description: typeof message === "string" ? message : "Dữ liệu nhập chưa hợp lệ.",
      color: "danger",
    });
  };

  return (
    <SlideDetailBlogUploadProvider folder="article" subfolder={currentSubfolder}>
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
              setValue("thumbnail", url, { shouldValidate: true, shouldDirty: true });
              if (fileId) setValue("thumbnailFileId", fileId, { shouldDirty: true });
              setThumbPreviewUrl(url);
              setFailedThumbUrl(null);
            }}
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
              <FormInput
                label="Tiêu đề bài viết (Title)"
                isRequired
                placeholder="VD: Hội nghị chuyển đổi số toàn diện tỉnh Gia Lai..."
                errorMessage={errors.title?.message}
                {...register("title")}
                onPaste={handlePlainPaste}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Tiêu đề phụ (Subtitle)"
                  placeholder="VD: Hướng tới xây dựng chính quyền số và kinh tế số..."
                  errorMessage={errors.subtitle?.message}
                  {...register("subtitle")}
                  onPaste={handlePlainPaste}
                />
                <FormInput
                  label="Đường dẫn tĩnh (Slug)"
                  placeholder="Tự sinh từ tiêu đề nếu để trống..."
                  helperText="Chỉ dùng chữ cái thường không dấu, số và dấu gạch ngang"
                  errorMessage={errors.slug?.message}
                  {...register("slug")}
                />
              </div>

              <FormTextarea
                label="Tóm tắt bài viết (Excerpt)"
                rows={2}
                placeholder="Mô tả ngắn hiển thị trên thẻ bài viết và mạng xã hội..."
                errorMessage={errors.excerpt?.message}
                {...register("excerpt")}
                onPaste={handlePlainPaste}
              />
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
          <Card className="border border-border bg-surface shadow-xs">
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
          <div className="flex items-center justify-end gap-3 pt-2">
            <AppButton variant="ghost" type="button" onClick={() => router.back()}>
              Huỷ
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              isLoading={createMutation.isPending}
              onClick={handleSubmit((data) => onSubmit(data, false), onInvalid)}
              className="border border-border"
            >
              Lưu bản nháp
            </AppButton>
            <AppButton
              type="button"
              isLoading={createMutation.isPending}
              onClick={handleSubmit((data) => onSubmit(data, true), onInvalid)}
            >
              Xuất bản bài viết
            </AppButton>
          </div>
        </form>

        {/* Floating/Fixed Footer when in Reader or Visual Tab */}
        {activeTab !== "editor" && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <AppButton variant="ghost" type="button" onClick={() => router.back()}>
              Huỷ
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              isLoading={createMutation.isPending}
              onClick={handleSubmit((data) => onSubmit(data, false), onInvalid)}
              className="border border-border"
            >
              Lưu bản nháp
            </AppButton>
            <AppButton
              type="button"
              isLoading={createMutation.isPending}
              onClick={handleSubmit((data) => onSubmit(data, true), onInvalid)}
            >
              Xuất bản bài viết
            </AppButton>
          </div>
        )}
      </div>
    </SlideDetailBlogUploadProvider>
  );
}
