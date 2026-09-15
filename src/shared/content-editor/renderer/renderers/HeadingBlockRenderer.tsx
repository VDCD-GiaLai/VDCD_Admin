import React, { useRef, useCallback, useMemo } from "react";
import { useSanitizedPaste } from "../../paste/useSanitizedPaste";
import { useContentEditableSync } from "../../hooks/useContentEditableSync";
import type { HeadingBlock } from "../../model/document.types";

export interface HeadingBlockRendererProps {
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
  });

  const handleBlur = useCallback(() => {
    if (ref.current && onTextChange) {
      const text = ref.current.textContent?.trim() ?? "";
      onTextChange(text ? ref.current.innerHTML : "");
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
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder="Nhập tiêu đề mục..."
      />
    );
  }

  return (
    <Tag
      className="blog-preview-heading"
      style={fontStyle}
      dangerouslySetInnerHTML={{ __html: block.text }}
    />
  );
}
