import React, { useRef, useCallback, useMemo } from "react";
import { useSanitizedPaste } from "../../paste/useSanitizedPaste";
import { useContentEditableSync } from "../../hooks/useContentEditableSync";
import type { ParagraphBlock } from "../../model/document.types";

export interface ParagraphBlockRendererProps {
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
  const blockStyle = useMemo(
    () => ({
      fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
      lineHeight: block.lineHeight ? block.lineHeight : undefined,
      color: block.color || undefined,
      backgroundColor: block.backgroundColor || undefined,
      borderColor: block.borderColor || undefined,
      borderWidth: block.borderWidth ? `${block.borderWidth}px` : undefined,
      borderStyle: block.borderColor ? "solid" : undefined,
      borderRadius: block.borderRadius ? `${block.borderRadius}px` : undefined,
      padding: block.padding ? `${block.padding}px` : undefined,
      textIndent: block.indent ? `${block.indent}px` : undefined,
      textAlign: block.textAlign || undefined,
    }),
    [
      block.fontSize,
      block.lineHeight,
      block.color,
      block.backgroundColor,
      block.borderColor,
      block.borderWidth,
      block.borderRadius,
      block.padding,
      block.indent,
      block.textAlign,
    ],
  );

  const handleBlur = useCallback(() => {
    if (ref.current && onTextChange) {
      const text = ref.current.textContent?.trim() ?? "";
      onTextChange(text ? ref.current.innerHTML : "");
    }
  }, [onTextChange]);

  if (!block.text?.trim() && !editable) {
    return (
      <p className="blog-preview-paragraph italic text-text-muted/50" style={blockStyle}>
        (Đoạn văn trống)
      </p>
    );
  }

  if (editable) {
    return (
      <p
        ref={ref}
        className="blog-preview-paragraph ve-editable"
        style={blockStyle}
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
      style={blockStyle}
      dangerouslySetInnerHTML={{ __html: block.text }}
    />
  );
}
