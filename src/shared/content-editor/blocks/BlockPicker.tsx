import React from "react";
import type { ContentBlock } from "../model/document.types";

export interface BlockPickerProps {
  onSelect: (type: ContentBlock["type"]) => void;
  onClose?: () => void;
}

interface BlockOption {
  type: ContentBlock["type"];
  title: string;
  description: string;
  icon: React.ReactNode;
}

const BLOCK_OPTIONS: BlockOption[] = [
  {
    type: "heading",
    title: "Tiêu đề mục (Heading)",
    description: "Tiêu đề mục phụ phân cấp H2 hoặc H3",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
        H
      </span>
    ),
  },
  {
    type: "paragraph",
    title: "Đoạn văn (Paragraph)",
    description: "Đoạn văn bản mô tả, hỗ trợ định dạng HTML",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-serif text-lg font-bold text-primary">
        ¶
      </span>
    ),
  },
  {
    type: "image",
    title: "Hình ảnh (Image)",
    description: "Ảnh minh hoạ, tải lên ImageKit hoặc dán URL",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
          <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.22a.75.75 0 00-1.06 0l-1.91 1.91-4.72-4.72a.75.75 0 00-1.06 0L2.5 11.06zm10.25-4.81a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" clipRule="evenodd" />
        </svg>
      </span>
    ),
  },
  {
    type: "list",
    title: "Danh sách (List)",
    description: "Danh sách gạch đầu dòng, số thứ tự, La Mã hoặc checklist",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
          <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 102 0 1 1 0 00-2 0zm0 5.25a1 1 0 102 0 1 1 0 00-2 0zm0 5.25a1 1 0 102 0 1 1 0 00-2 0z" clipRule="evenodd" />
        </svg>
      </span>
    ),
  },
  {
    type: "section",
    title: "Nhóm nội dung (Section)",
    description: "Khối lớn có đánh số (01, 02...) và chứa các mục con",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
          <path fillRule="evenodd" d="M2 4.75C2 3.784 2.784 3 3.75 3h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0116.25 17H3.75A1.75 1.75 0 012 15.25V4.75zm1.75-.25a.25.25 0 00-.25.25v2.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25v-2.5a.25.25 0 00-.25-.25H3.75z" clipRule="evenodd" />
        </svg>
      </span>
    ),
  },
  {
    type: "cta",
    title: "Nút kêu gọi (Call to Action)",
    description: "Nút liên kết điều hướng hoặc đăng ký tư vấn",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
        </svg>
      </span>
    ),
  },
];

export function BlockPicker({ onSelect, onClose }: BlockPickerProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-border bg-surface-muted/50 px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-text">
          Chọn loại khối nội dung cần thêm
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted transition-colors hover:text-text"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {BLOCK_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => onSelect(opt.type)}
            className="flex items-start gap-3 rounded-lg border border-border/80 bg-surface p-3 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-xs"
          >
            {opt.icon}
            <div className="flex-1">
              <p className="text-xs font-semibold text-text">{opt.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-text-muted">
                {opt.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
