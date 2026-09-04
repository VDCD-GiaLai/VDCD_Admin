import React, { useState, useRef, useEffect, useCallback } from "react";
import { AppButton } from "@/components/ui";
import { BlockCard } from "./BlockCard";
import { BlockPicker } from "./BlockPicker";
import type {
  SlideDetailBlogContent,
  SlideDetailBlogBlock,
} from "@/types/slide-detail-blog";
import { createListBlock } from "../../utils/list-helpers";

interface BlockEditorProps {
  value: SlideDetailBlogContent;
  onChange: (value: SlideDetailBlogContent) => void;
}

const generateId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  // insertIndex: number = insert before that index, "end" = append at end, null = picker hidden
  const [insertIndex, setInsertIndex] = useState<number | "end" | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const showPicker = insertIndex !== null;
  const blocks = value?.blocks ?? [];

  // Auto-scroll the picker into view when it appears
  useEffect(() => {
    if (showPicker && pickerRef.current) {
      pickerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [showPicker, insertIndex]);

  const handleOpenPicker = useCallback((index?: number) => {
    setInsertIndex(typeof index === "number" ? index : "end");
  }, []);

  const handleClosePicker = useCallback(() => {
    setInsertIndex(null);
  }, []);

  const handleSelectBlockType = (type: SlideDetailBlogBlock["type"]) => {
    let newBlock: SlideDetailBlogBlock;

    switch (type) {
      case "heading":
        newBlock = {
          id: generateId("h"),
          type: "heading",
          level: 2,
          text: "",
        };
        break;
      case "paragraph":
        newBlock = {
          id: generateId("p"),
          type: "paragraph",
          text: "",
        };
        break;
      case "image":
        newBlock = {
          id: generateId("img"),
          type: "image",
          url: "",
          fileId: null,
          alt: "",
          caption: null,
        };
        break;
      case "list":
        newBlock = createListBlock({ id: generateId("ls") });
        break;
      case "section":
        newBlock = {
          id: generateId("sec"),
          type: "section",
          number: String(blocks.filter((b) => b.type === "section").length + 1).padStart(2, "0"),
          title: "",
          children: [],
        };
        break;
      case "cta":
        newBlock = {
          id: generateId("cta"),
          type: "cta",
          label: "Liên hệ tư vấn",
          url: "/lien-he",
        };
        break;
    }

    const nextBlocks = [...blocks];
    if (typeof insertIndex === "number") {
      nextBlocks.splice(insertIndex, 0, newBlock);
    } else {
      nextBlocks.push(newBlock);
    }

    onChange({
      ...value,
      blocks: nextBlocks,
    });

    setInsertIndex(null);
  };

  const handleUpdateBlock = (index: number, updated: SlideDetailBlogBlock) => {
    const nextBlocks = [...blocks];
    nextBlocks[index] = updated;
    onChange({
      ...value,
      blocks: nextBlocks,
    });
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const nextBlocks = [...blocks];
    const [moved] = nextBlocks.splice(index, 1);
    nextBlocks.splice(targetIndex, 0, moved);

    onChange({
      ...value,
      blocks: nextBlocks,
    });
  };

  const handleDuplicateBlock = (index: number) => {
    const original = blocks[index];
    // Deep clone with new id
    const cloned: SlideDetailBlogBlock = JSON.parse(JSON.stringify(original));
    cloned.id = generateId(cloned.type.slice(0, 3));
    if (cloned.type === "section") {
      cloned.children = cloned.children.map((child) => ({
        ...child,
        id: generateId(child.type.slice(0, 3)),
      }));
    }

    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, cloned);

    onChange({
      ...value,
      blocks: nextBlocks,
    });
  };

  const handleDeleteBlock = (index: number) => {
    const nextBlocks = blocks.filter((_, i) => i !== index);
    onChange({
      ...value,
      blocks: nextBlocks,
    });
  };

  /** Inline picker rendered at the insertion point */
  const renderInlinePicker = () => (
    <div ref={pickerRef} className="my-3 scroll-mt-4">
      <BlockPicker
        onSelect={handleSelectBlockType}
        onClose={handleClosePicker}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text">
            Nội dung bài viết theo khối ({blocks.length} khối)
          </h3>
          <p className="text-xs text-text-muted">
            Tạo bài viết bằng cách kết hợp các khối: tiêu đề, đoạn văn, ảnh, danh sách, nhóm section và nút kêu gọi.
          </p>
        </div>

        <AppButton
          type="button"
          size="sm"
          onClick={() => handleOpenPicker()}
          className="gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Thêm khối
        </AppButton>
      </div>

      {/* Blocks List */}
      {blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/30 p-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-text">Bài viết chưa có nội dung</h4>
          <p className="mt-1 max-w-sm text-xs text-text-muted">
            Bắt đầu xây dựng nội dung bài viết bằng cách thêm khối tiêu đề, đoạn văn hoặc section.
          </p>
          <AppButton
            type="button"
            size="sm"
            onClick={() => handleOpenPicker()}
            className="mt-4"
          >
            + Thêm khối nội dung đầu tiên
          </AppButton>

          {/* Inline picker for empty state */}
          {showPicker && renderInlinePicker()}
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <React.Fragment key={block.id || index}>
              {/* Inline picker: insert BEFORE this block */}
              {showPicker && insertIndex === index && renderInlinePicker()}

              <BlockCard
                block={block}
                index={index}
                totalBlocks={blocks.length}
                onChange={(updated) => handleUpdateBlock(index, updated)}
                onMove={(direction) => handleMoveBlock(index, direction)}
                onDuplicate={() => handleDuplicateBlock(index)}
                onDelete={() => handleDeleteBlock(index)}
              />

              {/* Inline Insert separator */}
              <div className="group relative flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-transparent group-hover:border-primary/20" />
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPicker(index + 1)}
                  className={`relative items-center gap-1 rounded-full border border-primary/30 bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-xs transition-transform hover:scale-105 hover:bg-primary/5 ${
                    showPicker && insertIndex === index + 1
                      ? "hidden"
                      : "hidden group-hover:inline-flex"
                  }`}
                >
                  + Chèn khối tại đây
                </button>
              </div>
            </React.Fragment>
          ))}

          {/* Inline picker: append at end */}
          {showPicker && (insertIndex === "end" || insertIndex === blocks.length) && renderInlinePicker()}

          {/* Bottom Add button */}
          <div className="pt-2">
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenPicker()}
              className="w-full border border-dashed border-border py-2.5 text-xs text-text-muted hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              + Thêm khối nội dung ở cuối
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
}
