"use client";

import React, { useState, useRef } from "react";
import type { ProjectImage } from "@/types/project";
import { Spinner } from "@/components/ui";

/* ─────────────────────────────────────────────────────────────
 * 1. CHALLENGE SECTION (Thách thức dự án & Ảnh khảo sát)
 * ───────────────────────────────────────────────────────────── */
export interface ProjectChallengeSectionProps {
  challenge?: string | null;
  challengeImage?: string | null;
  interactive?: boolean;
  onChallengeChange?: (val: string) => void;
  onImageUpload?: (file: File) => Promise<void> | void;
  onImageRemove?: () => void;
  isUploadingImage?: boolean;
  className?: string;
}

export function ProjectChallengeSection({
  challenge,
  challengeImage,
  interactive = false,
  onChallengeChange,
  onImageUpload,
  onImageRemove,
  isUploadingImage = false,
  className = "",
}: ProjectChallengeSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khi ở chế độ tĩnh (Read-only / Reader) và không có dữ liệu
  if (!challenge && !challengeImage && !interactive) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    // Reset file input value to allow re-uploading same file if desired
    e.target.value = "";
  };

  return (
    <section
      aria-label="Thách thức dự án"
      className={`p-6 sm:p-8 space-y-4 bg-surface rounded-xl transition-all ${
        interactive
          ? "border border-dashed border-border/70 hover:border-primary/50 shadow-2xs"
          : "border border-border/60 shadow-2xs"
      } ${className}`}
    >
      {/* Header Bar with Title & Edit Toggle */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-text flex items-center gap-2">
          <span>Thách thức dự án</span>
          {interactive && isEditing && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary uppercase">
              Chế độ chỉnh sửa
            </span>
          )}
        </h2>

        {interactive && (
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              isEditing
                ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white"
            }`}
            title={
              isEditing
                ? "Hoàn tất chỉnh sửa và xem trước"
                : "Chỉnh sửa trực tiếp mô tả và ảnh thách thức"
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
                <span>Sửa thách thức</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden File Input for Image Upload */}
      {interactive && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* Challenge Content */}
      {interactive && isEditing ? (
        /* Edit Mode */
        <div className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-text mb-1.5 block">
              Mô tả bài toán / Thách thức dự án:
            </label>
            <textarea
              value={challenge ?? ""}
              onChange={(e) => onChallengeChange?.(e.target.value)}
              rows={4}
              placeholder="VD: Bán đảo Sơn Trà có địa hình phức tạp với rừng nguyên sinh và hệ sinh thái nhạy cảm..."
              className="w-full text-sm text-text bg-surface-muted/30 rounded-lg border border-border p-3 focus:border-primary focus:outline-none transition-all leading-relaxed placeholder:text-text-muted/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text mb-1.5 block">
              Ảnh minh hoạ thách thức:
            </label>
            {challengeImage ? (
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-surface-muted shadow-2xs group/img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={challengeImage}
                  alt="Thách thức dự án"
                  className="max-h-72 w-full object-cover"
                />
                {isUploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white z-10">
                    <Spinner size="md" />
                    <span className="ml-2 text-xs font-medium">Đang tải ảnh lên...</span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white/95 text-text hover:bg-white shadow-md cursor-pointer backdrop-blur-xs transition-transform hover:scale-105"
                  >
                    Thay ảnh
                  </button>
                  {onImageRemove && (
                    <button
                      type="button"
                      onClick={onImageRemove}
                      disabled={isUploadingImage}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-danger text-white hover:bg-danger/90 shadow-md cursor-pointer transition-transform hover:scale-105"
                    >
                      Xoá ảnh
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-border/80 hover:border-primary hover:bg-primary/5 text-text-muted hover:text-primary transition-all cursor-pointer"
              >
                {isUploadingImage ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs">Đang tải ảnh lên...</span>
                  </div>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mb-1.5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-text">
                      + Tải ảnh minh hoạ thách thức từ máy tính
                    </span>
                    <span className="text-[10px] text-text-muted mt-0.5">
                      Hỗ trợ JPG, PNG, WebP (tối đa 10MB)
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Preview / Read-only Mode */
        <div className="space-y-4">
          {challenge ? (
            <p
              onClick={() => interactive && setIsEditing(true)}
              className={`text-sm text-text-muted leading-relaxed whitespace-pre-line ${
                interactive
                  ? "cursor-pointer hover:text-text hover:bg-surface-muted/40 p-2 -m-2 rounded-lg transition-all"
                  : ""
              }`}
              title={interactive ? "Nhấn để chỉnh sửa thách thức này" : undefined}
            >
              {challenge}
            </p>
          ) : interactive ? (
            <div
              onClick={() => setIsEditing(true)}
              className="p-4 rounded-lg border border-dashed border-border/70 text-center text-xs text-text-muted cursor-pointer hover:border-primary hover:text-primary transition-all bg-surface-muted/20"
            >
              Chưa có mô tả thách thức dự án. Nhấn vào đây để thêm nội dung thách thức.
            </div>
          ) : null}

          {challengeImage ? (
            <div className="relative overflow-hidden rounded-lg border border-border/70 bg-surface-muted shadow-2xs group/preview-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={challengeImage}
                alt="Thách thức dự án"
                className="max-h-80 w-full object-cover"
              />
              {interactive && (
                <div className="absolute top-3 right-3 opacity-0 group-hover/preview-img:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/90 text-text hover:bg-white shadow-md cursor-pointer"
                  >
                    Sửa ảnh
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 2. GALLERY SECTION (Thư viện ảnh công trình - Kéo thả gọn gàng)
 * ───────────────────────────────────────────────────────────── */
export interface ProjectGallerySectionProps {
  galleryImages?: ProjectImage[];
  interactive?: boolean;
  onManageClick?: () => void;
  className?: string;
}

export function ProjectGallerySection({
  galleryImages = [],
  interactive = false,
  onManageClick,
  className = "",
}: ProjectGallerySectionProps) {
  const [viewMode, setViewMode] = useState<"slider" | "grid">("slider");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Drag-to-scroll refs and state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll bounds to enable/disable navigation buttons
  const checkScrollBounds = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Update scroll bounds on mount or image count change
  React.useEffect(() => {
    checkScrollBounds();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollBounds);
    window.addEventListener("resize", checkScrollBounds);
    return () => {
      el.removeEventListener("scroll", checkScrollBounds);
      window.removeEventListener("resize", checkScrollBounds);
    };
  }, [galleryImages, viewMode]);

  // Arrow navigation scroll handler
  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(300, el.clientWidth * 0.7);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    dragDistanceRef.current = Math.abs(walk);
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Card click: only trigger lightbox if not dragging
  const handleCardClick = (index: number) => {
    if (dragDistanceRef.current < 6) {
      setSelectedImageIndex(index);
    }
  };

  // Lightbox keyboard navigation (ESC, ArrowLeft, ArrowRight)
  React.useEffect(() => {
    if (selectedImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1,
        );
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) =>
          prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0,
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, galleryImages.length]);

  if ((!galleryImages || galleryImages.length === 0) && !interactive) return null;

  return (
    <section
      aria-label="Thư viện ảnh dự án"
      className={`p-5 sm:p-7 space-y-4 bg-surface-muted/20 rounded-xl border border-border/60 ${className}`}
    >
      {/* ── Section Header Toolbar ─────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-text">
              Thư viện ảnh dự án ({galleryImages.length})
            </h2>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Bộ sưu tập hình ảnh thực tế từ quá trình triển khai dự án (kéo thả chuột để lướt xem).
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View Mode Toggle: Slider vs Grid */}
          {galleryImages.length > 0 && (
            <div className="flex items-center rounded-lg border border-border bg-surface p-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("slider")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === "slider"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-text-muted hover:text-text"
                }`}
                title="Dạng trượt ngang kéo thả (gọn gàng)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Trượt ngang</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-text-muted hover:text-text"
                }`}
                title="Dạng lưới mở rộng"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Lưới</span>
              </button>
            </div>
          )}

          {/* Slider Prev / Next Arrows */}
          {viewMode === "slider" && galleryImages.length > 2 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface text-text transition-all hover:bg-surface-muted hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                title="Lướt sang trái"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface text-text transition-all hover:bg-surface-muted hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                title="Lướt sang phải"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Quick link to Tab Gallery in Interactive Mode */}
          {interactive && onManageClick && (
            <button
              type="button"
              onClick={onManageClick}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white cursor-pointer shadow-2xs"
            >
              <span>Sắp xếp & Quản lý</span>
              <span className="text-xs">→</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Gallery Body ───────────────────────────────────── */}
      {galleryImages && galleryImages.length > 0 ? (
        viewMode === "slider" ? (
          /* SLIDER MODE: Drag-to-scroll horizontal filmstrip */
          <div className="relative group/gallery">
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`flex gap-4 overflow-x-auto pb-3 pt-1 px-1 scroll-smooth select-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              } [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-text-muted/40 [&::-webkit-scrollbar-track]:bg-surface-muted/30`}
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
              }}
            >
              {galleryImages.map((img, index) => {
                const isLarge = img.size === "large";
                return (
                  <figure
                    key={img.id || index}
                    onClick={() => handleCardClick(index)}
                    className={`group/card relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs transition-all duration-200 hover:border-primary/60 hover:shadow-md shrink-0 ${
                      isLarge ? "w-80 sm:w-96" : "w-64 sm:w-72"
                    }`}
                  >
                    {/* Image Box */}
                    <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.caption || `Ảnh ${index + 1}`}
                        draggable={false}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                          #{index + 1}
                        </span>
                        {isLarge && (
                          <span className="rounded-md bg-primary/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                            Cỡ rộng
                          </span>
                        )}
                      </div>

                      {/* Zoom Indicator on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-text shadow-md backdrop-blur-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                          Xem phóng to
                        </span>
                      </div>
                    </div>

                    {/* Caption Bar */}
                    <figcaption className="border-t border-border/60 bg-surface px-3 py-2 text-xs text-text transition-colors group-hover/card:bg-surface-muted/30">
                      {img.caption ? (
                        <p className="line-clamp-1 font-medium text-text" title={img.caption}>
                          {img.caption}
                        </p>
                      ) : (
                        <p className="text-[11px] italic text-text-muted">
                          (Chưa có chú thích ảnh)
                        </p>
                      )}
                    </figcaption>
                  </figure>
                );
              })}
            </div>

            {/* Subtle drag hint underneath */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-text-muted px-1">
              <span className="flex items-center gap-1">
                <span>⇄</span>
                <span>Nhấn giữ và kéo chuột hoặc vuốt để xem ảnh tiếp theo</span>
              </span>
              <span>Tổng cộng {galleryImages.length} ảnh</span>
            </div>
          </div>
        ) : (
          /* GRID MODE: Expanded multi-column gallery view */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {galleryImages.map((img, index) => {
              const isLarge = img.size === "large";
              return (
                <figure
                  key={img.id || index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`group/gridcard relative overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs transition-all duration-200 hover:border-primary/60 hover:shadow-md cursor-pointer ${
                    isLarge ? "sm:col-span-2 md:col-span-2" : "col-span-1"
                  }`}
                >
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.caption || `Ảnh ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/gridcard:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  {img.caption && (
                    <figcaption className="border-t border-border/60 bg-surface p-2.5 text-xs text-text">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        )
      ) : interactive ? (
        <div
          onClick={onManageClick}
          className="p-8 rounded-xl border-2 border-dashed border-border text-center text-xs text-text-muted cursor-pointer hover:border-primary hover:text-primary transition-all bg-surface"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="font-semibold text-text">Chưa có ảnh trong thư viện dự án</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Nhấn vào đây để mở Tab Gallery và tải ảnh dự án lên.
          </p>
        </div>
      ) : null}

      {/* ── Lightbox Preview Modal ───────────────────────────────── */}
      {selectedImageIndex !== null && galleryImages[selectedImageIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div
            className="relative flex flex-col items-center max-w-5xl w-full max-h-[92vh] bg-surface rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between w-full px-5 py-3 border-b border-border bg-surface">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary text-white">
                  #{selectedImageIndex + 1} / {galleryImages.length}
                </span>
                <span className="text-xs text-text-muted">
                  {galleryImages[selectedImageIndex].size === "large" ? "Ảnh kích thước lớn" : "Ảnh kích thước thường"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImageIndex(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors cursor-pointer"
                title="Đóng (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="relative flex items-center justify-center w-full flex-1 bg-black/95 min-h-[300px] max-h-[70vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryImages[selectedImageIndex].url}
                alt={galleryImages[selectedImageIndex].caption || "Project image"}
                className="max-h-[70vh] max-w-full object-contain select-none"
              />

              {/* Prev / Next Modal Buttons */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) =>
                        prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1,
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-primary transition-all cursor-pointer shadow-lg backdrop-blur-xs"
                    title="Ảnh trước (Mũi tên trái)"
                  >
                    ❮
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) =>
                        prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0,
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-primary transition-all cursor-pointer shadow-lg backdrop-blur-xs"
                    title="Ảnh sau (Mũi tên phải)"
                  >
                    ❯
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer Caption */}
            {galleryImages[selectedImageIndex].caption && (
              <div className="w-full p-4 text-center border-t border-border bg-surface">
                <p className="text-sm font-medium text-text">
                  {galleryImages[selectedImageIndex].caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
