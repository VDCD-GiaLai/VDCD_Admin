"use client";

import React from "react";
import type { UseFormRegister, Control, FieldErrors } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, AppButton } from "@/components/ui";
import type { OrganizationFormData } from "../schema";

interface StatsSectionProps {
  register: UseFormRegister<OrganizationFormData>;
  control: Control<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
}

export function StatsSection({
  register,
  control,
  errors,
}: StatsSectionProps) {
  const {
    fields: statFields,
    append: appendStat,
    remove: removeStat,
  } = useFieldArray({
    control,
    name: "statsList",
  });

  // Watch realtime values for Live Preview
  const watchedStatsList = useWatch({
    control,
    name: "statsList",
  });

  const handleFillStandardStats = () => {
    // Clear existing
    if (statFields.length > 0) {
      for (let i = statFields.length - 1; i >= 0; i--) {
        removeStat(i);
      }
    }
    appendStat({
      key: "staff",
      value: "1.500+",
      label: "CÁN BỘ, NHÂN SỰ",
      description:
        "Đội ngũ chuyên môn cao, đáp ứng triển khai dự án quy mô lớn",
    });
    appendStat({
      key: "experts",
      value: "250+",
      label: "CHUYÊN GIA ĐA LĨNH VỰC",
      description: "Năng lực R&D phần cứng, GIS, AI và chuyển đổi số",
    });
    appendStat({
      key: "projects",
      value: "100+",
      label: "DỰ ÁN TRỌNG ĐIỂM",
      description: "Tham gia trực tiếp triển khai các dự án quy mô toàn quốc",
    });
    appendStat({
      key: "provinces",
      value: "30",
      label: "TỈNH, THÀNH HIỆN DIỆN",
      description:
        "Mạng lưới phục vụ thực địa rộng khắp các tỉnh thành toàn quốc",
    });
  };

  return (
    <div className="space-y-8">
      {/* ════════════════════════════════════════════════════════════════════════
          FORM QUẢN LÝ CHỈ SỐ QUY MÔ & MẠNG LƯỚI
      ════════════════════════════════════════════════════════════════════════ */}
      <Card className="border border-border bg-surface shadow-sm">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                📊
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-text">
                  Quy mô và mạng lưới toàn quốc
                </CardTitle>
                <p className="text-xs text-text-muted">
                  Cấu hình 4 chỉ số năng lực hiển thị trên trang Về chúng tôi (Số lượng, Tiêu đề và Mô tả ngắn).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillStandardStats}
              >
                ⚡ Nạp 4 chỉ số chuẩn
              </AppButton>
              <AppButton
                type="button"
                color="primary"
                variant="solid"
                size="sm"
                onClick={() =>
                  appendStat({
                    key: `stat_${statFields.length + 1}`,
                    value: "",
                    label: "",
                    description: "",
                  })
                }
              >
                + Thêm chỉ số
              </AppButton>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {statFields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-text-muted">
                Chưa có chỉ số thống kê nào.
              </p>
              <div className="mt-3">
                <AppButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleFillStandardStats}
                >
                  ⚡ Nạp 4 chỉ số chuẩn (1.500+ Nhân sự, 250+ Chuyên gia...)
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {statFields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative flex flex-col justify-between rounded-xl border border-border bg-surface-muted/30 p-5 transition-all focus-within:border-primary/50 focus-within:shadow-sm hover:border-border-strong"
                >
                  {/* Top Bar: Number badge and Delete button */}
                  <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-text uppercase">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      Chỉ số Cột {(index + 1).toString().padStart(2, "0")}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeStat(index)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
                      title="Xoá chỉ số này"
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

                  {/* Form inputs (chỉ giữ 3 trường cần thiết: Giá trị, Nhãn, Mô tả) */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-5">
                        <FormInput
                          label="Con số hiển thị"
                          isRequired
                          placeholder="VD: 1.500+"
                          errorMessage={
                            errors.statsList?.[index]?.value?.message
                          }
                          {...register(`statsList.${index}.value`)}
                        />
                      </div>
                      <div className="sm:col-span-7">
                        <FormInput
                          label="Nhãn tiêu đề (In hoa)"
                          isRequired
                          placeholder="VD: CÁN BỘ, NHÂN SỰ"
                          errorMessage={
                            errors.statsList?.[index]?.label?.message
                          }
                          {...register(`statsList.${index}.label`)}
                        />
                      </div>
                    </div>

                    <FormTextarea
                      label="Mô tả ngắn năng lực"
                      rows={2}
                      placeholder="VD: Đội ngũ chuyên môn cao, đáp ứng triển khai dự án quy mô lớn"
                      errorMessage={
                        errors.statsList?.[index]?.description?.message
                      }
                      {...register(`statsList.${index}.description`)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Live Preview Chuẩn 100% UI Frontend (Khớp ảnh thực tế) ── */}
          <div className="mt-8 rounded-2xl border border-border bg-surface-muted/40 p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                  Live Preview: Quy mô và mạng lưới toàn quốc
                </span>
              </div>
              <span className="text-[11px] text-text-muted">
                (Hiển thị thời gian thực theo nội dung form)
              </span>
            </div>

            {/* Khung mô phỏng Frontend Section */}
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-zinc-950 sm:p-10">
              {/* Header preview */}
              <div className="mb-8 space-y-2">
                <div className="text-xs font-black tracking-widest text-red-600 uppercase">
                  NĂNG LỰC & HỆ SINH THÁI
                </div>
                <h3 className="text-2xl font-black tracking-tight text-text uppercase sm:text-3xl">
                  QUY MÔ VÀ MẠNG LƯỚI TOÀN QUỐC
                </h3>
              </div>

              {/* Đường kẻ ngang phân cách */}
              <div className="mb-8 border-t border-zinc-200 dark:border-zinc-800" />

              {/* 4 Cột chỉ số phân cách bằng đường kẻ dọc */}
              <div className="grid grid-cols-1 divide-y divide-zinc-200 dark:divide-zinc-800 sm:grid-cols-2 sm:divide-y-0 sm:gap-6 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                {watchedStatsList && watchedStatsList.length > 0 ? (
                  watchedStatsList.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center justify-start px-4 py-6 text-center first:pl-0 last:pr-0 lg:py-2"
                    >
                      {/* Con số to khổng lồ font black */}
                      <div className="mb-3 text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl">
                        {stat.value || "0"}
                      </div>

                      {/* Tiêu đề in hoa */}
                      <h4 className="mb-2 text-sm font-black tracking-wider text-zinc-800 uppercase dark:text-zinc-200 sm:text-base">
                        {stat.label || `CHỈ SỐ ${(idx + 1).toString().padStart(2, "0")}`}
                      </h4>

                      {/* Mô tả chi tiết */}
                      <p className="mx-auto max-w-[220px] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">
                        {stat.description ||
                          "Mô tả chi tiết về quy mô và năng lực..."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 py-8 text-center text-sm text-text-muted">
                    Bấm &ldquo;⚡ Nạp 4 chỉ số chuẩn&rdquo; ở trên để xem preview ngay.
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
