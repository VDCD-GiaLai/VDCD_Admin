import React, { useCallback } from "react";
import { FormTextarea } from "@/components/ui";
import { useHtmlShortcuts } from "../../hooks/useHtmlShortcuts";
import type { ParagraphBlock } from "@/types/slide-detail-blog";

interface ParagraphBlockItemProps {
  block: ParagraphBlock;
  onChange: (updated: ParagraphBlock) => void;
}

export function ParagraphBlockItem({ block, onChange }: ParagraphBlockItemProps) {
  const handleTextChange = useCallback(
    (newValue: string) => onChange({ ...block, text: newValue }),
    [block, onChange],
  );

  const { handleKeyDown } = useHtmlShortcuts(handleTextChange);

  return (
    <div className="space-y-2">
      <FormTextarea
        label="Nội dung đoạn văn"
        isRequired
        rows={4}
        placeholder="Nhập nội dung văn bản cho bài viết..."
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        onKeyDown={handleKeyDown}
        helperText="Có thể sử dụng thẻ HTML cơ bản như <strong>chữ đậm</strong>, <em>chữ nghiêng</em>, <a href='...'>liên kết</a>."
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
        <span className="font-medium text-text">Phím tắt:</span>
        <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+B</kbd>
        <span>Đậm</span>
        <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+I</kbd>
        <span>Nghiêng</span>
        <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+U</kbd>
        <span>Gạch chân</span>
      </div>
    </div>
  );
}

