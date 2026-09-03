import React, { useRef, useCallback, useMemo } from "react";
import { useSanitizedPaste } from "../../../hooks/useSanitizedPaste";
import type { ListBlock } from "@/types/slide-detail-blog";

interface ListBlockRendererProps {
  block: ListBlock;
  editable?: boolean;
  onItemsChange?: (items: string[]) => void;
}

export function ListBlockRenderer({
  block,
  editable,
  onItemsChange,
}: ListBlockRendererProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const { handlePaste } = useSanitizedPaste({ preserveLineBreaks: false });
  const fontStyle = useMemo(
    () => (block.fontSize ? { fontSize: `${block.fontSize}px` } : undefined),
    [block.fontSize],
  );

  const handleBlur = useCallback(() => {
    if (listRef.current && onItemsChange) {
      const items: string[] = [];
      listRef.current.querySelectorAll("li").forEach((li) => {
        const text = li.textContent?.trim() ?? "";
        if (text) items.push(text);
      });
      if (items.length > 0) onItemsChange(items);
    }
  }, [onItemsChange]);

  const nonEmptyItems = block.items.filter((item) => item.trim());

  if (nonEmptyItems.length === 0 && !editable) {
    return (
      <div className="blog-preview-list italic text-text-muted/50" style={fontStyle}>
        (Danh sách trống)
      </div>
    );
  }

  const displayItems = nonEmptyItems.length > 0 ? nonEmptyItems : ["Mục mới"];

  if (editable) {
    return (
      <ul
        ref={listRef}
        className="blog-preview-list ve-editable"
        style={fontStyle}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onPaste={handlePaste}
      >
        {displayItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="blog-preview-list" style={fontStyle}>
      {nonEmptyItems.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

