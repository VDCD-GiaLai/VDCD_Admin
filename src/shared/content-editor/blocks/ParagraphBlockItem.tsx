import React, { useCallback, useRef } from "react";
import { FormTextarea } from "@/components/ui";
import { useHtmlShortcuts, type FormatAction } from "../paste/useHtmlShortcuts";
import { BlockFormatToolbar } from "./BlockFormatToolbar";
import type { ParagraphBlock } from "../model/document.types";

export interface ParagraphBlockItemProps {
  block: ParagraphBlock;
  onChange: (updated: ParagraphBlock) => void;
}

export function ParagraphBlockItem({ block, onChange }: ParagraphBlockItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = useCallback(
    (newValue: string) => onChange({ ...block, text: newValue }),
    [block, onChange],
  );

  const { handleKeyDown, applyFormat, activeActions, handleSelect } = useHtmlShortcuts(handleTextChange);

  const handleToolbarApply = useCallback(
    (action: FormatAction) => {
      applyFormat(textareaRef.current, action);
    },
    [applyFormat],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase text-text-muted">
          Nội dung đoạn văn <span className="text-danger">*</span>
        </label>
        <BlockFormatToolbar onApply={handleToolbarApply} activeActions={activeActions} size="xs" />
      </div>

      <FormTextarea
        ref={textareaRef}
        rows={4}
        placeholder="Nhập nội dung văn bản cho bài viết..."
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        onClick={handleSelect}
        helperText="Có thể sử dụng thẻ HTML cơ bản như <strong>chữ đậm</strong>, <em>chữ nghiêng</em>, <a href='...'>liên kết</a>."
      />
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-text-muted">
        <span className="font-medium text-text">Phím tắt:</span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+B</kbd>
          <span>Đậm</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+I</kbd>
          <span>Nghiêng</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+U</kbd>
          <span>Gạch chân</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+Shift+X</kbd>
          <span>Gạch ngang</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+Shift+C</kbd>
          <span>Mã</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+Shift+H</kbd>
          <span>Highlight</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+K</kbd>
          <span>Link</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+\</kbd>
          <span>Xóa định dạng</span>
        </span>
      </div>
    </div>
  );
}
