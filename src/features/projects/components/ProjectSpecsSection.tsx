"use client";

import React, { useState } from "react";
import type { TechnicalHighlight } from "@/types/project";

export interface ProjectSpecsSectionProps {
  discipline?: string | null;
  provinceId?: string | null;
  provinceName?: string | null;
  provinces?: Array<{ id: string; name: string }>;
  year?: number | null;
  services?: string[] | null;
  technicalHighlights?: TechnicalHighlight[] | null;
  interactive?: boolean;
  onEditClick?: () => void;
  className?: string;

  // Direct inline editing callbacks
  onDisciplineChange?: (val: string) => void;
  onProvinceChange?: (provinceId: string) => void;
  onYearChange?: (year: number | null) => void;
  onServicesChange?: (services: string[]) => void;
  onHighlightsChange?: (highlights: TechnicalHighlight[]) => void;
}

/**
 * Khối Thông số dự án & Dịch vụ
 * Tái hiện 100% giao diện Section "THÔNG SỐ DỰ ÁN & DỊCH VỤ" trên VDCD Frontend:
 * 1. 3 thẻ thông tin chính: Chuyên môn, Địa điểm triển khai, Năm thực hiện.
 * 2. Danh sách thẻ Dịch vụ cung cấp (Chips kèm dấu tick ✓).
 * 3. Lưới Điểm nhấn kỹ thuật (3 cột, giá trị màu đỏ nổi bật).
 * 
 * Hỗ trợ chế độ tương tác (interactive = true) trên Visual Editor Canvas:
 * - Thêm và chỉnh sửa trực tiếp các thông số mà không cần rời Canvas
 * - Đồng bộ tức thì với React Hook Form (Single Source of Truth)
 * - Nút chuyển đổi [Sửa thông số] / [✓ Hoàn tất]
 */
export function ProjectSpecsSection({
  discipline,
  provinceId,
  provinceName,
  provinces = [],
  year,
  services = [],
  technicalHighlights = [],
  interactive = false,
  onEditClick,
  className = "",
  onDisciplineChange,
  onProvinceChange,
  onYearChange,
  onServicesChange,
  onHighlightsChange,
}: ProjectSpecsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newServiceInput, setNewServiceInput] = useState("");

  const hasOverviewData = Boolean(discipline || provinceName || year);
  const hasServices = Boolean(services && services.length > 0);
  const hasHighlights = Boolean(
    technicalHighlights && technicalHighlights.length > 0,
  );

  // Nếu không có bất kỳ thông số nào và không ở chế độ trực quan
  if (!hasOverviewData && !hasServices && !hasHighlights && !interactive) {
    return null;
  }

  const handleToggleEdit = () => {
    onEditClick?.();
    setIsEditing((prev) => !prev);
  };

  const handleAddService = () => {
    const trimmed = newServiceInput.trim();
    if (!trimmed) return;
    const currentServices = services ? [...services] : [];
    const updated = [...currentServices, trimmed];
    onServicesChange?.(updated);
    setNewServiceInput("");
  };

  const handleRemoveService = (indexToRemove: number) => {
    const currentServices = services ? [...services] : [];
    const updated = currentServices.filter((_, idx) => idx !== indexToRemove);
    onServicesChange?.(updated);
  };

  const handleAddHighlight = () => {
    const current = technicalHighlights ? [...technicalHighlights] : [];
    const updated = [...current, { label: "", value: "" }];
    onHighlightsChange?.(updated);
  };

  const handleUpdateHighlight = (
    indexToUpdate: number,
    field: "label" | "value",
    val: string,
  ) => {
    const current = technicalHighlights ? [...technicalHighlights] : [];
    const updated = current.map((item, idx) => {
      if (idx === indexToUpdate) {
        return { ...item, [field]: val };
      }
      return item;
    });
    onHighlightsChange?.(updated);
  };

  const handleRemoveHighlight = (indexToRemove: number) => {
    const current = technicalHighlights ? [...technicalHighlights] : [];
    const updated = current.filter((_, idx) => idx !== indexToRemove);
    onHighlightsChange?.(updated);
  };

  return (
    <section
      aria-label="Thông số dự án & Dịch vụ"
      className={`relative group/specs rounded-xl transition-all ${
        interactive
          ? "border border-dashed border-border/70 hover:border-primary/50 p-4 sm:p-6 bg-surface-muted/20"
          : "p-6 sm:p-8 bg-surface-muted/20"
      } ${className}`}
    >
      {/* Header Bar with Section Title & Quick Edit Action */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-muted font-mono flex items-center gap-2">
          <span>THÔNG SỐ DỰ ÁN & DỊCH VỤ</span>
          {isEditing && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary uppercase">
              Chế độ chỉnh sửa
            </span>
          )}
        </h2>

        {interactive && (
          <button
            type="button"
            onClick={handleToggleEdit}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              isEditing
                ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white"
            }`}
            title={
              isEditing
                ? "Hoàn tất chỉnh sửa và xem trước"
                : "Chỉnh sửa trực tiếp các thông số này"
            }
          >
            {isEditing ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5 text-emerald-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Hoàn tất</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                </svg>
                <span>Sửa thông số</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 1. 3-column Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Chuyên môn */}
        <div
          onClick={() => interactive && !isEditing && setIsEditing(true)}
          className={`rounded-xl border border-border/80 p-4 bg-surface shadow-2xs transition-all focus-within:border-primary/60 ${
            interactive && !isEditing
              ? "cursor-pointer hover:border-primary/60 hover:shadow-xs"
              : ""
          }`}
          title={
            interactive && !isEditing
              ? "Nhấn để chỉnh sửa chuyên môn"
              : undefined
          }
        >
          <div className="text-xs text-text-muted mb-1 font-medium">Chuyên môn</div>
          {isEditing ? (
            <input
              type="text"
              value={discipline ?? ""}
              onChange={(e) => onDisciplineChange?.(e.target.value)}
              placeholder="VD: Trắc địa & Quy hoạch"
              className="w-full text-sm sm:text-base font-bold text-text bg-transparent border-b border-border/60 focus:border-primary focus:outline-none pb-0.5 placeholder:font-normal placeholder:text-text-muted/50"
            />
          ) : (
            <div className="text-sm sm:text-base font-bold text-text">
              {discipline || (
                <span className="italic text-text-muted/60 font-normal">
                  (Chưa nhập)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Địa điểm triển khai */}
        <div
          onClick={() => interactive && !isEditing && setIsEditing(true)}
          className={`rounded-xl border border-border/80 p-4 bg-surface shadow-2xs transition-all focus-within:border-primary/60 ${
            interactive && !isEditing
              ? "cursor-pointer hover:border-primary/60 hover:shadow-xs"
              : ""
          }`}
          title={
            interactive && !isEditing
              ? "Nhấn để chọn tỉnh thành"
              : undefined
          }
        >
          <div className="text-xs text-text-muted mb-1 font-medium">
            Địa điểm triển khai
          </div>
          {isEditing ? (
            <select
              value={provinceId ?? ""}
              onChange={(e) => onProvinceChange?.(e.target.value)}
              className="w-full text-sm sm:text-base font-bold text-text bg-transparent border-b border-border/60 focus:border-primary focus:outline-none pb-0.5 cursor-pointer"
            >
              <option value="">— Chọn tỉnh thành —</option>
              {provinces?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm sm:text-base font-bold text-text">
              {provinceName || (
                <span className="italic text-text-muted/60 font-normal">
                  (Chưa chọn tỉnh thành)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Năm thực hiện */}
        <div
          onClick={() => interactive && !isEditing && setIsEditing(true)}
          className={`rounded-xl border border-border/80 p-4 bg-surface shadow-2xs transition-all focus-within:border-primary/60 ${
            interactive && !isEditing
              ? "cursor-pointer hover:border-primary/60 hover:shadow-xs"
              : ""
          }`}
          title={
            interactive && !isEditing
              ? "Nhấn để chỉnh sửa năm"
              : undefined
          }
        >
          <div className="text-xs text-text-muted mb-1 font-medium">Năm thực hiện</div>
          {isEditing ? (
            <input
              type="number"
              min={1990}
              max={2100}
              value={year ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onYearChange?.(val ? Number(val) : null);
              }}
              placeholder="2025"
              className="w-full text-sm sm:text-base font-bold text-text bg-transparent border-b border-border/60 focus:border-primary focus:outline-none pb-0.5 placeholder:font-normal placeholder:text-text-muted/50"
            />
          ) : (
            <div className="text-sm sm:text-base font-bold text-text">
              {year || (
                <span className="italic text-text-muted/60 font-normal">
                  (Chưa nhập năm)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Dịch vụ cung cấp (Chips with Checkmark & Inline Add) */}
      {isEditing ? (
        <div className="mb-6 rounded-xl border border-border/80 p-4 bg-surface/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm font-semibold text-text">
              Dịch vụ cung cấp ({services?.length ?? 0}):
            </p>
            <span className="text-[11px] text-text-muted hidden sm:inline">
              Nhấn Enter hoặc nút Thêm để lưu dịch vụ
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {services?.map((service, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-surface text-xs sm:text-sm font-medium text-text shadow-2xs group"
              >
                <span>✓ {service}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(idx)}
                  aria-label={`Xoá dịch vụ ${service}`}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-text-muted hover:bg-danger/10 hover:text-danger cursor-pointer transition-colors text-xs"
                >
                  ✕
                </button>
              </span>
            ))}

            {/* Inline Add Input */}
            <div className="inline-flex items-center gap-1.5">
              <input
                type="text"
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddService();
                  }
                }}
                placeholder="+ Thêm dịch vụ..."
                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-dashed border-border hover:border-primary focus:border-primary focus:outline-none bg-surface text-text w-44 sm:w-56"
              />
              <button
                type="button"
                onClick={handleAddService}
                disabled={!newServiceInput.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      ) : hasServices ? (
        <div
          onClick={() => interactive && !isEditing && setIsEditing(true)}
          className={`mb-6 ${
            interactive && !isEditing ? "cursor-pointer group/serv" : ""
          }`}
          title={
            interactive && !isEditing
              ? "Nhấn để thêm hoặc chỉnh sửa dịch vụ"
              : undefined
          }
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-text-muted font-medium">
              Dịch vụ cung cấp:
            </p>
            {interactive && !isEditing && (
              <span className="text-[11px] text-primary opacity-0 group-hover/serv:opacity-100 transition-opacity font-semibold">
                + Thêm / Sửa dịch vụ
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {services?.map((service, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-surface text-xs sm:text-sm font-medium text-text shadow-2xs hover:border-primary/50 transition-colors"
              >
                ✓ {service}
              </span>
            ))}
          </div>
        </div>
      ) : interactive ? (
        <div className="mb-6 rounded-lg border border-dashed border-border/60 p-3 text-center text-xs text-text-muted flex items-center justify-center gap-2">
          <span>Chưa có dịch vụ cung cấp.</span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-primary font-semibold hover:underline cursor-pointer"
          >
            + Thêm ngay
          </button>
        </div>
      ) : null}

      {/* 3. Điểm nhấn kỹ thuật (3-column Cards with Red Value & Inline Add) */}
      {isEditing ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm font-semibold text-text">
              Điểm nhấn kỹ thuật ({technicalHighlights?.length ?? 0}):
            </p>
            <button
              type="button"
              onClick={handleAddHighlight}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              + Thêm thông số mới
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {technicalHighlights?.map((highlight, idx) => (
              <div
                key={idx}
                className="relative rounded-xl border border-border/80 p-3.5 bg-surface shadow-2xs group/highlight focus-within:border-primary/60 transition-all"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(idx)}
                  aria-label={`Xoá điểm nhấn ${idx + 1}`}
                  className="absolute top-2.5 right-2.5 h-6 w-6 inline-flex items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger cursor-pointer transition-colors text-xs"
                  title="Xoá điểm nhấn này"
                >
                  ✕
                </button>
                <label className="text-[11px] font-medium text-text-muted block mb-1">
                  Tên thông số
                </label>
                <input
                  type="text"
                  value={highlight.label}
                  onChange={(e) =>
                    handleUpdateHighlight(idx, "label", e.target.value)
                  }
                  placeholder="VD: Diện tích"
                  className="w-full px-2.5 py-1 text-xs font-medium text-text bg-surface-muted/30 rounded-lg border border-border/70 focus:border-primary focus:outline-none mb-2.5"
                />
                <label className="text-[11px] font-medium text-text-muted block mb-1">
                  Giá trị
                </label>
                <input
                  type="text"
                  value={highlight.value}
                  onChange={(e) =>
                    handleUpdateHighlight(idx, "value", e.target.value)
                  }
                  placeholder="VD: 4,439 ha"
                  className="w-full px-2.5 py-1 text-sm font-bold text-primary bg-surface-muted/30 rounded-lg border border-border/70 focus:border-primary focus:outline-none"
                />
              </div>
            ))}

            {/* Thẻ Thêm điểm nhấn mới */}
            <button
              type="button"
              onClick={handleAddHighlight}
              className="flex flex-col items-center justify-center min-h-[120px] rounded-xl border-2 border-dashed border-border/80 hover:border-primary hover:bg-primary/5 p-4 text-text-muted hover:text-primary transition-all cursor-pointer group"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-muted group-hover:bg-primary/10 mb-1.5 text-lg font-bold text-primary transition-transform group-hover:scale-110">
                +
              </span>
              <span className="text-xs font-semibold text-text group-hover:text-primary">
                Thêm điểm nhấn kỹ thuật
              </span>
              <span className="text-[10px] text-text-muted mt-0.5">
                Tên thông số & Giá trị
              </span>
            </button>
          </div>
        </div>
      ) : hasHighlights ? (
        <div
          onClick={() => interactive && !isEditing && setIsEditing(true)}
          className={
            interactive && !isEditing ? "cursor-pointer group/hl" : ""
          }
          title={
            interactive && !isEditing
              ? "Nhấn để thêm hoặc chỉnh sửa điểm nhấn kỹ thuật"
              : undefined
          }
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-text-muted font-medium">
              Điểm nhấn kỹ thuật:
            </p>
            {interactive && !isEditing && (
              <span className="text-[11px] text-primary opacity-0 group-hover/hl:opacity-100 transition-opacity font-semibold">
                + Thêm / Sửa điểm nhấn
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {technicalHighlights?.map((highlight, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border/80 p-3.5 sm:p-4 bg-surface shadow-2xs hover:border-primary/50 transition-colors"
              >
                <div className="text-xs text-text-muted mb-1">
                  {highlight.label || "(Nhãn)"}
                </div>
                <div className="text-sm sm:text-base font-bold text-primary">
                  {highlight.value || "(Giá trị)"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : interactive ? (
        <div className="rounded-lg border border-dashed border-border/60 p-3 text-center text-xs text-text-muted flex items-center justify-center gap-2">
          <span>Chưa có điểm nhấn kỹ thuật.</span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-primary font-semibold hover:underline cursor-pointer"
          >
            + Thêm ngay
          </button>
        </div>
      ) : null}
    </section>
  );
}
