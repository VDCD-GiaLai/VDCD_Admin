"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo, Fragment } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { VisualEditorBlock } from "./VisualEditorBlock";
import { InsertZone } from "./InsertZone";
import { PropertyPanel } from "./PropertyPanel";
import { useEditorHistory } from "./useEditorHistory";
import { BlockPicker } from "../BlockEditor/BlockPicker";
import { validateImageFile, type UploadResult } from "@/lib/upload";
import { useSlideDetailBlogUpload } from "../../context/SlideDetailBlogUploadContext";
import { useSanitizedPaste } from "../../hooks/useSanitizedPaste";
import { Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import type {
  SlideDetailBlogContent,
  SlideDetailBlogBlock,
  HeroMeta,
  HeroPlacement,
} from "@/types/slide-detail-blog";

type ViewportMode = "desktop" | "tablet" | "mobile";

interface VisualEditorCanvasProps {
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  heroImageUrl?: string | null;
  content: SlideDetailBlogContent;
  onContentChange: (content: SlideDetailBlogContent) => void;
  onTitleChange: (title: string) => void;
  onSubtitleChange: (subtitle: string) => void;
  onExcerptChange: (excerpt: string) => void;
  onHeroImageChange?: (url: string, fileId?: string) => void;
}

const VIEWPORT_CONFIG: Record<ViewportMode, { label: string; maxWidth: string; icon: React.ReactNode }> = {
  desktop: {
    label: "Desktop",
    maxWidth: "max-w-4xl",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5H3.5v-7.5zM5 13.5h10v-.25a.75.75 0 00-.75-.75H5.75a.75.75 0 00-.75.75v.25z" clipRule="evenodd" />
      </svg>
    ),
  },
  tablet: {
    label: "Tablet",
    maxWidth: "max-w-2xl",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M5 1a3 3 0 00-3 3v12a3 3 0 003 3h10a3 3 0 003-3V4a3 3 0 00-3-3H5zm5 15.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
  },
  mobile: {
    label: "Mobile",
    maxWidth: "max-w-sm",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M8 16.25a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75z" />
        <path fillRule="evenodd" d="M4 4a3 3 0 013-3h6a3 3 0 013 3v12a3 3 0 01-3 3H7a3 3 0 01-3-3V4zm3-1.5A1.5 1.5 0 005.5 4v12A1.5 1.5 0 007 17.5h6a1.5 1.5 0 001.5-1.5V4A1.5 1.5 0 0013 2.5H7z" clipRule="evenodd" />
      </svg>
    ),
  },
};

/** Generate a unique block ID */
function generateBlockId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `blk_${crypto.randomUUID()}`;
  }
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Create a new default block by type */
function createDefaultBlock(
  type: SlideDetailBlogBlock["type"],
  existingBlocks: SlideDetailBlogBlock[] = [],
): SlideDetailBlogBlock {
  const id = generateBlockId();
  switch (type) {
    case "heading":
      return { id, type: "heading", level: 2, text: "" };
    case "paragraph":
      return { id, type: "paragraph", text: "" };
    case "image":
      return { id, type: "image", url: "", fileId: null, alt: "", caption: null };
    case "list":
      return { id, type: "list", items: [""] };
    case "section": {
      const sectionCount = existingBlocks.filter((b) => b.type === "section").length;
      return {
        id,
        type: "section",
        number: String(sectionCount + 1).padStart(2, "0"),
        title: "",
        children: [],
      };
    }
    case "cta":
      return { id, type: "cta", label: "Liên hệ tư vấn", url: "/lien-he" };
    default:
      return { id, type: "paragraph", text: "" };
  }
}

export function VisualEditorCanvas({
  title,
  subtitle,
  excerpt,
  heroImageUrl,
  content,
  onContentChange,
  onTitleChange,
  onSubtitleChange,
  onExcerptChange,
  onHeroImageChange,
}: VisualEditorCanvasProps) {
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { subfolder, uploadBlogImage } = useSlideDetailBlogUpload();
  const { handlePaste: handleMetaPaste } = useSanitizedPaste({ preserveLineBreaks: false });

  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const excerptRef = useRef<HTMLParagraphElement>(null);
  const heroCaptionRef = useRef<HTMLElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const blocks = useMemo(() => content.blocks ?? [], [content.blocks]);
  const heroMeta = content?.heroMeta;
  const heroPlacement = heroMeta?.placement ?? "above_title";
  const heroPosition = heroMeta?.position ?? "center";
  const heroCaption = heroMeta?.caption ?? "";
  const currentConfig = VIEWPORT_CONFIG[viewport];

  // ── History ──
  const { pushState, undo, redo, canUndo, canRedo } = useEditorHistory(content, onContentChange);

  // ── Block IDs for dnd-kit ──
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  // ── DnD sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Selected block reference ──
  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  );

  // ── Block operations ──
  const updateBlocks = useCallback(
    (newBlocks: SlideDetailBlogBlock[]) => {
      onContentChange({ ...content, blocks: newBlocks });
    },
    [content, onContentChange],
  );

  const handleBlockChange = useCallback(
    (index: number, updatedBlock: SlideDetailBlogBlock) => {
      pushState();
      const newBlocks = [...blocks];
      newBlocks[index] = updatedBlock;
      updateBlocks(newBlocks);
    },
    [blocks, pushState, updateBlocks],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      pushState();
      updateBlocks(arrayMove(blocks, index, index - 1));
    },
    [blocks, pushState, updateBlocks],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= blocks.length - 1) return;
      pushState();
      updateBlocks(arrayMove(blocks, index, index + 1));
    },
    [blocks, pushState, updateBlocks],
  );

  const focusBlock = useCallback((blockId: string) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const blockElement = document.getElementById(`block-${blockId}`);
        if (blockElement) {
          blockElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
          const editable = blockElement.querySelector<HTMLElement>(
            '[contenteditable="true"], input:not([type="hidden"]), textarea'
          );
          if (editable) {
            editable.focus();
            try {
              const selection = window.getSelection();
              if (selection) {
                const range = document.createRange();
                range.selectNodeContents(editable);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            } catch {
              // ignore if selection range fails on certain elements
            }
          }
        }
      });
    });
  }, []);

  const handleDuplicate = useCallback(
    (index: number) => {
      pushState();
      const original = blocks[index];
      const clone: SlideDetailBlogBlock = JSON.parse(JSON.stringify(original));
      clone.id = generateBlockId();
      // Also regenerate IDs for section children
      if (clone.type === "section") {
        clone.children = clone.children.map((child) => ({
          ...child,
          id: generateBlockId(),
        }));
      }
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, clone);
      updateBlocks(newBlocks);
      setSelectedBlockId(clone.id);
      focusBlock(clone.id);
    },
    [blocks, focusBlock, pushState, updateBlocks],
  );

  const handleDelete = useCallback(
    (index: number) => {
      pushState();
      const newBlocks = blocks.filter((_, i) => i !== index);
      updateBlocks(newBlocks);
      setSelectedBlockId("");
    },
    [blocks, pushState, updateBlocks],
  );

  const handleInsert = useCallback(
    (atIndex: number, type: SlideDetailBlogBlock["type"]) => {
      pushState();
      const newBlock = createDefaultBlock(type, blocks);
      const newBlocks = [...blocks];
      newBlocks.splice(atIndex, 0, newBlock);
      updateBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
      focusBlock(newBlock.id);
    },
    [blocks, focusBlock, pushState, updateBlocks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      pushState();
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      updateBlocks(arrayMove(blocks, oldIndex, newIndex));
    },
    [blocks, pushState, updateBlocks],
  );

  const handlePropertyPanelChange = useCallback(
    (updatedBlock: SlideDetailBlogBlock) => {
      const index = blocks.findIndex((b) => b.id === updatedBlock.id);
      if (index === -1) return;
      pushState();
      const newBlocks = [...blocks];
      newBlocks[index] = updatedBlock;
      updateBlocks(newBlocks);
    },
    [blocks, pushState, updateBlocks],
  );

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // Undo/Redo (always active)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete selected block (only when not editing text)
      if (!isEditing && selectedBlockId && selectedBlockId !== "hero" && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        const index = blocks.findIndex((b) => b.id === selectedBlockId);
        if (index !== -1) handleDelete(index);
        return;
      }

      // Escape to deselect
      if (e.key === "Escape") {
        setSelectedBlockId("");
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [undo, redo, selectedBlockId, blocks, handleDelete]);

  // ── Hero text blur handlers ──
  const handleTitleBlur = useCallback(() => {
    if (titleRef.current) onTitleChange(titleRef.current.textContent ?? "");
  }, [onTitleChange]);

  const handleSubtitleBlur = useCallback(() => {
    if (subtitleRef.current) onSubtitleChange(subtitleRef.current.textContent ?? "");
  }, [onSubtitleChange]);

  const handleExcerptBlur = useCallback(() => {
    if (excerptRef.current) onExcerptChange(excerptRef.current.textContent ?? "");
  }, [onExcerptChange]);

  // ── Hero meta handlers ──
  const updateHeroMeta = useCallback(
    (updates: Partial<HeroMeta>) => {
      pushState();
      onContentChange({
        ...content,
        heroMeta: { ...content.heroMeta, ...updates },
      });
    },
    [content, onContentChange, pushState],
  );

  const handleHeroPlacementChange = useCallback(
    (placement: HeroPlacement) => {
      updateHeroMeta({ placement });
    },
    [updateHeroMeta],
  );

  const handleHeroPositionChange = useCallback(
    (position: HeroMeta["position"]) => {
      updateHeroMeta({ position });
    },
    [updateHeroMeta],
  );

  const handleHeroCaptionBlur = useCallback(() => {
    if (heroCaptionRef.current) {
      updateHeroMeta({ caption: heroCaptionRef.current.textContent ?? "" });
    }
  }, [updateHeroMeta]);

  // ── Direct Hero Image File Upload ──
  const handleHeroFileUpload = useCallback(
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

      setIsUploadingHero(true);
      try {
        const result: UploadResult = await uploadBlogImage(file);
        onHeroImageChange(result.url, result.fileId);
        toast({ title: "Tải ảnh hero thành công", color: "success" });
      } catch {
        toast({ title: "Tải ảnh hero thất bại", color: "danger" });
      } finally {
        setIsUploadingHero(false);
        if (heroFileInputRef.current) {
          heroFileInputRef.current.value = "";
        }
      }
    },
    [onHeroImageChange, toast, uploadBlogImage],
  );

  // ── Subcomponents for Hero rendering in configurable layout order ──

  const renderHeroHeader = () => (
    <div className="space-y-2">
      {/* Editable subtitle */}
      <p
        ref={subtitleRef}
        className="blog-preview-subtitle ve-editable"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleSubtitleBlur}
        onPaste={handleMetaPaste}
        data-placeholder="Subtitle (tuỳ chọn)"
      >
        {subtitle || ""}
      </p>

      {/* Editable title */}
      <h1
        ref={titleRef}
        className="blog-preview-title ve-editable"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleTitleBlur}
        onPaste={handleMetaPaste}
        data-placeholder="Nhập tiêu đề bài viết..."
      >
        {title || ""}
      </h1>
    </div>
  );

  const renderHeroExcerpt = () => (
    <div>
      {/* Editable excerpt */}
      <p
        ref={excerptRef}
        className="blog-preview-excerpt ve-editable"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleExcerptBlur}
        onPaste={handleMetaPaste}
        data-placeholder="Mô tả ngắn (tuỳ chọn)"
      >
        {excerpt || ""}
      </p>
    </div>
  );

  const renderHeroMedia = () => (
    <div
      className={`relative group/hero transition-all ${
        selectedBlockId === "hero" ? "ring-2 ring-primary rounded-lg" : ""
      }`}
      onClick={() => setSelectedBlockId("hero")}
    >
      <input
        ref={heroFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleHeroFileUpload}
      />

      {heroImageUrl ? (
        <div className="blog-preview-hero-image-wrapper relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl}
            alt={title || "Hero"}
            className="blog-preview-hero-image"
            style={{ objectPosition: heroPosition }}
          />

          {/* Uploading overlay */}
          {isUploadingHero && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white z-20">
              <Spinner size="lg" />
              <span className="mt-2 text-xs font-semibold">Đang tải ảnh hero mới lên...</span>
            </div>
          )}

          {/* Placement & Position controls toolbar */}
          <div className="ve-hero-position-controls" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Replace hero image button */}
              <button
                type="button"
                onClick={() => heroFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-md backdrop-blur-sm transition-transform hover:scale-105 hover:bg-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5 text-primary"
                >
                  <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                Thay ảnh bìa
              </button>

              <div className="inline-flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md p-1 border border-white/20">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80 px-1.5">
                  Vị trí:
                </span>
                <button
                  type="button"
                  onClick={() => handleHeroPlacementChange("above_title")}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                    heroPlacement === "above_title"
                      ? "bg-primary text-white shadow-sm font-semibold"
                      : "text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                  title="Đặt ảnh bìa ở trên tiêu đề"
                >
                  ⬆ Trên tiêu đề
                </button>
                <button
                  type="button"
                  onClick={() => handleHeroPlacementChange("between_title_desc")}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                    heroPlacement === "between_title_desc"
                      ? "bg-primary text-white shadow-sm font-semibold"
                      : "text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                  title="Đặt ảnh bìa giữa tiêu đề và mô tả"
                >
                  ⬍ Giữa tiêu đề & mô tả
                </button>
                <button
                  type="button"
                  onClick={() => handleHeroPlacementChange("below_desc")}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                    heroPlacement === "below_desc"
                      ? "bg-primary text-white shadow-sm font-semibold"
                      : "text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                  title="Đặt ảnh bìa ở dưới mô tả"
                >
                  ⬇ Dưới mô tả
                </button>
              </div>

              {/* Object position */}
              <div className="inline-flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md p-1 border border-white/20">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80 px-1.5">
                  Khung:
                </span>
                {(["top", "center", "bottom"] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleHeroPositionChange(pos)}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                      heroPosition === pos
                        ? "bg-white text-gray-900 shadow-sm font-semibold"
                        : "text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {pos === "top" ? "Trên" : pos === "center" ? "Giữa" : "Dưới"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-muted/30 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
          onClick={(e) => {
            e.stopPropagation();
            heroFileInputRef.current?.click();
          }}
        >
          {isUploadingHero ? (
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <span className="text-xs text-text-muted">Đang tải ảnh bìa lên...</span>
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
              <span className="text-xs font-semibold text-text">
                Nhấn để tải ảnh bìa Hero từ máy tính (thư mục /vdcd/slides/{subfolder})
              </span>
              <span className="text-[11px] text-text-muted">
                Hỗ trợ JPG, PNG, WebP, GIF (tối đa 10MB)
              </span>
            </>
          )}
        </div>
      )}

      {/* Hero caption (only displayed when hero image exists) */}
      {heroImageUrl && (
        <figcaption
          ref={heroCaptionRef}
          className="blog-preview-hero-caption ve-editable"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleHeroCaptionBlur}
          onPaste={handleMetaPaste}
          onClick={(e) => e.stopPropagation()}
          data-placeholder="Thêm chú thích ảnh bìa..."
        >
          {heroCaption}
        </figcaption>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Top toolbar: viewport + undo/redo ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Viewport selector */}
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5">
            {(Object.entries(VIEWPORT_CONFIG) as [ViewportMode, typeof VIEWPORT_CONFIG[ViewportMode]][]).map(
              ([mode, config]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewport(mode)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    viewport === mode
                      ? "bg-surface font-semibold text-primary shadow-xs"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  {config.icon}
                  {config.label}
                </button>
              ),
            )}
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Hoàn tác (Ctrl+Z)"
              title="Hoàn tác (Ctrl+Z)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Làm lại (Ctrl+Shift+Z)"
              title="Làm lại (Ctrl+Shift+Z)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06l4.146 3.958H6.375a5.375 5.375 0 000 10.75H9.25a.75.75 0 000-1.5H6.375a3.875 3.875 0 010-7.75h10.003l-4.146 3.957a.75.75 0 001.036 1.085l5.5-5.25a.75.75 0 000-1.085l-5.5-5.25a.75.75 0 00-1.06.025z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <span className="text-[11px] text-text-muted">
          {blocks.length} khối nội dung
        </span>
      </div>

      {/* ── Canvas + Property Panel ── */}
      <div className="flex gap-4">
        {/* Canvas area */}
        <div className="flex-1 rounded-xl border border-border bg-surface-muted/30 p-4 sm:p-6 lg:p-8" ref={canvasRef}>
          {/* Browser chrome */}
          <div className="mb-4 flex items-center gap-1.5 pb-3 border-b border-border/60">
            <div className="h-2.5 w-2.5 rounded-full bg-danger/40" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/40" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/40" />
            <div className="ml-3 flex-1 rounded-md bg-surface-muted px-3 py-1">
              <span className="text-[10px] text-text-muted/60">vdcd.vn/slide-detail-blogs/...</span>
            </div>
          </div>

          {/* Article container */}
          <div className={`${currentConfig.maxWidth} mx-auto bg-surface rounded-lg shadow-xs border border-border/50 transition-all duration-300 relative`}>
            {/* Hero Section with 3 placement modes */}
            <div className="blog-preview-hero">
              {heroPlacement === "above_title" && (
                <>
                  {renderHeroMedia()}
                  <div className="blog-preview-hero-text">
                    {renderHeroHeader()}
                    {renderHeroExcerpt()}
                  </div>
                </>
              )}

              {heroPlacement === "between_title_desc" && (
                <>
                  <div className="blog-preview-hero-text pb-3">
                    {renderHeroHeader()}
                  </div>
                  {renderHeroMedia()}
                  <div className="blog-preview-hero-text pt-3">
                    {renderHeroExcerpt()}
                  </div>
                </>
              )}

              {heroPlacement === "below_desc" && (
                <>
                  <div className="blog-preview-hero-text">
                    {renderHeroHeader()}
                    {renderHeroExcerpt()}
                  </div>
                  {renderHeroMedia()}
                </>
              )}
            </div>

            {/* Content Body with blocks */}
            <div className="blog-preview-body">
              {blocks.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-muted">Chưa có nội dung</p>
                  <div className="mt-4">
                    <BlockPicker
                      onSelect={(type) => handleInsert(0, type)}
                    />
                  </div>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                    <div className="blog-preview-content">
                      {/* Insert zone at top */}
                      <InsertZone onInsert={(type) => handleInsert(0, type)} />

                      {blocks.map((block, index) => (
                        <Fragment key={block.id}>
                          <VisualEditorBlock
                            block={block}
                            index={index}
                            totalBlocks={blocks.length}
                            isSelected={selectedBlockId === block.id}
                            onSelect={setSelectedBlockId}
                            onBlockChange={handleBlockChange}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                          />
                          {/* Insert zone after each block */}
                          <InsertZone onInsert={(type) => handleInsert(index + 1, type)} />
                        </Fragment>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        {/* Property Panel (right sidebar) */}
        {selectedBlockId === "hero" ? (
          <PropertyPanel
            heroMeta={content?.heroMeta}
            heroImageUrl={heroImageUrl}
            onHeroMetaChange={updateHeroMeta}
            onHeroImageChange={onHeroImageChange}
            onClose={() => setSelectedBlockId("")}
          />
        ) : selectedBlock ? (
          <PropertyPanel
            block={selectedBlock}
            onBlockChange={handlePropertyPanelChange}
            onClose={() => setSelectedBlockId("")}
          />
        ) : null}
      </div>
    </div>
  );
}
