import type {
  BlockSpacing,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ListItem,
  ListType,
  ListStyle,
  ListFontWeight,
  ListLevelStyle,
  ListStyleConfig,
  ListBlock,
  SectionChildBlock,
  SectionBlock,
  CtaBlock,
  CtaButtonItem,
  CtaAlign,
  CtaShape,
  CtaVariant,
  CtaLayout,
  SlideDetailBlogBlock,
  HeroPlacement,
  HeroMeta,
  SlideDetailBlogContent,
} from "@/types/slide-detail-blog";

export { getCtaButtons } from "@/types/slide-detail-blog";

export type {
  BlockSpacing,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ListItem,
  ListType,
  ListStyle,
  ListFontWeight,
  ListLevelStyle,
  ListStyleConfig,
  ListBlock,
  SectionChildBlock,
  SectionBlock,
  CtaBlock,
  CtaButtonItem,
  CtaAlign,
  CtaShape,
  CtaVariant,
  CtaLayout,
  HeroPlacement,
  HeroMeta,
};

export interface QuoteBlock {
  id: string;
  type: "quote";
  text: string;
  author?: string | null;
  citation?: string | null;
  fontSize?: number;
  spacing?: BlockSpacing;
}

export interface HighlightBlock {
  id: string;
  type: "highlight";
  text: string;
  style?: string;
  fontSize?: number;
  spacing?: BlockSpacing;
}

/** Unified ContentBlock union type for all rich document models */
export type ContentBlock = SlideDetailBlogBlock | QuoteBlock | HighlightBlock;

/** Unified DocumentContent root structure */
export type DocumentContent = SlideDetailBlogContent;

/** Responsive preview viewport mode for Read-only and Visual editors */
export type ViewportMode = "desktop" | "tablet" | "mobile";
