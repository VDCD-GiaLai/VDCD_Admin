"use client";

import React from "react";
import type {
  UseFormRegister,
  Control,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, FormSelect, AppButton } from "@/components/ui";
import type { OrganizationFormData } from "../schema";

// ── SVG Icons ──────────────────────────────────────────────────

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.72 1.56-.05 2.87-1.14 3.17-2.67.14-.64.16-1.3.16-1.96V.02h-.03z" />
    </svg>
  );
}

function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.5 3H4.5A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM12 17.25c-3.17 0-5.75-2.24-5.75-5s2.58-5 5.75-5 5.75 2.24 5.75 5-2.58 5-5 5zm-1.88-3.44h3.76v-1.13h-2.3l2.3-2.57V8.88h-3.67v1.13h2.22l-2.31 2.57v1.23z" />
    </svg>
  );
}

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.518 3.735 7.218V22l3.376-1.854c.915.254 1.887.391 2.889.391 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.443l-2.617-2.792-5.11 2.792 5.62-5.968 2.68 2.792 5.047-2.792-5.62 5.968z" />
    </svg>
  );
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function DefaultLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "zalo", label: "Zalo" },
  { value: "messenger", label: "Messenger" },
  { value: "hotline", label: "Hotline / SĐT" },
  { value: "email", label: "Email" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website" },
  { value: "other", label: "Khác (Nhập tùy chỉnh)" },
];

const getPlatformIcon = (platform: string) => {
  switch (platform?.toLowerCase()) {
    case "facebook":
      return <FacebookIcon className="h-4 w-4 text-[#1877F2]" />;
    case "tiktok":
      return <TikTokIcon className="h-4 w-4 text-zinc-900 dark:text-white" />;
    case "zalo":
      return <ZaloIcon className="h-4 w-4 text-[#0068FF]" />;
    case "messenger":
      return <MessengerIcon className="h-4 w-4 text-[#00B2FF]" />;
    case "youtube":
      return <YoutubeIcon className="h-4 w-4 text-red-600" />;
    case "hotline":
      return <PhoneIcon className="h-4 w-4 text-emerald-600" />;
    case "email":
      return <EnvelopeIcon className="h-4 w-4 text-zinc-500" />;
    case "linkedin":
      return <LinkedinIcon className="h-4 w-4 text-[#0A66C2]" />;
    default:
      return <DefaultLinkIcon className="h-4 w-4 text-zinc-400" />;
  }
};

interface CtaContactSectionProps {
  register: UseFormRegister<OrganizationFormData>;
  control: Control<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
  setValue?: UseFormSetValue<OrganizationFormData>;
}

export function CtaContactSection({
  register,
  control,
  errors,
  setValue,
}: CtaContactSectionProps) {
  const {
    fields: socialFields,
    append: appendSocial,
    remove: removeSocial,
    replace: replaceSocial,
  } = useFieldArray({
    control,
    name: "socialLinksArray",
  });

  const socialLinksWatch = useWatch({
    control,
    name: "socialLinksArray",
  });

  const ctaWatch = useWatch({
    control,
    name: "ctaSection",
  });

  const addressWatch = useWatch({
    control,
    name: "address",
  });

  const hotlineWatch = useWatch({
    control,
    name: "hotline",
  });

  const emailWatch = useWatch({
    control,
    name: "email",
  });

  // CTA values with fallbacks matching Frontend CommonCtaSection
  const ctaBadge = ctaWatch?.badge || "Tầm nhìn & Sứ mệnh";
  const ctaTitle = ctaWatch?.title || "CHUYỂN ĐỔI SỐ TƯƠNG LAI CỦA BẠN";
  const ctaDescription =
    ctaWatch?.description ||
    "Hãy liên hệ với chúng tôi để thiết kế các giải pháp công nghệ tối ưu nhất dành riêng cho doanh nghiệp, cơ quan của bạn tại địa bàn tỉnh.";
  const ctaButtonText = ctaWatch?.buttonText || "Liên hệ hợp tác";
  const ctaButtonLink = ctaWatch?.buttonLink || "/contact";
  const ctaSecondaryButtonText =
    ctaWatch?.secondaryButtonText || "Khám phá giải pháp";
  const ctaSecondaryButtonLink = ctaWatch?.secondaryButtonLink || "#";
  const ctaSubtext =
    ctaWatch?.subtext ||
    "Kiến tạo tương lai số bền vững cho doanh nghiệp và cộng đồng.";

  // Contact values with fallbacks
  const previewAddress =
    addressWatch || "Số 226 Đống Đa, Phường Quy Nhơn, Tỉnh Gia Lai";
  const previewHotline = hotlineWatch || "0373600099";
  const previewEmail = emailWatch || "dmstgialai@vdcd.vn";

  // Helper: Load default CTA template
  const handleLoadCtaTemplate = () => {
    if (!setValue) return;
    setValue("ctaSection.badge", "Tầm nhìn & Sứ mệnh", { shouldDirty: true });
    setValue("ctaSection.title", "CHUYỂN ĐỔI SỐ TƯƠNG LAI CỦA BẠN", {
      shouldDirty: true,
    });
    setValue(
      "ctaSection.description",
      "Hãy liên hệ với chúng tôi để thiết kế các giải pháp công nghệ tối ưu nhất dành riêng cho doanh nghiệp, cơ quan của bạn tại địa bàn tỉnh.",
      { shouldDirty: true }
    );
    setValue("ctaSection.buttonText", "Liên hệ hợp tác", {
      shouldDirty: true,
    });
    setValue("ctaSection.buttonLink", "/contact", { shouldDirty: true });
    setValue("ctaSection.secondaryButtonText", "Khám phá giải pháp", {
      shouldDirty: true,
    });
    setValue("ctaSection.secondaryButtonLink", "#", { shouldDirty: true });
    setValue(
      "ctaSection.subtext",
      "Kiến tạo tương lai số bền vững cho doanh nghiệp và cộng đồng.",
      { shouldDirty: true }
    );
  };

  // Helper: Quick load 4 official social channels
  const handleLoadOfficialSocialChannels = () => {
    const officialChannels = [
      {
        platform: "facebook",
        url: "https://www.facebook.com/VDCDGIALAI",
      },
      {
        platform: "tiktok",
        url: "https://www.tiktok.com/@vdcdgialai",
      },
      {
        platform: "zalo",
        url: "https://zalo.me/0373600099",
      },
      {
        platform: "messenger",
        url: "https://www.messenger.com/t/888742211000071",
      },
    ];
    replaceSocial(officialChannels);
  };

  return (
    <div className="space-y-8">
      {/* ══════════════════════════════════════════════════════════════
          KHỐI 1: KÊU GỌI HÀNH ĐỘNG (CTA SECTION)
      ══════════════════════════════════════════════════════════════ */}
      <Card className="border border-border bg-surface shadow-sm">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-sm font-bold text-red-600 dark:text-red-400">
                8A
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-text">
                  Khối Kêu gọi hành động (Common CTA Section)
                </CardTitle>
                <p className="text-xs text-text-muted">
                  Banner chốt trang Về chúng tôi (/about-us) & các trang giới thiệu, đồng bộ 100% với Frontend CommonCtaSection.
                </p>
              </div>
            </div>

            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadCtaTemplate}
              className="text-xs"
            >
              🔄 Nạp mẫu CTA chuẩn
            </AppButton>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Form Fields */}
            <div className="space-y-4 lg:col-span-7">
              {/* Eyebrow Tag */}
              <FormInput
                label="Thẻ nhận diện (Eyebrow Badge)"
                placeholder="VD: Tầm nhìn & Sứ mệnh (hoặc Năng lực chuyển đổi số)"
                errorMessage={errors.ctaSection?.badge?.message}
                {...register("ctaSection.badge")}
              />

              {/* Title */}
              <FormInput
                label="Tiêu đề chính (Headline in hoa)"
                placeholder="VD: CHUYỂN ĐỔI SỐ TƯƠNG LAI CỦA BẠN"
                errorMessage={errors.ctaSection?.title?.message}
                {...register("ctaSection.title")}
              />

              {/* Description */}
              <FormTextarea
                label="Nội dung mô tả kêu gọi"
                rows={3}
                placeholder="Hãy liên hệ với chúng tôi để thiết kế các giải pháp công nghệ tối ưu nhất..."
                errorMessage={errors.ctaSection?.description?.message}
                {...register("ctaSection.description")}
              />

              {/* Dual Action Buttons Inputs */}
              <div className="rounded-xl border border-border bg-surface-muted/30 p-4 space-y-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-text">
                  Cặp nút hành động kép (Dual Action Buttons)
                </span>

                {/* Primary Button */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormInput
                    label="Nút chính (Primary Label)"
                    placeholder="VD: Liên hệ hợp tác"
                    errorMessage={errors.ctaSection?.buttonText?.message}
                    {...register("ctaSection.buttonText")}
                  />
                  <FormInput
                    label="Đường dẫn nút chính (Link)"
                    placeholder="VD: /contact"
                    errorMessage={errors.ctaSection?.buttonLink?.message}
                    {...register("ctaSection.buttonLink")}
                  />
                </div>

                {/* Secondary Button */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormInput
                    label="Nút phụ (Secondary Label)"
                    placeholder="VD: Khám phá giải pháp"
                    errorMessage={errors.ctaSection?.secondaryButtonText?.message}
                    {...register("ctaSection.secondaryButtonText")}
                  />
                  <FormInput
                    label="Đường dẫn nút phụ (Link / # để mở menu)"
                    placeholder="VD: # hoặc /solutions"
                    errorMessage={errors.ctaSection?.secondaryButtonLink?.message}
                    {...register("ctaSection.secondaryButtonLink")}
                  />
                </div>
              </div>

              {/* Subtext */}
              <FormInput
                label="Thông điệp kết phụ (Subtext ghi chú)"
                placeholder="VD: Kiến tạo tương lai số bền vững cho doanh nghiệp và cộng đồng."
                errorMessage={errors.ctaSection?.subtext?.message}
                {...register("ctaSection.subtext")}
              />
            </div>

            {/* Live Preview CTA Box (100% Frontend Match) */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Xem trước thực tế (Live Preview)
                  </span>
                  <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                    CommonCtaSection
                  </span>
                </div>

                {/* Preview Box Styled Exactly Like Frontend */}
                <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/70 p-6 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
                  {/* Eyebrow badge with pulsing dot */}
                  {ctaBadge && (
                    <div className="mb-2.5 inline-flex items-center justify-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-red-600 dark:text-red-500">
                      <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                      {ctaBadge}
                    </div>
                  )}

                  {/* Headline uppercase */}
                  <h3 className="text-lg font-bold uppercase tracking-tight text-zinc-950 dark:text-white sm:text-xl">
                    {ctaTitle}
                  </h3>

                  {/* Description */}
                  <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {ctaDescription}
                  </p>

                  {/* Dual Action Buttons */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    {/* Primary Button */}
                    <a
                      href={ctaButtonLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex cursor-pointer items-center gap-2 bg-zinc-950 py-2 pl-4 pr-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-red-600 dark:bg-white dark:text-zinc-950 dark:hover:bg-red-600 dark:hover:text-white"
                    >
                      <span>{ctaButtonText}</span>
                      <span className="flex h-6 w-6 items-center justify-center bg-white/15 text-inherit transition-colors group-hover:bg-white/25 dark:bg-black/10">
                        <EnvelopeIcon className="h-3 w-3" />
                      </span>
                    </a>

                    {/* Secondary Button */}
                    <a
                      href={ctaSecondaryButtonLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex cursor-pointer items-center gap-2 border border-zinc-300 bg-white/80 py-2 pl-4 pr-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-800 backdrop-blur-xs transition-all hover:border-red-600 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200"
                    >
                      <span>{ctaSecondaryButtonText}</span>
                      <span className="flex h-6 w-6 items-center justify-center bg-zinc-100 text-inherit transition-colors group-hover:bg-red-50 dark:bg-zinc-700">
                        <ArrowUpRightIcon className="h-3 w-3" />
                      </span>
                    </a>
                  </div>

                  {/* Subtext footer */}
                  {ctaSubtext && (
                    <p className="mt-4 text-[10px] italic text-zinc-400 dark:text-zinc-500">
                      {ctaSubtext}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          KHỐI 2: THÔNG TIN LIÊN HỆ & MẠNG XÃ HỘI
      ══════════════════════════════════════════════════════════════ */}
      <Card className="border border-border bg-surface shadow-sm">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-bold text-blue-600 dark:text-blue-400">
                8B
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-text">
                  Thông tin Liên hệ & Mạng xã hội (Contact & Social)
                </CardTitle>
                <p className="text-xs text-text-muted">
                  Hiển thị tại trang Liên hệ (/contact), chân trang (Footer) và các điểm kết nối chính thức.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadOfficialSocialChannels}
                className="text-xs"
              >
                ⚡ Nạp 4 mạng xã hội chuẩn
              </AppButton>
              <AppButton
                type="button"
                variant="solid"
                color="primary"
                size="sm"
                onClick={() => appendSocial({ platform: "facebook", url: "" })}
                className="text-xs"
              >
                + Thêm kênh
              </AppButton>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Form Fields */}
            <div className="space-y-5 lg:col-span-7">
              {/* Địa chỉ văn phòng, Hotline, Email */}
              <div className="space-y-4">
                <FormInput
                  label="Địa chỉ văn phòng chính"
                  placeholder="VD: Số 226 Đống Đa, Phường Quy Nhơn, Tỉnh Gia Lai"
                  errorMessage={errors.address?.message}
                  {...register("address")}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Hotline liên hệ"
                    placeholder="VD: 0373600099"
                    errorMessage={errors.hotline?.message}
                    {...register("hotline")}
                  />
                  <FormInput
                    label="Email chính thức"
                    placeholder="VD: dmstgialai@vdcd.vn"
                    errorMessage={errors.email?.message}
                    {...register("email")}
                  />
                </div>
              </div>

              {/* Social Channels List */}
              <div className="border-t border-border pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-text">
                    Danh sách kênh mạng xã hội & liên kết ({socialFields.length})
                  </h4>
                  <span className="text-[11px] text-text-muted">
                    Facebook, TikTok, Zalo, Messenger được ưu tiên
                  </span>
                </div>

                {socialFields.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <p className="text-xs text-text-muted">
                      Chưa có kênh liên hệ nào. Hãy bấm &ldquo;⚡ Nạp 4 mạng xã hội chuẩn&rdquo; để tự động cấu hình.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {socialFields.map((field, index) => {
                      const currentPlatform =
                        socialLinksWatch?.[index]?.platform || "facebook";

                      return (
                        <div
                          key={field.id}
                          className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-muted/20 p-3.5 transition-all hover:border-border-strong"
                        >
                          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-12">
                            <div className="sm:col-span-4">
                              <FormSelect
                                label="Nền tảng"
                                options={PLATFORM_OPTIONS}
                                errorMessage={
                                  errors.socialLinksArray?.[index]?.platform
                                    ?.message
                                }
                                {...register(
                                  `socialLinksArray.${index}.platform`
                                )}
                              />
                            </div>
                            <div className="sm:col-span-8">
                              <div className="relative">
                                <FormInput
                                  label="Đường dẫn / Link liên kết"
                                  placeholder="https://..."
                                  errorMessage={
                                    errors.socialLinksArray?.[index]?.url
                                      ?.message
                                  }
                                  {...register(
                                    `socialLinksArray.${index}.url`
                                  )}
                                  className="pl-9"
                                />
                                <div className="pointer-events-none absolute left-3 top-[34px] flex items-center justify-center">
                                  {getPlatformIcon(currentPlatform)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSocial(index)}
                            className="mt-7 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10"
                            title="Xóa kênh này"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Contact & Social Channels (100% Frontend Match) */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Xem trước khối Liên hệ & Mạng xã hội
                  </span>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                    ContactInfo & Footer
                  </span>
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
                  {/* Item 1: Địa chỉ */}
                  <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                        Địa chỉ văn phòng
                      </span>
                      <span className="block truncate text-xs font-semibold text-zinc-900 dark:text-white">
                        {previewAddress}
                      </span>
                    </div>
                  </div>

                  {/* Item 2: Hotline */}
                  <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <PhoneIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                        Hotline
                      </span>
                      <span className="block text-xs font-semibold text-zinc-900 dark:text-white">
                        {previewHotline}
                      </span>
                    </div>
                  </div>

                  {/* Item 3: Email */}
                  <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <EnvelopeIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                        Email
                      </span>
                      <span className="block truncate text-xs font-semibold text-zinc-900 dark:text-white">
                        {previewEmail}
                      </span>
                    </div>
                  </div>

                  {/* Item 4: Giờ làm việc */}
                  <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <ClockIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                        Giờ làm việc
                      </span>
                      <span className="block text-xs font-semibold text-zinc-900 dark:text-white">
                        Thứ 2 — Thứ 6 · 08:00 — 17:30
                      </span>
                    </div>
                  </div>

                  {/* Social Buttons bar */}
                  <div className="pt-2">
                    <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                      Kênh mạng xã hội kích hoạt
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {socialFields.length === 0 ? (
                        <span className="text-[11px] text-zinc-400">
                          Chưa có mạng xã hội nào
                        </span>
                      ) : (
                        socialFields.map((field, idx) => {
                          const item = socialLinksWatch?.[idx];
                          const platform = item?.platform?.toLowerCase() || "facebook";
                          const url = item?.url || "#";

                          let badgeStyle =
                            "border-zinc-200 text-zinc-700 bg-zinc-100";
                          let iconNode = <DefaultLinkIcon className="h-3.5 w-3.5" />;

                          if (platform === "facebook") {
                            badgeStyle =
                              "border-[#1877F2]/30 text-[#1877F2] bg-[#1877F2]/10";
                            iconNode = <FacebookIcon className="h-3.5 w-3.5" />;
                          } else if (platform === "tiktok") {
                            badgeStyle =
                              "border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800";
                            iconNode = <TikTokIcon className="h-3.5 w-3.5" />;
                          } else if (platform === "zalo") {
                            badgeStyle =
                              "border-[#0068FF]/30 text-[#0068FF] bg-[#0068FF]/10";
                            iconNode = <ZaloIcon className="h-3.5 w-3.5" />;
                          } else if (platform === "messenger") {
                            badgeStyle =
                              "border-[#00B2FF]/30 text-[#00B2FF] bg-[#00B2FF]/10";
                            iconNode = <MessengerIcon className="h-3.5 w-3.5" />;
                          } else if (platform === "youtube") {
                            badgeStyle =
                              "border-red-500/30 text-red-600 bg-red-500/10";
                            iconNode = <YoutubeIcon className="h-3.5 w-3.5" />;
                          } else if (platform === "linkedin") {
                            badgeStyle =
                              "border-[#0A66C2]/30 text-[#0A66C2] bg-[#0A66C2]/10";
                            iconNode = <LinkedinIcon className="h-3.5 w-3.5" />;
                          }

                          return (
                            <a
                              key={field.id}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-transform hover:scale-105 ${badgeStyle}`}
                              title={`${item?.platform || "Kênh"}: ${url}`}
                            >
                              {iconNode}
                            </a>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
