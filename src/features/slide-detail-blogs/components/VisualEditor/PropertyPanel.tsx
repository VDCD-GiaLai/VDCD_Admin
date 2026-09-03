"use client";

import React, { useCallback, useRef, useState } from "react";
import { validateImageFile, type UploadResult } from "@/lib/upload";
import { useSlideDetailBlogUpload } from "../../context/SlideDetailBlogUploadContext";
import { Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import type {
  SlideDetailBlogBlock,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  ImageBlock,
  CtaBlock,
  SectionBlock,
  BlockSpacing,
  HeroMeta,
  HeroPlacement,
} from "@/types/slide-detail-blog";

const FONT_SIZE_PRESETS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];

interface PropertyPanelProps {
  block?: SlideDetailBlogBlock | null;
  heroMeta?: HeroMeta;
  heroImageUrl?: string | null;
  onBlockChange?: (block: SlideDetailBlogBlock) => void;
  onHeroMetaChange?: (heroMeta: HeroMeta) => void;
  onHeroImageChange?: (url: string, fileId?: string) => void;
  onClose: () => void;
}

const SPACING_PRESETS = [0, 8, 16, 24, 32, 48, 64, 80, 96];

const BLOCK_TYPE_LABELS: Record<SlideDetailBlogBlock["type"], string> = {
  heading: "Tiêu đề",
  paragraph: "Đoạn văn",
  image: "Hình ảnh",
  list: "Danh sách",
  section: "Nhóm nội dung",
  cta: "Nút CTA",
};

/**
 * Right sidebar property panel — shows block-specific or hero-specific settings when selected.
 */
export function PropertyPanel({
  block,
  heroMeta,
  heroImageUrl,
  onBlockChange,
  onHeroMetaChange,
  onHeroImageChange,
  onClose,
}: PropertyPanelProps) {
  const isHero = !block && (!!onHeroMetaChange || !!heroMeta);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { subfolder, uploadBlogImage } = useSlideDetailBlogUpload();

  const handleSpacingChange = useCallback(
    (key: keyof BlockSpacing, value: number) => {
      if (!block || !onBlockChange) return;
      onBlockChange({
        ...block,
        spacing: {
          ...block.spacing,
          [key]: value, // Explicitly keep 0 as number
        },
      });
    },
    [block, onBlockChange],
  );

  const handleResetSpacing = useCallback(
    (key: keyof BlockSpacing) => {
      if (!block || !onBlockChange) return;
      const newSpacing = { ...block.spacing };
      delete newSpacing[key];
      onBlockChange({
        ...block,
        spacing: Object.keys(newSpacing).length > 0 ? newSpacing : undefined,
      });
    },
    [block, onBlockChange],
  );

  const handleHeadingLevelChange = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      if (block?.type === "heading" && onBlockChange) {
        onBlockChange({ ...block, level } as HeadingBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleFontSizeChange = useCallback(
    (fontSize: number) => {
      if (!block || !onBlockChange) return;
      if (block.type === "heading" || block.type === "paragraph" || block.type === "list" || block.type === "cta") {
        onBlockChange({ ...block, fontSize } as HeadingBlock | ParagraphBlock | ListBlock | CtaBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleResetFontSize = useCallback(() => {
    if (!block || !onBlockChange) return;
    if (block.type === "heading" || block.type === "paragraph" || block.type === "list" || block.type === "cta") {
      const updated = { ...block };
      delete (updated as Record<string, unknown>).fontSize;
      onBlockChange(updated);
    }
  }, [block, onBlockChange]);

  const handleImageAltChange = useCallback(
    (alt: string) => {
      if (block?.type === "image" && onBlockChange) {
        onBlockChange({ ...block, alt } as ImageBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleImageCaptionChange = useCallback(
    (caption: string) => {
      if (block?.type === "image" && onBlockChange) {
        onBlockChange({ ...block, caption: caption || null } as ImageBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleImageUrlChange = useCallback(
    (url: string) => {
      if (block?.type === "image" && onBlockChange) {
        onBlockChange({ ...block, url } as ImageBlock);
      }
    },
    [block, onBlockChange],
  );

  // Direct file upload for image block
  const handleBlockImageFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !block || block.type !== "image" || !onBlockChange) return;

      const validationError = validateImageFile(file);
      if (validationError) {
        toast({
          title: "File không hợp lệ",
          description: validationError,
          color: "danger",
        });
        return;
      }

      setIsUploading(true);
      try {
        const result: UploadResult = await uploadBlogImage(file);
        onBlockChange({
          ...block,
          url: result.url,
          fileId: result.fileId,
        } as ImageBlock);
        toast({ title: "Tải ảnh thành công", color: "success" });
      } catch {
        toast({ title: "Tải ảnh thất bại", color: "danger" });
      } finally {
        setIsUploading(false);
        if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      }
    },
    [block, onBlockChange, toast, uploadBlogImage],
  );

  // Direct file upload for hero image
  const handleHeroImageFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onHeroImageChange) return;

      const validationError = validateImageFile(file);
      if (validationError) {
        toast({
          title: "File không hợp lệ",
          description: validationError,
          color: "danger",
        });
        return;
      }

      setIsUploading(true);
      try {
        const result: UploadResult = await uploadBlogImage(file);
        onHeroImageChange(result.url, result.fileId);
        toast({ title: "Tải ảnh hero thành công", color: "success" });
      } catch {
        toast({ title: "Tải ảnh hero thất bại", color: "danger" });
      } finally {
        setIsUploading(false);
        if (heroFileInputRef.current) heroFileInputRef.current.value = "";
      }
    },
    [onHeroImageChange, toast, uploadBlogImage],
  );

  const handleCtaUrlChange = useCallback(
    (url: string) => {
      if (block?.type === "cta" && onBlockChange) {
        onBlockChange({ ...block, url } as CtaBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleSectionNumberChange = useCallback(
    (number: string) => {
      if (block?.type === "section" && onBlockChange) {
        onBlockChange({ ...block, number } as SectionBlock);
      }
    },
    [block, onBlockChange],
  );

  // ── Hero handlers ──
  const handleHeroPlacementChange = useCallback(
    (placement: HeroPlacement) => {
      onHeroMetaChange?.({
        ...heroMeta,
        placement,
      });
    },
    [heroMeta, onHeroMetaChange],
  );

  const handleHeroPositionChange = useCallback(
    (position: HeroMeta["position"]) => {
      onHeroMetaChange?.({
        ...heroMeta,
        position,
      });
    },
    [heroMeta, onHeroMetaChange],
  );

  const handleHeroCaptionChange = useCallback(
    (caption: string) => {
      onHeroMetaChange?.({
        ...heroMeta,
        caption,
      });
    },
    [heroMeta, onHeroMetaChange],
  );

  // ── Hero Property Panel ──
  if (isHero) {
    const currentPlacement = heroMeta?.placement ?? "above_title";
    const currentPosition = heroMeta?.position ?? "center";
    const currentCaption = heroMeta?.caption ?? "";

    return (
      <div className="ve-property-panel">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text">
            Ảnh bìa Hero
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
            aria-label="Đóng bảng thuộc tính"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-4">
          {/* Tải ảnh bìa lên */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Tải ảnh bìa trực tiếp
            </label>
            <input
              ref={heroFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleHeroImageFileUpload}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => heroFileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-muted/30 p-3 text-xs font-medium text-text transition-all hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Spinner size="sm" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                  <span>{heroImageUrl ? "Thay ảnh bìa từ máy tính" : "Chọn ảnh bìa từ máy tính"}</span>
                </>
              )}
            </button>
            <p className="mt-1 text-[10px] text-text-muted">
              Lưu vào thư mục /vdcd/slides/{subfolder} trên ImageKit (tối đa 10MB)
            </p>
          </div>

          {/* Vị trí ảnh bìa trong layout */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Vị trí ảnh bìa
            </label>
            <div className="flex flex-col gap-1.5">
              {[
                { id: "above_title", label: "Trên tiêu đề", desc: "Ảnh bìa → Tiêu đề → Mô tả" },
                { id: "between_title_desc", label: "Giữa tiêu đề & mô tả", desc: "Tiêu đề → Ảnh bìa → Mô tả" },
                { id: "below_desc", label: "Dưới mô tả", desc: "Tiêu đề → Mô tả → Ảnh bìa" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleHeroPlacementChange(item.id as HeroPlacement)}
                  className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                    currentPlacement === item.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text hover:border-primary/40 bg-surface"
                  }`}
                >
                  <span className="text-xs font-semibold">{item.label}</span>
                  <span className="text-[10px] text-text-muted mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chú thích ảnh bìa */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Chú thích ảnh bìa (dưới ảnh)
            </label>
            <input
              type="text"
              value={currentCaption}
              onChange={(e) => handleHeroCaptionChange(e.target.value)}
              placeholder="Nhập chú thích hiển thị dưới ảnh bìa..."
              className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Căn chỉnh ảnh (object-position) */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Tiêu điểm khung ảnh
            </label>
            <div className="flex gap-1.5">
              {[
                { id: "top", label: "Trên" },
                { id: "center", label: "Giữa" },
                { id: "bottom", label: "Dưới" },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => handleHeroPositionChange(pos.id as HeroMeta["position"])}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
                    currentPosition === pos.id
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border text-text-muted hover:border-primary/40"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!block) return null;

  return (
    <div className="ve-property-panel">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text">
          {BLOCK_TYPE_LABELS[block.type]}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          aria-label="Đóng bảng thuộc tính"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      <div className="space-y-5 p-4">
        {/* ── Block-specific settings ── */}

        {/* Heading: level selector */}
        {block.type === "heading" && (
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Cấp độ
            </label>
            <div className="flex flex-wrap gap-1">
              {([1, 2, 3, 4, 5, 6] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleHeadingLevelChange(level)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${
                    (block as HeadingBlock).level === level
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text-muted hover:border-primary/40"
                  }`}
                >
                  H{level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Font size — shown for text blocks */}
        {(block.type === "heading" || block.type === "paragraph" || block.type === "list" || block.type === "cta") && (
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Cỡ chữ
            </label>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-text">
                {(block as HeadingBlock | ParagraphBlock | ListBlock | CtaBlock).fontSize
                  ? `${(block as HeadingBlock | ParagraphBlock | ListBlock | CtaBlock).fontSize}px`
                  : "Mặc định"}
              </span>
              {(block as HeadingBlock | ParagraphBlock | ListBlock | CtaBlock).fontSize && (
                <button
                  type="button"
                  onClick={handleResetFontSize}
                  className="text-[10px] text-primary hover:underline"
                >
                  Đặt lại
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {FONT_SIZE_PRESETS.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleFontSizeChange(size)}
                  className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-all ${
                    (block as HeadingBlock | ParagraphBlock | ListBlock | CtaBlock).fontSize === size
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border text-text-muted hover:border-primary/40"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image: Direct upload, URL, alt, caption */}
        {block.type === "image" && (
          <>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Tải ảnh trực tiếp
              </label>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleBlockImageFileUpload}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => imageFileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-muted/30 p-3 text-xs font-medium text-text transition-all hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                    <span>{(block as ImageBlock).url ? "Thay ảnh từ máy tính" : "Chọn ảnh từ máy tính"}</span>
                  </>
                )}
              </button>
              <p className="mt-1 text-[10px] text-text-muted">
                Lưu vào thư mục /vdcd/slides/{subfolder} trên ImageKit (tối đa 10MB)
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Hoặc dán đường dẫn ảnh
              </label>
              <input
                type="url"
                value={(block as ImageBlock).url}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Alt text
              </label>
              <input
                type="text"
                value={(block as ImageBlock).alt}
                onChange={(e) => handleImageAltChange(e.target.value)}
                placeholder="Mô tả ngắn ảnh..."
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Chú thích ảnh (dưới ảnh)
              </label>
              <input
                type="text"
                value={(block as ImageBlock).caption ?? ""}
                onChange={(e) => handleImageCaptionChange(e.target.value)}
                placeholder="Chú thích ảnh (hiển thị dưới ảnh)..."
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </>
        )}

        {/* CTA: URL */}
        {block.type === "cta" && (
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Đường dẫn liên kết
            </label>
            <input
              type="url"
              value={(block as CtaBlock).url}
              onChange={(e) => handleCtaUrlChange(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        )}

        {/* Section: number */}
        {block.type === "section" && (
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Số thứ tự
            </label>
            <input
              type="text"
              value={(block as SectionBlock).number}
              onChange={(e) => handleSectionNumberChange(e.target.value)}
              placeholder="01"
              className="w-20 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        )}

        {/* ── Spacing (all block types) ── */}
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Khoảng cách lề
          </label>

          {/* Top spacing */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Trên (Margin Top)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-text">
                  {typeof block.spacing?.marginTop === "number"
                    ? `${block.spacing.marginTop}px`
                    : "Mặc định"}
                </span>
                {typeof block.spacing?.marginTop === "number" && (
                  <button
                    type="button"
                    onClick={() => handleResetSpacing("marginTop")}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Đặt lại
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {SPACING_PRESETS.map((val) => (
                <button
                  key={`mt-${val}`}
                  type="button"
                  onClick={() => handleSpacingChange("marginTop", val)}
                  className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-all ${
                    block.spacing?.marginTop === val
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border text-text-muted hover:border-primary/40"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom spacing */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Dưới (Margin Bottom)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-text">
                  {typeof block.spacing?.marginBottom === "number"
                    ? `${block.spacing.marginBottom}px`
                    : "Mặc định"}
                </span>
                {typeof block.spacing?.marginBottom === "number" && (
                  <button
                    type="button"
                    onClick={() => handleResetSpacing("marginBottom")}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Đặt lại
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {SPACING_PRESETS.map((val) => (
                <button
                  key={`mb-${val}`}
                  type="button"
                  onClick={() => handleSpacingChange("marginBottom", val)}
                  className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-all ${
                    block.spacing?.marginBottom === val
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border text-text-muted hover:border-primary/40"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
