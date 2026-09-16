"use client";

import React, { useRef, useEffect } from "react";
import { AppButton, Spinner } from "@/components/ui";
import type { GalleryFile } from "@/hooks/useGallery";

interface MediaTableProps {
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

export function MediaTable({
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
}: MediaTableProps) {
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Đang tải danh sách ảnh...</p>
      </div>
    );
  }

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

  if (images.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-6">
        <p className="text-sm font-semibold text-text">
          {searchTerm
            ? `Không tìm thấy ảnh nào khớp với "${searchTerm}"`
            : dateFilter && dateFilter !== "all"
              ? "Không có ảnh nào trong khoảng thời gian này"
              : "Thư mục này hiện chưa có ảnh"}
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

  return (
    <div className="overflow-x-auto p-4 sm:p-6">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-muted/60 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            <th className="py-3 pl-4 pr-3">Hình ảnh</th>
            <th className="px-3 py-3">Tên tệp</th>
            <th className="px-3 py-3">Đường dẫn</th>
            <th className="px-3 py-3">Kích thước</th>
            <th className="px-3 py-3">Dung lượng</th>
            <th className="px-3 py-3">Ngày tải lên</th>
            <th className="py-3 pl-3 pr-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {images.map((img) => (
            <tr
              key={img.fileId}
              className="group cursor-pointer transition-colors hover:bg-surface-muted/40"
              onClick={() => onSelectImage(img)}
            >
              {/* Thumbnail */}
              <td className="py-2.5 pl-4 pr-3">
                <div className="h-11 w-11 overflow-hidden rounded-lg border border-border bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbnail || img.url}
                    alt={img.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </td>

              {/* Name */}
              <td className="px-3 py-2.5 font-medium text-text max-w-xs truncate">
                <span title={img.name}>{img.name}</span>
              </td>

              {/* File Path */}
              <td className="px-3 py-2.5 text-text-muted font-mono text-[11px] max-w-xs truncate">
                <span title={img.filePath}>{img.filePath}</span>
              </td>

              {/* Dimensions */}
              <td className="px-3 py-2.5 text-text-muted">
                {img.width && img.height ? `${img.width} × ${img.height} px` : "—"}
              </td>

              {/* Size */}
              <td className="px-3 py-2.5 font-medium text-text">
                {formatFileSize(img.size)}
              </td>

              {/* Created At */}
              <td className="px-3 py-2.5 text-text-muted">
                {formatDate(img.createdAt)}
              </td>

              {/* Actions */}
              <td className="py-2.5 pl-3 pr-4 text-right">
                <div
                  className="flex items-center justify-end gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onCopyUrl(img.url)}
                    title="Sao chép URL"
                    className="rounded-md p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12a1.5 1.5 0 0 1 .439 1.061V16.5A1.5 1.5 0 0 1 15.5 18h-7A1.5 1.5 0 0 1 7 16.5v-13Z" />
                      <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h.75v11.5A3 3 0 0 0 9.25 19.5h6.25v.5a1.5 1.5 0 0 1-1.5 1.5h-8.5A1.5 1.5 0 0 1 4 20V6.5Z" />
                    </svg>
                  </button>

                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Mở ảnh gốc trong tab mới"
                    className="rounded-md p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h4a.75.75 0 0 1 0 1.5h-4Z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>

                  {canDelete && onDeleteImage && (
                    <button
                      type="button"
                      onClick={() => onDeleteImage(img)}
                      title="Xóa ảnh khỏi ImageKit"
                      className="rounded-md p-1.5 text-danger/80 hover:bg-danger/10 hover:text-danger transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
