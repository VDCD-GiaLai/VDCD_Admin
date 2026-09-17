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
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-100/80 dark:border-red-900/40 font-mono">
          {fieldName}
        </span>
      )}
      {provinceName && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700 font-mono">
          📍 {provinceName}
        </span>
      )}
      {year && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700 font-mono">
          🗓️ {year}
        </span>
      )}
    </div>
  );
}
