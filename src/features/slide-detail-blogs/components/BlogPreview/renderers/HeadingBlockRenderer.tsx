import React, { useRef, useCallback, useMemo } from "react";
import { useSanitizedPaste } from "../../../hooks/useSanitizedPaste";
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

  const handleBlur = useCallback(() => {
    if (ref.current && onTextChange) {
      onTextChange(ref.current.textContent ?? "");
    }
  }, [onTextChange]);

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
  const fontStyle = useMemo(
    () => (block.fontSize ? { fontSize: `${block.fontSize}px` } : undefined),
    [block.fontSize],
  );

  if (!block.text?.trim() && !editable) {
    return (
      <Tag className="blog-preview-heading italic text-text-muted/50" style={fontStyle}>
        (Tiêu đề trống)
      </Tag>
    );
  }

  if (editable) {
    return (
      <Tag
        ref={ref}
        className="blog-preview-heading ve-editable"
        style={fontStyle}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder="Nhập tiêu đề mục..."
        dangerouslySetInnerHTML={{ __html: block.text || "" }}
      />
    );
  }

  return <Tag className="blog-preview-heading" style={fontStyle}>{block.text}</Tag>;
}

