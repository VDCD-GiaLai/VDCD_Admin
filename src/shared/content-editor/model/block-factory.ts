import type {
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ListBlock,
  SectionBlock,
  CtaBlock,
  QuoteBlock,
  HighlightBlock,
  DocumentContent,
  ListType,
  ListStyle,
  ListStyleConfig,
} from "./document.types";
import { generateListItemId } from "../paste/list-helpers";

export function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export function createHeadingBlock(options?: {
  id?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  text?: string;
  fontSize?: number;
}): HeadingBlock {
  return {
    id: options?.id ?? generateId("blk_h"),
    type: "heading",
    level: options?.level ?? 2,
    text: options?.text ?? "",
    ...(options?.fontSize ? { fontSize: options.fontSize } : {}),
  };
}

export function createParagraphBlock(options?: {
  id?: string;
  text?: string;
  fontSize?: number;
}): ParagraphBlock {
  return {
    id: options?.id ?? generateId("blk_p"),
    type: "paragraph",
    text: options?.text ?? "",
    ...(options?.fontSize ? { fontSize: options.fontSize } : {}),
  };
}

export function createImageBlock(options?: {
  id?: string;
  url?: string;
  alt?: string;
  caption?: string | null;
  fileId?: string | null;
}): ImageBlock {
  return {
    id: options?.id ?? generateId("blk_img"),
    type: "image",
    url: options?.url ?? "",
    alt: options?.alt ?? "",
    caption: options?.caption ?? null,
    fileId: options?.fileId ?? null,
  };
}

export function createListBlock(options?: {
  id?: string;
  initialTexts?: string[];
  listType?: ListType;
  listStyle?: ListStyle;
  fontSize?: number;
  lineHeight?: number;
  itemSpacing?: number;
  style?: ListStyleConfig;
}): ListBlock {
  const blockId = options?.id ?? generateId("blk_ls");
  const items = options?.initialTexts && options.initialTexts.length > 0
    ? options.initialTexts.map((text) => ({
        id: generateListItemId(),
        content: text,
        children: [],
      }))
    : [{ id: generateListItemId(), content: "", children: [] }];

  return {
    id: blockId,
    type: "list",
    items,
    listType: options?.listType ?? "bullet",
    listStyle: options?.listStyle ?? (options?.listType === "ordered" ? "decimal" : "disc"),
    ...(options?.fontSize ? { fontSize: options.fontSize } : {}),
    ...(options?.lineHeight ? { lineHeight: options.lineHeight } : {}),
    ...(options?.itemSpacing ? { itemSpacing: options.itemSpacing } : {}),
    ...(options?.style ? { style: options.style } : {}),
  };
}

export function createSectionBlock(options?: {
  id?: string;
  number?: string;
  title?: string;
}): SectionBlock {
  return {
    id: options?.id ?? generateId("blk_sec"),
    type: "section",
    number: options?.number ?? "01",
    title: options?.title ?? "",
    children: [],
  };
}

export function createCtaBlock(options?: {
  id?: string;
  label?: string;
  url?: string;
  fontSize?: number;
}): CtaBlock {
  return {
    id: options?.id ?? generateId("blk_cta"),
    type: "cta",
    label: options?.label ?? "Xem thêm",
    url: options?.url ?? "",
    ...(options?.fontSize ? { fontSize: options.fontSize } : {}),
  };
}

export function createQuoteBlock(options?: {
  id?: string;
  text?: string;
  author?: string | null;
  citation?: string | null;
  fontSize?: number;
}): QuoteBlock {
  return {
    id: options?.id ?? generateId("blk_q"),
    type: "quote",
    text: options?.text ?? "",
    author: options?.author ?? null,
    citation: options?.citation ?? null,
    ...(options?.fontSize ? { fontSize: options.fontSize } : {}),
  };
}

export function createHighlightBlock(options?: {
  id?: string;
  text?: string;
  style?: string;
  fontSize?: number;
}): HighlightBlock {
  return {
    id: options?.id ?? generateId("blk_hl"),
    type: "highlight",
    text: options?.text ?? "",
    style: options?.style,
    ...(options?.fontSize ? { fontSize: options.fontSize } : {}),
  };
}

export function createDefaultDocumentContent(): DocumentContent {
  return {
    version: 1,
    blocks: [],
    heroMeta: {
      placement: "above_title",
      position: "center",
      caption: "",
    },
  };
}
