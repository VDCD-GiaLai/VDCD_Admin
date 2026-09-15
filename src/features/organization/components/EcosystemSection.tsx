"use client";

import React, { useState } from "react";
import type {
  UseFormRegister,
  UseFormSetValue,
  Control,
  FieldErrors,
} from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { uploadImage, validateImageFile } from "@/lib/upload";
import type { OrganizationFormData } from "../schema";



interface EcosystemSectionProps {
  register: UseFormRegister<OrganizationFormData>;
  setValue: UseFormSetValue<OrganizationFormData>;
  control: Control<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
}

export function EcosystemSection({
  register,
  setValue,
  control,
  errors,
}: EcosystemSectionProps) {
  const { toast } = useToast();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Carousel slide index in Live Preview (shows 2 cards per view)
  const [carouselIndex, setCarouselIndex] = useState(0);

  const {
    fields: memberFields,
    append: appendMember,
    remove: removeMember,
  } = useFieldArray({
    control,
    name: "ecosystemMembersArray",
  });

  // Realtime values for preview
  const watchedCapabilities = useWatch({
    control,
    name: "ecosystemCapabilities",
  });
  const watchedMembers = useWatch({
    control,
    name: "ecosystemMembersArray",
  });

  const totalMembers = watchedMembers?.length || 0;

  const handleNextSlide = () => {
    if (totalMembers <= 2) return;
    setCarouselIndex((prev) => (prev + 1 >= totalMembers - 1 ? 0 : prev + 1));
  };

  const handlePrevSlide = () => {
    if (totalMembers <= 2) return;
    setCarouselIndex((prev) => (prev - 1 < 0 ? totalMembers - 2 : prev - 1));
  };

  const handleUploadMemberImage = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (validation) {
      toast({
        title: "File không hợp lệ",
        description: validation,
        color: "danger",
      });
      return;
    }

    try {
      setUploadingIndex(index);
      const res = await uploadImage(file, "about-us");
      const safeUrl =
        res.url?.includes("ik.imagekit.io") && !res.url.includes("?tr=")
          ? `${res.url}?tr=w-800,q-85,f-auto`
          : res.url;
      setValue(`ecosystemMembersArray.${index}.imageUrl`, safeUrl, {
        shouldDirty: true,
      });
      toast({
        title: "Tải ảnh thành công",
        description: "Đã cập nhật hình ảnh cho đơn vị thành viên.",
        color: "success",
      });
    } catch (err) {
      toast({
        title: "Tải ảnh thất bại",
        description:
          err instanceof Error
            ? err.message
            : "Vui lòng thử lại hoặc dán trực tiếp liên kết ảnh.",
        color: "danger",
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ════════════════════════════════════════════════════════════════════════
          KHỐI 1: NĂNG LỰC KẾ THỪA & THÔNG ĐIỆP HỆ SINH THÁI
      ════════════════════════════════════════════════════════════════════════ */}
      <Card className="border border-border bg-surface shadow-sm">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              01
            </span>
            <div>
              <CardTitle className="text-base font-semibold text-text">
                Thông điệp & Năng lực kế thừa từ VDCD Group
              </CardTitle>
              <p className="text-xs text-text-muted">
                Đoạn văn khái quát hiển thị dưới tiêu đề &ldquo;Sức mạnh từ Hệ sinh thái&rdquo; trên trang Về chúng tôi.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <FormTextarea
            label="Mô tả năng lực kế thừa hệ sinh thái"
            rows={3}
            placeholder="Trung tâm kế thừa năng lực công nghệ, đội ngũ chuyên gia và mạng lưới triển khai của hệ sinh thái VDCD Group trong các lĩnh vực khảo sát, dữ liệu không gian..."
            errorMessage={errors.ecosystemCapabilities?.message}
            {...register("ecosystemCapabilities")}
          />
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          KHỐI 2: DANH SÁCH 12 ĐƠN VỊ THÀNH VIÊN
      ════════════════════════════════════════════════════════════════════════ */}
      <Card className="border border-border bg-surface shadow-sm">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                02
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-text">
                  Danh sách Đơn vị Thành viên Hệ sinh thái ({memberFields.length})
                </CardTitle>
                <p className="text-xs text-text-muted">
                  Hiển thị dạng thẻ trượt (Carousel) trên trang Về chúng tôi kèm ảnh thực địa, mô tả và liên kết tìm hiểu thêm.
                </p>
              </div>
            </div>
            <AppButton
              type="button"
              color="primary"
              variant="solid"
              size="sm"
              onClick={() =>
                appendMember({
                  title: "",
                  slug: "",
                  description: "",
                  imageUrl: "",
                  websiteUrl: "",
                  order: memberFields.length + 1,
                })
              }
            >
              + Thêm đơn vị thành viên
            </AppButton>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {memberFields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-text-muted">
                Chưa có đơn vị thành viên nào. Bấm &ldquo;+ Thêm đơn vị thành viên&rdquo; ở góc trên bên phải để bắt đầu thêm.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {memberFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-surface-muted/30 p-5 transition-all focus-within:border-primary/50 focus-within:shadow-sm hover:border-border-strong"
                >
                  <div>
                    {/* Member Top Bar */}
                    <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-text uppercase">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                          {(index + 1).toString().padStart(2, "0")}
                        </span>
                        Đơn vị #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
                        title="Xoá đơn vị này"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <FormInput
                        label="Tên đơn vị thành viên"
                        isRequired
                        placeholder="VD: Trung tâm Bản đồ số"
                        errorMessage={
                          errors.ecosystemMembersArray?.[index]?.title?.message
                        }
                        {...register(`ecosystemMembersArray.${index}.title`)}
                      />

                      <FormTextarea
                        label="Mô tả chức năng & năng lực"
                        rows={2}
                        placeholder="Mô tả dịch vụ và giải pháp..."
                        errorMessage={
                          errors.ecosystemMembersArray?.[index]?.description
                            ?.message
                        }
                        {...register(
                          `ecosystemMembersArray.${index}.description`
                        )}
                      />

                      <FormInput
                        label="Liên kết Tìm hiểu thêm"
                        placeholder="https://... hoặc /solution/uav"
                        {...register(
                          `ecosystemMembersArray.${index}.websiteUrl`
                        )}
                      />

                      {/* Image Upload / URL */}
                      <div>
                        <FormInput
                          label="Hình ảnh thực tế / phối cảnh (URL)"
                          placeholder="https://... hoặc bấm tải ảnh bên dưới"
                          {...register(
                            `ecosystemMembersArray.${index}.imageUrl`
                          )}
                        />

                        <div className="mt-2 flex items-center justify-between">
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text shadow-sm transition-colors hover:bg-surface-muted">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3.5 w-3.5 text-text-muted"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>
                              {uploadingIndex === index
                                ? "Đang tải ảnh..."
                                : "📁 Tải ảnh mới lên"}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              disabled={uploadingIndex === index}
                              onChange={(e) =>
                                handleUploadMemberImage(index, e)
                              }
                            />
                          </label>

                          {watchedMembers?.[index]?.imageUrl && (
                            <a
                              href={watchedMembers[index].imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Xem ảnh ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              KHỐI 3: LIVE PREVIEW CHUẨN 100% GIAO DIỆN FRONTEND (NHƯ ẢNH GỬI)
          ════════════════════════════════════════════════════════════════════ */}
          <div className="mt-10 rounded-2xl border border-border bg-surface-muted/40 p-5 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                  Live Preview: Sức mạnh từ Hệ sinh thái VDCD
                </span>
              </div>
              <span className="text-[11px] text-text-muted">
                (Khớp 100% bố cục trang thực tế)
              </span>
            </div>

            {/* Khung mô phỏng Frontend Section */}
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-zinc-950 sm:p-10">
              {/* Header Top: Tag, H2, Description & VDCD Logo */}
              <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                <div className="max-w-2xl space-y-3">
                  <div className="text-xs font-black tracking-widest text-red-600 uppercase">
                    VDCD GROUP
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-text sm:text-4xl">
                    Sức mạnh từ Hệ sinh thái
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                    {watchedCapabilities ||
                      "Trung tâm kế thừa năng lực công nghệ, đội ngũ chuyên gia và mạng lưới triển khai của hệ sinh thái VDCD Group trong các lĩnh vực khảo sát, dữ liệu không gian, trí tuệ nhân tạo, mô hình thông tin công trình, hạ tầng dữ liệu và phần mềm quản lý."}
                  </p>
                </div>

                {/* Logo VDCD Group chuẩn phong cách thương hiệu */}
                <div className="flex shrink-0 items-center justify-start lg:justify-end">
                  <div className="flex flex-col items-center select-none">
                    <div className="flex items-center font-sans text-4xl font-black tracking-tight sm:text-5xl">
                      <span className="font-extrabold italic text-red-600">
                        V
                      </span>
                      <span className="text-zinc-950 dark:text-white">DCD</span>
                    </div>
                    <span className="mt-1 text-[10px] font-black tracking-[0.45em] text-zinc-800 uppercase dark:text-zinc-200 sm:text-xs">
                      G R O U P
                    </span>
                  </div>
                </div>
              </div>

              {/* Slider / Carousel Container */}
              <div className="relative">
                {watchedMembers && watchedMembers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Render 2 cards starting from carouselIndex */}
                    {[0, 1].map((offset) => {
                      const idx =
                        (carouselIndex + offset) % watchedMembers.length;
                      const member = watchedMembers[idx];
                      if (!member) return null;

                      return (
                        <div
                          key={idx}
                          className="relative flex h-[380px] w-full flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900 shadow-md transition-all duration-300 sm:h-[420px]"
                          style={{
                            backgroundImage: member.imageUrl
                              ? `url(${member.imageUrl})`
                              : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          {/* Fallback pattern if no image */}
                          {!member.imageUrl && (
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
                          )}

                          {/* Gradient overlay for readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30" />

                          {/* Badge Number Top Left */}
                          <div className="relative z-10 p-5">
                            <div className="inline-flex h-9 w-12 items-center justify-center rounded-lg bg-black/60 text-sm font-black text-white backdrop-blur-md">
                              {(idx + 1).toString().padStart(2, "0")}
                            </div>
                          </div>

                          {/* Content Bottom */}
                          <div className="relative z-10 p-6 text-white sm:p-7">
                            <h4 className="text-xl font-black tracking-wide sm:text-2xl">
                              {member.title || "Tên đơn vị thành viên"}
                            </h4>
                            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                              {member.description ||
                                "Mô tả năng lực, dịch vụ và các giải pháp triển khai..."}
                            </p>

                            <div className="mt-4 flex items-center gap-1.5 text-xs font-black tracking-wider text-red-600 uppercase transition-colors hover:text-red-500">
                              <span>TÌM HIỂU THÊM</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-text-muted">
                    Bấm &ldquo;⚡ Nạp chuẩn 12 đơn vị & thông điệp&rdquo; ở trên để xem preview ngay.
                  </div>
                )}

                {/* Slider Navigation Buttons (Next / Prev) */}
                {totalMembers > 2 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-xs font-medium text-text-muted">
                      Đang hiển thị #{carouselIndex + 1} - #
                      {((carouselIndex + 1) % totalMembers) + 1} / {totalMembers}{" "}
                      đơn vị thành viên
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrevSlide}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md transition-transform hover:scale-105 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900"
                        title="Xem đơn vị trước"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextSlide}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md transition-transform hover:scale-105 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900"
                        title="Xem đơn vị tiếp theo"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
