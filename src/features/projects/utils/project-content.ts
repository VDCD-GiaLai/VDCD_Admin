import type { DocumentContent, ContentBlock, SectionChildBlock } from "@/shared/content-editor";
import {
  createDefaultDocumentContent,
  createHeadingBlock,
  createParagraphBlock,
  createImageBlock,
  createListBlock,
} from "@/shared/content-editor";
import type { ProjectFormData } from "../schema";

/**
 * Checks if a string is a serialized JSON DocumentContent
 */
export function isDocumentContentString(str: string | null | undefined): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      parsed.version === 1 &&
      Array.isArray(parsed.blocks)
    );
  } catch {
    return false;
  }
}

/**
 * Converts legacy HTML content or plain text into structured DocumentContent blocks.
 * Runs in browser environment using DOMParser or regex fallback.
 */
export function htmlToDocumentBlocks(html: string): ContentBlock[] {
  if (!html || !html.trim()) return [];

  // If plain text without HTML tags
  if (!html.includes("<") || !html.includes(">")) {
    return [createParagraphBlock({ text: html.trim() })];
  }

  // In non-browser / SSR environment, fall back to a single paragraph block
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return [createParagraphBlock({ text: html })];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;
  const blocks: ContentBlock[] = [];

  const children = Array.from(body.children);

  if (children.length === 0 && body.textContent?.trim()) {
    return [createParagraphBlock({ text: body.innerHTML.trim() })];
  }

  for (const child of children) {
    const tagName = child.tagName.toLowerCase();

    if (tagName.startsWith("h") && ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
      const level = parseInt(tagName.slice(1), 10) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push(createHeadingBlock({ level, text: child.textContent?.trim() || "" }));
    } else if (tagName === "p") {
      const text = child.innerHTML.trim();
      if (text) {
        blocks.push(createParagraphBlock({ text }));
      }
    } else if (tagName === "img") {
      const img = child as HTMLImageElement;
      blocks.push(
        createImageBlock({
          url: img.src || "",
          alt: img.alt || "",
          caption: img.title || null,
        }),
      );
    } else if (tagName === "ul" || tagName === "ol") {
      const lis = Array.from(child.querySelectorAll("li"));
      const items = lis.map((li) => ({
        id: `li_${Math.random().toString(36).substring(2, 9)}`,
        content: li.innerHTML.trim(),
        children: [],
      }));
      blocks.push(
        createListBlock({
          listType: tagName === "ol" ? "ordered" : "bullet",
          initialTexts: items.map((i) => i.content),
        }),
      );
    } else {
      const inner = child.innerHTML.trim();
      if (inner) {
        blocks.push(createParagraphBlock({ text: inner }));
      }
    }
  }

  return blocks.length > 0 ? blocks : [createParagraphBlock({ text: html.trim() })];
}

import { normalizeListItems } from "@/shared/content-editor/paste/list-helpers";

/**
 * Normalizes a single child block (or top-level block) ensuring all required
 * schema properties (id, level, items, content, children) exist and are valid.
 */
function normalizeChildBlock(raw: unknown): ContentBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const id =
    typeof b.id === "string" && b.id.trim()
      ? b.id
      : `blk_${Math.random().toString(36).substring(2, 9)}`;
  const type = String(b.type || "paragraph");

  if (type === "paragraph") {
    return {
      id,
      type: "paragraph",
      text: typeof b.text === "string" && b.text.trim() ? b.text : " ",
      fontSize: typeof b.fontSize === "number" ? b.fontSize : undefined,
      spacing: b.spacing as ContentBlock["spacing"],
    } as ContentBlock;
  }

  if (type === "heading") {
    const level =
      typeof b.level === "number" && b.level >= 1 && b.level <= 6
        ? (b.level as 1 | 2 | 3 | 4 | 5 | 6)
        : 2;
    return {
      id,
      type: "heading",
      level,
      text: typeof b.text === "string" && b.text.trim() ? b.text : "Tiêu đề",
      fontSize: typeof b.fontSize === "number" ? b.fontSize : undefined,
      spacing: b.spacing as ContentBlock["spacing"],
    } as ContentBlock;
  }

  if (type === "image") {
    return {
      id,
      type: "image",
      url: typeof b.url === "string" ? b.url : "",
      fileId: typeof b.fileId === "string" ? b.fileId : null,
      alt: typeof b.alt === "string" ? b.alt : "",
      caption: typeof b.caption === "string" ? b.caption : null,
      spacing: b.spacing as ContentBlock["spacing"],
    } as ContentBlock;
  }

  if (type === "list" || type === "ordered_list") {
    const rawItems = Array.isArray(b.items) ? b.items : [];
    const normalizedItems = normalizeListItems(rawItems);
    const validItems = normalizedItems.map((item) => {
      const textVal = (item.content || item.text || "").trim();
      return {
        ...item,
        content: textVal || "Mục danh sách",
        text: textVal || "Mục danh sách",
      };
    });

    return {
      id,
      type: type === "ordered_list" ? "ordered_list" : "list",
      items:
        validItems.length > 0
          ? validItems
          : [
              {
                id: `li_${Math.random().toString(36).substring(2, 9)}`,
                content: "Mục danh sách",
                text: "Mục danh sách",
                children: [],
              },
            ],
      listType: (b.listType as "bullet" | "ordered" | "checklist") || (type === "ordered_list" ? "ordered" : "bullet"),
      listStyle: b.listStyle as "disc" | "circle" | "square" | "decimal" | "lower-alpha" | "upper-alpha" | "lower-roman" | "upper-roman" | "checklist" | undefined,
      spacing: b.spacing as ContentBlock["spacing"],
    } as ContentBlock;
  }

  return b as unknown as ContentBlock;
}

/**
 * Normalizes all blocks within a document (including nested section blocks)
 * to guarantee complete compliance with documentContentSchema.
 */
export function normalizeDocumentBlocks(rawBlocks: unknown[]): ContentBlock[] {
  if (!Array.isArray(rawBlocks)) return [];

  const result: ContentBlock[] = [];

  for (const raw of rawBlocks) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as Record<string, unknown>;
    const id =
      typeof b.id === "string" && b.id.trim()
        ? b.id
        : `blk_${Math.random().toString(36).substring(2, 9)}`;
    const type = String(b.type || "paragraph");

    if (type === "section") {
      const rawChildren = Array.isArray(b.children) ? b.children : [];
      const children: SectionChildBlock[] = [];
      for (const child of rawChildren) {
        const normChild = normalizeChildBlock(child);
        if (normChild) children.push(normChild as SectionChildBlock);
      }

      result.push({
        id,
        type: "section",
        number: typeof b.number === "string" && b.number.trim() ? b.number : "01",
        title: typeof b.title === "string" && b.title.trim() ? b.title : "Nhóm mục",
        children,
        spacing: b.spacing as ContentBlock["spacing"],
      } as ContentBlock);
    } else {
      const norm = normalizeChildBlock(raw);
      if (norm) result.push(norm);
    }
  }

  return result;
}

/**
 * Parses raw Project content (which may be DocumentContent, serialized JSON, legacy HTML/text,
 * or null falling back to overview) into a canonical DocumentContent.
 *
 * Strict Rule: Only DocumentContent is created.
 * NO visualContent, NO previewContent, NO readerContent.
 */
export function parseProjectContent(
  rawContent: unknown,
  overviewFallback?: string | null,
): DocumentContent {
  if (!rawContent) {
    if (overviewFallback && overviewFallback.trim()) {
      return {
        version: 1,
        blocks: htmlToDocumentBlocks(overviewFallback),
      };
    }
    return createDefaultDocumentContent();
  }

  // Already a structured DocumentContent object
  if (
    typeof rawContent === "object" &&
    rawContent !== null &&
    "version" in rawContent &&
    "blocks" in rawContent &&
    Array.isArray((rawContent as { blocks: unknown }).blocks)
  ) {
    const rawBlocks = (rawContent as { blocks: unknown[] }).blocks;
    return {
      version: (rawContent as { version?: number }).version ?? 1,
      blocks: normalizeDocumentBlocks(rawBlocks),
      heroMeta: (rawContent as { heroMeta?: DocumentContent["heroMeta"] }).heroMeta,
    };
  }

  // Serialized string
  if (typeof rawContent === "string") {
    if (isDocumentContentString(rawContent)) {
      try {
        const parsed = JSON.parse(rawContent);
        return {
          version: parsed.version ?? 1,
          blocks: normalizeDocumentBlocks(parsed.blocks || []),
          heroMeta: parsed.heroMeta,
        };
      } catch {
        // fall through to htmlToDocumentBlocks
      }
    }
    return {
      version: 1,
      blocks: htmlToDocumentBlocks(rawContent),
    };
  }

  return createDefaultDocumentContent();
}

/**
 * Serializes Project form data for API submission.
 * Preserves canonical DocumentContent and tempFolderKey.
 * Strictly guarantees NO visualContent, NO previewContent, NO readerContent.
 */
export function serializeProjectPayload(data: ProjectFormData): ProjectFormData {
  const content =
    data.content && typeof data.content === "object" && "blocks" in data.content
      ? {
          ...data.content,
          blocks: normalizeDocumentBlocks((data.content as DocumentContent).blocks),
        }
      : parseProjectContent(data.content, data.overview);

  // Clean empty technicalHighlights
  const cleanHighlights = data.technicalHighlights
    ?.filter((h) => h && (h.label?.trim() || h.value?.trim()))
    .map((h) => ({
      label: h.label?.trim() ?? "",
      value: h.value?.trim() ?? "",
    }));

  // Clean empty services
  const cleanServices = data.services
    ?.map((s) => s?.trim())
    ?.filter((s): s is string => Boolean(s));

  // Clean year
  const cleanYear =
    typeof data.year === "number" && !isNaN(data.year) && data.year >= 1990 && data.year <= 2100
      ? data.year
      : null;

  const payload = {
    ...data,
    content,
    year: cleanYear,
    technicalHighlights: cleanHighlights,
    services: cleanServices,
  };

  // Explicitly ensure forbidden fields are never created
  delete (payload as Record<string, unknown>).visualContent;
  delete (payload as Record<string, unknown>).previewContent;
  delete (payload as Record<string, unknown>).readerContent;

  return payload;
}
