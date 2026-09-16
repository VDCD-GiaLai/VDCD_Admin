"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui";
import { usePermission } from "@/hooks/usePermission";
import {
  useGalleryImagesInfinite,
  useDeleteGalleryImage,
  PRESET_FOLDERS,
  getDateSearchQuery,
  type DateFilter,
  type GalleryFile,
} from "@/hooks/useGallery";
import {
  MediaSidebar,
  MediaToolbar,
  MediaGrid,
  MediaTable,
  MediaUploadDrawer,
  MediaDetailModal,
  MediaDeleteDialog,
} from "@/features/media/components";

export default function MediaManagementPage() {
  const { toast } = useToast();
  const canDelete = usePermission("organization:update"); // superadmin has full access

  // State
  const [currentFolder, setCurrentFolder] = useState<string>("/vdcd");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Modals state
  const [detailImage, setDetailImage] = useState<GalleryFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryFile | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build searchQuery combining date and name
  const searchQuery = useMemo(() => {
    const parts: string[] = [];
    const dateQuery = getDateSearchQuery(dateFilter);
    if (dateQuery) parts.push(dateQuery);
    if (debouncedSearch) {
      const safeName = debouncedSearch.replace(/"/g, '\\"');
      parts.push(`name : "${safeName}"`);
    }
    return parts.length > 0 ? parts.join(" AND ") : undefined;
  }, [dateFilter, debouncedSearch]);

  // Gallery query
  const {
    data: infiniteData,
    isLoading,
    isError,
    error,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGalleryImagesInfinite(currentFolder, {
    searchQuery,
    pageSize: 30,
  });

  // Delete mutation
  const deleteMutation = useDeleteGalleryImage();

  // Flatten items
  const images = useMemo(
    () => infiniteData?.pages.flatMap((p) => p) ?? [],
    [infiniteData],
  );

  // Current folder info
  const currentFolderLabel = useMemo(() => {
    return PRESET_FOLDERS.find((f) => f.path === currentFolder)?.label ?? "Thư mục ảnh";
  }, [currentFolder]);

  // Handlers
  const handleCopyUrl = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Đã sao chép liên kết ảnh",
          description: "URL đã được lưu vào clipboard",
          color: "success",
        });
      } catch {
        toast({
          title: "Không thể sao chép liên kết",
          color: "danger",
        });
      }
    },
    [toast],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;

    deleteMutation.mutate(deleteTarget.fileId, {
      onSuccess: () => {
        toast({
          title: "Đã xóa ảnh thành công",
          description: `Tệp "${deleteTarget.name}" đã được xóa khỏi ImageKit`,
          color: "success",
        });
        setDeleteTarget(null);
        if (detailImage?.fileId === deleteTarget.fileId) {
          setDetailImage(null);
        }
      },
      onError: (err) => {
        toast({
          title: "Không thể xóa ảnh",
          description: err.message || "Vui lòng thử lại sau",
          color: "danger",
        });
      },
    });
  }, [deleteTarget, detailImage, deleteMutation, toast]);

  const handleUploadSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-surface-muted/20">
      {/* Upload drawer */}
      <MediaUploadDrawer
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultFolder={currentFolder}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Main layout: Sidebar + Gallery content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left folder sidebar */}
        <MediaSidebar
          currentFolder={currentFolder}
          onSelectFolder={(path) => {
            setCurrentFolder(path);
          }}
        />

        {/* Right main area */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
          {/* Toolbar */}
          <MediaToolbar
            currentFolderLabel={currentFolderLabel}
            totalCount={images.length}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenUpload={() => setIsUploadOpen((prev) => !prev)}
            onRefresh={() => refetch()}
          />

          {/* Gallery View (Grid / Table) with internal scroll */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === "grid" ? (
              <MediaGrid
                images={images}
                isLoading={isLoading}
                isError={isError}
                errorMessage={error?.message}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                onFetchNextPage={fetchNextPage}
                onSelectImage={(img) => setDetailImage(img)}
                onCopyUrl={handleCopyUrl}
                onDeleteImage={(img) => setDeleteTarget(img)}
                onRetry={() => refetch()}
                onOpenUpload={() => setIsUploadOpen(true)}
                searchTerm={debouncedSearch}
                dateFilter={dateFilter}
                canDelete={canDelete}
              />
            ) : (
              <MediaTable
                images={images}
                isLoading={isLoading}
                isError={isError}
                errorMessage={error?.message}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                onFetchNextPage={fetchNextPage}
                onSelectImage={(img) => setDetailImage(img)}
                onCopyUrl={handleCopyUrl}
                onDeleteImage={(img) => setDeleteTarget(img)}
                onRetry={() => refetch()}
                onOpenUpload={() => setIsUploadOpen(true)}
                searchTerm={debouncedSearch}
                dateFilter={dateFilter}
                canDelete={canDelete}
              />
            )}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      <MediaDetailModal
        image={detailImage}
        isOpen={Boolean(detailImage)}
        onClose={() => setDetailImage(null)}
        onDelete={(img) => setDeleteTarget(img)}
        canDelete={canDelete}
      />

      {/* Delete Confirmation Dialog */}
      <MediaDeleteDialog
        image={deleteTarget}
        isOpen={Boolean(deleteTarget)}
        isLoading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
