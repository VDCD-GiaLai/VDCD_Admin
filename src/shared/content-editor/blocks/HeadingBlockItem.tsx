import React, { useCallback, useRef } from "react";
import { FormInput } from "@/components/ui";
import { useHtmlShortcuts, type FormatAction } from "../paste/useHtmlShortcuts";
import { BlockFormatToolbar } from "./BlockFormatToolbar";
import type { HeadingBlock } from "../model/document.types";

export interface HeadingBlockItemProps {
  block: HeadingBlock;
  onChange: (updated: HeadingBlock) => void;
}

export function HeadingBlockItem({ block, onChange }: HeadingBlockItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = useCallback(
    (newValue: string) => onChange({ ...block, text: newValue }),
    [block, onChange],
  );

  const { handleKeyDown, applyFormat, activeActions, handleSelect } = useHtmlShortcuts(handleTextChange);

  const handleToolbarApply = useCallback(
    (action: FormatAction) => {
      applyFormat(inputRef.current, action);
    },
    [applyFormat],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase text-text-muted">
          Cấp độ tiêu đề:
        </span>
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-surface-muted p-1">
          {([1, 2, 3, 4, 5, 6] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange({ ...block, level: lvl })}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                block.level === lvl
                  ? "bg-surface text-primary shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              H{lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold uppercase text-text-muted">
            Nội dung tiêu đề <span className="text-danger">*</span>
          </label>
          <BlockFormatToolbar onApply={handleToolbarApply} activeActions={activeActions} size="xs" />
        </div>

        <FormInput
          ref={inputRef}
          isRequired
          placeholder="Nhập tiêu đề mục (VD: Tổng quan giải pháp)..."
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          onClick={handleSelect}
          helperText="Sử dụng phím tắt Ctrl+B (Đậm), Ctrl+I (Nghiêng), Ctrl+U (Gạch chân) hoặc thanh công cụ để định dạng."
        />
      </div>
    </div>
  );
}
