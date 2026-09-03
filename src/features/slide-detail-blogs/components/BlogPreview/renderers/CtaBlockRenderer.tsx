import React, { useRef, useCallback, useMemo } from "react";
import { useSanitizedPaste } from "../../../hooks/useSanitizedPaste";
import type { CtaBlock } from "@/types/slide-detail-blog";

interface CtaBlockRendererProps {
  block: CtaBlock;
  editable?: boolean;
  onLabelChange?: (label: string) => void;
  onSelect?: () => void;
}

export function CtaBlockRenderer({
  block,
  editable,
  onLabelChange,
  onSelect,
}: CtaBlockRendererProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const { handlePaste } = useSanitizedPaste({ preserveLineBreaks: false });
  const fontStyle = useMemo(
    () => (block.fontSize ? { fontSize: `${block.fontSize}px` } : undefined),
    [block.fontSize],
  );

  const handleBlur = useCallback(() => {
    if (labelRef.current && onLabelChange) {
      onLabelChange(labelRef.current.textContent ?? "");
    }
  }, [onLabelChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      labelRef.current?.blur();
    }
  }, []);

  return (
    <div
      className={`blog-preview-cta ${editable ? "cursor-pointer" : ""}`}
      onClick={editable ? onSelect : undefined}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
    >
      {editable ? (
        <span
          ref={labelRef}
          className="blog-preview-cta-button ve-editable"
          style={fontStyle}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onClick={(e) => e.stopPropagation()}
          data-placeholder="Nút Call to Action"
          dangerouslySetInnerHTML={{ __html: block.label || "" }}
        />
      ) : (
        <span className="blog-preview-cta-button" style={fontStyle}>
          {block.label || "Nút Call to Action"}
        </span>
      )}
      {block.url && (
        <span className="mt-1.5 block text-xs text-text-muted">
          → {block.url}
        </span>
      )}
    </div>
  );
}

