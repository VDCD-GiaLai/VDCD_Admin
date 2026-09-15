import React, { useRef, useCallback, useMemo } from "react";
import { useSanitizedPaste } from "../../../hooks/useSanitizedPaste";
import { useContentEditableSync } from "../../../hooks/useContentEditableSync";
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
  const { handleInput } = useContentEditableSync(ref, {
    html: block.text || "",
    enabled: editable,
  });
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
        onInput={handleInput}
        onBlur={handleBlur}
        onPaste={handlePaste}
        data-placeholder="Nhập nội dung đoạn văn..."
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

