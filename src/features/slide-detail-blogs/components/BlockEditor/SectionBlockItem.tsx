import React, { useState } from "react";
import { FormInput, AppButton } from "@/components/ui";
import { HeadingBlockItem } from "./HeadingBlockItem";
import { ParagraphBlockItem } from "./ParagraphBlockItem";
import { ImageBlockItem } from "./ImageBlockItem";
import { ListBlockItem } from "./ListBlockItem";
import type {
  SectionBlock,
  SectionChildBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ListBlock,
} from "@/types/slide-detail-blog";

interface SectionBlockItemProps {
  block: SectionBlock;
  onChange: (updated: SectionBlock) => void;
}

const generateId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;

export function SectionBlockItem({ block, onChange }: SectionBlockItemProps) {
  const [showChildPicker, setShowChildPicker] = useState(false);

  const handleAddChild = (type: "heading" | "paragraph" | "image" | "list") => {
    let newChild: SectionChildBlock;
    if (type === "heading") {
      newChild = {
        id: generateId("h"),
        type: "heading",
        level: 3,
        text: "",
      };
    } else if (type === "paragraph") {
      newChild = {
        id: generateId("p"),
        type: "paragraph",
        text: "",
      };
    } else if (type === "image") {
      newChild = {
        id: generateId("img"),
        type: "image",
        url: "",
        fileId: null,
        alt: "",
        caption: null,
      };
    } else {
      newChild = {
        id: generateId("ls"),
        type: "list",
        items: [""],
      };
    }

    onChange({
      ...block,
      children: [...block.children, newChild],
    });
    setShowChildPicker(false);
  };

  const handleUpdateChild = (index: number, updated: SectionChildBlock) => {
    const nextChildren = [...block.children];
    nextChildren[index] = updated;
    onChange({ ...block, children: nextChildren });
  };

  const handleMoveChild = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= block.children.length) return;

    const nextChildren = [...block.children];
    const [moved] = nextChildren.splice(index, 1);
    nextChildren.splice(targetIndex, 0, moved);
    onChange({ ...block, children: nextChildren });
  };

  const handleDeleteChild = (index: number) => {
    const nextChildren = block.children.filter((_, i) => i !== index);
    onChange({ ...block, children: nextChildren });
  };

  const getChildTypeLabel = (type: SectionChildBlock["type"]) => {
    switch (type) {
      case "heading":
        return "Tiêu đề con";
      case "paragraph":
        return "Đoạn văn";
      case "image":
        return "Hình ảnh";
      case "list":
        return "Danh sách";
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header Inputs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <FormInput
            label="Số thứ tự"
            isRequired
            placeholder="VD: 01"
            value={block.number}
            onChange={(e) => onChange({ ...block, number: e.target.value })}
          />
        </div>
        <div className="sm:col-span-3">
          <FormInput
            label="Tiêu đề Section"
            isRequired
            placeholder="VD: Khảo sát và đo đạc hiện trạng..."
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
        </div>
      </div>

      {/* Children list */}
      <div className="space-y-3 rounded-lg border border-border/80 bg-surface-muted/40 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-text-muted">
            Khối nội dung con bên trong section ({block.children.length})
          </span>
          <AppButton
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowChildPicker(!showChildPicker)}
            className="text-xs text-primary hover:bg-primary/10"
          >
            {showChildPicker ? "Đóng chọn khối" : "+ Thêm khối con"}
          </AppButton>
        </div>

        {/* Child picker */}
        {showChildPicker && (
          <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-surface p-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => handleAddChild("heading")}
              className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-muted/50 p-2 text-xs font-medium text-text transition-colors hover:border-primary hover:text-primary"
            >
              <span>H</span> Tiêu đề
            </button>
            <button
              type="button"
              onClick={() => handleAddChild("paragraph")}
              className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-muted/50 p-2 text-xs font-medium text-text transition-colors hover:border-primary hover:text-primary"
            >
              <span>¶</span> Đoạn văn
            </button>
            <button
              type="button"
              onClick={() => handleAddChild("image")}
              className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-muted/50 p-2 text-xs font-medium text-text transition-colors hover:border-primary hover:text-primary"
            >
              <span>🖼</span> Hình ảnh
            </button>
            <button
              type="button"
              onClick={() => handleAddChild("list")}
              className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-muted/50 p-2 text-xs font-medium text-text transition-colors hover:border-primary hover:text-primary"
            >
              <span>•</span> Danh sách
            </button>
          </div>
        )}

        {/* Render child blocks */}
        {block.children.length === 0 ? (
          <div className="py-4 text-center text-xs text-text-muted">
            Section chưa có nội dung con. Bấm &quot;+ Thêm khối con&quot; để thêm tiêu đề, đoạn văn, ảnh hoặc danh sách.
          </div>
        ) : (
          <div className="space-y-3">
            {block.children.map((child, index) => (
              <div
                key={child.id}
                className="rounded-lg border border-border bg-surface p-3 shadow-xs"
              >
                {/* Child header */}
                <div className="mb-2.5 flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-muted text-[10px] font-bold text-text-muted">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-text">
                      {getChildTypeLabel(child.type)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveChild(index, "up")}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:opacity-30"
                      title="Lên trên"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={index === block.children.length - 1}
                      onClick={() => handleMoveChild(index, "down")}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:opacity-30"
                      title="Xuống dưới"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChild(index)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      title="Xoá khối con này"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Child content */}
                {child.type === "heading" && (
                  <HeadingBlockItem
                    block={child as HeadingBlock}
                    onChange={(updated) => handleUpdateChild(index, updated)}
                  />
                )}
                {child.type === "paragraph" && (
                  <ParagraphBlockItem
                    block={child as ParagraphBlock}
                    onChange={(updated) => handleUpdateChild(index, updated)}
                  />
                )}
                {child.type === "image" && (
                  <ImageBlockItem
                    block={child as ImageBlock}
                    onChange={(updated) => handleUpdateChild(index, updated)}
                  />
                )}
                {child.type === "list" && (
                  <ListBlockItem
                    block={child as ListBlock}
                    onChange={(updated) => handleUpdateChild(index, updated)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
