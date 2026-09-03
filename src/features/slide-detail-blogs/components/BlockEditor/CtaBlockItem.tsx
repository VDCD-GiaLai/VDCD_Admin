import React, { useCallback } from "react";
import { FormInput } from "@/components/ui";
import { useHtmlShortcuts } from "../../hooks/useHtmlShortcuts";
import type { CtaBlock } from "@/types/slide-detail-blog";

interface CtaBlockItemProps {
  block: CtaBlock;
  onChange: (updated: CtaBlock) => void;
}

export function CtaBlockItem({ block, onChange }: CtaBlockItemProps) {
  const handleLabelChange = useCallback(
    (newValue: string) => onChange({ ...block, label: newValue }),
    [block, onChange],
  );

  const { handleKeyDown } = useHtmlShortcuts(handleLabelChange);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInput
          label="Nhãn nút Call to Action"
          isRequired
          placeholder="VD: Liên hệ tư vấn ngay"
          value={block.label}
          onChange={(e) => onChange({ ...block, label: e.target.value })}
          onKeyDown={handleKeyDown}
        />
        <FormInput
          label="Đường dẫn điều hướng (URL)"
          isRequired
          placeholder="VD: /lien-he hoặc https://..."
          value={block.url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2 rounded-md bg-surface-muted p-2.5 text-xs text-text-muted">
        <span className="font-semibold text-text">Xem trước nút:</span>
        <span className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-fg shadow-xs">
          {block.label || "Nút Call to Action"}
        </span>
      </div>
    </div>
  );
}

