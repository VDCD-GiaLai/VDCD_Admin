import React, { useRef, useCallback, useState } from "react";
import { validateImageFile, type UploadResult } from "@/lib/upload";
import { useDocumentUpload } from "../../media/DocumentUploadContext";
import { useSanitizedPaste } from "../../paste/useSanitizedPaste";
import { Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import type { ImageBlock } from "../../model/document.types";

export interface ImageBlockRendererProps {
  block: ImageBlock;
  editable?: boolean;
  onSelect?: () => void;
  onCaptionChange?: (caption: string) => void;
  onImageUpdate?: (url: string, fileId?: string) => void;
}

export function ImageBlockRenderer({
  block,
  editable,
  onSelect,
  onCaptionChange,
  onImageUpdate,
}: ImageBlockRendererProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [prevBlockUrl, setPrevBlockUrl] = useState(block.url);
  const [hasError, setHasError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { subfolder, uploadDocumentImage } = useDocumentUpload();
  const { handlePaste } = useSanitizedPaste({ preserveLineBreaks: false });

  if (block.url !== prevBlockUrl) {
    setPrevBlockUrl(block.url);
    setHasError(false);
    setLocalPreview(null);
  }

  const displayUrl = localPreview ?? block.url;

  const handleCaptionBlur = useCallback(() => {
    if (captionRef.current && onCaptionChange) {
      onCaptionChange(captionRef.current.textContent ?? "");
    }
  }, [onCaptionChange]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setHasError(false);
      setIsUploading(true);
      try {
        const result: UploadResult = await uploadDocumentImage(file);
        setLocalPreview(result.url);
        onImageUpdate?.(result.url, result.fileId);
        toast({ title: "Tải ảnh thành công", color: "success" });
      } catch {
        setLocalPreview(null);
        toast({ title: "Tải ảnh thất bại", color: "danger" });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onImageUpdate, toast, uploadDocumentImage],
  );

  const triggerUpload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      fileInputRef.current?.click();
    },
    [],
  );

  if (!displayUrl) {
    return (
      <figure className="blog-preview-image">
        {editable && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        )}
        <div
          className={`relative flex h-52 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-muted/30 transition-all ${
            editable
              ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5"
              : ""
          }`}
          onClick={editable ? (e) => { triggerUpload(e); onSelect?.(); } : undefined}
          role={editable ? "button" : undefined}
          tabIndex={editable ? 0 : undefined}
          aria-label={editable ? "Tải ảnh lên" : undefined}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <span className="text-xs text-text-muted">Đang tải ảnh lên...</span>
            </div>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.22a.75.75 0 00-1.06 0l-1.91 1.91-4.72-4.72a.75.75 0 00-1.06 0L2.5 11.06zm10.25-4.81a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-text">
                {editable ? `Nhấn để tải ảnh lên (${subfolder})` : "(Chưa có hình ảnh)"}
              </span>
              {editable && (
                <span className="text-[11px] text-text-muted">
                  JPG, PNG, WebP, GIF (tối đa 10MB)
                </span>
              )}
            </>
          )}
        </div>
      </figure>
    );
  }

  return (
    <figure
      className={`blog-preview-image relative group/img ${editable ? "cursor-pointer" : ""}`}
      onClick={editable ? onSelect : undefined}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
    >
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      <div className="relative overflow-hidden rounded-lg">
        {displayUrl && !hasError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={displayUrl}
            alt={block.alt || "Hình ảnh minh hoạ"}
            className="w-full rounded-lg object-cover"
            loading="lazy"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-danger/30 bg-danger/5">
            <span className="text-sm text-danger/60">Không thể tải ảnh</span>
          </div>
        )}

        {/* Uploading overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
            <Spinner size="md" />
            <span className="mt-2 text-xs font-medium">Đang tải ảnh mới lên...</span>
          </div>
        )}

        {/* Edit mode hover button overlay */}
        {editable && !isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={triggerUpload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-md backdrop-blur-sm transition-transform hover:scale-105 hover:bg-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-primary"
              >
                <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Thay đổi ảnh
            </button>
          </div>
        )}
      </div>

      {/* Caption */}
      {editable ? (
        <figcaption
          ref={captionRef}
          className="mt-2.5 text-center text-sm italic text-text-muted ve-editable"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleCaptionBlur}
          onPaste={handlePaste}
          onClick={(e) => e.stopPropagation()}
          data-placeholder="Thêm chú thích ảnh..."
        >
          {block.caption || ""}
        </figcaption>
      ) : (
        block.caption && (
          <figcaption className="mt-2.5 text-center text-sm italic text-text-muted">
            {block.caption}
          </figcaption>
        )
      )}
    </figure>
  );
}
