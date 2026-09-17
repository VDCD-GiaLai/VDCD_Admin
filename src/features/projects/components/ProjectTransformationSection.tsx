"use client";

import React, { useState, useRef } from "react";
import { Spinner } from "@/components/ui";

export interface ProjectTransformationSectionProps {
  transformationBefore?: string | null;
  transformationAfter?: string | null;
  interactive?: boolean;
  onBeforeUpload?: (file: File) => Promise<void> | void;
  onAfterUpload?: (file: File) => Promise<void> | void;
  onBeforeRemove?: () => void;
  onAfterRemove?: () => void;
  isUploadingBefore?: boolean;
  isUploadingAfter?: boolean;
  className?: string;
}

export function ProjectTransformationSection({
  transformationBefore,
  transformationAfter,
  interactive = false,
  onBeforeUpload,
  onAfterUpload,
  onBeforeRemove,
  onAfterRemove,
  isUploadingBefore = false,
  isUploadingAfter = false,
  className = "",
}: ProjectTransformationSectionProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  if (!transformationBefore && !transformationAfter && !interactive) {
    return null;
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    uploader?: (file: File) => Promise<void> | void,
  ) => {
    const file = e.target.files?.[0];
    if (file && uploader) {
      uploader(file);
    }
    e.target.value = "";
  };

  return (
    <section
      aria-label="Chuyển đổi số & Giải pháp công nghệ"
      className={`p-6 sm:p-8 space-y-6 bg-surface rounded-xl transition-all ${
        interactive
          ? "border border-dashed border-border/70 hover:border-primary/50 shadow-2xs"
          : ""
      } ${className}`}
    >
      {/* Hidden file inputs for interactive upload */}
      {interactive && (
        <>
          <input
            ref={beforeInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, onBeforeUpload)}
          />
          <input
            ref={afterInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, onAfterUpload)}
          />
        </>
      )}

      {/* Section Header with Section 02 badge */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-6 items-center rounded-md bg-[#ca2a30]/10 px-2 font-mono text-xs font-bold text-[#ca2a30]">
            02
          </span>
          <div>
            <h3 className="text-lg sm:text-xl font-bold uppercase text-[#011A42] dark:text-white font-mono tracking-tight">
              Chuyển đổi số & Giải pháp công nghệ
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              So sánh trực quan hiện trạng trước khi số hóa và giải pháp công nghệ ứng dụng trên công trình.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Before / After Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── CARD 1: HIỆN TRẠNG TRƯỚC SỐ HÓA ── */}
        <div className="rounded-xl border border-border/80 bg-surface-muted/20 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono uppercase tracking-wider">
              <span>📷</span>
              <span>Hiện trạng trước số hóa</span>
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {transformationBefore ? (
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-surface shadow-2xs group/img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={transformationBefore}
                  alt="Hiện trạng trước số hóa"
                  className="w-full h-56 sm:h-64 object-cover cursor-pointer transition-transform duration-300 group-hover/img:scale-102"
                  onClick={() =>
                    setSelectedImage({
                      url: transformationBefore,
                      title: "Hiện trạng trước số hóa",
                    })
                  }
                />
                {isUploadingBefore && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white z-10">
                    <Spinner size="md" />
                    <span className="ml-2 text-xs font-medium">Đang tải ảnh...</span>
                  </div>
                )}
                {interactive && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 group-hover/img:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => beforeInputRef.current?.click()}
                      disabled={isUploadingBefore}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/95 text-text hover:bg-white shadow-md cursor-pointer backdrop-blur-xs transition-transform hover:scale-105"
                    >
                      Thay ảnh
                    </button>
                    {onBeforeRemove && (
                      <button
                        type="button"
                        onClick={onBeforeRemove}
                        disabled={isUploadingBefore}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-danger text-white hover:bg-danger/90 shadow-md cursor-pointer transition-transform hover:scale-105"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : interactive ? (
              <button
                type="button"
                onClick={() => beforeInputRef.current?.click()}
                disabled={isUploadingBefore}
                className="w-full h-56 flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-border/80 hover:border-primary hover:bg-primary/5 text-text-muted hover:text-primary transition-all cursor-pointer"
              >
                {isUploadingBefore ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs">Đang tải ảnh...</span>
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
                      + Tải ảnh hiện trạng trước số hóa
                    </span>
                    <span className="text-[10px] text-text-muted mt-0.5">
                      JPG, PNG, WebP (tối đa 10MB)
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div className="h-44 flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-surface-muted/30 text-xs text-text-muted italic">
                (Chưa có ảnh hiện trạng trước số hóa)
              </div>
            )}
          </div>
          <p className="text-[11px] text-text-muted text-center italic">
            Hiện trạng công trình trước khi can thiệp công nghệ / số hóa
          </p>
        </div>

        {/* ── CARD 2: GIẢI PHÁP CÔNG NGHỆ ỨNG DỤNG ── */}
        <div className="rounded-xl border border-border/80 bg-surface-muted/20 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider">
              <span>🚀</span>
              <span>Giải pháp công nghệ ứng dụng</span>
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {transformationAfter ? (
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-surface shadow-2xs group/img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={transformationAfter}
                  alt="Giải pháp công nghệ ứng dụng"
                  className="w-full h-56 sm:h-64 object-cover cursor-pointer transition-transform duration-300 group-hover/img:scale-102"
                  onClick={() =>
                    setSelectedImage({
                      url: transformationAfter,
                      title: "Giải pháp công nghệ ứng dụng",
                    })
                  }
                />
                {isUploadingAfter && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white z-10">
                    <Spinner size="md" />
                    <span className="ml-2 text-xs font-medium">Đang tải ảnh...</span>
                  </div>
                )}
                {interactive && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 group-hover/img:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => afterInputRef.current?.click()}
                      disabled={isUploadingAfter}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/95 text-text hover:bg-white shadow-md cursor-pointer backdrop-blur-xs transition-transform hover:scale-105"
                    >
                      Thay ảnh
                    </button>
                    {onAfterRemove && (
                      <button
                        type="button"
                        onClick={onAfterRemove}
                        disabled={isUploadingAfter}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-danger text-white hover:bg-danger/90 shadow-md cursor-pointer transition-transform hover:scale-105"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : interactive ? (
              <button
                type="button"
                onClick={() => afterInputRef.current?.click()}
                disabled={isUploadingAfter}
                className="w-full h-56 flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-border/80 hover:border-primary hover:bg-primary/5 text-text-muted hover:text-primary transition-all cursor-pointer"
              >
                {isUploadingAfter ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs">Đang tải ảnh...</span>
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
                      + Tải ảnh giải pháp công nghệ sau số hóa
                    </span>
                    <span className="text-[10px] text-text-muted mt-0.5">
                      JPG, PNG, WebP (tối đa 10MB)
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div className="h-44 flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-surface-muted/30 text-xs text-text-muted italic">
                (Chưa có ảnh giải pháp công nghệ ứng dụng)
              </div>
            )}
          </div>
          <p className="text-[11px] text-text-muted text-center italic">
            Kết quả số hóa / Mô hình công nghệ 3D / Bản đồ giải pháp
          </p>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative flex flex-col items-center max-w-5xl w-full max-h-[92vh] bg-surface rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full px-5 py-3 border-b border-border bg-surface">
              <span className="text-sm font-bold text-text">
                {selectedImage.title}
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors cursor-pointer"
                title="Đóng (Esc)"
              >
                ✕
              </button>
            </div>
            <div className="relative flex items-center justify-center w-full flex-1 bg-black/95 min-h-[300px] max-h-[75vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-[75vh] max-w-full object-contain select-none"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
