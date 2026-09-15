import type {
  SlideDetailBlogContent,
  SlideDetailBlogBlock,
  ListItem,
  SectionBlock,
  ListBlock,
} from "@/types/slide-detail-blog";
import { generateListItemId } from "./list-helpers";

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
