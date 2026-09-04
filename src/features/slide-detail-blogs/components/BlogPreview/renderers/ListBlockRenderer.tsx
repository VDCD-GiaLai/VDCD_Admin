import React, { useRef, useCallback, useMemo } from "react";
import type { ListBlock, ListItem, ListType } from "@/types/slide-detail-blog";
import {
  normalizeListItems,
  generateListItemId,
  resolveListContainerStyle,
  resolveListLevelStyle,
} from "../../../utils/list-helpers";
import { parseClipboardTextToList } from "../../../utils/list-parser";

// ─── ListItemRenderer ─────────────────────────────────────────

export interface ListItemRendererProps {
  item: ListItem;
  block?: ListBlock;
  depth?: number;
  listType?: ListType; // kept for backwards compatibility
}

/**
 * Renders an individual ListItem recursively with full level-specific styling.
 * Uses semantic <ul> for bullet lists and <ol> for ordered lists.
 */
export function ListItemRenderer({
  item,
  block,
  depth = 0,
}: ListItemRendererProps) {
  const resolved = resolveListLevelStyle(block, depth);
  const listType = block?.listType ?? "bullet";

  const itemStyle: React.CSSProperties = {};
  if (resolved.fontSize) itemStyle.fontSize = `${resolved.fontSize}px`;
  if (resolved.fontWeight) itemStyle.fontWeight = resolved.fontWeight;
  if (resolved.color) itemStyle.color = resolved.color;
  if (typeof resolved.itemSpacing === "number") itemStyle.marginBottom = `${resolved.itemSpacing}px`;
  if (resolved.marker && listType !== "checklist") {
    itemStyle.listStyleType = resolved.marker;
  }

  const subListStyle: React.CSSProperties = {
    paddingLeft: `${resolved.indentation}px`,
  };

  if (listType === "checklist") {
    return (
      <li className="flex items-start gap-2 list-none my-0.5" style={itemStyle}>
        <input
          type="checkbox"
          checked={!!item.checked}
          readOnly
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary pointer-events-none"
        />
        <div className="flex-1">
          <span dangerouslySetInnerHTML={{ __html: item.content }} />
          {item.children && item.children.length > 0 && (
            <ul className="blog-preview-list blog-preview-checklist mt-1" style={subListStyle}>
              {item.children.map((child: ListItem) => (
                <ListItemRenderer
                  key={child.id}
                  item={child}
                  block={block}
                  depth={depth + 1}
                />
              ))}
            </ul>
          )}
        </div>
      </li>
    );
  }

  const isOrdered = listType === "ordered";
  const SubListTag = isOrdered ? "ol" : "ul";

  return (
    <li style={itemStyle}>
      <span dangerouslySetInnerHTML={{ __html: item.content }} />
      {item.children && item.children.length > 0 && (
        <SubListTag className="blog-preview-list" style={subListStyle}>
          {item.children.map((child: ListItem) => (
            <ListItemRenderer
              key={child.id}
              item={child}
              block={block}
              depth={depth + 1}
            />
          ))}
        </SubListTag>
      )}
    </li>
  );
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderEditableListItemsHTML(
  items: ListItem[],
  block: ListBlock,
  depth = 0,
): string {
  const resolved = resolveListLevelStyle(block, depth);
  const listType = block.listType ?? "bullet";

  const styleParts: string[] = [];
  if (resolved.fontSize) styleParts.push(`font-size: ${resolved.fontSize}px`);
  if (resolved.fontWeight) styleParts.push(`font-weight: ${resolved.fontWeight}`);
  if (resolved.color) styleParts.push(`color: ${resolved.color}`);
  if (typeof resolved.itemSpacing === "number") styleParts.push(`margin-bottom: ${resolved.itemSpacing}px`);
  if (resolved.marker && listType !== "checklist") {
    styleParts.push(`list-style-type: ${resolved.marker}`);
  }
  const itemStyleStr = styleParts.join("; ");
  const subListStyleStr = `padding-left: ${resolved.indentation}px`;

  const isOrdered = listType === "ordered";
  const SubListTag = isOrdered ? "ol" : "ul";

  return items
    .map((item) => {
      const subListHtml =
        item.children && item.children.length > 0
          ? `<${SubListTag} class="blog-preview-list" style="${subListStyleStr}">${renderEditableListItemsHTML(
              item.children,
              block,
              depth + 1,
            )}</${SubListTag}>`
          : "";

      if (listType === "checklist") {
        const checkedAttr = item.checked ? "checked" : "";
        const checkSubListHtml =
          item.children && item.children.length > 0
            ? `<ul class="blog-preview-list blog-preview-checklist mt-1" style="${subListStyleStr}">${renderEditableListItemsHTML(
                item.children,
                block,
                depth + 1,
              )}</ul>`
            : "";

        return `<li data-item-id="${item.id}" class="flex items-start gap-2 list-none my-0.5" style="${itemStyleStr}">` +
          `<input type="checkbox" ${checkedAttr} readonly class="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary pointer-events-none" />` +
          `<div class="flex-1">${escapeHtml(item.content)}${checkSubListHtml}</div></li>`;
      }

      return `<li data-item-id="${item.id}" style="${itemStyleStr}">` +
        `${escapeHtml(item.content)}` +
        `${subListHtml}</li>`;
    })
    .join("");
}

/**
 * Extracts all text belonging to a single list item, cleanly excluding nested sub-lists and checkboxes.
 * Never gets fooled by browser placing typed text outside or around spans.
 */
function extractItemText(li: HTMLElement): string {
  const clone = li.cloneNode(true) as HTMLElement;

  // Remove any nested sub-lists (<ul>, <ol>) from the clone
  const subLists = clone.querySelectorAll("ul, ol");
  subLists.forEach((sub) => sub.remove());

  // Remove any checkboxes from the clone
  const checkboxes = clone.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach((cb) => cb.remove());

  return (clone.textContent || "").trim();
}

/**
 * Recursively parses a DOM <ul>/<ol> element into a nested ListItem[] hierarchy.
 * Deduplicates cloned IDs and preserves empty items so deletes sync accurately.
 */
function parseDOMList(container: HTMLElement, seenIds = new Set<string>()): ListItem[] {
  const result: ListItem[] = [];
  const children = Array.from(container.children);

  for (const child of children) {
    if (child.tagName.toLowerCase() === "li") {
      const childList = (child.querySelector(":scope > ul, :scope > ol") ||
        child.querySelector("ul, ol")) as HTMLElement | null;
      const subItems = childList ? parseDOMList(childList, seenIds) : [];

      const checkbox = child.querySelector("input[type='checkbox']") as HTMLInputElement | null;
      const checked = checkbox ? checkbox.checked : undefined;

      // Extract full text content belonging to this item
      const text = extractItemText(child as HTMLElement);

      let id = (child as HTMLElement).dataset.itemId;
      if (!id || seenIds.has(id) || id.startsWith("temp_")) {
        id = generateListItemId();
        (child as HTMLElement).dataset.itemId = id;
      }
      seenIds.add(id);

      result.push({
        id,
        content: text,
        children: subItems,
        ...(checked !== undefined ? { checked } : {}),
      });
    }
  }

  // Fallback if all <li> were completely removed from DOM
  if (result.length === 0) {
    const fallbackText = container.textContent?.trim() || "";
    return [
      {
        id: generateListItemId(),
        content: fallbackText,
        children: [],
      },
    ];
  }

  return result;
}

// ─── ListBlockRenderer (ListRenderer) ─────────────────────────

export interface ListBlockRendererProps {
  block: ListBlock;
  editable?: boolean;
  onItemsChange?: (items: ListItem[]) => void;
}

export function ListBlockRenderer({
  block,
  editable,
  onItemsChange,
}: ListBlockRendererProps) {
  const listRef = useRef<HTMLUListElement | HTMLOListElement>(null);

  const listType: ListType = block.listType ?? "bullet";
  const isOrdered = listType === "ordered";
  const ListTag = isOrdered ? "ol" : "ul";

  const listContainerStyle = useMemo(() => {
    return resolveListContainerStyle(block);
  }, [block]);

  // Normalize legacy string items to ListItem[]
  const normalizedItems = useMemo(
    () => normalizeListItems(block.items),
    [block.items],
  );

  const handleBlur = useCallback(() => {
    if (listRef.current && onItemsChange) {
      const parsed = parseDOMList(listRef.current);
      const finalItems =
        parsed.length > 0
          ? parsed
          : [{ id: generateListItemId(), content: "", children: [] }];
      onItemsChange(finalItems);
    }
  }, [onItemsChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (typeof document !== "undefined" && typeof document.execCommand === "function") {
        if (e.shiftKey) {
          document.execCommand("outdent");
        } else {
          document.execCommand("indent");
        }
      }
    }
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLElement>) => {
      const plainText = e.clipboardData.getData("text/plain");
      if (!plainText) return;

      if (plainText.includes("\n")) {
        e.preventDefault();
        const { items: parsedItems } = parseClipboardTextToList(plainText);
        if (parsedItems.length > 0 && onItemsChange) {
          onItemsChange(parsedItems);
          return;
        }
      }
    },
    [onItemsChange],
  );

  const hasContent = useMemo(() => {
    const checkHasContent = (items: ListItem[]): boolean => {
      return items.some(
        (it) => it.content.trim().length > 0 || (it.children && checkHasContent(it.children)),
      );
    };
    return checkHasContent(normalizedItems);
  }, [normalizedItems]);

  const editableHtml = useMemo(() => {
    return renderEditableListItemsHTML(normalizedItems, block);
  }, [normalizedItems, block]);

  if (!hasContent && !editable) {
    return (
      <div className="blog-preview-list italic text-text-muted/50" style={listContainerStyle}>
        (Danh sách trống)
      </div>
    );
  }

  if (editable) {
    return (
      <ListTag
        ref={listRef as unknown as React.RefObject<HTMLUListElement & HTMLOListElement>}
        className="blog-preview-list ve-editable"
        style={listContainerStyle}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder="Nhập nội dung danh sách..."
        dangerouslySetInnerHTML={{ __html: editableHtml }}
      />
    );
  }

  return (
    <ListTag className="blog-preview-list" style={listContainerStyle}>
      {normalizedItems.map((item: ListItem) => (
        <ListItemRenderer
          key={item.id}
          item={item}
          block={block}
          depth={0}
        />
      ))}
    </ListTag>
  );
}

// Named alias per architectural convention
export { ListBlockRenderer as ListRenderer };
