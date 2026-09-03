import React, { useRef, useCallback, useMemo } from "react";
import { useSanitizedPaste } from "../../../hooks/useSanitizedPaste";
import type { ParagraphBlock } from "@/types/slide-detail-blog";

interface ParagraphBlockRendererProps {
  block: ParagraphBlock;
  editable?: boolean;
  onTextChange?: (text: string) => void;
}

export function ParagraphBlockRenderer({
  block,
  editable,
  onTextChange,
}: ParagraphBlockRendererProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { handlePaste } = useSanitizedPaste({ preserveLineBreaks: true });
  const fontStyle = useMemo(
    () => (block.fontSize ? { fontSize: `${block.fontSize}px` } : undefined),
    [block.fontSize],
  );

  const handleBlur = useCallback(() => {
    if (ref.current && onTextChange) {
      const text = ref.current.textContent?.trim() ?? "";
      onTextChange(text ? ref.current.innerHTML : "");
    }
  }, [onTextChange]);

  if (!block.text?.trim() && !editable) {
    return (
      <p className="blog-preview-paragraph italic text-text-muted/50" style={fontStyle}>
        (Đoạn văn trống)
      </p>
    );
  }

  if (editable) {
    return (
      <p
        ref={ref}
        className="blog-preview-paragraph ve-editable"
        style={fontStyle}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onPaste={handlePaste}
        data-placeholder="Nhập nội dung đoạn văn..."
        dangerouslySetInnerHTML={{ __html: block.text || "" }}
      />
    );
  }

  return (
    <p
      className="blog-preview-paragraph"
      style={fontStyle}
      dangerouslySetInnerHTML={{ __html: block.text }}
    />
  );
}

