"use client";

import React, { useState, useRef, useCallback } from "react";
import { AppButton, Spinner, useToast } from "@/components/ui";
import {
  uploadImage,
  validateImageFile,
  type UploadResult,
  type UploadFolder,
} from "@/lib/upload";

const UPLOAD_FOLDER_OPTIONS: { label: string; value: UploadFolder }[] = [
  { label: "Hình ảnh chung (/vdcd/images)", value: "image" },
  { label: "Slides (/vdcd/slides)", value: "slide" },
  { label: "Thumbnails (/vdcd/thumbnails)", value: "thumbnail" },
  { label: "Đối tác (/vdcd/partners)", value: "partner" },
  { label: "Bài viết (/vdcd/articles)", value: "article" },
  { label: "Chương trình (/vdcd/programs)", value: "program" },
  { label: "Giải pháp (/vdcd/solutions)", value: "solution" },
  { label: "Dự án (/vdcd/projects)", value: "project" },
];

interface MediaUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFolder?: string;
  onUploadSuccess: (result: UploadResult) => void;
}

export function MediaUploadDrawer({
  isOpen,
  onClose,
  defaultFolder,
  onUploadSuccess,
}: MediaUploadDrawerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map path like "/vdcd/slides" to upload folder
  const initialFolder: UploadFolder =
    defaultFolder?.includes("slide") ? "slide" :
    defaultFolder?.includes("thumbnail") ? "thumbnail" :
    defaultFolder?.includes("partner") ? "partner" :
    defaultFolder?.includes("article") ? "article" :
    defaultFolder?.includes("program") ? "program" :
    defaultFolder?.includes("solution") ? "solution" :
    defaultFolder?.includes("project") ? "project" : "image";

  const [selectedFolder, setSelectedFolder] = useState<UploadFolder>(initialFolder);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      toast({ title: "Tệp không hợp lệ", description: error, color: "danger" });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const result = await uploadImage(selectedFile, selectedFolder);
      toast({
        title: "Tải lên thành công",
        description: `Đã lưu ảnh "${result.name}"`,
        color: "success",
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      onUploadSuccess(result);
    } catch {
      toast({
        title: "Tải lên thất bại",
        description: "Vui lòng kiểm tra lại kết nối mạng hoặc thử lại",
        color: "danger",
      });
    } finally {
      setUploading(false);
    }
  }, [selectedFile, selectedFolder, toast, onUploadSuccess]);

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="border-b border-border bg-surface-muted/30 p-4 transition-all">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-surface p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text">
                Tải ảnh mới lên hệ thống
              </h3>
              <p className="text-xs text-text-muted">
                Hỗ trợ định dạng JPG, PNG, WebP, GIF (tối đa 10MB)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-muted hover:text-text"
          >
            ✕
          </button>
        </div>

        {/* Folder selection */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-text">
            Thư mục đích
          </label>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value as UploadFolder)}
            className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {UPLOAD_FOLDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
          }}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border bg-surface-muted/20 hover:border-primary/50"
          }`}
        >
          {previewUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative max-h-48 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 w-auto object-contain"
                />
              </div>
              <p className="text-xs font-medium text-text">
                {selectedFile?.name} ({(selectedFile?.size ?? 0) > 1024 * 1024
                  ? `${((selectedFile?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB`
                  : `${((selectedFile?.size ?? 0) / 1024).toFixed(1)} KB`})
              </p>
              <div className="flex items-center gap-2">
                <AppButton
                  variant="solid"
                  color="primary"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Spinner size="sm" className="mr-1.5" />
                      Đang tải lên...
                    </>
                  ) : (
                    "Bắt đầu tải lên"
                  )}
                </AppButton>
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  disabled={uploading}
                >
                  Chọn file khác
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="mb-2 h-10 w-10 text-text-muted/60"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                />
              </svg>
              <p className="text-xs font-medium text-text">
                Kéo thả file ảnh vào đây, hoặc click để chọn file
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                JPG, PNG, WebP, GIF • Tối đa 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <AppButton
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn file từ máy tính
              </AppButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
