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

/**
 * Prepares the payload to submit to Backend API.
 * Passes content as a structured JSON object to comply with Backend's @IsObject() validation.
 */
export function serializeProgramPayload(data: ProgramFormData): Record<string, unknown> {
  const contentObj =
    typeof data.content === "object" && data.content !== null
      ? data.content
      : typeof data.content === "string"
        ? parseProgramContent(data.content)
        : createDefaultDocumentContent();

  return {
    title: data.title,
    slug: data.slug || undefined,
    shortDescription: data.shortDescription || undefined,
    content: contentObj,
    thumbnail: data.thumbnail || null,
    thumbnailFileId: data.thumbnailFileId || null,
    fieldId: data.fieldId || null,
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
