import React, { useCallback } from "react";
import { FormInput } from "@/components/ui";
import { useHtmlShortcuts } from "../paste/useHtmlShortcuts";
import type { HeadingBlock } from "../model/document.types";

export interface HeadingBlockItemProps {
  block: HeadingBlock;
  onChange: (updated: HeadingBlock) => void;
}

export function HeadingBlockItem({ block, onChange }: HeadingBlockItemProps) {
  const handleTextChange = useCallback(
    (newValue: string) => onChange({ ...block, text: newValue }),
    [block, onChange],
  );

  const { handleKeyDown } = useHtmlShortcuts(handleTextChange);

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

      <FormInput
        label="Nội dung tiêu đề"
        isRequired
        placeholder="Nhập tiêu đề mục (VD: Tổng quan giải pháp)..."
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
