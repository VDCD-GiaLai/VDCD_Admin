import type {
  SlideDetailBlogContent,
  SlideDetailBlogBlock,
  ListItem,
  SectionBlock,
  SectionChildBlock,
  ListBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  QuoteBlock,
  HighlightBlock,
  CtaBlock,
  ListType,
  ListStyle,
  BlockSpacing,
} from "@/types/slide-detail-blog";
import { generateListItemId } from "./list-helpers";

const VALID_TEXT_ALIGN = new Set(["left", "center", "right", "justify"]);
const VALID_LIST_STYLES = new Set<ListStyle>([
  "disc",
  "circle",
  "square",
  "decimal",
  "lower-alpha",
  "upper-alpha",
  "lower-roman",
  "upper-roman",
  "checklist",
]);

function generateUniqueBlockId(prefix = "blk"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeSpacing(spacing: unknown): BlockSpacing | undefined {
  if (!spacing || typeof spacing !== "object") return undefined;
  const raw = spacing as Record<string, unknown>;
  const marginTop =
    typeof raw.marginTop === "number" && Number.isFinite(raw.marginTop)
      ? Math.max(0, raw.marginTop)
      : undefined;
  const marginBottom =
    typeof raw.marginBottom === "number" && Number.isFinite(raw.marginBottom)
      ? Math.max(0, raw.marginBottom)
      : undefined;
  if (marginTop === undefined && marginBottom === undefined) return undefined;
  return {
    ...(marginTop !== undefined ? { marginTop } : {}),
    ...(marginBottom !== undefined ? { marginBottom } : {}),
  };
}

function clampOptionalNumber(
  val: unknown,
  min: number,
  max: number,
): number | undefined {
  if (typeof val !== "number" || !Number.isFinite(val)) return undefined;
  return Math.min(max, Math.max(min, val));
}

/**
 * Recursively sanitizes list items to ensure:
 * 1. Both `content` and `text` properties are always populated with non-empty strings.
 * 2. Empty/whitespace-only items without children are pruned when other valid items exist.
 * 3. If all items in the list are empty, a single fallback item ("Mục danh sách") is retained.
 * 4. `item.text` is NEVER undefined or empty string, completely eliminating backend
 *    `Item text không được để trống` validation errors.
 */
export function sanitizeListItems(items: unknown): ListItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    const id = generateListItemId();
    return [{ id, content: "Mục danh sách", text: "Mục danh sách", children: [] }];
  }

  const cleanItem = (raw: unknown): ListItem | null => {
    if (!raw || typeof raw !== "object") {
      if (typeof raw === "string" && raw.trim()) {
        const text = raw.trim();
        return { id: generateListItemId(), content: text, text, children: [] };
      }
      return null;
    }

    const obj = raw as Record<string, unknown>;
    const rawVal =
      typeof obj.content === "string" && obj.content.trim()
        ? obj.content.trim()
        : typeof obj.text === "string" && obj.text.trim()
          ? obj.text.trim()
          : "";

    const rawChildren = Array.isArray(obj.children) ? obj.children : [];
    const children: ListItem[] = rawChildren
      .map(cleanItem)
      .filter((c): c is ListItem => c !== null);

    // If completely empty text and has no nested children, discard if siblings exist
    if (!rawVal && children.length === 0) {
      return null;
    }

    const val = rawVal || "Mục danh sách";
    const id =
      typeof obj.id === "string" && obj.id.trim() && !obj.id.startsWith("temp_")
        ? obj.id
        : generateListItemId();

    return {
      id,
      content: val,
      text: val,
      ...(typeof obj.checked === "boolean" ? { checked: obj.checked } : {}),
      children,
    };
  };

  const cleaned = items.map(cleanItem).filter((item): item is ListItem => item !== null);

  if (cleaned.length === 0) {
    const id = generateListItemId();
    return [{ id, content: "Mục danh sách", text: "Mục danh sách", children: [] }];
  }

  return cleaned;
}

/**
 * Normalizes all blocks in a slide detail blog content structure.
 * Recursively normalizes `list` and `ordered_list` blocks, including those nested inside `section.children`.
 */
export function normalizeSlideDetailBlogBlocks(
  blocks: SlideDetailBlogBlock[],
): SlideDetailBlogBlock[] {
  if (!Array.isArray(blocks)) return [];

  return blocks.map((block) => {
    if (!block || typeof block !== "object") return block;

    if (block.type === "list" || block.type === "ordered_list") {
      const listBlock = block as ListBlock;
      return {
        ...listBlock,
        items: sanitizeListItems(listBlock.items),
      };
    }

    if (block.type === "section") {
      const secBlock = block as SectionBlock;
      const normalizedChildren = Array.isArray(secBlock.children)
        ? secBlock.children.map((child) => {
            if (child.type === "list" || (child as unknown as { type: string }).type === "ordered_list") {
              return {
                ...child,
                items: sanitizeListItems((child as ListBlock).items),
              };
            }
            return child;
          })
        : [];
      return {
        ...secBlock,
        children: normalizedChildren,
      };
    }

    return block;
  });
}

/**
 * Normalizes an entire slide detail blog content object before saving or submitting to API.
 */
export function normalizeSlideDetailBlogContent(
  content: SlideDetailBlogContent | undefined | null,
): SlideDetailBlogContent {
  if (!content || typeof content !== "object") {
    return { version: 1, blocks: [] };
  }

  return {
    ...content,
    version: content.version || 1,
    blocks: normalizeSlideDetailBlogBlocks(content.blocks || []),
  };
}

/**
 * Adapts and sanitizes blocks imported from Quick Import (Google Docs / Word)
 * or Smart Import (AI Gemini) so they strictly conform to `SlideDetailBlogBlock`
 * and `slideDetailBlogContentSchema` used by Articles and Slide Detail Blogs.
 */
export function adaptImportedBlocksForBlog(
  rawBlocks: unknown[],
): SlideDetailBlogBlock[] {
  if (!Array.isArray(rawBlocks)) return [];

  const adaptSingleBlock = (raw: unknown): SlideDetailBlogBlock | null => {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const type = typeof obj.type === "string" ? obj.type : "";
    const spacing = sanitizeSpacing(obj.spacing);
    const textAlign =
      typeof obj.textAlign === "string" && VALID_TEXT_ALIGN.has(obj.textAlign)
        ? (obj.textAlign as "left" | "center" | "right" | "justify")
        : undefined;

    switch (type) {
      case "heading": {
        const text = typeof obj.text === "string" ? obj.text.trim() : "";
        const plainText = text.replace(/<[^>]*>/g, "").trim();
        if (!plainText) return null;

        const rawLevel = typeof obj.level === "number" ? Math.round(obj.level) : 2;
        const level = Math.min(6, Math.max(1, rawLevel)) as 1 | 2 | 3 | 4 | 5 | 6;
        const fontSize = clampOptionalNumber(obj.fontSize, 10, 96);
        const lineHeight = clampOptionalNumber(obj.lineHeight, 0.5, 4.0);
        const borderWidth = clampOptionalNumber(obj.borderWidth, 0, 50);
        const borderRadius = clampOptionalNumber(obj.borderRadius, 0, 100);
        const padding = clampOptionalNumber(obj.padding, 0, 100);

        const headingBlock: HeadingBlock = {
          id: generateUniqueBlockId("h"),
          type: "heading",
          level,
          text,
          ...(fontSize !== undefined ? { fontSize } : {}),
          ...(lineHeight !== undefined ? { lineHeight } : {}),
          ...(typeof obj.color === "string" && obj.color ? { color: obj.color } : {}),
          ...(typeof obj.backgroundColor === "string" && obj.backgroundColor
            ? { backgroundColor: obj.backgroundColor }
            : {}),
          ...(typeof obj.borderColor === "string" && obj.borderColor
            ? { borderColor: obj.borderColor }
            : {}),
          ...(borderWidth !== undefined ? { borderWidth } : {}),
          ...(borderRadius !== undefined ? { borderRadius } : {}),
          ...(padding !== undefined ? { padding } : {}),
          ...(textAlign ? { textAlign } : {}),
          ...(spacing ? { spacing } : {}),
        };
        return headingBlock;
      }

      case "paragraph": {
        const text = typeof obj.text === "string" ? obj.text.trim() : "";
        const plainText = text.replace(/<[^>]*>/g, "").trim();
        if (!plainText) return null;

        const fontSize = clampOptionalNumber(obj.fontSize, 10, 96);
        const lineHeight = clampOptionalNumber(obj.lineHeight, 0.5, 4.0);
        const borderWidth = clampOptionalNumber(obj.borderWidth, 0, 50);
        const borderRadius = clampOptionalNumber(obj.borderRadius, 0, 100);
        const padding = clampOptionalNumber(obj.padding, 0, 100);
        const indent = clampOptionalNumber(obj.indent, 0, 200);

        const paragraphBlock: ParagraphBlock = {
          id: generateUniqueBlockId("p"),
          type: "paragraph",
          text,
          ...(fontSize !== undefined ? { fontSize } : {}),
          ...(lineHeight !== undefined ? { lineHeight } : {}),
          ...(typeof obj.color === "string" && obj.color ? { color: obj.color } : {}),
          ...(typeof obj.backgroundColor === "string" && obj.backgroundColor
            ? { backgroundColor: obj.backgroundColor }
            : {}),
          ...(typeof obj.borderColor === "string" && obj.borderColor
            ? { borderColor: obj.borderColor }
            : {}),
          ...(borderWidth !== undefined ? { borderWidth } : {}),
          ...(borderRadius !== undefined ? { borderRadius } : {}),
          ...(padding !== undefined ? { padding } : {}),
          ...(indent !== undefined ? { indent } : {}),
          ...(textAlign ? { textAlign } : {}),
          ...(spacing ? { spacing } : {}),
        };
        return paragraphBlock;
      }

      case "image": {
        const url = typeof obj.url === "string" ? obj.url.trim() : "";
        if (!url) return null;

        const secondaryUrl =
          typeof obj.secondaryUrl === "string" && obj.secondaryUrl.trim()
            ? obj.secondaryUrl.trim()
            : null;
        const layout =
          obj.layout === "dual" && secondaryUrl ? "dual" : "single";

        const imageBlock: ImageBlock = {
          id: generateUniqueBlockId("img"),
          type: "image",
          url,
          fileId: typeof obj.fileId === "string" && obj.fileId ? obj.fileId : null,
          alt: typeof obj.alt === "string" ? obj.alt : "",
          caption: typeof obj.caption === "string" && obj.caption.trim() ? obj.caption.trim() : null,
          layout,
          ...(secondaryUrl
            ? {
                secondaryUrl,
                secondaryFileId:
                  typeof obj.secondaryFileId === "string" && obj.secondaryFileId
                    ? obj.secondaryFileId
                    : null,
                secondaryAlt: typeof obj.secondaryAlt === "string" ? obj.secondaryAlt : "",
                secondaryCaption:
                  typeof obj.secondaryCaption === "string" && obj.secondaryCaption.trim()
                    ? obj.secondaryCaption.trim()
                    : null,
              }
            : {}),
          ...(typeof obj.aspectRatio === "string" && obj.aspectRatio
            ? { aspectRatio: obj.aspectRatio }
            : {}),
          ...(spacing ? { spacing } : {}),
        };
        return imageBlock;
      }

      case "list":
      case "ordered_list": {
        if (!Array.isArray(obj.items) || obj.items.length === 0) return null;

        const listType: ListType =
          type === "ordered_list" || obj.listType === "ordered"
            ? "ordered"
            : obj.listType === "checklist"
              ? "checklist"
              : "bullet";

        const defaultStyle: ListStyle =
          listType === "ordered"
            ? "decimal"
            : listType === "checklist"
              ? "checklist"
              : "disc";

        const listStyle: ListStyle =
          typeof obj.listStyle === "string" && VALID_LIST_STYLES.has(obj.listStyle as ListStyle)
            ? (obj.listStyle as ListStyle)
            : defaultStyle;

        const items = sanitizeListItems(obj.items);
        const fontSize = clampOptionalNumber(obj.fontSize, 10, 96);
        const lineHeight = clampOptionalNumber(obj.lineHeight, 1.0, 3.0);
        const itemSpacing = clampOptionalNumber(obj.itemSpacing, 0, 48);

        const rawStyle =
          obj.style && typeof obj.style === "object"
            ? (obj.style as Record<string, unknown>)
            : null;

        const styleMarker: ListStyle =
          rawStyle &&
          typeof rawStyle.marker === "string" &&
          VALID_LIST_STYLES.has(rawStyle.marker as ListStyle)
            ? (rawStyle.marker as ListStyle)
            : listStyle;

        const listBlock: ListBlock = {
          id: generateUniqueBlockId("ls"),
          type: "list",
          listType,
          listStyle,
          items,
          ...(fontSize !== undefined ? { fontSize } : {}),
          ...(lineHeight !== undefined ? { lineHeight } : {}),
          ...(itemSpacing !== undefined ? { itemSpacing } : {}),
          style: {
            marker: styleMarker,
            fontSize: clampOptionalNumber(rawStyle?.fontSize, 10, 96) ?? 16,
            lineHeight: clampOptionalNumber(rawStyle?.lineHeight, 1.0, 3.0) ?? 1.6,
            itemSpacing: clampOptionalNumber(rawStyle?.itemSpacing, 0, 48) ?? 8,
            indentation: clampOptionalNumber(rawStyle?.indentation, 8, 64) ?? 24,
          },
          ...(spacing ? { spacing } : {}),
        };
        return listBlock;
      }

      case "quote": {
        const text = typeof obj.text === "string" ? obj.text.trim() : "";
        const plainText = text.replace(/<[^>]*>/g, "").trim();
        if (!plainText) return null;

        const fontSize = clampOptionalNumber(obj.fontSize, 10, 96);
        const quoteBlock: QuoteBlock = {
          id: generateUniqueBlockId("qte"),
          type: "quote",
          text,
          author:
            typeof obj.author === "string" && obj.author.trim()
              ? obj.author.trim()
              : null,
          citation:
            typeof obj.citation === "string" && obj.citation.trim()
              ? obj.citation.trim()
              : null,
          ...(fontSize !== undefined ? { fontSize } : {}),
          ...(spacing ? { spacing } : {}),
        };
        return quoteBlock;
      }

      case "highlight": {
        const text = typeof obj.text === "string" ? obj.text.trim() : "";
        const plainText = text.replace(/<[^>]*>/g, "").trim();
        if (!plainText) return null;

        const fontSize = clampOptionalNumber(obj.fontSize, 10, 96);
        const highlightBlock: HighlightBlock = {
          id: generateUniqueBlockId("hl"),
          type: "highlight",
          text,
          ...(typeof obj.style === "string" && obj.style ? { style: obj.style } : {}),
          ...(fontSize !== undefined ? { fontSize } : {}),
          ...(spacing ? { spacing } : {}),
        };
        return highlightBlock;
      }

      case "section": {
        const number =
          typeof obj.number === "string" && obj.number.trim()
            ? obj.number.trim()
            : "01";
        const title =
          typeof obj.title === "string" && obj.title.trim()
            ? obj.title.trim()
            : "Mục nội dung";
        const rawChildren = Array.isArray(obj.children) ? obj.children : [];
        const children = rawChildren
          .map(adaptSingleBlock)
          .filter(
            (child): child is SectionChildBlock =>
              child !== null &&
              (child.type === "heading" ||
                child.type === "paragraph" ||
                child.type === "image" ||
                child.type === "list"),
          );

        const sectionBlock: SectionBlock = {
          id: generateUniqueBlockId("sec"),
          type: "section",
          number,
          title,
          children,
          ...(spacing ? { spacing } : {}),
        };
        return sectionBlock;
      }

      case "cta": {
        const label =
          typeof obj.label === "string" && obj.label.trim()
            ? obj.label.trim()
            : "Liên hệ tư vấn";
        const url =
          typeof obj.url === "string" && obj.url.trim()
            ? obj.url.trim()
            : "/lien-he";
        const ctaBlock: CtaBlock = {
          id: generateUniqueBlockId("cta"),
          type: "cta",
          label,
          url,
          ...(spacing ? { spacing } : {}),
        };
        return ctaBlock;
      }

      default:
        return null;
    }
  };

  return rawBlocks
    .map(adaptSingleBlock)
    .filter((block): block is SlideDetailBlogBlock => block !== null);
}
