"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import {
  FormInput,
  FormCheckbox,
  AppButton,
  FormTextarea,
  Badge,
  useToast,
} from "@/components/ui";
import {
  pageBannerSchema,
  type PageBannerFormData,
} from "@/features/page-banners/schema";
import {
  DEFAULT_CAREERS_SLIDES,
  extractBannerSlides,
} from "@/features/page-banners/utils/banner-slides";
import {
  uploadImage,
  validateImageFile,
  type UploadResult,
} from "@/lib/upload";
import { ImagePickerModal, type ImagePickerResult } from "@/components/shared";
import type { PageBanner } from "@/types/page-banner";
import {
  useCreatePageBanner,
  useUpdatePageBanner,
} from "@/features/page-banners/api";

interface PageBannerFormProps {
  initialData?: PageBanner;
}

export function PageBannerForm({ initialData }: PageBannerFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const isEditing = !!initialData;
  const createMutation = useCreatePageBanner();
  const updateMutation = useUpdatePageBanner();

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [gallerySlideIndex, setGallerySlideIndex] = useState<number | null>(
    null,
  );

  const initialSlides = initialData
    ? extractBannerSlides(initialData)
    : [
        {
          id: "slide-1",
          title: "",
          subtitle: "",
          tag: "",
          imageUrl: "",
          imageFileId: "",
        },
      ];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PageBannerFormData>({
    resolver: zodResolver(pageBannerSchema),
    defaultValues: initialData
      ? {
          pageKey: initialData.pageKey,
          title: initialData.title ?? "",
          subtitle: initialData.subtitle ?? "",
          tag: initialData.tag ?? "",
          imageUrl: initialData.imageUrl,
          imageFileId: initialData.imageFileId ?? "",
          ctaButtons: initialData.ctaButtons ?? [],
          slides: initialSlides,
          isActive: initialData.isActive,
        }
      : {
          pageKey: "",
          title: "",
          subtitle: "",
          tag: "",
          imageUrl: "",
          imageFileId: "",
          ctaButtons: [],
          slides: initialSlides,
          isActive: true,
        },
  });

  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: "slides",
  });

  const watchedPageKey = useWatch({ control, name: "pageKey" });
  const watchedSlides = useWatch({ control, name: "slides" });

  const isMultiSlidePage =
    watchedPageKey === "careers" || (fields && fields.length > 1);

  const handlePageKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextKey = e.target.value;
    setValue("pageKey", nextKey, { shouldValidate: true });

    if (
      !isEditing &&
      nextKey === "careers" &&
      fields.length === 1 &&
      !watchedSlides?.[0]?.title &&
      !watchedSlides?.[0]?.imageUrl
    ) {
      replace(
        DEFAULT_CAREERS_SLIDES.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: s.subtitle ?? "",
          tag: s.tag ?? "",
          imageUrl: s.imageUrl,
          imageFileId: s.imageFileId ?? "",
        })),
      );
    }
  };

  const handleGallerySelect = (image: ImagePickerResult) => {
    if (gallerySlideIndex === null) return;
    setValue(`slides.${gallerySlideIndex}.imageUrl`, image.url, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`slides.${gallerySlideIndex}.imageFileId`, image.fileId ?? "", {
      shouldDirty: true,
    });
    if (gallerySlideIndex === 0) {
      setValue("imageUrl", image.url, { shouldValidate: true });
      setValue("imageFileId", image.fileId ?? "");
    }
    setGallerySlideIndex(null);
    toast({
      title: `Đã chọn ảnh cho Slide ${gallerySlideIndex + 1}`,
      color: "success",
    });
  };

  const handleFileChange = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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

    setUploadingIndex(index);

    try {
      const result: UploadResult = await uploadImage(file, "image");
      setValue(`slides.${index}.imageUrl`, result.url, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue(`slides.${index}.imageFileId`, result.fileId, {
        shouldValidate: true,
        shouldDirty: true,
      });
      if (index === 0) {
        setValue("imageUrl", result.url, { shouldValidate: true });
        setValue("imageFileId", result.fileId, { shouldValidate: true });
      }
      toast({
        title: `Upload ảnh Slide ${index + 1} thành công`,
        color: "success",
      });
    } catch {
      toast({
        title: "Upload thất bại",
        description: "Vui lòng thử lại",
        color: "danger",
      });
    } finally {
      setUploadingIndex(null);
      e.target.value = "";
    }
  };

  const handleAddSlide = () => {
    const nextIdx = fields.length + 1;
    append({
      id: `slide-${Date.now()}-${nextIdx}`,
      title: "",
      subtitle: "",
      tag: watchedPageKey === "careers" ? "Tuyển dụng" : "",
      imageUrl: "",
      imageFileId: "",
    });
  };

  const onSubmit = (data: PageBannerFormData) => {
    const primary = data.slides[0];
    const normalizedData: PageBannerFormData = {
      ...data,
      title: primary?.title ?? data.title ?? "",
      subtitle: primary?.subtitle ?? data.subtitle ?? "",
      tag: primary?.tag ?? data.tag ?? "",
      imageUrl: primary?.imageUrl ?? data.imageUrl ?? "",
      imageFileId: primary?.imageFileId ?? data.imageFileId ?? "",
    };

    if (isEditing) {
      updateMutation.mutate(
        { ...normalizedData, pageKey: initialData.pageKey },
        {
          onSuccess: () => {
            toast({ title: "Cập nhật thành công", color: "success" });
            router.push("/page-banners");
          },
          onError: (error) => {
            toast({
              title: "Cập nhật thất bại",
              description: error.message,
              color: "danger",
            });
          },
        },
      );
    } else {
      createMutation.mutate(normalizedData, {
        onSuccess: () => {
          toast({ title: "Tạo thành công", color: "success" });
          router.push("/page-banners");
        },
        onError: (error) => {
          toast({
            title: "Tạo thất bại",
            description: error.message,
            color: "danger",
          });
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">
            {isEditing ? "Chỉnh sửa Banner" : "Thêm Banner"}
          </h1>
          <p className="text-sm text-text-muted">
            {isEditing
              ? "Cập nhật thông tin và danh sách ảnh banner cho trang"
              : "Tạo banner mới cho trang"}
          </p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>
          ← Quay lại
        </AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Settings Card */}
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Cấu hình trang áp dụng
            </CardTitle>
            {isMultiSlidePage && (
              <Badge color="primary" variant="soft">
                {fields.length} Slide Banner
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Trang áp dụng (Mã trang) <span className="text-danger">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  {...register("pageKey")}
                  onChange={handlePageKeyChange}
                  disabled={isEditing}
                >
                  <option value="">Chọn trang...</option>
                  <option value="home">Trang chủ (Home)</option>
                  <option value="about">Về chúng tôi (About)</option>
                  <option value="programs">Chương trình (Programs)</option>
                  <option value="solutions">Giải pháp (Solutions)</option>
                  <option value="projects">Dự án (Projects)</option>
                  <option value="articles">Tin tức (Articles)</option>
                  <option value="contact">Liên hệ (Contact)</option>
                  <option value="careers">Tuyển dụng (Careers)</option>
                </select>
                {errors.pageKey && (
                  <p className="mt-1 text-xs text-danger">
                    {errors.pageKey.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pb-1.5 pt-1">
                <FormCheckbox
                  label="Hiển thị (Kích hoạt)"
                  {...register("isActive")}
                />

                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSlide}
                >
                  + Thêm slide banner
                </AppButton>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slides List */}
        <div className="space-y-4">
          {fields.map((field, index) => {
            const currentImageUrl = watchedSlides?.[index]?.imageUrl || "";
            const isUploadingThis = uploadingIndex === index;
            const slideErrors = errors.slides?.[index];

            return (
              <Card
                key={field.id}
                className="border border-border bg-surface shadow-sm"
              >
                <CardHeader className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <CardTitle className="text-base font-semibold text-text">
                      {fields.length > 1
                        ? `Slide ${index + 1}`
                        : "Thông tin Banner"}
                    </CardTitle>
                    {index === 0 && fields.length > 1 && (
                      <Badge color="success" variant="soft">
                        Slide mặc định (Đầu tiên)
                      </Badge>
                    )}
                  </div>

                  {fields.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        title="Di chuyển lên"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-xs text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, index + 1)}
                        disabled={index === fields.length - 1}
                        title="Di chuyển xuống"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-xs text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="ml-1 inline-flex items-center gap-1 rounded-md border border-danger/30 bg-danger/5 px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/15"
                      >
                        Xoá slide
                      </button>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 p-5">
                  <input
                    type="hidden"
                    {...register(`slides.${index}.id` as const)}
                  />
                  <input
                    type="hidden"
                    {...register(`slides.${index}.imageUrl` as const)}
                  />
                  <input
                    type="hidden"
                    {...register(`slides.${index}.imageFileId` as const)}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput
                      label="Tiêu đề banner *"
                      placeholder="Nhập tiêu đề banner..."
                      errorMessage={slideErrors?.title?.message}
                      {...register(`slides.${index}.title` as const)}
                    />

                    <FormInput
                      label="Tag (Nhãn)"
                      placeholder="VD: Tuyển dụng, Môi trường, Cơ hội..."
                      errorMessage={slideErrors?.tag?.message}
                      {...register(`slides.${index}.tag` as const)}
                    />
                  </div>

                  <FormTextarea
                    label="Mô tả ngắn (Subtitle)"
                    placeholder="Nhập mô tả ngắn cho slide..."
                    errorMessage={slideErrors?.subtitle?.message}
                    {...register(`slides.${index}.subtitle` as const)}
                  />

                  {/* Image upload per slide */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      Ảnh Banner {fields.length > 1 ? `(Slide ${index + 1})` : ""}{" "}
                      <span className="text-danger">*</span>
                    </label>

                    <div className="mb-3 flex h-40 w-full max-w-lg items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-muted">
                      {currentImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={currentImageUrl}
                          alt={`Banner preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-text-muted">
                          Chưa có ảnh cho slide này
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface-muted">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                        </svg>
                        {isUploadingThis ? "Đang tải lên..." : "Chọn ảnh"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => handleFileChange(index, e)}
                          disabled={uploadingIndex !== null}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setGallerySlideIndex(index)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface-muted"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0L2.5 11.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Chọn từ thư viện
                      </button>

                      <span className="text-xs text-text-muted">
                        JPG, PNG, WebP • Tối đa 10MB
                      </span>
                    </div>

                    {slideErrors?.imageUrl && (
                      <p className="mt-1 text-xs text-danger">
                        {slideErrors.imageUrl.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {fields.length > 1 && (
          <div className="flex justify-center">
            <AppButton
              type="button"
              variant="outline"
              onClick={handleAddSlide}
            >
              + Thêm slide tiếp theo (Slide {fields.length + 1})
            </AppButton>
          </div>
        )}

        <ImagePickerModal
          isOpen={gallerySlideIndex !== null}
          onClose={() => setGallerySlideIndex(null)}
          onSelect={handleGallerySelect}
          defaultFolder="/vdcd/images"
          uploadFolder="image"
          title={
            gallerySlideIndex !== null
              ? `Chọn ảnh banner — Slide ${gallerySlideIndex + 1}`
              : "Chọn ảnh banner"
          }
        />

        <div className="mt-6 flex justify-end gap-3">
          <AppButton
            variant="ghost"
            type="button"
            onClick={() => router.back()}
          >
            Huỷ
          </AppButton>
          <AppButton
            type="submit"
            isLoading={isPending}
            disabled={uploadingIndex !== null}
          >
            {isEditing ? "Lưu thay đổi" : "Tạo Banner"}
          </AppButton>
        </div>
      </form>
    </div>
  );
}
