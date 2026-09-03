import React, { useCallback } from "react";
import { AppButton } from "@/components/ui";
import { useHtmlShortcuts } from "../../hooks/useHtmlShortcuts";
import type { ListBlock } from "@/types/slide-detail-blog";

interface ListBlockItemProps {
  block: ListBlock;
  onChange: (updated: ListBlock) => void;
}

/** Individual list item input with HTML shortcut support */
function ListItemInput({
  value,
  index,
  onChange,
}: {
  value: string;
  index: number;
  onChange: (newValue: string) => void;
}) {
  const { handleKeyDown } = useHtmlShortcuts(onChange);

  return (
    <input
      type="text"
      className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
      placeholder={`Nội dung mục ${index + 1}...`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}

export function ListBlockItem({ block, onChange }: ListBlockItemProps) {
  const handleItemChange = useCallback(
    (index: number, value: string) => {
      const nextItems = [...block.items];
      nextItems[index] = value;
      onChange({ ...block, items: nextItems });
    },
    [block, onChange],
  );

  const handleAddItem = () => {
    onChange({ ...block, items: [...block.items, ""] });
  };

  const handleRemoveItem = (index: number) => {
    if (block.items.length <= 1) return;
    const nextItems = block.items.filter((_, i) => i !== index);
    onChange({ ...block, items: nextItems });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase text-text-muted">
          Danh sách gạch đầu dòng (Bullet List)
        </label>
        <span className="text-[11px] text-text-muted">
          {block.items.length} mục
        </span>
      </div>

      <div className="space-y-2">
        {block.items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-text-muted">
              •
            </span>
            <ListItemInput
              value={item}
              index={index}
              onChange={(newValue) => handleItemChange(index, newValue)}
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              disabled={block.items.length <= 1}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
              title="Xoá mục này"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <AppButton
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAddItem}
        className="w-full border border-dashed border-border py-1.5 text-xs text-text-muted hover:border-primary hover:text-primary"
      >
        + Thêm dòng vào danh sách
      </AppButton>

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

