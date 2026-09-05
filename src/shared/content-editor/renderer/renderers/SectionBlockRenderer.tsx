import React, { useRef, useCallback } from "react";
import { useSanitizedPaste } from "../../paste/useSanitizedPaste";
import { HeadingBlockRenderer } from "./HeadingBlockRenderer";
import { ParagraphBlockRenderer } from "./ParagraphBlockRenderer";
import { ImageBlockRenderer } from "./ImageBlockRenderer";
import { ListBlockRenderer } from "./ListBlockRenderer";
import type {
  SectionBlock,
  SectionChildBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ListBlock,
} from "../../model/document.types";

export interface SectionBlockRendererProps {
  block: SectionBlock;
  editable?: boolean;
  onTitleChange?: (title: string) => void;
  onChildUpdate?: (childIndex: number, child: SectionChildBlock) => void;
  onAddChild?: (type: SectionChildBlock["type"]) => void;
  onDeleteChild?: (childIndex: number) => void;
  onMoveChild?: (childIndex: number, direction: "up" | "down") => void;
}

export function SectionBlockRenderer({
  block,
  editable,
  onTitleChange,
  onChildUpdate,
  onAddChild,
  onDeleteChild,
  onMoveChild,
}: SectionBlockRendererProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { handlePaste } = useSanitizedPaste({ preserveLineBreaks: false });

  const handleTitleBlur = useCallback(() => {
    if (titleRef.current && onTitleChange) {
      onTitleChange(titleRef.current.textContent ?? "");
    }
  }, [onTitleChange]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      titleRef.current?.blur();
    }
  }, []);

  return (
    <section className="blog-preview-section">
      {/* Section header with number + title */}
      <div className="blog-preview-section-header">
        <span className="blog-preview-section-number">{block.number}</span>
        {editable ? (
          <h2
            ref={titleRef}
            className="blog-preview-section-title ve-editable"
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            onPaste={handlePaste}
            data-placeholder="Nhập tiêu đề nhóm nội dung..."
            dangerouslySetInnerHTML={{ __html: block.title || "" }}
          />
        ) : (
          <h2 className="blog-preview-section-title">
            {block.title || (
              <span className="italic text-text-muted/50">
                (Chưa có tiêu đề section)
              </span>
            )}
          </h2>
        )}
      </div>

      {/* Section children */}
      {block.children.length === 0 ? (
        editable ? (
          <div className="mt-2 rounded-lg border border-dashed border-border bg-surface/50 p-4 text-center">
            <p className="mb-2.5 text-xs text-text-muted">
              Nhóm nội dung chưa có khối con nào
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onAddChild?.("paragraph")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:border-primary hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                + Đoạn văn
              </button>
              <button
                type="button"
                onClick={() => onAddChild?.("heading")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:border-primary hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                + Tiêu đề con
              </button>
              <button
                type="button"
                onClick={() => onAddChild?.("image")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:border-primary hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                + Hình ảnh
              </button>
              <button
                type="button"
                onClick={() => onAddChild?.("list")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:border-primary hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                + Danh sách
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm italic text-text-muted/50">
            (Section chưa có nội dung)
          </p>
        )
      ) : (
        <div className="blog-preview-section-body space-y-3">
          {block.children.map((child, childIndex) => (
            <div key={child.id} className="relative group/child">
              {editable && (
                <div className="absolute -top-3 right-2 z-10 hidden group-hover/child:flex items-center gap-0.5 rounded-md border border-border bg-surface px-1 py-0.5 shadow-xs">
                  <span className="text-[10px] text-text-muted font-medium px-1">
                    {child.type === "heading" ? "Tiêu đề" : child.type === "paragraph" ? "Đoạn văn" : child.type === "image" ? "Ảnh" : "Danh sách"}
                  </span>
                  {childIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => onMoveChild?.(childIndex, "up")}
                      className="p-1 text-text-muted hover:text-text rounded transition-colors"
                      title="Di chuyển lên"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  {childIndex < block.children.length - 1 && (
                    <button
                      type="button"
                      onClick={() => onMoveChild?.(childIndex, "down")}
                      className="p-1 text-text-muted hover:text-text rounded transition-colors"
                      title="Di chuyển xuống"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteChild?.(childIndex)}
                    className="p-1 text-danger/70 hover:text-danger rounded transition-colors"
                    title="Xoá khối con"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.75.75v7a.75.75 0 01-1.5 0v-7a.75.75 0 01.75-.75zm3.59 0a.75.75 0 01.75.75v7a.75.75 0 01-1.5 0v-7a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {child.type === "heading" && (
                <HeadingBlockRenderer
                  block={child as HeadingBlock}
                  editable={editable}
                  onTextChange={
                    editable
                      ? (text) =>
                          onChildUpdate?.(childIndex, {
                            ...(child as HeadingBlock),
                            text,
                          })
                      : undefined
                  }
                />
              )}
              {child.type === "paragraph" && (
                <ParagraphBlockRenderer
                  block={child as ParagraphBlock}
                  editable={editable}
                  onTextChange={
                    editable
                      ? (text) =>
                          onChildUpdate?.(childIndex, {
                            ...(child as ParagraphBlock),
                            text,
                          })
                      : undefined
                  }
                />
              )}
              {child.type === "image" && (
                <ImageBlockRenderer
                  block={child as ImageBlock}
                  editable={editable}
                  onImageUpdate={
                    editable
                      ? (url, fileId) =>
                          onChildUpdate?.(childIndex, {
                            ...(child as ImageBlock),
                            url,
                            fileId: fileId ?? (child as ImageBlock).fileId,
                          })
                      : undefined
                  }
                  onCaptionChange={
                    editable
                      ? (caption) =>
                          onChildUpdate?.(childIndex, {
                            ...(child as ImageBlock),
                            caption,
                          })
                      : undefined
                  }
                />
              )}
              {child.type === "list" && (
                <ListBlockRenderer
                  block={child as ListBlock}
                  editable={editable}
                  onItemsChange={
                    editable
                      ? (items) =>
                          onChildUpdate?.(childIndex, {
                            ...(child as ListBlock),
                            items,
                          })
                      : undefined
                  }
                />
              )}
            </div>
          ))}

          {editable && (
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Thêm khối vào nhóm:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAddChild?.("paragraph")}
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  + Đoạn văn
                </button>
                <button
                  type="button"
                  onClick={() => onAddChild?.("heading")}
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  + Tiêu đề
                </button>
                <button
                  type="button"
                  onClick={() => onAddChild?.("image")}
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  + Ảnh
                </button>
                <button
                  type="button"
                  onClick={() => onAddChild?.("list")}
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  + Danh sách
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
