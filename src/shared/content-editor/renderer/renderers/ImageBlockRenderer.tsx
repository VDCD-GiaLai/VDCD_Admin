import React, { useRef, useCallback, useState } from "react";
import { validateImageFile, type UploadResult } from "@/lib/upload";
import { ImagePickerModal, type ImagePickerResult } from "@/components/shared";
import { useDocumentUpload } from "../../media/DocumentUploadContext";
import { useSanitizedPaste } from "../../paste/useSanitizedPaste";
import { useContentEditableSync } from "../../hooks/useContentEditableSync";
import { Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import type { ImageBlock } from "../../model/document.types";

export interface ImageBlockRendererProps {
  block: ImageBlock;
  editable?: boolean;
  onSelect?: () => void;
  onCaptionChange?: (caption: string) => void;
  onImageUpdate?: (url: string, fileId?: string | null) => void;
  /** Called with the old fileId when an image is replaced/removed, for soft-delete tracking */
  onImageDiscard?: (fileId: string) => void;
  onBlockChange?: (block: ImageBlock) => void;
}

export function ImageBlockRenderer({
  block,
  editable,
  onSelect,
  onCaptionChange,
  onImageUpdate,
  onImageDiscard,
  onBlockChange,
}: ImageBlockRendererProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const secondaryCaptionRef = useRef<HTMLElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingSecondary, setIsUploadingSecondary] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showSecondaryGallery, setShowSecondaryGallery] = useState(false);
  const [prevBlockUrl, setPrevBlockUrl] = useState(block.url);
  const [prevSecondaryUrl, setPrevSecondaryUrl] = useState(block.secondaryUrl);
  const [hasError, setHasError] = useState(false);
  const [hasSecondaryError, setHasSecondaryError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [secondaryLocalPreview, setSecondaryLocalPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { subfolder, folder, uploadDocumentImage, onGalleryFileSelect } = useDocumentUpload();
  const { handlePaste } = useSanitizedPaste({ preserveLineBreaks: false });

  const defaultFolder =
    folder === "article"
      ? "/vdcd/articles"
      : folder === "project"
        ? "/vdcd/projects"
        : folder === "solution"
          ? "/vdcd/solutions"
          : folder === "program"
            ? "/vdcd/programs"
            : "/vdcd";

  // Sync caption from block prop safely (won't overwrite user typing mid-edit)
  const { handleInput: handleCaptionInput } = useContentEditableSync(
    captionRef as React.RefObject<HTMLElement | null>,
    { html: block.caption || "", enabled: editable },
  );

  const { handleInput: handleSecondaryCaptionInput } = useContentEditableSync(
    secondaryCaptionRef as React.RefObject<HTMLElement | null>,
    { html: block.secondaryCaption || "", enabled: editable },
  );

  if (block.url !== prevBlockUrl) {
    setPrevBlockUrl(block.url);
    setHasError(false);
    setLocalPreview(null);
  }

  if (block.secondaryUrl !== prevSecondaryUrl) {
    setPrevSecondaryUrl(block.secondaryUrl);
    setHasSecondaryError(false);
    setSecondaryLocalPreview(null);
  }

  const displayUrl = localPreview ?? block.url;
  const displaySecondaryUrl = secondaryLocalPreview ?? block.secondaryUrl;

  const handleCaptionBlur = useCallback(() => {
    if (captionRef.current && onCaptionChange) {
      const text = captionRef.current.textContent?.trim() ?? "";
      onCaptionChange(text ? captionRef.current.innerHTML : "");
    }
  }, [onCaptionChange]);

  const handleSecondaryCaptionBlur = useCallback(() => {
    if (secondaryCaptionRef.current && onBlockChange) {
      const text = secondaryCaptionRef.current.textContent?.trim() ?? "";
      onBlockChange({
        ...block,
        secondaryCaption: text ? secondaryCaptionRef.current.innerHTML : null,
      });
    }
  }, [block, onBlockChange]);

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

      // Soft-delete old image: track old fileId before uploading new one
      if (block.fileId) {
        onImageDiscard?.(block.fileId);
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
    [block.fileId, onImageUpdate, onImageDiscard, toast, uploadDocumentImage],
  );

  const handleSecondaryFileChange = useCallback(
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

      if (block.secondaryFileId) {
        onImageDiscard?.(block.secondaryFileId);
      }

      const tempUrl = URL.createObjectURL(file);
      setSecondaryLocalPreview(tempUrl);
      setHasSecondaryError(false);
      setIsUploadingSecondary(true);
      try {
        const result: UploadResult = await uploadDocumentImage(file);
        setSecondaryLocalPreview(result.url);
        if (onBlockChange) {
          onBlockChange({
            ...block,
            secondaryUrl: result.url,
            secondaryFileId: result.fileId,
          });
        }
        toast({ title: "Tải ảnh phụ thành công", color: "success" });
      } catch {
        setSecondaryLocalPreview(null);
        toast({ title: "Tải ảnh phụ thất bại", color: "danger" });
      } finally {
        setIsUploadingSecondary(false);
        if (secondaryFileInputRef.current) {
          secondaryFileInputRef.current.value = "";
        }
      }
    },
    [block, onBlockChange, onImageDiscard, toast, uploadDocumentImage],
  );

  const triggerUpload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      fileInputRef.current?.click();
    },
    [],
  );

  const triggerSecondaryUpload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      secondaryFileInputRef.current?.click();
    },
    [],
  );

  const aspectClass =
    block.aspectRatio === "16:9"
      ? "aspect-video"
      : block.aspectRatio === "4:3"
        ? "aspect-[4/3]"
        : block.aspectRatio === "1:1"
          ? "aspect-square"
          : "";

  // ── Layout: Dual images (2 columns) ──
  if (block.layout === "dual") {
    return (
      <div
        className={`blog-preview-image my-4 ${editable ? "cursor-pointer" : ""}`}
        onClick={editable ? onSelect : undefined}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Image 1 */}
          <div className="flex flex-col relative group/img1">
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
              className={`relative overflow-hidden rounded-lg bg-surface-muted/30 border border-border/60 ${
                aspectClass || "min-h-48"
              }`}
            >
              {displayUrl && !hasError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={displayUrl}
                  alt={block.alt || "Hình ảnh 1"}
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                  onError={() => setHasError(true)}
                />
              ) : (
                <div
                  className="flex h-48 w-full flex-col items-center justify-center gap-1.5 p-4 text-center cursor-pointer hover:bg-primary/5"
                  onClick={editable ? triggerUpload : undefined}
                >
                  <span className="text-xs font-semibold text-text">Thêm ảnh 1 (Trái)</span>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={triggerUpload}
                      className="rounded border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text hover:bg-surface-muted"
                    >
                      Tải lên
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGallery(true);
                        onSelect?.();
                      }}
                      className="rounded border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text hover:bg-surface-muted"
                    >
                      Thư viện
                    </button>
                  </div>
                </div>
              )}

              {/* Edit overlay for Image 1 */}
              {editable && displayUrl && !isUploading && (
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 group-hover/img1:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={triggerUpload}
                    className="rounded bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-900 shadow hover:bg-white"
                  >
                    Thay ảnh
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGallery(true);
                    }}
                    className="rounded bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-900 shadow hover:bg-white"
                  >
                    Thư viện
                  </button>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            {/* Caption 1 */}
            {editable ? (
              <figcaption
                ref={captionRef}
                className="mt-1.5 text-center text-xs italic text-text-muted ve-editable"
                contentEditable
                suppressContentEditableWarning
                onInput={handleCaptionInput}
                onBlur={handleCaptionBlur}
                onPaste={handlePaste}
                onClick={(e) => e.stopPropagation()}
                data-placeholder="Chú thích ảnh 1..."
              />
            ) : (
              block.caption && (
                <figcaption
                  className="mt-1.5 text-center text-xs italic text-text-muted"
                  dangerouslySetInnerHTML={{ __html: block.caption }}
                />
              )
            )}
          </div>

          {/* Column 2: Image 2 */}
          <div className="flex flex-col relative group/img2">
            {editable && (
              <input
                ref={secondaryFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleSecondaryFileChange}
              />
            )}
            <div
              className={`relative overflow-hidden rounded-lg bg-surface-muted/30 border border-border/60 ${
                aspectClass || "min-h-48"
              }`}
            >
              {displaySecondaryUrl && !hasSecondaryError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={displaySecondaryUrl}
                  alt={block.secondaryAlt || block.alt || "Hình ảnh 2"}
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                  onError={() => setHasSecondaryError(true)}
                />
              ) : (
                <div
                  className="flex h-48 w-full flex-col items-center justify-center gap-1.5 p-4 text-center cursor-pointer hover:bg-primary/5"
                  onClick={editable ? triggerSecondaryUpload : undefined}
                >
                  <span className="text-xs font-semibold text-text">Thêm ảnh 2 (Phải)</span>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={triggerSecondaryUpload}
                      className="rounded border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text hover:bg-surface-muted"
                    >
                      Tải lên
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSecondaryGallery(true);
                        onSelect?.();
                      }}
                      className="rounded border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text hover:bg-surface-muted"
                    >
                      Thư viện
                    </button>
                  </div>
                </div>
              )}

              {/* Edit overlay for Image 2 */}
              {editable && displaySecondaryUrl && !isUploadingSecondary && (
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 group-hover/img2:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={triggerSecondaryUpload}
                    className="rounded bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-900 shadow hover:bg-white"
                  >
                    Thay ảnh
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSecondaryGallery(true);
                    }}
                    className="rounded bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-900 shadow hover:bg-white"
                  >
                    Thư viện
                  </button>
                </div>
              )}
              {isUploadingSecondary && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            {/* Caption 2 */}
            {editable ? (
              <figcaption
                ref={secondaryCaptionRef}
                className="mt-1.5 text-center text-xs italic text-text-muted ve-editable"
                contentEditable
                suppressContentEditableWarning
                onInput={handleSecondaryCaptionInput}
                onBlur={handleSecondaryCaptionBlur}
                onPaste={handlePaste}
                onClick={(e) => e.stopPropagation()}
                data-placeholder="Chú thích ảnh 2..."
              />
            ) : (
              block.secondaryCaption && (
                <figcaption
                  className="mt-1.5 text-center text-xs italic text-text-muted"
                  dangerouslySetInnerHTML={{ __html: block.secondaryCaption }}
                />
              )
            )}
          </div>
        </div>

        {editable && showGallery && (
          <ImagePickerModal
            isOpen={showGallery}
            onClose={() => setShowGallery(false)}
            onSelect={(image: ImagePickerResult) => {
              if (block.fileId) onImageDiscard?.(block.fileId);
              if (image.fileId) onGalleryFileSelect?.(image.fileId);
              setLocalPreview(image.url);
              setHasError(false);
              onImageUpdate?.(image.url, null);
              setShowGallery(false);
              toast({ title: "Đã chọn ảnh 1 từ thư viện", color: "success" });
            }}
            defaultFolder={defaultFolder}
            uploadFolder={folder || "image"}
            uploadOptions={{ subfolder, slug: subfolder }}
            title="Chọn ảnh thứ 1"
          />
        )}

        {editable && showSecondaryGallery && (
          <ImagePickerModal
            isOpen={showSecondaryGallery}
            onClose={() => setShowSecondaryGallery(false)}
            onSelect={(image: ImagePickerResult) => {
              if (block.secondaryFileId) onImageDiscard?.(block.secondaryFileId);
              if (image.fileId) onGalleryFileSelect?.(image.fileId);
              setSecondaryLocalPreview(image.url);
              setHasSecondaryError(false);
              if (onBlockChange) {
                onBlockChange({
                  ...block,
                  secondaryUrl: image.url,
                  secondaryFileId: null,
                });
              }
              setShowSecondaryGallery(false);
              toast({ title: "Đã chọn ảnh 2 từ thư viện", color: "success" });
            }}
            defaultFolder={defaultFolder}
            uploadFolder={folder || "image"}
            uploadOptions={{ subfolder, slug: subfolder }}
            title="Chọn ảnh thứ 2"
          />
        )}
      </div>
    );
  }

  // ── Layout: Single image (Default) ──
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
          className={`relative flex min-h-52 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-muted/30 p-4 transition-all ${
            editable
              ? "hover:border-primary/50 hover:bg-primary/5"
              : ""
          }`}
          onClick={editable ? onSelect : undefined}
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
                {editable ? "Thêm hình ảnh vào khối" : "(Chưa có hình ảnh)"}
              </span>
              {editable && (
                <>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={triggerUpload}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text shadow-xs transition-colors hover:bg-surface-muted"
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
                      Tải ảnh lên
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGallery(true);
                        onSelect?.();
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text shadow-xs transition-colors hover:bg-surface-muted"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 text-primary"
                      >
                        <path
                          fillRule="evenodd"
                          d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0L2.5 11.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Chọn từ thư viện
                    </button>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    Lưu vào {defaultFolder}/{subfolder} (tối đa 10MB)
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {editable && showGallery && (
          <ImagePickerModal
            isOpen={showGallery}
            onClose={() => setShowGallery(false)}
            onSelect={(image: ImagePickerResult) => {
              if (block.fileId) {
                onImageDiscard?.(block.fileId);
              }
              if (image.fileId) {
                onGalleryFileSelect?.(image.fileId);
              }
              setLocalPreview(image.url);
              setHasError(false);
              onImageUpdate?.(image.url, null);
              setShowGallery(false);
              toast({ title: "Đã chọn ảnh từ thư viện", color: "success" });
            }}
            defaultFolder={defaultFolder}
            uploadFolder={folder || "image"}
            uploadOptions={{ subfolder, slug: subfolder }}
            title="Chọn ảnh khối nội dung"
          />
        )}
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

      <div className={`relative overflow-hidden rounded-lg ${aspectClass}`}>
        {displayUrl && !hasError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={displayUrl}
            alt={block.alt || "Hình ảnh minh hoạ"}
            className="w-full h-full rounded-lg object-cover"
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
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={triggerUpload}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-md backdrop-blur-sm transition-transform hover:scale-105 hover:bg-white"
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowGallery(true);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-md backdrop-blur-sm transition-transform hover:scale-105 hover:bg-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-primary"
              >
                <path
                  fillRule="evenodd"
                  d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0L2.5 11.06z"
                  clipRule="evenodd"
                />
              </svg>
              Chọn từ thư viện
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
          onInput={handleCaptionInput}
          onBlur={handleCaptionBlur}
          onPaste={handlePaste}
          onClick={(e) => e.stopPropagation()}
          data-placeholder="Thêm chú thích ảnh..."
        />
      ) : (
        block.caption && (
          <figcaption
            className="mt-2.5 text-center text-sm italic text-text-muted"
            dangerouslySetInnerHTML={{ __html: block.caption }}
          />
        )
      )}

      {editable && showGallery && (
        <ImagePickerModal
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          onSelect={(image: ImagePickerResult) => {
            if (block.fileId) {
              onImageDiscard?.(block.fileId);
            }
            if (image.fileId) {
              onGalleryFileSelect?.(image.fileId);
            }
            setLocalPreview(image.url);
            setHasError(false);
            onImageUpdate?.(image.url, null);
            setShowGallery(false);
            toast({ title: "Đã chọn ảnh từ thư viện", color: "success" });
          }}
          defaultFolder={defaultFolder}
          uploadFolder={folder || "image"}
          uploadOptions={{ subfolder, slug: subfolder }}
          title="Chọn ảnh khối nội dung"
        />
      )}
    </figure>
  );
}
