import React, { useRef, useCallback, useMemo } from "react";
import type { ListBlock, ListItem, ListType } from "../../model/document.types";
import {
  normalizeListItems,
  generateListItemId,
  resolveListContainerStyle,
  resolveListLevelStyle,
} from "../../paste/list-helpers";
import { parseClipboardTextToList } from "../../paste/list-parser";

// ─── ListItemRenderer ─────────────────────────────────────────

export interface ListItemRendererProps {
  item: ListItem;
  block?: ListBlock;
  depth?: number;
  listType?: ListType;
}

/**
 * Renders an individual ListItem recursively with full level-specific styling.
 * Supports bullet, ordered (decimal, alpha, roman), and checklist.
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

function extractItemText(li: HTMLElement): string {
  const clone = li.cloneNode(true) as HTMLElement;
  const subLists = clone.querySelectorAll("ul, ol");
  subLists.forEach((sub) => sub.remove());
  const checkboxes = clone.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach((cb) => cb.remove());
  return (clone.textContent || "").trim();
}

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

// ─── ListBlockRenderer ────────────────────────────────────────

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

  const items = useMemo(() => normalizeListItems(block.items), [block.items]);

  const handleBlur = useCallback(() => {
    if (!listRef.current || !onItemsChange) return;
    const parsedItems = parseDOMList(listRef.current);
    onItemsChange(parsedItems);
  }, [onItemsChange]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!editable) return;
      const rawText = e.clipboardData.getData("text/plain");
      if (!rawText) return;

      const parsed = parseClipboardTextToList(rawText);
      if (parsed.items.length > 1) {
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection || !selection.anchorNode) return;

        let liNode = selection.anchorNode as Node | null;
        while (liNode && liNode.nodeName.toLowerCase() !== "li") {
          liNode = liNode.parentNode;
        }

        const targetLi = liNode as HTMLElement | null;
        const targetId = targetLi?.dataset?.itemId;

        const currentItems = listRef.current ? parseDOMList(listRef.current) : items;
        const updatedItems = [...currentItems];

        if (targetId) {
          const idx = updatedItems.findIndex((it) => it.id === targetId);
          if (idx !== -1) {
            updatedItems.splice(idx, 1, ...parsed.items);
          } else {
            updatedItems.push(...parsed.items);
          }
        } else {
          updatedItems.push(...parsed.items);
        }

        onItemsChange?.(updatedItems);
      }
    },
    [editable, items, onItemsChange],
  );

  if (editable) {
    const listHtml = renderEditableListItemsHTML(items, block);

    return (
      <ListTag
        ref={listRef as React.RefObject<HTMLUListElement & HTMLOListElement>}
        className="blog-preview-list ve-editable-list"
        style={listContainerStyle}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: listHtml }}
      />
    );
  }

  return (
    <ListTag
      className={`blog-preview-list ${listType === "checklist" ? "blog-preview-checklist" : ""}`}
      style={listContainerStyle}
    >
      {items.map((item) => (
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
