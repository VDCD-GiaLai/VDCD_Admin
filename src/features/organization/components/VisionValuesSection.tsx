"use client";

import React, { useState } from "react";
import type {
  UseFormRegister,
  Control,
  FieldErrors,
} from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, AppButton } from "@/components/ui";
import type { OrganizationFormData } from "../schema";

interface VisionValuesSectionProps {
  register: UseFormRegister<OrganizationFormData>;
  control: Control<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
}

// Default background images matching the 3 cards in Frontend
const DEFAULT_CARD_IMAGES = {
  mission:
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop", // Champa tower sunset
  vision:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop", // Peaceful lake view
  coreValues:
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop", // Rugged nature landscape
};

export function VisionValuesSection({
  register,
  control,
  errors,
}: VisionValuesSectionProps) {
  // Realtime values from form
  const watchedMission = useWatch({ control, name: "mission" });
  const watchedVision = useWatch({ control, name: "vision" });
  const watchedCoreValues = useWatch({ control, name: "coreValues" });
  const watchedOrientations = useWatch({
    control,
    name: "developmentOrientationsArray",
  });

  // State for interactive Accordion in Live Preview
  const [activeAccordion, setActiveAccordion] = useState<
    "mission" | "vision" | "coreValues"
  >("mission");

  // Field Array for 4 Core Functions (Development Orientations)
  const {
    fields: devFields,
    append: appendDev,
    remove: removeDev,
  } = useFieldArray({
    control,
    name: "developmentOrientationsArray",
  });


  const handleFillSampleFunctions = () => {
    if (devFields.length > 0) {
      // Clear existing
      for (let i = devFields.length - 1; i >= 0; i--) {
        removeDev(i);
      }
    }
    appendDev({
      title: "Phát triển hạ tầng dữ liệu và công nghệ dùng chung",
      description:
        "Lập mô hình 3D số hóa không gian, chuẩn hóa hệ thống GIS và vận hành điện toán mây phục vụ dữ liệu số toàn tỉnh.",
      icon: "database",
      order: 1,
    });
    appendDev({
      title: "Thúc đẩy ứng dụng công nghệ trong các ngành kinh tế chủ lực",
      description:
        "Cung cấp hệ thống giám sát IOC/DOC, tự động hóa AutoTimelapse và nền tảng Digital Twin hỗ trợ quản trị và vận hành.",
      icon: "layers",
      order: 2,
    });
    appendDev({
      title: "Hỗ trợ startup và doanh nghiệp đổi mới mô hình hoạt động",
      description:
        "Xây dựng mạng lưới liên kết giữa cơ quan quản lý, viện nghiên cứu, tập đoàn công nghệ và quỹ đầu tư trong nước.",
      icon: "share-2",
      order: 3,
    });
    appendDev({
      title:
        "Kết nối Gia Lai với mạng lưới chuyên gia, công nghệ và đầu tư trong nước",
      description:
        "Đào tạo nhân lực số chất lượng cao, tư vấn chuyển đổi số và chuyển giao giải pháp cho doanh nghiệp địa phương.",
      icon: "bookmark",
      order: 4,
    });
  };

  return (
    <div className="space-y-8">
      {/* ════════════════════════════════════════════════════════════════════════
          KHỐI 1: NỀN TẢNG PHÁT TRIỂN (SỨ MỆNH - TẦM NHÌN - GIÁ TRỊ CỐT LÕI)
      ════════════════════════════════════════════════════════════════════════ */}
      <Card className="border border-border bg-surface shadow-sm">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                01
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-text">
                  Nền tảng phát triển (Triết lý cốt lõi)
                </CardTitle>
                <p className="text-xs text-text-muted">
                  Hiển thị thành 3 thẻ ảnh Accordion tương tác trên trang Về chúng tôi (/about-us).
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Form inputs */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text">
                  Sứ mệnh (Mission) <span className="text-primary">*</span>
                </label>
                <span className="text-[11px] text-text-muted">Thẻ 1 (Trái)</span>
              </div>
              <FormTextarea
                rows={4}
                placeholder="VD: Thúc đẩy đổi mới sáng tạo, chuyển đổi số và phát triển bền vững cho tỉnh Gia Lai và khu vực Tây Nguyên..."
                errorMessage={errors.mission?.message}
                {...register("mission")}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text">
                  Tầm nhìn (Vision) <span className="text-primary">*</span>
                </label>
                <span className="text-[11px] text-text-muted">Thẻ 2 (Giữa)</span>
              </div>
              <FormTextarea
                rows={4}
                placeholder="VD: Trở thành trung tâm kết nối công nghệ, thúc đẩy đổi mới sáng tạo và chuyển đổi số hàng đầu khu vực Tây Nguyên..."
                errorMessage={errors.vision?.message}
                {...register("vision")}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text">
                  Giá trị cốt lõi (Core Values)
                </label>
                <span className="text-[11px] text-text-muted">Thẻ 3 (Phải)</span>
              </div>
              <FormTextarea
                rows={4}
                placeholder="VD: Bắt đầu từ thực tế, đổi mới bằng hành động, kiến tạo giải pháp công nghệ phục vụ con người..."
                errorMessage={errors.coreValues?.message}
                {...register("coreValues")}
              />
            </div>
          </div>

          {/* ── Live Preview Chuẩn 100% UI Frontend (Ảnh 1) ── */}
          <div className="mt-8 rounded-2xl border border-border bg-surface-muted/40 p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                  Live Preview: Accordion Triết lý phát triển
                </span>
              </div>
              <span className="text-[11px] text-text-muted">
                (Click vào thẻ để xem hiệu ứng mở rộng thực tế)
              </span>
            </div>

            {/* Khung mô phỏng Frontend Section */}
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-zinc-950 sm:p-8">
              {/* Header preview */}
              <div className="mb-6 space-y-1.5">
                <div className="text-xs font-black tracking-widest text-red-600 uppercase">
                  NỀN TẢNG PHÁT TRIỂN
                </div>
                <h3 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
                  Sứ mệnh - Tầm nhìn - Giá trị cốt lõi
                </h3>
              </div>

              {/* 3 Thẻ Accordion Container */}
              <div className="flex h-[380px] w-full flex-col gap-3 sm:h-[400px] sm:flex-row sm:gap-4">
                {/* ── Thẻ 1: SỨ MỆNH ── */}
                <div
                  onClick={() => setActiveAccordion("mission")}
                  className={`relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-out ${
                    activeAccordion === "mission"
                      ? "sm:flex-[2.8] ring-2 ring-red-600/30"
                      : "sm:flex-1 hover:opacity-95 opacity-85"
                  }`}
                  style={{
                    backgroundImage: `url(${DEFAULT_CARD_IMAGES.mission})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Thanh đỏ chỉ báo active trên đỉnh thẻ */}
                  {activeAccordion === "mission" && (
                    <div className="absolute top-0 right-0 left-0 z-20 h-1.5 bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.8)]" />
                  )}

                  {/* Gradient tối dần để chữ trắng luôn nổi bật */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                  {/* Icon nút tròn góc trên phải */}
                  <div className="absolute top-4 right-4 z-10">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all ${
                        activeAccordion === "mission"
                          ? "bg-red-600 text-white shadow-red-600/40"
                          : "bg-black/50 text-white/90 backdrop-blur-md"
                      }`}
                    >
                      {/* Globe Icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                  </div>

                  {/* Nội dung text góc dưới */}
                  <div className="absolute right-0 bottom-0 left-0 z-10 p-5 text-white sm:p-6">
                    <h4 className="text-lg font-black tracking-wide uppercase sm:text-xl">
                      SỨ MỆNH
                    </h4>
                    {activeAccordion === "mission" && (
                      <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-white/90 sm:text-sm">
                        {watchedMission ||
                          "Thúc đẩy đổi mới sáng tạo, chuyển đổi số và phát triển bền vững cho tỉnh Gia Lai và khu vực Tây Nguyên."}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Thẻ 2: TẦM NHÌN ── */}
                <div
                  onClick={() => setActiveAccordion("vision")}
                  className={`relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-out ${
                    activeAccordion === "vision"
                      ? "sm:flex-[2.8] ring-2 ring-red-600/30"
                      : "sm:flex-1 hover:opacity-95 opacity-85"
                  }`}
                  style={{
                    backgroundImage: `url(${DEFAULT_CARD_IMAGES.vision})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Thanh đỏ chỉ báo active */}
                  {activeAccordion === "vision" && (
                    <div className="absolute top-0 right-0 left-0 z-20 h-1.5 bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.8)]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                  {/* Icon nút tròn góc trên phải */}
                  <div className="absolute top-4 right-4 z-10">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all ${
                        activeAccordion === "vision"
                          ? "bg-red-600 text-white shadow-red-600/40"
                          : "bg-black/50 text-white/90 backdrop-blur-md"
                      }`}
                    >
                      {/* Target / Compass Icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute right-0 bottom-0 left-0 z-10 p-5 text-white sm:p-6">
                    <h4 className="text-lg font-black tracking-wide uppercase sm:text-xl">
                      TẦM NHÌN
                    </h4>
                    {activeAccordion === "vision" && (
                      <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-white/90 sm:text-sm">
                        {watchedVision ||
                          "Trở thành trung tâm kết nối công nghệ, thúc đẩy đổi mới sáng tạo và chuyển đổi số hàng đầu khu vực Tây Nguyên."}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Thẻ 3: GIÁ TRỊ CỐT LÕI ── */}
                <div
                  onClick={() => setActiveAccordion("coreValues")}
                  className={`relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-out ${
                    activeAccordion === "coreValues"
                      ? "sm:flex-[2.8] ring-2 ring-red-600/30"
                      : "sm:flex-1 hover:opacity-95 opacity-85"
                  }`}
                  style={{
                    backgroundImage: `url(${DEFAULT_CARD_IMAGES.coreValues})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Thanh đỏ chỉ báo active */}
                  {activeAccordion === "coreValues" && (
                    <div className="absolute top-0 right-0 left-0 z-20 h-1.5 bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.8)]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                  {/* Icon nút tròn góc trên phải */}
                  <div className="absolute top-4 right-4 z-10">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all ${
                        activeAccordion === "coreValues"
                          ? "bg-red-600 text-white shadow-red-600/40"
                          : "bg-black/50 text-white/90 backdrop-blur-md"
                      }`}
                    >
                      {/* Shield Icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute right-0 bottom-0 left-0 z-10 p-5 text-white sm:p-6">
                    <h4 className="text-lg font-black tracking-wide uppercase sm:text-xl">
                      GIÁ TRỊ CỐT LÕI
                    </h4>
                    {activeAccordion === "coreValues" && (
                      <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-white/90 sm:text-sm">
                        {watchedCoreValues ||
                          "Bắt đầu từ thực tế, đổi mới bằng hành động, kiến tạo giải pháp công nghệ phục vụ con người và kiến thiết cộng đồng địa phương."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          KHỐI 2: CHỨC NĂNG TRỌNG TÂM (NỀN TẢNG NĂNG LỰC ĐỔI MỚI SÁNG TẠO)
      ════════════════════════════════════════════════════════════════════════ */}
      <Card className="border border-border bg-surface shadow-sm">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                02
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-text">
                  Chức năng trọng tâm (Nền tảng năng lực)
                </CardTitle>
                <p className="text-xs text-text-muted">
                  Hiển thị thành lưới 4 thẻ (01, 02, 03, 04) ngay bên dưới khối Triết lý trên trang Về chúng tôi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillSampleFunctions}
              >
                ⚡ Nạp 4 chức năng chuẩn
              </AppButton>
              <AppButton
                type="button"
                color="primary"
                variant="solid"
                size="sm"
                onClick={() =>
                  appendDev({
                    title: "",
                    description: "",
                    icon: "compass",
                    order: devFields.length + 1,
                  })
                }
              >
                + Thêm chức năng
              </AppButton>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Form quản lý các thẻ chức năng */}
          {devFields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-text-muted">
                Chưa có chức năng trọng tâm nào.
              </p>
              <div className="mt-3">
                <AppButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleFillSampleFunctions}
                >
                  ⚡ Nạp nhanh 4 chức năng trọng tâm chuẩn
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {devFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/30 p-4 transition-all focus-within:border-primary/50 focus-within:shadow-sm hover:border-border-strong"
                >
                  <div className="flex min-w-[32px] items-center justify-center pt-7 text-base font-black text-red-600">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>

                  <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-5">
                      <FormInput
                        label="Tiêu đề chức năng / năng lực"
                        isRequired
                        placeholder="VD: Phát triển hạ tầng dữ liệu..."
                        errorMessage={
                          errors.developmentOrientationsArray?.[index]?.title
                            ?.message
                        }
                        {...register(
                          `developmentOrientationsArray.${index}.title`
                        )}
                      />
                    </div>
                    <div className="md:col-span-7">
                      <FormTextarea
                        label="Mô tả chi tiết năng lực"
                        rows={2}
                        placeholder="Mô tả chi tiết cách thức tổ chức triển khai..."
                        errorMessage={
                          errors.developmentOrientationsArray?.[index]
                            ?.description?.message
                        }
                        {...register(
                          `developmentOrientationsArray.${index}.description`
                        )}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeDev(index)}
                    className="mt-7 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
                    title="Xoá thẻ này"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Live Preview Chuẩn 100% UI Frontend (Ảnh 2) ── */}
          <div className="mt-8 rounded-2xl border border-border bg-surface-muted/40 p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                  Live Preview: Lưới 4 Thẻ Chức Năng Trọng Tâm
                </span>
              </div>
              <span className="text-[11px] text-text-muted">
                (Đồng bộ thời gian thực theo nội dung bạn nhập)
              </span>
            </div>

            {/* Khung mô phỏng Frontend Section */}
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-[#FAFAFA] p-6 shadow-sm dark:bg-zinc-950 sm:p-8">
              {/* Header preview */}
              <div className="mb-6 space-y-1.5">
                <div className="text-xs font-black tracking-widest text-red-600 uppercase">
                  CHỨC NĂNG TRỌNG TÂM
                </div>
                <h3 className="text-2xl font-black tracking-tight text-text uppercase sm:text-3xl">
                  NỀN TẢNG NĂNG LỰC <br />
                  THÚC ĐẨY ĐỔI MỚI SÁNG TẠO
                </h3>
              </div>

              {/* Lưới 4 thẻ 01, 02, 03, 04 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                {watchedOrientations && watchedOrientations.length > 0 ? (
                  watchedOrientations.map((item, idx) => {
                    const isCardTwo = idx === 1; // Card 02 in photo 2 has distinctive red theme and arrow
                    return (
                      <div
                        key={idx}
                        className={`group relative flex flex-col justify-between rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-zinc-900 ${
                          isCardTwo
                            ? "border-red-200/80 dark:border-red-900/30"
                            : "border-border/80"
                        }`}
                      >
                        {/* Top row: Number and Icon */}
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-3xl font-black tracking-tight text-red-600">
                            {(idx + 1).toString().padStart(2, "0")}
                          </span>

                          {/* Icon container */}
                          {isCardTwo ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm shadow-red-600/30">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                              >
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 17 12 22 22 17" />
                                <polyline points="2 12 12 17 22 12" />
                              </svg>
                            </div>
                          ) : idx === 0 ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                              >
                                <ellipse cx="12" cy="5" rx="9" ry="3" />
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                              </svg>
                            </div>
                          ) : idx === 2 ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                              >
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                              >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4
                            className={`flex items-center gap-1.5 text-base font-bold leading-snug tracking-tight ${
                              isCardTwo
                                ? "text-red-600 dark:text-red-500"
                                : "text-zinc-900 group-hover:text-red-600 dark:text-white"
                            }`}
                          >
                            <span>
                              {item.title || `Chức năng ${(idx + 1).toString().padStart(2, "0")}`}
                            </span>
                            {isCardTwo && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4 shrink-0 text-red-600"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </h4>
                          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-sm">
                            {item.description ||
                              "Mô tả chi tiết giải pháp và năng lực triển khai..."}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
                    Bấm &ldquo;⚡ Nạp 4 chức năng chuẩn&rdquo; ở trên để xem preview ngay.
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
