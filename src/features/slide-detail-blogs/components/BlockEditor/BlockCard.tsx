import React, { useState } from "react";
import { HeadingBlockItem } from "./HeadingBlockItem";
import { ParagraphBlockItem } from "./ParagraphBlockItem";
import { ImageBlockItem } from "./ImageBlockItem";
import { ListBlockItem } from "./ListBlockItem";
import { SectionBlockItem } from "./SectionBlockItem";
import { CtaBlockItem } from "./CtaBlockItem";
import type {
  SlideDetailBlogBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ListBlock,
  SectionBlock,
  CtaBlock,
} from "@/types/slide-detail-blog";

interface BlockCardProps {
  block: SlideDetailBlogBlock;
  index: number;
  totalBlocks: number;
  onChange: (updated: SlideDetailBlogBlock) => void;
  onMove: (direction: "up" | "down") => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function BlockCard({
  block,
  index,
  totalBlocks,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
}: BlockCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getBlockInfo = (type: SlideDetailBlogBlock["type"]) => {
    switch (type) {
      case "heading":
        return { label: "Tiêu đề (Heading)", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" };
      case "paragraph":
        return { label: "Đoạn văn (Paragraph)", badgeColor: "bg-gray-50 text-gray-700 border-gray-200" };
      case "image":
        return { label: "Hình ảnh (Image)", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "list":
        return { label: "Danh sách (List)", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" };
      case "section":
        return { label: "Nhóm nội dung (Section)", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" };
      case "cta":
        return { label: "Nút kêu gọi (CTA)", badgeColor: "bg-rose-50 text-rose-700 border-rose-200" };
    }
  };

  const info = getBlockInfo(block.type);

  // Summary preview for collapsed state
  const getSummary = () => {
    switch (block.type) {
      case "heading":
        return `[H${block.level}] ${block.text || "(Trống)"}`;
      case "paragraph":
        return block.text || "(Trống)";
      case "image":
        return block.url ? `Ảnh: ${block.alt || block.url}` : "(Chưa có URL ảnh)";
      case "list":
        return `${block.items.length} mục`;
      case "section":
        return `[#${block.number}] ${block.title || "(Chưa có tiêu đề)"} • ${block.children.length} khối con`;
      case "cta":
        return `${block.label || "Nút"} → ${block.url || "Chưa có link"}`;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs transition-shadow hover:shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 bg-surface-muted/60 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-5.5 w-5.5 items-center justify-center rounded-md bg-surface text-xs font-bold text-text-muted shadow-xs">
            {index + 1}
          </span>
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${info.badgeColor}`}>
            {info.label}
          </span>
          {isCollapsed && (
            <span className="max-w-[280px] truncate text-xs text-text-muted sm:max-w-md">
              {getSummary()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove("up")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
            title="Di chuyển lên trên"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            disabled={index === totalBlocks - 1}
            onClick={() => onMove("down")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
            title="Di chuyển xuống dưới"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-primary"
            title="Nhân bản khối này"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V14.5A1.5 1.5 0 0115.5 16h-7A1.5 1.5 0 017 14.5v-11z" />
              <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-.75a.75.75 0 00-1.5 0v.75a.25.25 0 01-.25.25h-7a.25.25 0 01-.25-.25v-9a.25.25 0 01.25-.25h.75a.75.75 0 000-1.5h-.75z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            title="Xoá khối"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-4">
          {block.type === "heading" && (
            <HeadingBlockItem
              block={block as HeadingBlock}
              onChange={onChange}
            />
          )}
          {block.type === "paragraph" && (
            <ParagraphBlockItem
              block={block as ParagraphBlock}
              onChange={onChange}
            />
          )}
          {block.type === "image" && (
            <ImageBlockItem
              block={block as ImageBlock}
              onChange={onChange}
            />
          )}
          {block.type === "list" && (
            <ListBlockItem
              block={block as ListBlock}
              onChange={onChange}
            />
          )}
          {block.type === "section" && (
            <SectionBlockItem
              block={block as SectionBlock}
              onChange={onChange}
            />
          )}
          {block.type === "cta" && (
            <CtaBlockItem
              block={block as CtaBlock}
              onChange={onChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
