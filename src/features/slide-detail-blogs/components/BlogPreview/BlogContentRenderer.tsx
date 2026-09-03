import React from "react";
import {
  HeadingBlockRenderer,
  ParagraphBlockRenderer,
  ImageBlockRenderer,
  ListBlockRenderer,
  SectionBlockRenderer,
  CtaBlockRenderer,
} from "./renderers";
import type {
  SlideDetailBlogBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ListBlock,
  SectionBlock,
  CtaBlock,
} from "@/types/slide-detail-blog";

interface BlogContentRendererProps {
  blocks: SlideDetailBlogBlock[];
}

/**
 * Dispatches each block to its corresponding renderer component.
 * Pure rendering — no editor UI, no toolbar, no drag handles.
 * Reads from the same `SlideDetailBlogBlock[]` data structure used by the editor.
 */
export function BlogContentRenderer({ blocks }: BlogContentRendererProps) {
  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-6 w-6"
          >
            <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-sm text-text-muted">
          Bài viết chưa có khối nội dung nào.
        </p>
        <p className="mt-1 text-xs text-text-muted/70">
          Chuyển sang tab &quot;Nội dung&quot; để thêm khối.
        </p>
      </div>
    );
  }

  return (
    <div className="blog-preview-content">
      {blocks.map((block) => {
        const spacingStyle: React.CSSProperties = {
          marginTop:
            typeof block.spacing?.marginTop === "number"
              ? `${block.spacing.marginTop}px`
              : undefined,
          marginBottom:
            typeof block.spacing?.marginBottom === "number"
              ? `${block.spacing.marginBottom}px`
              : undefined,
        };

        const renderBlock = () => {
          switch (block.type) {
            case "heading":
              return <HeadingBlockRenderer block={block as HeadingBlock} />;
            case "paragraph":
              return <ParagraphBlockRenderer block={block as ParagraphBlock} />;
            case "image":
              return <ImageBlockRenderer block={block as ImageBlock} />;
            case "list":
              return <ListBlockRenderer block={block as ListBlock} />;
            case "section":
              return <SectionBlockRenderer block={block as SectionBlock} />;
            case "cta":
              return <CtaBlockRenderer block={block as CtaBlock} />;
            default:
              return null;
          }
        };

        return (
          <div key={block.id} style={spacingStyle}>
            {renderBlock()}
          </div>
        );
      })}
    </div>
  );
}
