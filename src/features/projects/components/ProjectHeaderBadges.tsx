"use client";

import React from "react";

export interface ProjectHeaderBadgesProps {
  fieldName?: string | null;
  provinceName?: string | null;
  year?: number | null;
  className?: string;
}

/**
 * Hàng badge phân loại dự án (Lĩnh vực, Địa điểm, Năm thực hiện)
 * Đồng bộ phong cách hiển thị giữa Tab Đọc bài, Tab Trình chỉnh sửa trực quan và Frontend công khai.
 */
export function ProjectHeaderBadges({
  fieldName,
  provinceName,
  year,
  className = "",
}: ProjectHeaderBadgesProps) {
  if (!fieldName && !provinceName && !year) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {fieldName && (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary border border-primary/20 shadow-2xs font-mono">
          {fieldName}
        </span>
      )}
      {provinceName && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted border border-border px-3 py-1 text-xs font-medium text-text-muted shadow-2xs font-mono">
          📍 {provinceName}
        </span>
      )}
      {year && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted border border-border px-3 py-1 text-xs font-medium text-text-muted shadow-2xs font-mono">
          🗓️ {year}
        </span>
      )}
    </div>
  );
}
