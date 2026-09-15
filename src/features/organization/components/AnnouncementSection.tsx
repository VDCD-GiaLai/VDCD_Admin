"use client";

import React, { useState, useRef } from "react";
import type {
  UseFormRegister,
  UseFormSetValue,
  Control,
  FieldErrors,
} from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, FormSwitch, AppButton, useToast } from "@/components/ui";
import { uploadImage, validateImageFile } from "@/lib/upload";
import type { OrganizationFormData } from "../schema";

interface AnnouncementSectionProps {
  register: UseFormRegister<OrganizationFormData>;
  setValue: UseFormSetValue<OrganizationFormData>;
  control: Control<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
}

export function AnnouncementSection({
  register,
  setValue,
  control,
  errors,
}: AnnouncementSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const announcementWatch = useWatch({
    control,
    name: "announcement",
  });

  const isActive = announcementWatch?.isActive ?? true;
  const text = announcementWatch?.text || "";
  const link = announcementWatch?.link || "";
  const imageUrl = announcementWatch?.imageUrl || "";
  const displayImage = imageUrl || "/about-us/3A5A2610.webp";
  const optimizedDisplayImage = displayImage
    ? displayImage.includes("ik.imagekit.io") && !displayImage.includes("?tr=")
      ? `${displayImage}?tr=w-1600,q-85,f-auto`
      : displayImage
    : "/about-us/3A5A2610.webp";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      setIsUploading(true);
      const res = await uploadImage(file, "about-us");
      const safeUrl =
        res.url?.includes("ik.imagekit.io") && !res.url.includes("?tr=")
          ? `${res.url}?tr=w-1600,q-85,f-auto`
          : res.url;
      setValue("announcement.imageUrl", safeUrl, { shouldDirty: true });
      if (res.fileId) {
        setValue("announcement.imageFileId", res.fileId, { shouldDirty: true });
      }
      toast({
        title: "Tải ảnh thành công",
        description: "Ảnh sự kiện nổi bật đã được cập nhật.",
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
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card className="border border-border bg-surface shadow-sm">
      <CardHeader className="border-b border-border px-6 py-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              2
            </span>
            <div>
              <CardTitle className="text-base font-semibold text-text">
                Hình ảnh & Sự kiện tiêu biểu (Bento Intro)
              </CardTitle>
              <p className="text-xs text-text-muted">
                Hình ảnh sự kiện nổi bật kèm chú thích thực tế hiển thị ở đầu trang &ldquo;Về chúng tôi&rdquo; (đặt cạnh thông tin tổ chức).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FormSwitch
              size="sm"
              color="primary"
              label={isActive ? "Đang bật hiển thị" : "Đang tắt"}
              {...register("announcement.isActive")}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ── Cột trái: Form nhập liệu ── */}
          <div className="space-y-4 lg:col-span-7">
            {/* Ảnh sự kiện */}
            <div>
              <FormInput
                label="Đường dẫn ảnh sự kiện tiêu biểu"
                placeholder="https://... hoặc tải ảnh bên dưới (mặc định: /about-us/3A5A2610.webp)"
                errorMessage={errors.announcement?.imageUrl?.message}
                {...register("announcement.imageUrl")}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="announcement-image-upload"
                />
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Chọn và tải ảnh sự kiện lên
                </AppButton>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("announcement.imageUrl", "", { shouldDirty: true });
                      setValue("announcement.imageFileId", "", { shouldDirty: true });
                    }}
                    className="text-xs text-danger hover:underline"
                  >
                    Khôi phục ảnh mặc định
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-text-muted">
                Ảnh chụp sự kiện thực tế của tổ chức. Hệ thống tự động tối ưu hiển thị với hiệu ứng kính lúp zoom chi tiết trên trang web.
              </p>
            </div>

            {/* Lời chú thích sự kiện */}
            <FormTextarea
              label="Lời chú thích sự kiện / hình ảnh"
              rows={3}
              placeholder="VD: Hội nghị Xúc tiến đầu tư tỉnh Gia Lai năm 2026 diễn ra vào ngày 28/3/2026 tại Trung tâm Hội nghị tỉnh (số 01 Nguyễn Tất Thành, phường Quy Nhơn)..."
              errorMessage={errors.announcement?.text?.message}
              {...register("announcement.text")}
            />
            <p className="-mt-2.5 text-xs text-text-muted">
              Đoạn văn bản in nghiêng mô tả ngắn gọn nội dung sự kiện, địa điểm hoặc bối cảnh bức ảnh.
            </p>

            {/* Đường dẫn liên kết */}
            <FormInput
              label="Đường dẫn liên kết chi tiết (tuỳ chọn)"
              placeholder="VD: /news/hoi-nghi-xuc-tien-dau-tu-2026 hoặc https://..."
              errorMessage={errors.announcement?.link?.message}
              {...register("announcement.link")}
            />
          </div>

          {/* ── Cột phải: Live Preview chuẩn Frontend ── */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-dashed border-border bg-surface-muted/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Xem trước Bento Intro trên Frontend:
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    isActive
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {isActive ? "● Sẽ hiển thị" : "○ Đang ẩn"}
                </span>
              </div>

              {/* Mô phỏng khung Bento Intro của Frontend */}
              <div
                className={`relative overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all ${
                  isActive ? "opacity-100" : "opacity-50 grayscale"
                }`}
              >
                {/* 1. Base Image Container */}
                <div className="group relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optimizedDisplayImage}
                    alt={text || "Ảnh sự kiện nổi bật"}
                    className="h-full w-full object-cover transition-transform duration-300"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes("tr=orig-true")) {
                        img.src = `${displayImage}?tr=orig-true`;
                      } else {
                        img.src =
                          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80";
                      }
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                  {/* Kính lúp icon badge giống hệt Frontend */}
                  <div className="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded bg-black/75 px-2 py-1 font-mono text-[11px] text-white/90 shadow-md backdrop-blur-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M156,112a12,12,0,0,1-12,12H124v20a12,12,0,0,1-24,0V124H80a12,12,0,0,1,0-24h20V80a12,12,0,0,1,24,0v20h20A12,12,0,0,1,156,112Zm76.49,120.49a12,12,0,0,1-17,0L168,185a92.12,92.12,0,1,1,17-17l47.54,47.53A12,12,0,0,1,232.49,232.49ZM112,180a68,68,0,1,0-68-68A68.08,68.08,0,0,0,112,180Z" />
                    </svg>
                    <span>Zoom</span>
                  </div>
                </div>

                {/* 2. Event Caption Container */}
                <div className="border-t border-border/60 bg-surface-muted/80 p-3.5">
                  <p className="text-xs italic leading-relaxed text-text-muted">
                    {text || (
                      <span className="text-text-muted/60">
                        (Chưa nhập nội dung chú thích sự kiện...)
                      </span>
                    )}
                  </p>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Xem chi tiết sự kiện &rarr;
                    </a>
                  )}
                </div>
              </div>

              <p className="mt-2.5 text-center text-[11px] text-text-muted">
                💡 Khối này hiển thị ở cột bên trái của Bento Intro (/about-us), bên phải là Tên, Mã số DN và bài giới thiệu tổ chức.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

