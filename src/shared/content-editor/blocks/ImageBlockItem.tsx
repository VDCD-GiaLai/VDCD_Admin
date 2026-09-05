import React, { useState } from "react";
import { FormInput } from "@/components/ui";
import { useToast } from "@/components/ui";
import { validateImageFile, type UploadResult } from "@/lib/upload";
import { useDocumentUpload } from "../media/DocumentUploadContext";
import type { ImageBlock } from "../model/document.types";

export interface ImageBlockItemProps {
  block: ImageBlock;
  onChange: (updated: ImageBlock) => void;
}

export function ImageBlockItem({ block, onChange }: ImageBlockItemProps) {
  const { toast } = useToast();
  const { subfolder, uploadDocumentImage } = useDocumentUpload();
  const [mode, setMode] = useState<"upload" | "url">(
    block.fileId || !block.url ? "upload" : "url",
  );
  const [uploading, setUploading] = useState(false);
  const [prevBlockUrl, setPrevBlockUrl] = useState(block.url);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  if (block.url !== prevBlockUrl) {
    setPrevBlockUrl(block.url);
    setLocalPreview(null);
    setImageLoadError(false);
  }

  const displayUrl = localPreview ?? block.url;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast({
        title: "File không hợp lệ",
        description: validationError,
        color: "danger",
      });
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setLocalPreview(tempUrl);
    setImageLoadError(false);
    setUploading(true);

    try {
      const result: UploadResult = await uploadDocumentImage(file);
      setLocalPreview(result.url);
      onChange({
        ...block,
        url: result.url,
        fileId: result.fileId,
      });
      toast({ title: "Tải ảnh lên thành công", color: "success" });
    } catch {
      setLocalPreview(null);
      toast({ title: "Tải ảnh lên thất bại", color: "danger" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-text-muted">
          Hình ảnh
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted p-0.5">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all ${
              mode === "upload"
                ? "bg-surface font-semibold text-primary shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Tải ảnh lên
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all ${
              mode === "url"
                ? "bg-surface font-semibold text-primary shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
              <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
            </svg>
            Nhập URL
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface-muted">
        {displayUrl && !imageLoadError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={displayUrl}
            alt={block.alt || "Ảnh minh hoạ"}
            className="h-44 w-full object-cover transition-opacity duration-200"
            onError={() => setImageLoadError(true)}
            onLoad={() => setImageLoadError(false)}
          />
        ) : displayUrl && imageLoadError ? (
          <div className="flex h-36 w-full flex-col items-center justify-center gap-1.5 p-4 text-center text-text-muted">
            <p className="text-xs font-medium text-danger">Không thể tải xem trước ảnh</p>
            <p className="text-[11px] text-text-muted">Vui lòng kiểm tra lại liên kết hình ảnh.</p>
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center text-xs text-text-muted">
            Chưa có hình ảnh được chọn
          </div>
        )}
      </div>

      {/* Input controls */}
      {mode === "upload" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-primary"
              >
                <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              {uploading ? "Đang tải lên..." : block.url ? "Thay đổi ảnh" : "Chọn ảnh tải lên"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            <span className="text-[11px] text-text-muted">
              JPG, PNG, WebP, GIF • Tối đa 10MB • Thư mục: {subfolder}
            </span>
          </div>
          {block.url && (
            <p className="truncate text-[11px] text-text-muted">
              <span className="font-medium text-text">URL hiện tại:</span> {block.url}
            </p>
          )}
        </div>
      ) : (
        <FormInput
          label="Đường dẫn URL ảnh"
          isRequired
          placeholder="https://ik.imagekit.io/vdcd/.../example.jpg"
          value={block.url}
          onChange={(e) => {
            setImageLoadError(false);
            onChange({
              ...block,
              url: e.target.value,
              fileId: null,
            });
          }}
        />
      )}

      {/* Alt & Caption */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormInput
          label="Mô tả ảnh (Alt text)"
          placeholder="Mô tả nội dung hình ảnh..."
          value={block.alt}
          onChange={(e) => onChange({ ...block, alt: e.target.value })}
        />
        <FormInput
          label="Chú thích ảnh (Caption)"
          placeholder="VD: Hình 1: Mô hình hoạt động"
          value={block.caption ?? ""}
          onChange={(e) =>
            onChange({
              ...block,
              caption: e.target.value ? e.target.value : null,
            })
          }
        />
      </div>
    </div>
  );
}
