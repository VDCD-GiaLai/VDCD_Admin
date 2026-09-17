"use client";

import React, { memo, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { VisualEditorToolbar } from "./VisualEditorToolbar";
import {
  HeadingBlockRenderer,
  ParagraphBlockRenderer,
  ImageBlockRenderer,
  ListBlockRenderer,
  SectionBlockRenderer,
  CtaBlockRenderer,
} from "../BlogPreview/renderers";
import {
  getCtaButtons,
  type SlideDetailBlogBlock,
  type HeadingBlock,
  type ParagraphBlock,
  type ImageBlock,
  type ListBlock,
  type ListItem,
  type SectionBlock,
  type SectionChildBlock,
  type CtaBlock,
  type QuoteBlock,
  type HighlightBlock,
} from "@/types/slide-detail-blog";
import { createListBlock } from "../../utils/list-helpers";

interface VisualEditorBlockProps {
  block: SlideDetailBlogBlock;
  index: number;
  totalBlocks: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onBlockChange: (index: number, block: SlideDetailBlogBlock) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  /** Called with a fileId when an image block's file is discarded (for soft-delete) */
  onImageDiscard?: (fileId: string) => void;
}

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

function VisualEditorBlockInner({
  block,
  index,
  totalBlocks,
  isSelected,
  onSelect,
  onBlockChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onImageDiscard,
}: VisualEditorBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
      marginTop:
        typeof block.spacing?.marginTop === "number"
          ? `${block.spacing.marginTop}px`
          : undefined,
      marginBottom:
        typeof block.spacing?.marginBottom === "number"
          ? `${block.spacing.marginBottom}px`
          : undefined,
    }),
    [transform, transition, isDragging, block.spacing],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;

      // Do not process clicks inside the toolbar
      if (target.closest(".ve-block-toolbar")) {
        return;
      }

      // Check if user clicked/dragged inside an editable element or has active selection
      const editableEl = target.closest<HTMLElement>(
        '.ve-editable, [contenteditable="true"], input, textarea'
      );
      const hasSelection = !window.getSelection()?.isCollapsed;

      // If user is interacting with text or has selected text, keep block selected but DO NOT collapse or steal focus
      if (editableEl || hasSelection) {
        onSelect(block.id);
        return;
      }

      onSelect(block.id);

      // If clicking inside wrapper background (outside toolbar & buttons), focus the editable element
      if (!target.closest(".ve-block-toolbar") && !target.closest("button")) {
        const editable = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(
          '.ve-editable, [contenteditable="true"], input:not([type="hidden"]), textarea'
        );
        if (editable && document.activeElement !== editable) {
          editable.focus();
        }
      }
    },
    [block.id, onSelect],
  );

  const handleFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      // When an editable element inside this block receives focus, select this block
      if (
        !target.closest(".ve-block-toolbar") &&
        (target.matches?.('.ve-editable, [contenteditable="true"], input, textarea') ||
          Boolean(target.closest?.('.ve-editable, [contenteditable="true"], input, textarea')))
      ) {
        onSelect(block.id);
      }
    },
    [block.id, onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onSelect("");
      }
    },
    [onSelect],
  );

  const blockRef = useRef(block);
  useLayoutEffect(() => {
    blockRef.current = block;
  });

  // Block-specific change handlers
  const handleTextChange = useCallback(
    (text: string) => {
      const currentBlock = blockRef.current;
      if (currentBlock.type === "heading") {
        onBlockChange(index, { ...currentBlock, text } as HeadingBlock);
      } else if (currentBlock.type === "paragraph") {
        onBlockChange(index, { ...currentBlock, text } as ParagraphBlock);
      } else if (currentBlock.type === "quote") {
        onBlockChange(index, { ...currentBlock, text } as QuoteBlock);
      } else if (currentBlock.type === "highlight") {
        onBlockChange(index, { ...currentBlock, text } as HighlightBlock);
      }
    },
    [index, onBlockChange],
  );

  const handleItemsChange = useCallback(
    (items: ListItem[]) => {
      if (block.type === "list") {
        onBlockChange(index, { ...block, items } as ListBlock);
      }
    },
    [block, index, onBlockChange],
  );

  const handleCtaLabelChange = useCallback(
    (label: string) => {
      if (block.type === "cta") {
        const cta = block as CtaBlock;
        const buttons = [...getCtaButtons(cta)];
        if (buttons[0]) buttons[0] = { ...buttons[0], label };
        onBlockChange(index, { ...cta, label, items: buttons } as CtaBlock);
      }
    },
    [block, index, onBlockChange],
  );

  const handleCtaSecondaryLabelChange = useCallback(
    (secondaryLabel: string) => {
      if (block.type === "cta") {
        const cta = block as CtaBlock;
        const buttons = [...getCtaButtons(cta)];
        if (buttons[1]) buttons[1] = { ...buttons[1], label: secondaryLabel };
        onBlockChange(index, { ...cta, secondaryLabel, items: buttons } as CtaBlock);
      }
    },
    [block, index, onBlockChange],
  );

  const handleCtaButtonLabelChange = useCallback(
    (btnIndex: number, label: string) => {
      if (block.type === "cta") {
        const cta = block as CtaBlock;
        const buttons = [...getCtaButtons(cta)];
        if (buttons[btnIndex]) {
          buttons[btnIndex] = { ...buttons[btnIndex], label };
        }
        onBlockChange(index, {
          ...cta,
          items: buttons,
          label: buttons[0]?.label || "",
          secondaryLabel: buttons[1]?.label || undefined,
        } as CtaBlock);
      }
    },
    [block, index, onBlockChange],
  );

  const handleSectionTitleChange = useCallback(
    (title: string) => {
      if (block.type === "section") {
        onBlockChange(index, { ...block, title } as SectionBlock);
      }
    },
    [block, index, onBlockChange],
  );

  const handleSectionChildUpdate = useCallback(
    (childIndex: number, child: SectionChildBlock) => {
      if (block.type === "section") {
        const newChildren = [...(block as SectionBlock).children];
        newChildren[childIndex] = child;
        onBlockChange(index, { ...block, children: newChildren } as SectionBlock);
      }
    },
    [block, index, onBlockChange],
  );

  const handleSectionAddChild = useCallback(
    (childType: SectionChildBlock["type"]) => {
      if (block.type !== "section") return;
      const childId = `sec_child_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      let newChild: SectionChildBlock;
      switch (childType) {
        case "heading":
          newChild = { id: childId, type: "heading", level: 3, text: "" };
          break;
        case "paragraph":
          newChild = { id: childId, type: "paragraph", text: "" };
          break;
        case "image":
          newChild = { id: childId, type: "image", url: "", fileId: null, alt: "", caption: null };
          break;
        case "list":
          newChild = createListBlock({ id: childId });
          break;
      }
      const newChildren = [...(block as SectionBlock).children, newChild];
      onBlockChange(index, { ...block, children: newChildren } as SectionBlock);
    },
    [block, index, onBlockChange],
  );

  const handleSectionDeleteChild = useCallback(
    (childIndex: number) => {
      if (block.type !== "section") return;
      const newChildren = (block as SectionBlock).children.filter((_, i) => i !== childIndex);
      onBlockChange(index, { ...block, children: newChildren } as SectionBlock);
    },
    [block, index, onBlockChange],
  );

  const handleSectionMoveChild = useCallback(
    (childIndex: number, direction: "up" | "down") => {
      if (block.type !== "section") return;
      const currentChildren = (block as SectionBlock).children;
      const targetIndex = direction === "up" ? childIndex - 1 : childIndex + 1;
      if (targetIndex < 0 || targetIndex >= currentChildren.length) return;
      const newChildren = [...currentChildren];
      const [moved] = newChildren.splice(childIndex, 1);
      newChildren.splice(targetIndex, 0, moved);
      onBlockChange(index, { ...block, children: newChildren } as SectionBlock);
    },
    [block, index, onBlockChange],
  );

  const handleImageCaptionChange = useCallback(
    (caption: string) => {
      if (block.type === "image") {
        onBlockChange(index, { ...block, caption: caption || null } as ImageBlock);
      }
    },
    [block, index, onBlockChange],
  );

  const handleImageUpdate = useCallback(
    (url: string, fileId?: string) => {
      if (block.type === "image") {
        // Soft-delete: if replacing image, track old fileId
        const oldFileId = (block as ImageBlock).fileId;
        if (oldFileId && oldFileId !== fileId) {
          onImageDiscard?.(oldFileId);
        }
        onBlockChange(index, {
          ...block,
          url,
          fileId: fileId ?? (block as ImageBlock).fileId,
        } as ImageBlock);
      }
    },
    [block, index, onBlockChange, onImageDiscard],
  );

  const handleImageSelect = useCallback(() => {
    onSelect(block.id);
  }, [block.id, onSelect]);

  // Render the correct shared renderer based on block type
  const renderBlockContent = () => {
    switch (block.type) {
      case "heading":
        return (
          <HeadingBlockRenderer
            block={block as HeadingBlock}
            editable
            onTextChange={handleTextChange}
          />
        );
      case "paragraph":
        return (
          <ParagraphBlockRenderer
            block={block as ParagraphBlock}
            editable
            onTextChange={handleTextChange}
          />
        );
      case "image":
        return (
          <ImageBlockRenderer
            block={block as ImageBlock}
            editable
            onSelect={handleImageSelect}
            onCaptionChange={handleImageCaptionChange}
            onImageUpdate={handleImageUpdate}
            onImageDiscard={onImageDiscard}
          />
        );
      case "list":
        return (
          <ListBlockRenderer
            block={block as ListBlock}
            editable
            onItemsChange={handleItemsChange}
          />
        );
      case "section":
        return (
          <SectionBlockRenderer
            block={block as SectionBlock}
            editable
            onTitleChange={handleSectionTitleChange}
            onChildUpdate={handleSectionChildUpdate}
            onAddChild={handleSectionAddChild}
            onDeleteChild={handleSectionDeleteChild}
            onMoveChild={handleSectionMoveChild}
          />
        );
      case "cta":
        return (
          <CtaBlockRenderer
            block={block as CtaBlock}
            editable
            onLabelChange={handleCtaLabelChange}
            onSecondaryLabelChange={handleCtaSecondaryLabelChange}
            onButtonLabelChange={handleCtaButtonLabelChange}
            onSelect={handleImageSelect}
          />
        );
      case "quote": {
        const quote = block as QuoteBlock;
        return (
          <blockquote className="blog-preview-quote my-4 border-l-4 border-primary pl-4 italic text-text-muted">
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange(e.currentTarget.innerText)}
              className="ve-editable outline-none focus:ring-1 focus:ring-primary/40 rounded px-1"
            >
              {quote.text || "Nội dung trích dẫn..."}
            </div>
            <footer className="mt-1 flex items-center gap-2 text-xs not-italic text-text-muted/80">
              <span>—</span>
              <input
                type="text"
                placeholder="Tác giả"
                value={quote.author || ""}
                onChange={(e) => onBlockChange(index, { ...quote, author: e.target.value })}
                className="bg-transparent border-b border-border/50 focus:border-primary text-xs outline-none py-0.5"
              />
              <input
                type="text"
                placeholder="Nguồn / Chức vụ"
                value={quote.citation || ""}
                onChange={(e) => onBlockChange(index, { ...quote, citation: e.target.value })}
                className="bg-transparent border-b border-border/50 focus:border-primary text-xs outline-none py-0.5"
              />
            </footer>
          </blockquote>
        );
      }
      case "highlight": {
        const hl = block as HighlightBlock;
        return (
          <div className="blog-preview-highlight my-4 rounded-lg border border-primary/20 bg-primary/5 p-4 font-medium text-text">
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange(e.currentTarget.innerText)}
              className="ve-editable outline-none focus:ring-1 focus:ring-primary/40 rounded px-1"
            >
              {hl.text || "Nội dung điểm nhấn..."}
            </div>
          </div>
        );
      }
      default:
        return (
          <div className="rounded-lg border-2 border-dashed border-danger/30 bg-danger/5 px-4 py-6 text-center">
            <p className="text-sm text-danger/70">
              Không thể hiển thị khối này
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Loại: {(block as SlideDetailBlogBlock).type}
            </p>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      id={`block-${block.id}`}
      style={style}
      className={`ve-block-wrapper ${isSelected ? "ve-block-selected" : ""} ${isDragging ? "ve-block-dragging" : ""}`}
      onClick={handleClick}
      onFocusCapture={handleFocusCapture}
      onKeyDown={handleKeyDown}
      role="article"
      tabIndex={-1}
      aria-label={`Khối ${BLOCK_TYPE_LABELS[block.type] || block.type}`}
    >
      {/* Block type label (shown on hover) */}
      <div className="ve-block-type-label">
        {BLOCK_TYPE_LABELS[block.type] || block.type}
      </div>

      {/* Floating toolbar (shown on hover/select) */}
      <VisualEditorToolbar
        onMoveUp={() => onMoveUp(index)}
        onMoveDown={() => onMoveDown(index)}
        onDuplicate={() => onDuplicate(index)}
        onDelete={() => onDelete(index)}
        isFirst={index === 0}
        isLast={index === totalBlocks - 1}
        dragHandleProps={{ ...attributes, ...listeners }}
      />

      {/* Block content via shared renderer */}
      {renderBlockContent()}
    </div>
  );
}

export const VisualEditorBlock = memo(VisualEditorBlockInner);
