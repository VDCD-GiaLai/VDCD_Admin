import type { DocumentContent, ContentBlock } from "@/shared/content-editor";
import {
  createDefaultDocumentContent,
  createHeadingBlock,
  createParagraphBlock,
  createImageBlock,
  createListBlock,
} from "@/shared/content-editor";
import type { ProgramFormData } from "../schema";

/**
 * Checks if a string is a serialized JSON DocumentContent
 */
export function isDocumentContentString(str: string | null | undefined): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null && parsed.version === 1 && Array.isArray(parsed.blocks);
  } catch {
    return false;
  }
}

/**
 * Converts legacy HTML content into structured DocumentContent blocks.
 * Runs in browser environment using DOMParser or regex fallback.
 */
export function htmlToDocumentBlocks(html: string): ContentBlock[] {
  if (!html || !html.trim()) return [];

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
      // General container or div -> treat as paragraph if has text
      const inner = child.innerHTML.trim();
      if (inner) {
        blocks.push(createParagraphBlock({ text: inner }));
      }
    }
  }

  return blocks.length > 0 ? blocks : [createParagraphBlock({ text: "" })];
}

/**
 * Parses raw program content from DB into DocumentContent.
 * Handles:
 * 1. Structured DocumentContent object (modern backend JSONB)
 * 2. Serialized JSON string
 * 3. Legacy HTML/text strings
 */
export function parseProgramContent(rawContent: unknown): DocumentContent {
  if (!rawContent) {
    return createDefaultDocumentContent();
  }

  // Case 1: Already an object
  if (typeof rawContent === "object" && rawContent !== null && "blocks" in rawContent) {
    const doc = rawContent as Partial<DocumentContent>;
    return {
      version: doc.version ?? 1,
      blocks: Array.isArray(doc.blocks) ? doc.blocks : [],
      heroMeta: doc.heroMeta ?? {
        placement: "above_title",
        position: "center",
        caption: "",
      },
    };
  }

  // Case 2: String
  if (typeof rawContent === "string") {
    const trimmed = rawContent.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.blocks)) {
          return {
            version: parsed.version ?? 1,
            blocks: parsed.blocks,
            heroMeta: parsed.heroMeta ?? {
              placement: "above_title",
              position: "center",
              caption: "",
            },
          };
        }
      } catch {
        // Not JSON, continue to HTML converter
      }
    }

    // Convert legacy HTML or plain text to DocumentContent
    return {
      version: 1,
      blocks: htmlToDocumentBlocks(trimmed),
      heroMeta: {
        placement: "above_title",
        position: "center",
        caption: "",
      },
    };
  }

  return createDefaultDocumentContent();
}

import { normalizeListItems } from "@/shared/content-editor/paste/list-helpers";
import type { SectionChildBlock } from "@/shared/content-editor";

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
      lineHeight: typeof b.lineHeight === "number" ? b.lineHeight : undefined,
      color: typeof b.color === "string" ? b.color : undefined,
      backgroundColor: typeof b.backgroundColor === "string" ? b.backgroundColor : undefined,
      borderColor: typeof b.borderColor === "string" ? b.borderColor : undefined,
      borderWidth: typeof b.borderWidth === "number" ? b.borderWidth : undefined,
      borderRadius: typeof b.borderRadius === "number" ? b.borderRadius : undefined,
      padding: typeof b.padding === "number" ? b.padding : undefined,
      indent: typeof b.indent === "number" ? b.indent : undefined,
      textAlign: typeof b.textAlign === "string" ? (b.textAlign as "left" | "center" | "right" | "justify") : undefined,
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
      lineHeight: typeof b.lineHeight === "number" ? b.lineHeight : undefined,
      color: typeof b.color === "string" ? b.color : undefined,
      backgroundColor: typeof b.backgroundColor === "string" ? b.backgroundColor : undefined,
      borderColor: typeof b.borderColor === "string" ? b.borderColor : undefined,
      borderWidth: typeof b.borderWidth === "number" ? b.borderWidth : undefined,
      borderRadius: typeof b.borderRadius === "number" ? b.borderRadius : undefined,
      padding: typeof b.padding === "number" ? b.padding : undefined,
      textAlign: typeof b.textAlign === "string" ? (b.textAlign as "left" | "center" | "right" | "justify") : undefined,
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
      layout: b.layout === "dual" ? "dual" : "single",
      secondaryUrl: typeof b.secondaryUrl === "string" ? b.secondaryUrl : null,
      secondaryFileId: typeof b.secondaryFileId === "string" ? b.secondaryFileId : null,
      secondaryAlt: typeof b.secondaryAlt === "string" ? b.secondaryAlt : "",
      secondaryCaption: typeof b.secondaryCaption === "string" ? b.secondaryCaption : null,
      aspectRatio: typeof b.aspectRatio === "string" ? b.aspectRatio : null,
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
      fontSize: typeof b.fontSize === "number" ? b.fontSize : undefined,
      lineHeight: typeof b.lineHeight === "number" ? b.lineHeight : undefined,
      style: typeof b.style === "object" && b.style !== null ? b.style : undefined,
      spacing: b.spacing as ContentBlock["spacing"],
    } as ContentBlock;
  }

  return b as unknown as ContentBlock;
}

/**
 * Normalizes all blocks within a document (including nested section blocks)
 * to guarantee complete compliance with backend document-content validation.
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
 * Prepares the payload to submit to Backend API.
 * Passes content as a structured JSON object to comply with Backend's @IsObject() validation.
 */
export function serializeProgramPayload(data: ProgramFormData): Record<string, unknown> {
  const contentObj =
    typeof data.content === "object" && data.content !== null
      ? {
          ...data.content,
          blocks: normalizeDocumentBlocks((data.content as DocumentContent).blocks),
        }
      : typeof data.content === "string"
        ? parseProgramContent(data.content)
        : createDefaultDocumentContent();

  const cleanOrder =
    typeof data.order === "number" && !isNaN(data.order) && data.order >= 1
      ? Math.floor(data.order)
      : undefined;

  return {
    title: data.title,
    slug: data.slug || undefined,
    shortDescription: data.shortDescription || undefined,
    content: contentObj,
    thumbnail: data.thumbnail || null,
    thumbnailFileId: data.thumbnailFileId || null,
    fieldId: data.fieldId || null,
    order: cleanOrder,
    metaTitle: data.metaTitle || undefined,
    metaDescription: data.metaDescription || undefined,
    isPublished: data.isPublished ?? false,
  };
}

/**
 * Serializes DocumentContent into JSON string for debug or localStorage.
 */
export function serializeProgramContent(doc: DocumentContent): string {
  return JSON.stringify(doc);
}
