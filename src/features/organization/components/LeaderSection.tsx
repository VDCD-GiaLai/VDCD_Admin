"use client";

import React, { useState, useRef } from "react";
import type { UseFormRegister, UseFormSetValue, Control, FieldErrors } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { uploadImage, validateImageFile } from "@/lib/upload";
import type { OrganizationFormData } from "../schema";

interface LeaderSectionProps {
  register: UseFormRegister<OrganizationFormData>;
  setValue: UseFormSetValue<OrganizationFormData>;
  control: Control<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
}

export function LeaderSection({
  register,
  setValue,
  control,
  errors,
}: LeaderSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const leaderWatch = useWatch({
    control,
    name: "leader",
  });

  const role = leaderWatch?.role || "Phó Chủ tịch HĐQT kiêm Tổng Giám đốc";
  const name = leaderWatch?.name || "";
  const quote =
    leaderWatch?.quote ||
    "Chúng tôi không bắt đầu từ những điều quá cao siêu. Chúng tôi bắt đầu từ những khó khăn thực tế của người dân, cơ quan quản lý và doanh nghiệp, để đưa công nghệ vào giải quyết những vấn đề thiết thực và góp phần nâng cao chất lượng cuộc sống.";
  const ctaText = leaderWatch?.ctaText || "Xem thông tin lãnh đạo";
  const ctaLink = leaderWatch?.ctaLink || "/leadership";
  const avatarUrl = leaderWatch?.avatarUrl || "";
  const displayAvatar = avatarUrl
    ? avatarUrl.includes("ik.imagekit.io") && !avatarUrl.includes("?tr=")
      ? `${avatarUrl}?tr=w-400,h-400,fo-auto`
      : avatarUrl
    : "";

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
          ? `${res.url}?tr=w-400,h-400,fo-auto`
          : res.url;
      setValue("leader.avatarUrl", safeUrl, { shouldDirty: true });
      if (res.fileId) {
        setValue("leader.avatarFileId", res.fileId, { shouldDirty: true });
      }
      toast({
        title: "Tải ảnh thành công",
        description: "Ảnh chân dung lãnh đạo đã được cập nhật.",
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
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            3
          </span>
          <div>
            <CardTitle className="text-base font-semibold text-text">
              Thông điệp Lãnh đạo
            </CardTitle>
            <p className="text-xs text-text-muted">
              Khối trích dẫn phát biểu của Tổng Giám đốc / Lãnh đạo định hướng hành động trên trang Về chúng tôi.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Form Fields */}
          <div className="space-y-4 lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Chức vụ lãnh đạo"
                placeholder="VD: Phó Chủ tịch HĐQT kiêm Tổng Giám đốc"
                errorMessage={errors.leader?.role?.message}
                {...register("leader.role")}
              />
              <FormInput
                label="Họ và tên lãnh đạo (tuỳ chọn)"
                placeholder="VD: Ban Lãnh đạo VDCD"
                errorMessage={errors.leader?.name?.message}
                {...register("leader.name")}
              />
            </div>

            <FormTextarea
              label="Câu trích dẫn / Thông điệp tâm huyết"
              rows={4}
              placeholder="Chúng tôi không bắt đầu từ những điều quá cao siêu..."
              errorMessage={errors.leader?.quote?.message}
              {...register("leader.quote")}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Chữ trên nút (CTA Text)"
                placeholder="VD: Xem thông tin lãnh đạo"
                errorMessage={errors.leader?.ctaText?.message}
                {...register("leader.ctaText")}
              />
              <FormInput
                label="Đường dẫn nút (CTA Link)"
                placeholder="VD: /leadership"
                errorMessage={errors.leader?.ctaLink?.message}
                {...register("leader.ctaLink")}
              />
            </div>

            <div>
              <FormInput
                label="Đường dẫn ảnh đại diện (Avatar URL)"
                placeholder="https://... hoặc bấm tải ảnh bên dưới"
                errorMessage={errors.leader?.avatarUrl?.message}
                {...register("leader.avatarUrl")}
              />
              <div className="mt-2 flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="leader-avatar-upload"
                />
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Chọn và tải ảnh chân dung lên
                </AppButton>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("leader.avatarUrl", "", { shouldDirty: true });
                      setValue("leader.avatarFileId", "", { shouldDirty: true });
                    }}
                    className="text-xs text-danger hover:underline"
                  >
                    Xoá ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-dashed border-border bg-surface-muted/60 p-5">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Xem trước thẻ thông điệp lãnh đạo:
              </span>

              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-surface to-primary/5 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayAvatar}
                      alt={name || "Leader Avatar"}
                      className="h-14 w-14 rounded-full border-2 border-primary object-cover shadow-sm"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.src.includes("tr=orig-true")) {
                          img.src = `${avatarUrl}?tr=orig-true`;
                        }
                      }}
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                      👤
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-primary">
                      {role || "CHỨC VỤ LÃNH ĐẠO"}
                    </span>
                    {name && (
                      <h4 className="text-sm font-semibold text-text">{name}</h4>
                    )}
                  </div>
                </div>

                <div className="relative mb-5 pl-3 border-l-2 border-primary">
                  <p className="text-sm italic leading-relaxed text-text">
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>

                {ctaText && (
                  <div className="pt-2">
                    <a
                      href={ctaLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary/90"
                    >
                      {ctaText} &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
