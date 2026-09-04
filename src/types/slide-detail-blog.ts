import type { Slide } from "./slide";

// ─── Block Spacing ───────────────────────────────────────────

/** Optional spacing metadata for visual editor. Backward-compatible: omitted = default CSS spacing. */
export interface BlockSpacing {
  marginTop?: number;
  marginBottom?: number;
}

// ─── Block Types ─────────────────────────────────────────────

export interface HeadingBlock {
  id: string;
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  fontSize?: number;
  spacing?: BlockSpacing;
}

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
  fontSize?: number;
  spacing?: BlockSpacing;
}

export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  fileId?: string | null;
  alt?: string;
  caption?: string | null;
  spacing?: BlockSpacing;
}

export interface ListItem {
  id: string;
  content: string;
  children: ListItem[];
  checked?: boolean;
}

export type ListType = "bullet" | "ordered" | "checklist";

export type ListStyle =
  | "disc"
  | "circle"
  | "square"
  | "decimal"
  | "lower-alpha"
  | "upper-alpha"
  | "checklist";

export type ListFontWeight = "normal" | "medium" | "semibold" | "bold";

export interface ListLevelStyle {
  marker?: ListStyle;
  fontSize?: number;
  fontWeight?: ListFontWeight;
  color?: string;
  itemSpacing?: number;
}

export interface ListStyleConfig {
  marker?: ListStyle;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: ListFontWeight;
  color?: string;
  lineHeight?: number;
  itemSpacing?: number;
  indentation?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  levelStyles?: Record<number, ListLevelStyle>;
}

export interface ListBlock {
  id: string;
  type: "list";
  items: ListItem[];
  listType?: ListType;
  listStyle?: ListStyle;
  fontSize?: number;
  lineHeight?: number;
  itemSpacing?: number;
  style?: ListStyleConfig;
  spacing?: BlockSpacing;
}

export type SectionChildBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ListBlock;

export interface SectionBlock {
  id: string;
  type: "section";
  number: string;
  title: string;
  children: SectionChildBlock[];
  spacing?: BlockSpacing;
}

export interface CtaBlock {
  id: string;
  type: "cta";
  label: string;
  url: string;
  fontSize?: number;
  spacing?: BlockSpacing;
}

export type SlideDetailBlogBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ListBlock
  | SectionBlock
  | CtaBlock;


export type HeroPlacement = "above_title" | "between_title_desc" | "below_desc";

/** Hero image display metadata — stored inside content JSON, no DB migration needed. */
export interface HeroMeta {
  /** Placement of the hero image relative to title & description */
  placement?: HeroPlacement;
  /** CSS object-position value (e.g., 'top', 'center', 'bottom') */
  position?: "top" | "center" | "bottom";
  /** Caption displayed below the hero image */
  caption?: string;
}

export interface SlideDetailBlogContent {
  version: number;
  blocks: SlideDetailBlogBlock[];
  heroMeta?: HeroMeta;
}

// ─── Entity Definitions ──────────────────────────────────────

export interface SlideDetailBlog {
  id: string;
  slideId: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  heroImageUrl: string | null;
  heroImageFileId: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  content: SlideDetailBlogContent;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  slide?: Slide;
}

/**
 * Item in the paginated list returned by GET /slide-detail-blogs/all.
 * Notice: excludes `content` for performance optimization.
 */
export interface SlideDetailBlogListItem {
  id: string;
  slideId: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  heroImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  slide?: {
    id: string;
    title: string;
    imageUrl?: string;
  };
}

export interface SlideDetailBlogFilters {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean | "";
}
