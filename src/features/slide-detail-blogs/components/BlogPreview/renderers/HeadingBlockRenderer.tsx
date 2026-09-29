import React, { useRef, useCallback, useMemo } from "react";
import { useSanitizedPaste } from "../../../hooks/useSanitizedPaste";
import { useContentEditableSync } from "../../../hooks/useContentEditableSync";
import type { HeadingBlock } from "@/types/slide-detail-blog";

interface HeadingBlockRendererProps {
  block: HeadingBlock;
  editable?: boolean;
  onTextChange?: (text: string) => void;
}

export function HeadingBlockRenderer({
  block,
  editable,
  onTextChange,
}: HeadingBlockRendererProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const { handlePaste } = useSanitizedPaste({ preserveLineBreaks: false });
  const { handleInput } = useContentEditableSync(ref, {
    html: block.text || "",
    enabled: editable,
    nodeKey: block.level,
  });

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLHeadingElement>) => {
      // If tag is switching (e.g. h2 -> h1) or element is detached from DOM, ignore blur
      if (
        !e.currentTarget ||
        !e.currentTarget.isConnected ||
        e.currentTarget.tagName.toLowerCase() !== `h${block.level}`
      ) {
        return;
      }
      if (onTextChange) {
        const text = e.currentTarget.textContent?.trim() ?? "";
        onTextChange(text ? e.currentTarget.innerHTML : "");
      }
    },
    [block.level, onTextChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        ref.current?.blur();
      }
    },
    [],
  );

  const Tag = `h${block.level}` as const;
  const blockStyle = useMemo(
    () => ({
      fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
      lineHeight: block.lineHeight ? block.lineHeight : undefined,
      color: block.color || undefined,
      backgroundColor: block.backgroundColor || undefined,
      borderColor: block.borderColor || undefined,
      borderWidth: block.borderWidth ? `${block.borderWidth}px` : undefined,
      borderStyle: block.borderColor ? "solid" as const : undefined,
      borderRadius: block.borderRadius ? `${block.borderRadius}px` : undefined,
      padding: block.padding ? `${block.padding}px` : undefined,
      textAlign: block.textAlign || undefined,
    }),
    [block.fontSize, block.lineHeight, block.color, block.backgroundColor, block.borderColor, block.borderWidth, block.borderRadius, block.padding, block.textAlign],
  );

  if (!block.text?.trim() && !editable) {
    return (
      <Tag className="blog-preview-heading italic text-text-muted/50" style={blockStyle}>
        (Tiêu đề trống)
      </Tag>
    );
  }

  if (editable) {
    return (
      <Tag
        ref={ref}
        className="blog-preview-heading ve-editable"
        style={blockStyle}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder="Nhập tiêu đề mục..."
        data-block-id={block.id}
      />
    );
  }

  return (
    <Tag
      className="blog-preview-heading"
      style={blockStyle}
      dangerouslySetInnerHTML={{ __html: block.text }}
    />
  );
}

