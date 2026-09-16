"use client";

import React, { useEffect, useRef } from "react";
import { AppButton, Spinner } from "@/components/ui";
import type { GalleryFile } from "@/hooks/useGallery";

interface MediaGridProps {
  images: GalleryFile[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  onFetchNextPage: () => void;
  onSelectImage: (image: GalleryFile) => void;
  onCopyUrl: (url: string) => void;
  onDeleteImage?: (image: GalleryFile) => void;
  onRetry: () => void;
  onOpenUpload: () => void;
  searchTerm?: string;
  dateFilter?: string;
  canDelete?: boolean;
}

export function MediaGrid({
  images,
  isLoading,
  isError,
  errorMessage,
  isFetchingNextPage,
  hasNextPage,
  onFetchNextPage,
  onSelectImage,
  onCopyUrl,
  onDeleteImage,
  onRetry,
  onOpenUpload,
  searchTerm,
  dateFilter,
  canDelete,
}: MediaGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onFetchNextPage();
        }
      },
      { rootMargin: "300px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Đang tải danh sách ảnh...</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-6">
        <div className="mb-3 rounded-full bg-danger/10 p-3 text-danger">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-text">Không thể tải dữ liệu ảnh</h3>
        <p className="mt-1 text-xs text-text-muted max-w-sm">
          {errorMessage || "Đã xảy ra sự cố khi kết nối đến ImageKit API"}
        </p>
        <AppButton variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Thử lại
        </AppButton>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────
  if (images.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-6">
        <div className="mb-3 rounded-full bg-surface-muted p-4 text-text-muted/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-10 w-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-text">
          {searchTerm
            ? `Không tìm thấy ảnh nào khớp với "${searchTerm}"`
            : dateFilter && dateFilter !== "all"
              ? "Không có ảnh nào trong khoảng thời gian này"
              : "Thư mục này hiện chưa có ảnh"}
        </p>
        <p className="mt-1 text-xs text-text-muted max-w-xs">
          Bạn có thể tải ảnh mới vào thư mục này để phục vụ quản lý nội dung.
        </p>
        <AppButton
          variant="solid"
          color="primary"
          size="sm"
          className="mt-4"
          onClick={onOpenUpload}
        >
          Tải ảnh lên ngay
        </AppButton>
      </div>
    );
  }

  // ── Grid ──────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {images.map((img) => (
          <div
            key={img.fileId}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xs transition-all hover:border-primary/50 hover:shadow-md"
          >
            {/* Image Preview Container */}
            <div
              className="relative aspect-square w-full cursor-pointer overflow-hidden bg-surface-muted/60"
              onClick={() => onSelectImage(img)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnail || img.url}
                alt={img.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover actions top right */}
              <div className="absolute right-1.5 top-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyUrl(img.url);
                  }}
                  title="Sao chép URL"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur-xs transition-colors hover:bg-black/80"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12a1.5 1.5 0 0 1 .439 1.061V16.5A1.5 1.5 0 0 1 15.5 18h-7A1.5 1.5 0 0 1 7 16.5v-13Z" />
                    <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h.75v11.5A3 3 0 0 0 9.25 19.5h6.25v.5a1.5 1.5 0 0 1-1.5 1.5h-8.5A1.5 1.5 0 0 1 4 20V6.5Z" />
                  </svg>
                </button>

                {canDelete && onDeleteImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage(img);
                    }}
                    title="Xóa ảnh"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-danger/80 text-white backdrop-blur-xs transition-colors hover:bg-danger"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 1 .75.74l.5 6.5a.75.75 0 1 1-1.498.115l-.5-6.5a.75.75 0 0 1 .748-.855Zm3.58.74a.75.75 0 0 0-1.498-.115l-.5 6.5a.75.75 0 1 0 1.498.115l.5-6.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Info footer */}
            <div
              className="flex cursor-pointer flex-col p-2.5 transition-colors group-hover:bg-surface-muted/30"
              onClick={() => onSelectImage(img)}
            >
              <p className="truncate text-xs font-medium text-text" title={img.name}>
                {img.name}
              </p>
              <div className="mt-1 flex items-center justify-between text-[10px] text-text-muted">
                <span>{formatFileSize(img.size)}</span>
                {img.width && img.height && (
                  <span>
                    {img.width}×{img.height}
                  </span>
                )}
                <span>{formatDate(img.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-6 text-center">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs text-text-muted">Đang tải thêm ảnh...</span>
          </div>
        )}
        {!isFetchingNextPage && !hasNextPage && images.length > 0 && (
          <p className="text-xs text-text-muted">
            — Đã hiển thị tất cả {images.length} ảnh —
          </p>
        )}
      </div>
    </div>
  );
}
