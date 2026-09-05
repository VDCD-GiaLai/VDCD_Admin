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
  CtaButtonItem,
  CtaAlign,
  CtaShape,
  CtaLayout,
  SectionBlock,
  BlockSpacing,
  HeroMeta,
  HeroPlacement,
  ListType,
  ListStyle,
  ListItem,
  ListFontWeight,
  ListStyleConfig,
  ListLevelStyle,
} from "@/types/slide-detail-blog";
import { getCtaButtons } from "@/types/slide-detail-blog";
import {
  normalizeListItems,
  flattenListItems,
  indentListItem,
  outdentListItem,
  deleteListItemInTree,
  addListItem,
  moveListItem,
  updateListItemContent,
  findItemLocation,
  resolveListLevelStyle,
} from "../../utils/list-helpers";
import { parseClipboardTextToList } from "../../utils/list-parser";

const FONT_SIZE_PRESETS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];

const COLOR_PALETTE = [
  { label: "Mặc định", value: "" },
  { label: "Đậm chính (Navy)", value: "#011A42" },
  { label: "Đỏ VDCD", value: "#ca2a30" },
  { label: "Ghi phụ", value: "#6C7E96" },
  { label: "Xanh lá", value: "#32D484" },
  { label: "Cam", value: "#FDAF22" },
  { label: "Xanh ngọc", value: "#35B5AA" },
  { label: "Đen", value: "#0A0A0A" },
];

const BG_PALETTE = [
  { label: "Trong suốt", value: "" },
  { label: "Xám tím", value: "#F9F7FC" },
  { label: "Nền Body", value: "#F8F9FD" },
  { label: "Đỏ nhẹ", value: "#FFF5F5" },
  { label: "Xanh lá nhẹ", value: "#F0FDF4" },
  { label: "Xanh dương", value: "#EFF6FF" },
];

const FONT_FAMILY_OPTIONS = [
  { label: "Mặc định (Space Grotesk / Be Vietnam Pro)", value: "" },
  { label: "Space Grotesk (Hiện đại)", value: '"Space Grotesk", sans-serif' },
  { label: "Be Vietnam Pro (Tiêu chuẩn)", value: '"Be Vietnam Pro", sans-serif' },
  { label: "Serif (Có chân trang trọng)", value: "Georgia, serif" },
  { label: "Monospace (Mã lập trình)", value: "monospace" },
];

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
  quote: "Trích dẫn",
  highlight: "Điểm nhấn",
  ordered_list: "Danh sách số",
};

function getListMarker(
  index: number,
  depth: number,
  listType: ListType,
  listStyle?: ListStyle,
): string {
  if (listType === "checklist" || listStyle === "checklist") {
    return "☑";
  }
  if (listType === "ordered") {
    const num = index + 1;
    if (listStyle === "lower-alpha" || (depth === 1 && !listStyle)) {
      return `${String.fromCharCode(96 + ((num - 1) % 26) + 1)}.`;
    }
    if (listStyle === "upper-alpha") {
      return `${String.fromCharCode(64 + ((num - 1) % 26) + 1)}.`;
    }
    return `${num}.`;
  }
  if (listStyle === "circle" || depth === 1) return "◦";
  if (listStyle === "square" || depth === 2) return "▪";
  if (depth >= 3) return "▫";
  return "•";
}

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
  const [bulkPasteText, setBulkPasteText] = useState("");
  const [showBulkPasteArea, setShowBulkPasteArea] = useState(false);
  const [activeListLevel, setActiveListLevel] = useState<"all" | 1 | 2 | 3>("all");
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

  const handleCtaUpdate = useCallback(
    (updates: Partial<CtaBlock>) => {
      if (block?.type === "cta" && onBlockChange) {
        onBlockChange({ ...block, ...updates } as CtaBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleCtaButtonsUpdate = useCallback(
    (newButtons: CtaButtonItem[]) => {
      if (block?.type === "cta" && onBlockChange) {
        const cta = block as CtaBlock;
        const updated: CtaBlock = {
          ...cta,
          items: newButtons,
          label: newButtons[0]?.label || "",
          url: newButtons[0]?.url || "",
          secondaryLabel: newButtons[1]?.label || undefined,
          secondaryUrl: newButtons[1]?.url || undefined,
          variant: newButtons[1]?.variant || newButtons[0]?.variant || "solid",
        };
        if (!newButtons[1]) {
          delete updated.secondaryLabel;
          delete updated.secondaryUrl;
        }
        onBlockChange(updated);
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

  // ── List handlers ──
  const handleListStyleUpdate = useCallback(
    (updater: (currentStyle: ListStyleConfig) => ListStyleConfig) => {
      if (block?.type === "list" && onBlockChange) {
        const currentBlock = block as ListBlock;
        const currentStyle: ListStyleConfig = currentBlock.style ?? {};
        const nextStyle = updater(currentStyle);
        onBlockChange({
          ...currentBlock,
          style: nextStyle,
          ...(activeListLevel === "all"
            ? {
                ...(nextStyle.lineHeight !== undefined ? { lineHeight: nextStyle.lineHeight } : {}),
                ...(nextStyle.itemSpacing !== undefined ? { itemSpacing: nextStyle.itemSpacing } : {}),
                ...(nextStyle.fontSize !== undefined ? { fontSize: nextStyle.fontSize } : {}),
                ...(nextStyle.marker !== undefined ? { listStyle: nextStyle.marker } : {}),
              }
            : {}),
        } as ListBlock);
      }
    },
    [activeListLevel, block, onBlockChange],
  );

  const handleListLevelOverrideUpdate = useCallback(
    (level: 1 | 2 | 3, updater: (currentLevelStyle: ListLevelStyle) => ListLevelStyle) => {
      handleListStyleUpdate((prev) => {
        const prevLevelStyles = prev.levelStyles ?? {};
        const currentLevelStyle = prevLevelStyles[level] ?? {};
        const updatedLevelStyle = updater(currentLevelStyle);
        return {
          ...prev,
          levelStyles: {
            ...prevLevelStyles,
            [level]: updatedLevelStyle,
          },
        };
      });
    },
    [handleListStyleUpdate],
  );

  const handleResetLevelOverride = useCallback(
    (level: 1 | 2 | 3) => {
      handleListStyleUpdate((prev) => {
        if (!prev.levelStyles || !prev.levelStyles[level]) return prev;
        const nextLevelStyles = { ...prev.levelStyles };
        delete nextLevelStyles[level];
        return {
          ...prev,
          levelStyles: Object.keys(nextLevelStyles).length > 0 ? nextLevelStyles : undefined,
        };
      });
    },
    [handleListStyleUpdate],
  );

  const handleListTypeChange = useCallback(
    (listType: ListType) => {
      if (block?.type === "list" && onBlockChange) {
        let listStyle: ListStyle = "disc";
        if (listType === "ordered") listStyle = "decimal";
        if (listType === "checklist") listStyle = "checklist";
        const currentStyle = (block as ListBlock).style ?? {};
        onBlockChange({
          ...block,
          listType,
          listStyle,
          style: {
            ...currentStyle,
            marker: listStyle,
          },
        } as ListBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleListStyleChange = useCallback(
    (listStyle: ListStyle) => {
      if (block?.type === "list" && onBlockChange) {
        if (activeListLevel === "all") {
          const currentStyle = (block as ListBlock).style ?? {};
          onBlockChange({
            ...block,
            listStyle,
            style: {
              ...currentStyle,
              marker: listStyle,
            },
          } as ListBlock);
        } else {
          handleListLevelOverrideUpdate(activeListLevel, (prev) => ({
            ...prev,
            marker: listStyle,
          }));
        }
      }
    },
    [activeListLevel, block, handleListLevelOverrideUpdate, onBlockChange],
  );

  const handleListLineHeightChange = useCallback(
    (lineHeight: number) => {
      if (block?.type === "list" && onBlockChange) {
        const currentStyle = (block as ListBlock).style ?? {};
        onBlockChange({
          ...block,
          lineHeight,
          style: {
            ...currentStyle,
            lineHeight,
          },
        } as ListBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleListItemSpacingChange = useCallback(
    (itemSpacing: number) => {
      if (block?.type === "list" && onBlockChange) {
        if (activeListLevel === "all") {
          const currentStyle = (block as ListBlock).style ?? {};
          onBlockChange({
            ...block,
            itemSpacing,
            style: {
              ...currentStyle,
              itemSpacing,
            },
          } as ListBlock);
        } else {
          handleListLevelOverrideUpdate(activeListLevel, (prev) => ({
            ...prev,
            itemSpacing,
          }));
        }
      }
    },
    [activeListLevel, block, handleListLevelOverrideUpdate, onBlockChange],
  );

  const handleListApplyBulkPaste = useCallback(() => {
    if (block?.type === "list" && onBlockChange && bulkPasteText.trim()) {
      const { items: parsed, suggestedListType, suggestedListStyle } =
        parseClipboardTextToList(bulkPasteText);
      if (parsed.length > 0) {
        onBlockChange({
          ...block,
          items: parsed,
          listType: (block as ListBlock).listType ?? suggestedListType,
          listStyle: (block as ListBlock).listStyle ?? suggestedListStyle,
        } as ListBlock);
        toast({ title: `Đã dán thành công ${parsed.length} mục`, color: "success" });
        setBulkPasteText("");
        setShowBulkPasteArea(false);
      }
    }
  }, [block, bulkPasteText, onBlockChange, toast]);

  const handleListItemContentChange = useCallback(
    (itemId: string, content: string) => {
      if (block?.type === "list" && onBlockChange) {
        const nextItems = updateListItemContent((block as ListBlock).items, itemId, content);
        onBlockChange({ ...block, items: nextItems } as ListBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleListMoveItem = useCallback(
    (itemId: string, direction: "up" | "down") => {
      if (block?.type === "list" && onBlockChange) {
        const { items: nextItems, success } = moveListItem(
          (block as ListBlock).items,
          itemId,
          direction,
        );
        if (success) {
          onBlockChange({ ...block, items: nextItems } as ListBlock);
        }
      }
    },
    [block, onBlockChange],
  );

  const handleListIndentItem = useCallback(
    (itemId: string) => {
      if (block?.type === "list" && onBlockChange) {
        const { items: nextItems, success } = indentListItem((block as ListBlock).items, itemId);
        if (success) {
          onBlockChange({ ...block, items: nextItems } as ListBlock);
        }
      }
    },
    [block, onBlockChange],
  );

  const handleListOutdentItem = useCallback(
    (itemId: string) => {
      if (block?.type === "list" && onBlockChange) {
        const { items: nextItems, success } = outdentListItem((block as ListBlock).items, itemId);
        if (success) {
          onBlockChange({ ...block, items: nextItems } as ListBlock);
        }
      }
    },
    [block, onBlockChange],
  );

  const handleListDeleteItem = useCallback(
    (itemId: string) => {
      if (block?.type === "list" && onBlockChange) {
        const { items: nextItems } = deleteListItemInTree((block as ListBlock).items, itemId);
        onBlockChange({ ...block, items: nextItems } as ListBlock);
      }
    },
    [block, onBlockChange],
  );

  const handleListAddItem = useCallback(() => {
    if (block?.type === "list" && onBlockChange) {
      const { items: nextItems } = addListItem((block as ListBlock).items);
      onBlockChange({ ...block, items: nextItems } as ListBlock);
    }
  }, [block, onBlockChange]);

  const handleListToggleCheck = useCallback(
    (itemId: string, checked: boolean) => {
      if (block?.type === "list" && onBlockChange) {
        const toggleInItems = (items: ListItem[]): ListItem[] => {
          return items.map((it) => {
            if (it.id === itemId) {
              return { ...it, checked };
            }
            if (it.children && it.children.length > 0) {
              return { ...it, children: toggleInItems(it.children) };
            }
            return it;
          });
        };
        const nextItems = toggleInItems((block as ListBlock).items);
        onBlockChange({ ...block, items: nextItems } as ListBlock);
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

        {/* List Block Settings */}
        {block.type === "list" && (() => {
          const listBlock = block as ListBlock;
          const currentListType: ListType = listBlock.listType ?? "bullet";
          const currentListStyle: ListStyle =
            listBlock.listStyle ??
            (currentListType === "ordered" ? "decimal" : currentListType === "checklist" ? "checklist" : "disc");
          const normalized = normalizeListItems(listBlock.items);
          const flatItems = flattenListItems(normalized);

          return (
            <div className="space-y-4 border-t border-border/50 pt-3">
              {/* 0. Phạm vi cài đặt Style (Level Scoping) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Phạm vi áp dụng Style
                  </label>
                  {activeListLevel !== "all" && listBlock.style?.levelStyles?.[activeListLevel] && (
                    <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      Đang có tùy biến
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveListLevel("all")}
                    className={`rounded-md border px-1.5 py-1 text-center text-xs font-medium transition-all ${
                      activeListLevel === "all"
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border text-text-muted hover:border-primary/40"
                    }`}
                  >
                    Tất cả cấp
                  </button>
                  {([1, 2, 3] as const).map((lvl) => {
                    const hasCustom = !!listBlock.style?.levelStyles?.[lvl];
                    return (
                      <button
                        key={`lvl-${lvl}`}
                        type="button"
                        onClick={() => setActiveListLevel(lvl)}
                        className={`relative rounded-md border px-1.5 py-1 text-center text-xs font-medium transition-all ${
                          activeListLevel === lvl
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border text-text-muted hover:border-primary/40"
                        }`}
                      >
                        Cấp {lvl}
                        {hasCustom && (
                          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION A: CÀI ĐẶT CHUNG (TẤT CẢ CẤP) */}
              {activeListLevel === "all" ? (
                <>
                  {/* 1. Kiểu danh sách (List Type) */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Kiểu danh sách
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => handleListTypeChange("bullet")}
                        className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
                          currentListType === "bullet"
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border text-text-muted hover:border-primary/40"
                        }`}
                      >
                        • Chấm tròn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleListTypeChange("ordered")}
                        className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
                          currentListType === "ordered"
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border text-text-muted hover:border-primary/40"
                        }`}
                      >
                        1. Thứ tự
                      </button>
                      <button
                        type="button"
                        onClick={() => handleListTypeChange("checklist")}
                        className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
                          currentListType === "checklist"
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border text-text-muted hover:border-primary/40"
                        }`}
                      >
                        ☑ Hộp kiểm
                      </button>
                    </div>
                  </div>

                  {/* 2. Ký hiệu đầu mục (List Style / Marker) */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Ký hiệu đầu mục (Style)
                    </label>
                    <select
                      value={currentListStyle}
                      onChange={(e) => handleListStyleChange(e.target.value as ListStyle)}
                      aria-label="Ký hiệu đầu mục"
                      className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
                    >
                      {currentListType === "bullet" && (
                        <>
                          <option value="disc">Chấm tròn đặc (Disc •)</option>
                          <option value="circle">Chấm tròn rỗng (Circle ◦)</option>
                          <option value="square">Hình vuông (Square ▪)</option>
                        </>
                      )}
                      {currentListType === "ordered" && (
                        <>
                          <option value="decimal">Số thập phân (1, 2, 3)</option>
                          <option value="lower-alpha">Chữ thường (a, b, c)</option>
                          <option value="upper-alpha">Chữ in hoa (A, B, C)</option>
                        </>
                      )}
                      {currentListType === "checklist" && (
                        <option value="checklist">Hộp kiểm việc cần làm (☑ Tasklist)</option>
                      )}
                    </select>
                    <p className="mt-1 text-[10px] text-text-muted">
                      * Danh sách nhiều cấp sẽ tự động luân phiên ký hiệu cấp độ (Level 1 → Level 2 → Level 3).
                    </p>
                  </div>

                  {/* 3. Phông chữ (Font Family) */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Phông chữ (Font Family)
                    </label>
                    <select
                      value={listBlock.style?.fontFamily ?? ""}
                      onChange={(e) =>
                        handleListStyleUpdate((prev) => ({
                          ...prev,
                          fontFamily: e.target.value || undefined,
                        }))
                      }
                      className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
                    >
                      {FONT_FAMILY_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Cỡ chữ & Độ đậm (Typography) */}
                  <div className="space-y-2 rounded-lg border border-border/60 bg-surface-muted/20 p-2.5">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-text-muted">
                          Cỡ chữ (Font Size)
                        </label>
                        <span className="text-[11px] font-bold text-text">
                          {listBlock.style?.fontSize ?? listBlock.fontSize ?? 16}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={36}
                        step={1}
                        value={listBlock.style?.fontSize ?? listBlock.fontSize ?? 16}
                        onChange={(e) => {
                          const fs = parseInt(e.target.value, 10);
                          handleListStyleUpdate((prev) => ({ ...prev, fontSize: fs }));
                        }}
                        className="w-full cursor-pointer accent-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-text-muted">
                        Độ đậm chữ (Font Weight)
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {(
                          [
                            { label: "Thường", value: "normal" },
                            { label: "Vừa", value: "medium" },
                            { label: "Bán đậm", value: "semibold" },
                            { label: "Đậm", value: "bold" },
                          ] as const
                        ).map((fw) => {
                          const active =
                            (listBlock.style?.fontWeight ?? "normal") === fw.value;
                          return (
                            <button
                              key={fw.value}
                              type="button"
                              onClick={() =>
                                handleListStyleUpdate((prev) => ({
                                  ...prev,
                                  fontWeight: fw.value as ListFontWeight,
                                }))
                              }
                              className={`rounded border py-1 text-[10px] font-medium transition-all ${
                                active
                                  ? "border-primary bg-primary/10 font-bold text-primary"
                                  : "border-border text-text-muted hover:border-primary/40"
                              }`}
                            >
                              {fw.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Màu chữ (Text Color) */}
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-text-muted">Màu chữ</label>
                        {listBlock.style?.color && (
                          <button
                            type="button"
                            onClick={() =>
                              handleListStyleUpdate((prev) => {
                                const next = { ...prev };
                                delete next.color;
                                return next;
                              })
                            }
                            className="text-[10px] text-primary hover:underline"
                          >
                            Đặt lại
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {COLOR_PALETTE.map((c) => (
                          <button
                            key={c.label}
                            type="button"
                            title={c.label}
                            onClick={() =>
                              handleListStyleUpdate((prev) => ({
                                ...prev,
                                color: c.value || undefined,
                              }))
                            }
                            className={`h-5 w-5 rounded-full border transition-all ${
                              (listBlock.style?.color ?? "") === c.value
                                ? "scale-110 border-primary ring-2 ring-primary/30"
                                : "border-border hover:scale-105"
                            }`}
                            style={{ backgroundColor: c.value || "#333333" }}
                          />
                        ))}
                        <input
                          type="text"
                          value={listBlock.style?.color ?? ""}
                          onChange={(e) =>
                            handleListStyleUpdate((prev) => ({
                              ...prev,
                              color: e.target.value || undefined,
                            }))
                          }
                          placeholder="#011A42"
                          className="w-20 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-text"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Typography & Spacing & Indentation */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-[11px] font-medium text-text-muted">
                          Độ cao dòng
                        </label>
                        <span className="text-[11px] font-semibold text-text">
                          {listBlock.lineHeight ?? listBlock.style?.lineHeight ?? 1.75}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1.2}
                        max={2.4}
                        step={0.05}
                        value={listBlock.lineHeight ?? listBlock.style?.lineHeight ?? 1.75}
                        onChange={(e) => handleListLineHeightChange(parseFloat(e.target.value))}
                        className="w-full cursor-pointer accent-primary"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-[11px] font-medium text-text-muted">
                          Khoảng cách mục
                        </label>
                        <span className="text-[11px] font-semibold text-text">
                          {listBlock.itemSpacing ?? listBlock.style?.itemSpacing ?? 6}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        step={1}
                        value={listBlock.itemSpacing ?? listBlock.style?.itemSpacing ?? 6}
                        onChange={(e) => handleListItemSpacingChange(parseInt(e.target.value, 10))}
                        className="w-full cursor-pointer accent-primary"
                      />
                    </div>
                  </div>

                  {/* Indentation per depth */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-[11px] font-medium text-text-muted">
                        Độ thụt lề cấp con
                      </label>
                      <span className="text-[11px] font-semibold text-text">
                        {listBlock.style?.indentation ?? 24}px / cấp
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={48}
                      step={2}
                      value={listBlock.style?.indentation ?? 24}
                      onChange={(e) => {
                        const ind = parseInt(e.target.value, 10);
                        handleListStyleUpdate((prev) => ({ ...prev, indentation: ind }));
                      }}
                      className="w-full cursor-pointer accent-primary"
                    />
                  </div>

                  {/* 6. Khung viền & Nền (Container Border & Background) */}
                  <div className="space-y-2 rounded-lg border border-border/60 bg-surface-muted/20 p-2.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Khung viền & Nền khối
                    </span>

                    {/* Background color */}
                    <div>
                      <label className="mb-1 block text-[10px] text-text-muted">Màu nền khối</label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {BG_PALETTE.map((bg) => (
                          <button
                            key={bg.label}
                            type="button"
                            title={bg.label}
                            onClick={() =>
                              handleListStyleUpdate((prev) => ({
                                ...prev,
                                backgroundColor: bg.value || undefined,
                              }))
                            }
                            className={`h-5 w-5 rounded border transition-all ${
                              (listBlock.style?.backgroundColor ?? "") === bg.value
                                ? "scale-110 border-primary ring-2 ring-primary/30"
                                : "border-border hover:scale-105"
                            }`}
                            style={{ backgroundColor: bg.value || "transparent" }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Border Width & Radius & Padding */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <div>
                        <label className="block text-[10px] text-text-muted">
                          Độ dày viền ({listBlock.style?.borderWidth ?? 0}px)
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={6}
                          step={1}
                          value={listBlock.style?.borderWidth ?? 0}
                          onChange={(e) => {
                            const bw = parseInt(e.target.value, 10);
                            handleListStyleUpdate((prev) => ({
                              ...prev,
                              borderWidth: bw,
                              borderColor: bw > 0 ? prev.borderColor ?? "#E2E8F0" : undefined,
                            }));
                          }}
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted">
                          Bo góc ({listBlock.style?.borderRadius ?? 0}px)
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          step={2}
                          value={listBlock.style?.borderRadius ?? 0}
                          onChange={(e) => {
                            const br = parseInt(e.target.value, 10);
                            handleListStyleUpdate((prev) => ({ ...prev, borderRadius: br }));
                          }}
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted">
                          Đệm trong ({listBlock.style?.padding ?? 0}px)
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={24}
                          step={2}
                          value={listBlock.style?.padding ?? 0}
                          onChange={(e) => {
                            const pad = parseInt(e.target.value, 10);
                            handleListStyleUpdate((prev) => ({ ...prev, padding: pad }));
                          }}
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* SECTION B: CÀI ĐẶT RIÊNG CHO TỪNG CẤP (CẤP 1, 2, HOẶC 3) */
                (() => {
                  const level = activeListLevel;
                  const levelOverride = listBlock.style?.levelStyles?.[level];
                  const resolved = resolveListLevelStyle(listBlock, level - 1);

                  return (
                    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                        <div>
                          <span className="text-xs font-bold text-primary">Tùy biến Cấp {level}</span>
                          <p className="text-[10px] text-text-muted">
                            Áp dụng độc lập cho tất cả các mục thuộc cấp độ {level}
                          </p>
                        </div>
                        {levelOverride && (
                          <button
                            type="button"
                            onClick={() => handleResetLevelOverride(level)}
                            className="rounded border border-danger/30 bg-surface px-2 py-1 text-[10px] font-semibold text-danger hover:bg-danger/10"
                          >
                            Xóa tùy biến
                          </button>
                        )}
                      </div>

                      {/* Marker override */}
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-text-muted">
                          Ký hiệu đầu mục Cấp {level}
                        </label>
                        <select
                          value={levelOverride?.marker ?? resolved.marker}
                          onChange={(e) =>
                            handleListLevelOverrideUpdate(level, (prev) => ({
                              ...prev,
                              marker: e.target.value as ListStyle,
                            }))
                          }
                          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
                        >
                          <option value="disc">Chấm tròn đặc (Disc •)</option>
                          <option value="circle">Chấm tròn rỗng (Circle ◦)</option>
                          <option value="square">Hình vuông (Square ▪)</option>
                          <option value="decimal">Số thập phân (1, 2, 3)</option>
                          <option value="lower-alpha">Chữ thường (a, b, c)</option>
                          <option value="upper-alpha">Chữ in hoa (A, B, C)</option>
                          <option value="checklist">Hộp kiểm (☑ Tasklist)</option>
                        </select>
                      </div>

                      {/* Cỡ chữ Cấp {level} */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-text-muted">
                            Cỡ chữ Cấp {level}
                          </label>
                          <span className="text-[11px] font-bold text-text">
                            {levelOverride?.fontSize ?? resolved.fontSize ?? 16}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={12}
                          max={32}
                          step={1}
                          value={levelOverride?.fontSize ?? resolved.fontSize ?? 16}
                          onChange={(e) => {
                            const fs = parseInt(e.target.value, 10);
                            handleListLevelOverrideUpdate(level, (prev) => ({
                              ...prev,
                              fontSize: fs,
                            }));
                          }}
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>

                      {/* Độ đậm chữ Cấp {level} */}
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-text-muted">
                          Độ đậm Cấp {level}
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                          {(
                            [
                              { label: "Thường", value: "normal" },
                              { label: "Vừa", value: "medium" },
                              { label: "Bán đậm", value: "semibold" },
                              { label: "Đậm", value: "bold" },
                            ] as const
                          ).map((fw) => {
                            const active =
                              (levelOverride?.fontWeight ?? resolved.fontWeight ?? "normal") ===
                              fw.value;
                            return (
                              <button
                                key={fw.value}
                                type="button"
                                onClick={() =>
                                  handleListLevelOverrideUpdate(level, (prev) => ({
                                    ...prev,
                                    fontWeight: fw.value as ListFontWeight,
                                  }))
                                }
                                className={`rounded border py-1 text-[10px] font-medium transition-all ${
                                  active
                                    ? "border-primary bg-primary/10 font-bold text-primary"
                                    : "border-border bg-surface text-text-muted hover:border-primary/40"
                                }`}
                              >
                                {fw.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Màu chữ Cấp {level} */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-text-muted">
                            Màu chữ Cấp {level}
                          </label>
                          {levelOverride?.color && (
                            <button
                              type="button"
                              onClick={() =>
                                handleListLevelOverrideUpdate(level, (prev) => {
                                  const next = { ...prev };
                                  delete next.color;
                                  return next;
                                })
                              }
                              className="text-[10px] text-primary hover:underline"
                            >
                              Theo cấp cha
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c.label}
                              type="button"
                              title={c.label}
                              onClick={() =>
                                handleListLevelOverrideUpdate(level, (prev) => ({
                                  ...prev,
                                  color: c.value || undefined,
                                }))
                              }
                              className={`h-5 w-5 rounded-full border transition-all ${
                                (levelOverride?.color ?? resolved.color ?? "") === c.value
                                  ? "scale-110 border-primary ring-2 ring-primary/30"
                                  : "border-border hover:scale-105"
                              }`}
                              style={{ backgroundColor: c.value || "#333333" }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Khoảng cách mục Cấp {level} */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-text-muted">
                            Khoảng cách mục Cấp {level}
                          </label>
                          <span className="text-[11px] font-bold text-text">
                            {levelOverride?.itemSpacing ?? resolved.itemSpacing ?? 6}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={levelOverride?.itemSpacing ?? resolved.itemSpacing ?? 6}
                          onChange={(e) => {
                            const sp = parseInt(e.target.value, 10);
                            handleListLevelOverrideUpdate(level, (prev) => ({
                              ...prev,
                              itemSpacing: sp,
                            }));
                          }}
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  );
                })()
              )}

              {/* 4. Dán nhanh danh sách dài (Bulk Paste / Import) */}
              <div className="rounded-lg border border-border bg-surface-muted/30 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text">Dán danh sách dài</span>
                  <button
                    type="button"
                    onClick={() => setShowBulkPasteArea((prev) => !prev)}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    {showBulkPasteArea ? "Thu gọn" : "Mở khung dán"}
                  </button>
                </div>
                {showBulkPasteArea && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      rows={4}
                      value={bulkPasteText}
                      onChange={(e) => setBulkPasteText(e.target.value)}
                      placeholder={`Dán văn bản nhiều dòng từ Word, Excel, Docs...\nVí dụ:\n- Thửa đất 1\n    - Chi tiết A\n- Thửa đất 2`}
                      className="w-full rounded border border-border bg-surface p-2 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setBulkPasteText("");
                          setShowBulkPasteArea(false);
                        }}
                        className="rounded px-2 py-1 text-[11px] text-text-muted hover:bg-surface-muted"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleListApplyBulkPaste}
                        disabled={!bulkPasteText.trim()}
                        className="rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                      >
                        Chuyển thành danh sách
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Quản lý từng mục (Items hierarchy tree) */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Các mục ({flatItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleListAddItem}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    + Thêm mục
                  </button>
                </div>

                <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                  {flatItems.map((flat, idx) => {
                    const loc = findItemLocation(normalized, flat.item.id);
                    const canMoveUp = loc ? loc.index > 0 : false;
                    const canMoveDown = loc ? loc.index < loc.siblings.length - 1 : false;

                    return (
                      <div
                        key={flat.item.id}
                        className="flex items-center gap-1.5 rounded-md border border-border/70 bg-surface p-1.5 transition-all hover:border-border"
                        style={{ marginLeft: `${Math.min(flat.depth * 14, 56)}px` }}
                      >
                        {/* Marker / Checkbox */}
                        {currentListType === "checklist" ? (
                          <input
                            type="checkbox"
                            checked={!!flat.item.checked}
                            onChange={(e) => handleListToggleCheck(flat.item.id, e.target.checked)}
                            className="h-3.5 w-3.5 cursor-pointer rounded border-border text-primary accent-primary"
                            title={flat.item.checked ? "Đã xong" : "Chưa hoàn thành"}
                          />
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-surface-muted text-[10px] font-bold text-text-muted select-none">
                            {getListMarker(idx, flat.depth, currentListType, currentListStyle)}
                          </span>
                        )}

                        {/* Inline Content Input */}
                        <input
                          type="text"
                          value={flat.item.content}
                          onChange={(e) => handleListItemContentChange(flat.item.id, e.target.value)}
                          placeholder={`Mục cấp ${flat.depth + 1}...`}
                          className="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-xs text-text placeholder:text-text-muted/40 focus:outline-none"
                        />

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-0.5">
                          {/* Move up */}
                          <button
                            type="button"
                            onClick={() => handleListMoveItem(flat.item.id, "up")}
                            disabled={!canMoveUp}
                            title="Di chuyển lên"
                            className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-20"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>

                          {/* Move down */}
                          <button
                            type="button"
                            onClick={() => handleListMoveItem(flat.item.id, "down")}
                            disabled={!canMoveDown}
                            title="Di chuyển xuống"
                            className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-20"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Outdent */}
                          <button
                            type="button"
                            onClick={() => handleListOutdentItem(flat.item.id)}
                            disabled={!flat.canOutdent}
                            title="Lùi một cấp (Giảm thụt lề)"
                            className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-20"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                          </button>

                          {/* Indent */}
                          <button
                            type="button"
                            onClick={() => handleListIndentItem(flat.item.id)}
                            disabled={!flat.canIndent}
                            title="Thụt vào một cấp (Tăng thụt lề)"
                            className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-20"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleListDeleteItem(flat.item.id)}
                            disabled={flatItems.length <= 1}
                            title="Xóa mục này"
                            className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-20"
                          >
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── CTA Block Controls ── */}
        {block.type === "cta" && (() => {
          const cta = block as CtaBlock;
          const buttons = getCtaButtons(cta);
          const currentShape: CtaShape = cta.shape ?? "square";
          const currentAlign: CtaAlign = cta.align ?? "center";
          const currentGap = cta.gap ?? (cta.layout === "flex" ? 8 : 16);
          const currentLayout: CtaLayout =
            cta.layout ?? (cta.align === "between" ? "between" : "flex");
          const isSpaceBetween = currentLayout === "between" || currentAlign === "between";

          return (
            <div className="space-y-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Cấu hình nút kêu gọi (CTA)
                  </label>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {buttons.length} nút
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Hình dáng */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">Hình dáng:</span>
                    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleCtaUpdate({ shape: "square" })}
                        className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          currentShape === "square"
                            ? "bg-primary text-white shadow-xs"
                            : "text-text-muted hover:text-text"
                        }`}
                      >
                        Vuông bo nhẹ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCtaUpdate({ shape: "pill" })}
                        className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          currentShape === "pill"
                            ? "bg-primary text-white shadow-xs"
                            : "text-text-muted hover:text-text"
                        }`}
                      >
                        Viên thuốc
                      </button>
                    </div>
                  </div>

                  {/* Căn lề */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">Căn lề:</span>
                    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
                      {[
                        { id: "center", label: "Giữa" },
                        { id: "start", label: "Trái" },
                        { id: "end", label: "Phải" },
                        { id: "between", label: "Between" },
                      ].map((al) => (
                        <button
                          key={al.id}
                          type="button"
                          onClick={() => {
                            if (al.id === "between") {
                              handleCtaUpdate({ align: "between", layout: "between" });
                            } else {
                              handleCtaUpdate({ align: al.id as CtaAlign, layout: "flex" });
                            }
                          }}
                          className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                            (al.id === "between"
                              ? isSpaceBetween
                              : currentAlign === al.id && !isSpaceBetween)
                              ? "bg-primary text-white shadow-xs"
                              : "text-text-muted hover:text-text"
                          }`}
                        >
                          {al.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Khoảng cách gap */}
                  {!isSpaceBetween && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-text-muted">Khoảng cách:</span>
                      <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
                        {[
                          { label: "4px", val: 4 },
                          { label: "8px", val: 8 },
                          { label: "12px", val: 12 },
                          { label: "16px", val: 16 },
                          { label: "24px", val: 24 },
                        ].map((g) => (
                          <button
                            key={g.val}
                            type="button"
                            onClick={() => handleCtaUpdate({ gap: g.val })}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                              currentGap === g.val
                                ? "bg-primary text-white shadow-xs"
                                : "text-text-muted hover:text-text"
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Thêm nút mới */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const newBtn: CtaButtonItem = {
                          id: `btn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          label: `Nút ${buttons.length + 1}`,
                          url: "/contact",
                          variant: buttons.length % 2 === 1 ? "outline" : "solid",
                        };
                        handleCtaButtonsUpdate([...buttons, newBtn]);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                      </svg>
                      Thêm nút mới
                    </button>
                  </div>
                </div>
              </div>

              {/* Danh sách các nút */}
              <div className="space-y-3">
                {buttons.map((btn, idx) => {
                  const isSolid =
                    (btn.variant ?? (idx === 0 ? "solid" : "outline")) === "solid";

                  return (
                    <div
                      key={btn.id || idx}
                      className="rounded-lg border border-border/80 bg-surface-muted/30 p-2.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text flex items-center gap-1.5">
                          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          Nút #{idx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Variant toggle */}
                          <div className="inline-flex rounded border border-border bg-surface p-0.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...buttons];
                                next[idx] = { ...next[idx], variant: "solid" };
                                handleCtaButtonsUpdate(next);
                              }}
                              className={`px-1.5 py-0.5 rounded transition-colors ${
                                isSolid
                                  ? "bg-primary text-white"
                                  : "text-text-muted hover:text-text"
                              }`}
                            >
                              Solid
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...buttons];
                                next[idx] = { ...next[idx], variant: "outline" };
                                handleCtaButtonsUpdate(next);
                              }}
                              className={`px-1.5 py-0.5 rounded transition-colors ${
                                !isSolid
                                  ? "bg-primary text-white"
                                  : "text-text-muted hover:text-text"
                              }`}
                            >
                              Outline
                            </button>
                          </div>

                          {/* Reorder */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const next = [...buttons];
                              const [moved] = next.splice(idx, 1);
                              next.splice(idx - 1, 0, moved);
                              handleCtaButtonsUpdate(next);
                            }}
                            className="rounded p-0.5 text-text-muted hover:bg-surface hover:text-text disabled:opacity-20"
                            title="Lên trên"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={idx === buttons.length - 1}
                            onClick={() => {
                              const next = [...buttons];
                              const [moved] = next.splice(idx, 1);
                              next.splice(idx + 1, 0, moved);
                              handleCtaButtonsUpdate(next);
                            }}
                            className="rounded p-0.5 text-text-muted hover:bg-surface hover:text-text disabled:opacity-20"
                            title="Xuống dưới"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>

                          {/* Delete */}
                          {buttons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = buttons.filter((_, i) => i !== idx);
                                handleCtaButtonsUpdate(next);
                              }}
                              className="rounded p-0.5 text-danger/80 hover:bg-danger/10 hover:text-danger"
                              title="Xóa nút này"
                            >
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Label input */}
                      <div>
                        <label className="mb-1 block text-[10px] text-text-muted">Nhãn nút</label>
                        <input
                          type="text"
                          value={btn.label || ""}
                          onChange={(e) => {
                            const next = [...buttons];
                            next[idx] = { ...next[idx], label: e.target.value };
                            handleCtaButtonsUpdate(next);
                          }}
                          placeholder="VD: Đăng ký nhu cầu đào tạo"
                          className="w-full rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none"
                        />
                        <div className="mt-1 flex flex-wrap gap-1">
                          {["Đăng ký tư vấn", "Trao đổi trung tâm", "Tìm hiểu thêm"].map(
                            (p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => {
                                  const next = [...buttons];
                                  next[idx] = { ...next[idx], label: p };
                                  handleCtaButtonsUpdate(next);
                                }}
                                className={`rounded border px-1.5 py-0.5 text-[10px] ${
                                  btn.label === p
                                    ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                                    : "border-border bg-surface text-text-muted"
                                }`}
                              >
                                {p}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* URL input */}
                      <div>
                        <label className="mb-1 block text-[10px] text-text-muted">
                          Đường dẫn liên kết (URL)
                        </label>
                        <input
                          type="text"
                          value={btn.url || ""}
                          onChange={(e) => {
                            const next = [...buttons];
                            next[idx] = { ...next[idx], url: e.target.value };
                            handleCtaButtonsUpdate(next);
                          }}
                          placeholder="VD: /contact hoặc https://..."
                          className="w-full rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none font-mono"
                        />
                        <div className="mt-1 flex flex-wrap gap-1">
                          {["/contact", "/programs", "/solutions"].map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => {
                                const next = [...buttons];
                                next[idx] = { ...next[idx], url: u };
                                handleCtaButtonsUpdate(next);
                              }}
                              className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${
                                btn.url === u
                                  ? "border-primary text-primary font-bold"
                                  : "border-border text-text-muted"
                              }`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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
