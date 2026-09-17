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
  QuoteBlock,
  HighlightBlock,
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
    return null;
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
            case "ordered_list":
              return (
                <ListBlockRenderer
                  block={{ ...block, listType: "ordered" } as unknown as ListBlock}
                />
              );
            case "quote": {
              const quote = block as QuoteBlock;
              return (
                <blockquote className="blog-preview-quote my-4 border-l-4 border-primary pl-4 italic text-text-muted">
                  <p dangerouslySetInnerHTML={{ __html: quote.text }} />
                  {Boolean(quote.author || quote.citation) && (
                    <footer className="mt-1 text-xs not-italic text-text-muted/80">
                      — {[quote.author, quote.citation].filter(Boolean).join(", ")}
                    </footer>
                  )}
                </blockquote>
              );
            }
            case "highlight": {
              const hl = block as HighlightBlock;
              return (
                <div className="blog-preview-highlight my-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-text">
                  <p
                    className="font-medium"
                    dangerouslySetInnerHTML={{ __html: hl.text }}
                  />
                </div>
              );
            }
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
