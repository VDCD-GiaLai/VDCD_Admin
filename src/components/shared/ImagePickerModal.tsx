"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Modal";
import { AppButton, Spinner, useToast } from "@/components/ui";
import {
  useGalleryImagesInfinite,
  type GalleryFile,
} from "@/hooks/useGallery";
import {
  uploadImage,
  validateImageFile,
  type UploadResult,
  type UploadFolder,
  type UploadImageOptions,
} from "@/lib/upload";

// ─── Types ───────────────────────────────────────────────────

export interface ImagePickerResult {
  url: string;
  fileId: string;
  name?: string;
  filePath?: string;
}

export interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: ImagePickerResult) => void;
  /** Default folder to browse in gallery */
  defaultFolder?: string;
  /** Upload folder type for new uploads */
  uploadFolder?: UploadFolder;
  /** Upload options for new uploads */
  uploadOptions?: UploadImageOptions;
  /** Title of the modal */
  title?: string;
}

// ─── Predefined folders ──────────────────────────────────────

const PRESET_FOLDERS = [
  { label: "Tất cả", path: "/vdcd" },
  { label: "Hình ảnh chung", path: "/vdcd/images" },
  { label: "Slides", path: "/vdcd/slides" },
  { label: "Thumbnails", path: "/vdcd/thumbnails" },
  { label: "Đối tác", path: "/vdcd/partners" },
  { label: "Bài viết", path: "/vdcd/articles" },
  { label: "Chương trình", path: "/vdcd/programs" },
  { label: "Giải pháp", path: "/vdcd/solutions" },
  { label: "Dự án", path: "/vdcd/projects" },
  { label: "Đính kèm", path: "/vdcd/attachments" },
];

type PickerTab = "gallery" | "upload";

// ─── Date filter presets ─────────────────────────────────────

type DateFilter = "all" | "today" | "7days" | "30days" | "90days" | "year";

const DATE_FILTERS: { label: string; value: DateFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày", value: "7days" },
  { label: "30 ngày", value: "30days" },
  { label: "3 tháng", value: "90days" },
  { label: "1 năm", value: "year" },
];

function getDateSearchQuery(filter: DateFilter): string | undefined {
  if (filter === "all") return undefined;
  const now = new Date();
  let from: Date;
  switch (filter) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7days":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30days":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90days":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return undefined;
  }
  return `createdAt >= "${from.toISOString()}"`;
}

// ═════════════════════════════════════════════════════════════
//  ImagePickerModal
// ═════════════════════════════════════════════════════════════

export function ImagePickerModal({
  isOpen,
  onClose,
  onSelect,
  defaultFolder = "/vdcd",
  uploadFolder = "image",
  uploadOptions,
  title = "Chọn ảnh",
}: ImagePickerModalProps) {
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<PickerTab>("gallery");
  const [currentFolder, setCurrentFolder] = useState(defaultFolder);
  const [selectedImage, setSelectedImage] = useState<GalleryFile | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll sentinel ref for infinite scroll
  const scrollSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build search query (date filter + name search)
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

  // Reset state when modal opens or defaultFolder changes
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setActiveTab("gallery");
      setCurrentFolder(defaultFolder);
      setSelectedImage(null);
      setDateFilter("all");
      setSearchTerm("");
      setDebouncedSearch("");
      setUploadPreview(null);
    }
  }

  // Query gallery images (infinite)
  const {
    data: infiniteData,
    isLoading: loadingImages,
    isError: isImagesError,
    error: imagesError,
    refetch: refetchImages,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGalleryImagesInfinite(currentFolder, {
    searchQuery,
    enabled: isOpen && activeTab === "gallery",
  });

  // Flatten pages into a single array
  const images = useMemo(
    () => infiniteData?.pages.flatMap((p) => p) ?? [],
    [infiniteData],
  );


  // ─── Infinite scroll observer ──────────────────────────────

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "200px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ─── Gallery Actions ───────────────────────────────────────

  const handleFolderChange = useCallback((path: string) => {
    setCurrentFolder(path);
    setSelectedImage(null);
  }, []);

  const handleSelectImage = useCallback((img: GalleryFile) => {
    setSelectedImage((prev) => (prev?.fileId === img.fileId ? null : img));
  }, []);

  const handleConfirmSelect = useCallback(() => {
    if (selectedImage) {
      onSelect({
        url: selectedImage.url,
        fileId: selectedImage.fileId,
        name: selectedImage.name,
        filePath: selectedImage.filePath,
      });
      onClose();
    }
  }, [selectedImage, onSelect, onClose]);

  // ─── Upload Actions ────────────────────────────────────────

  const processUpload = useCallback(
    async (file: File) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        toast({
          title: "File không hợp lệ",
          description: validationError,
          color: "danger",
        });
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setUploadPreview(objectUrl);
      setUploading(true);

      try {
        const result: UploadResult = await uploadImage(
          file,
          uploadFolder,
          uploadOptions,
        );
        toast({ title: "Upload thành công", color: "success" });

        // Auto-select the uploaded image
        onSelect({
          url: result.url,
          fileId: result.fileId,
          name: result.name,
          filePath: result.filePath,
        });
        onClose();
      } catch {
        toast({
          title: "Upload thất bại",
          description: "Vui lòng thử lại",
          color: "danger",
        });
        setUploadPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [uploadFolder, uploadOptions, toast, onSelect, onClose],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processUpload(file);
      // Reset input so the same file can be selected again
      if (e.target) e.target.value = "";
    },
    [processUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processUpload(file);
    },
    [processUpload],
  );

  // ─── Format helpers ────────────────────────────────────────

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

  // ─── Find current folder label ─────────────────────────────

  const currentFolderLabel =
    PRESET_FOLDERS.find((f) => f.path === currentFolder)?.label ??
    currentFolder.split("/").pop() ??
    "Thư mục";

  // ═════════════════════════════════════════════════════════════
  //  Render
  // ═════════════════════════════════════════════════════════════

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      placement="center"
      scrollBehavior="outside"
    >
      <ModalContent className="max-h-[85vh]">
        <ModalHeader>
          <div className="flex items-center gap-3">
            {/* Gallery icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-primary"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                clipRule="evenodd"
              />
            </svg>
            {title}
          </div>
        </ModalHeader>

        <ModalBody className="overflow-hidden p-0">
          {/* Tabs */}
          <div className="flex shrink-0 border-b border-border bg-surface-muted/50">
            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "gallery"
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5H3.5v-7.5z"
                  clipRule="evenodd"
                />
              </svg>
              Thư viện ảnh
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "upload"
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Tải ảnh mới
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "gallery" && (
            <div className="flex min-h-0 flex-1">
              {/* Sidebar - folder list */}
              <div className="w-48 shrink-0 overflow-y-auto border-r border-border bg-surface-muted/30 p-2">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Thư mục
                </p>
                <nav className="space-y-0.5">
                  {PRESET_FOLDERS.map((folder) => (
                    <button
                      key={folder.path}
                      type="button"
                      onClick={() => handleFolderChange(folder.path)}
                      className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                        currentFolder === folder.path
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-text-muted hover:bg-surface-muted hover:text-text"
                      }`}
                    >
                      {folder.label}
                    </button>
                  ))}

                </nav>
              </div>

              {/* Main content - image grid with scroll */}
              <div className="flex min-h-0 flex-1 flex-col">
                {/* Sticky header: folder name + date filter + search */}
                <div className="shrink-0 border-b border-border bg-surface px-4 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text">
                        {currentFolderLabel}
                      </h3>
                      {(loadingImages || isFetchingNextPage) && (
                        <Spinner size="sm" />
                      )}
                      <span className="text-xs text-text-muted">
                        {images.length > 0 ? `(${images.length} ảnh)` : ""}
                      </span>
                    </div>

                    {/* Search input */}
                    <div className="relative w-full sm:w-56">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
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
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên ảnh..."
                        className="w-full rounded-md border border-border bg-surface-muted/40 py-1 pl-8 pr-7 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text"
                          aria-label="Xóa tìm kiếm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date filter pills */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-text-muted">Lọc:</span>
                    {DATE_FILTERS.map((df) => (
                      <button
                        key={df.value}
                        type="button"
                        onClick={() => setDateFilter(df.value)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                          dateFilter === df.value
                            ? "bg-primary text-white shadow-sm"
                            : "bg-surface-muted text-text-muted hover:bg-surface-muted/80 hover:text-text"
                        }`}
                      >
                        {df.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable image area */}
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto p-4"
                  style={{ maxHeight: "calc(85vh - 260px)" }}
                >
                  {/* Loading (initial) */}
                  {loadingImages && (
                    <div className="flex h-64 items-center justify-center">
                      <Spinner size="lg" />
                    </div>
                  )}

                  {/* Error state */}
                  {!loadingImages && isImagesError && (
                    <div className="flex h-64 flex-col items-center justify-center text-center">
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
                      <p className="text-sm font-medium text-text">
                        Không thể tải danh sách ảnh
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {imagesError?.message || "Đã xảy ra lỗi kết nối"}
                      </p>
                      <AppButton
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => refetchImages()}
                      >
                        Thử lại
                      </AppButton>
                    </div>
                  )}

                  {/* Empty state */}
                  {!loadingImages && !isImagesError && images.length === 0 && (
                    <div className="flex h-64 flex-col items-center justify-center text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="mb-3 h-12 w-12 text-text-muted/40"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                        />
                      </svg>
                      <p className="text-sm text-text-muted">
                        {searchTerm
                          ? `Không tìm thấy ảnh nào khớp với "${searchTerm}"`
                          : dateFilter !== "all"
                            ? "Chưa có ảnh nào trong khoảng thời gian này"
                            : "Thư mục này hiện chưa có ảnh"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("upload")}
                        className="mt-2 text-sm font-medium text-primary hover:underline"
                      >
                        Tải ảnh mới lên →
                      </button>
                    </div>
                  )}

                  {/* Image grid */}
                  {!loadingImages && images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {images.map((img) => {
                        const isSelected =
                          selectedImage?.fileId === img.fileId;
                        return (
                          <button
                            key={img.fileId}
                            type="button"
                            onClick={() => handleSelectImage(img)}
                            className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {/* Image */}
                            <div className="aspect-square bg-surface-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.thumbnail || img.url}
                                alt={img.name}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>

                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}

                            {/* Hover overlay with info */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <p className="truncate text-xs font-medium text-white">
                                {img.name}
                              </p>
                              <p className="text-[10px] text-white/70">
                                {formatFileSize(img.size)}
                                {img.width && img.height
                                  ? ` • ${img.width}×${img.height}`
                                  : ""}
                                {img.createdAt
                                  ? ` • ${formatDate(img.createdAt)}`
                                  : ""}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Infinite scroll sentinel */}
                  <div ref={scrollSentinelRef} className="py-4 text-center">
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center gap-2">
                        <Spinner size="sm" />
                        <span className="text-xs text-text-muted">
                          Đang tải thêm...
                        </span>
                      </div>
                    )}
                    {!loadingImages &&
                      !isFetchingNextPage &&
                      !hasNextPage &&
                      images.length > 0 && (
                        <p className="text-xs text-text-muted">
                          — Đã hiển thị tất cả {images.length} ảnh —
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="flex items-center justify-center p-8" style={{ minHeight: 380 }}>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex w-full max-w-lg flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface-muted/30 hover:border-primary/50"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Spinner size="lg" />
                    <p className="text-sm font-medium text-text">
                      Đang tải ảnh lên...
                    </p>
                    {uploadPreview && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={uploadPreview}
                          alt="Preview"
                          className="h-32 w-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="mb-4 h-12 w-12 text-text-muted/50"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                      />
                    </svg>
                    <p className="mb-1 text-sm font-medium text-text">
                      Kéo thả ảnh vào đây
                    </p>
                    <p className="mb-4 text-xs text-text-muted">
                      hoặc click để chọn file
                    </p>
                    <AppButton
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Chọn file từ máy tính
                    </AppButton>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <p className="mt-4 text-[11px] text-text-muted">
                      JPG, PNG, WebP, GIF • Tối đa 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </ModalBody>

        {activeTab === "gallery" && (
          <ModalFooter>
            {/* Selected image info */}
            {selectedImage && (
              <div className="mr-auto flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage.thumbnail || selectedImage.url}
                    alt={selectedImage.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="max-w-[200px] truncate text-sm font-medium text-text">
                    {selectedImage.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatFileSize(selectedImage.size)}
                    {selectedImage.width && selectedImage.height
                      ? ` • ${selectedImage.width}×${selectedImage.height}`
                      : ""}
                    {selectedImage.createdAt
                      ? ` • ${formatDate(selectedImage.createdAt)}`
                      : ""}
                  </p>
                </div>
              </div>
            )}

            <AppButton variant="ghost" onClick={onClose}>
              Hủy
            </AppButton>
            <AppButton
              variant="solid"
              color="primary"
              onClick={handleConfirmSelect}
              disabled={!selectedImage}
            >
              Chọn ảnh này
            </AppButton>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
