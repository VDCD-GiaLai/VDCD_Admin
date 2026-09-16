"use client";

import React from "react";
import { AppButton, Spinner } from "@/components/ui";
import { DATE_FILTERS, type DateFilter } from "@/hooks/useGallery";

interface MediaToolbarProps {
  currentFolderLabel: string;
  totalCount: number;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  onOpenUpload: () => void;
  onRefresh: () => void;
}

export function MediaToolbar({
  currentFolderLabel,
  totalCount,
  isLoading,
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  viewMode,
  onViewModeChange,
  onOpenUpload,
  onRefresh,
}: MediaToolbarProps) {
  return (
    <div className="border-b border-border bg-surface p-4">
      {/* Top row: Title + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text">
            {currentFolderLabel}
          </h1>
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-text-muted">
              {totalCount} ảnh
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <AppButton
            variant="outline"
            size="sm"
            onClick={onRefresh}
            title="Làm mới danh sách"
            className="px-2.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </AppButton>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-border bg-surface-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
              title="Xem dạng lưới"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
              title="Xem dạng danh sách"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Upload Button */}
          <AppButton
            variant="solid"
            color="primary"
            size="sm"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            Tải ảnh lên
          </AppButton>
        </div>
      </div>

      {/* Filter row: Search + Date pills */}
      <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên file..."
            className="w-full rounded-lg border border-border bg-surface-muted/40 py-1.5 pl-9 pr-8 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text"
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-text-muted">Thời gian:</span>
          {DATE_FILTERS.map((df) => (
            <button
              key={df.value}
              type="button"
              onClick={() => onDateFilterChange(df.value)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                dateFilter === df.value
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-muted text-text-muted hover:bg-surface-muted/80 hover:text-text"
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
