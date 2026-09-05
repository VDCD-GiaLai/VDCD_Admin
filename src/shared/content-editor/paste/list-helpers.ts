import type {
  ListBlock,
  ListItem,
  ListType,
  ListStyle,
  ListFontWeight,
  ListStyleConfig,
} from "../model/document.types";

/** Maximum indentation depth supported in lists to prevent UI overflow */
export const MAX_LIST_DEPTH = 6;

/**
 * Converts a positive integer to Roman numerals (e.g. 1 -> i or I, 4 -> iv or IV).
 */
export function toRoman(num: number, isUpper = false): string {
  if (num <= 0) return String(num);
  const romanLookup: [number, string][] = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let result = "";
  let n = num;
  for (const [val, letter] of romanLookup) {
    while (n >= val) {
      result += letter;
      n -= val;
    }
  }
  return isUpper ? result.toUpperCase() : result;
}

/**
 * Generates a unique, stable ID for a list item.
 * Uses crypto.randomUUID when available, falling back to timestamp + random string.
 */
export function generateListItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `li_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `li_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Clones a tree of ListItems immutably.
 */
export function cloneTree(items: ListItem[]): ListItem[] {
  return items.map((item) => ({
    id: item.id,
    content: item.content,
    ...(typeof item.checked === "boolean" ? { checked: item.checked } : {}),
    children: item.children && item.children.length > 0 ? cloneTree(item.children) : [],
  }));
}

/**
 * Normalizes a single raw item (string or object) into a valid ListItem.
 * Guarantees backward compatibility with legacy string items and nested children.
 */
export function normalizeListItem(raw: unknown): ListItem {
  if (typeof raw === "string") {
    return {
      id: generateListItemId(),
      content: raw,
      children: [],
    };
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return {
      id:
        typeof obj.id === "string" && obj.id.trim() && !obj.id.startsWith("temp_")
          ? obj.id
          : generateListItemId(),
      content: typeof obj.content === "string" ? obj.content : "",
      ...(typeof obj.checked === "boolean" ? { checked: obj.checked } : {}),
      children: Array.isArray(obj.children)
        ? obj.children.map(normalizeListItem)
        : [],
    };
  }

  return {
    id: generateListItemId(),
    content: "",
    children: [],
  };
}

/**
 * Normalizes an array of items (legacy string[] or ListItem[]) into ListItem[].
 * Always ensures at least one item exists in the list and all IDs across the tree are strictly unique.
 */
export function normalizeListItems(items: unknown): ListItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [{ id: generateListItemId(), content: "", children: [] }];
  }

  const seenIds = new Set<string>();

  const normalizeWithDedup = (raw: unknown): ListItem => {
    const item = normalizeListItem(raw);
    if (seenIds.has(item.id)) {
      item.id = generateListItemId();
    }
    seenIds.add(item.id);

    if (item.children && item.children.length > 0) {
      item.children = item.children.map(normalizeWithDedup);
    }
    return item;
  };

  return items.map(normalizeWithDedup);
}

/**
 * Factory to create a new default ListBlock.
 */
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
  const blockId = options?.id ?? `ls_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
  const items: ListItem[] = options?.initialTexts && options.initialTexts.length > 0
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
    fontSize: options?.fontSize,
    lineHeight: options?.lineHeight,
    itemSpacing: options?.itemSpacing,
    style: options?.style,
  };
}

// ─── Style Engine: Resolving Level & Container Styles ──────────

export interface ResolvedListLevelStyle {
  marker: ListStyle;
  fontSize?: number;
  fontWeight?: ListFontWeight;
  color?: string;
  itemSpacing?: number;
  lineHeight?: number;
  indentation: number;
  fontFamily?: string;
}

/**
 * Resolves styling for a given hierarchy depth (0 = Level 1, 1 = Level 2, ...).
 * Cascade: default fallback -> root legacy -> block.style -> block.style.levelStyles[depth + 1].
 */
export function resolveListLevelStyle(
  block?: Partial<ListBlock> | null,
  depth: number = 0,
): ResolvedListLevelStyle {
  const level = depth + 1;
  const baseStyle = block?.style;
  const levelOverride = baseStyle?.levelStyles?.[level];
  const listType: ListType = block?.listType ?? "bullet";

  // Marker hierarchy
  let marker: ListStyle;
  if (levelOverride?.marker) {
    marker = levelOverride.marker;
  } else if (baseStyle?.marker) {
    marker = baseStyle.marker;
  } else if (block?.listStyle) {
    marker = block.listStyle;
  } else if (listType === "checklist") {
    marker = "checklist";
  } else if (listType === "ordered") {
    if (depth === 1) marker = "lower-alpha";
    else if (depth === 2) marker = "lower-roman";
    else if (depth >= 3) marker = "upper-alpha";
    else marker = "decimal";
  } else {
    // Bullet default
    if (depth === 1) marker = "circle";
    else if (depth >= 2) marker = "square";
    else marker = "disc";
  }

  const fontSize = levelOverride?.fontSize ?? baseStyle?.fontSize ?? block?.fontSize;
  const fontWeight = levelOverride?.fontWeight ?? baseStyle?.fontWeight;
  const color = levelOverride?.color ?? baseStyle?.color;
  const itemSpacing = levelOverride?.itemSpacing ?? baseStyle?.itemSpacing ?? block?.itemSpacing;
  const lineHeight = baseStyle?.lineHeight ?? block?.lineHeight;
  const indentation = baseStyle?.indentation ?? 24;
  const fontFamily = baseStyle?.fontFamily;

  return {
    marker,
    fontSize,
    fontWeight,
    color,
    itemSpacing,
    lineHeight,
    indentation,
    fontFamily,
  };
}

/**
 * Resolves container-level CSS properties for the ListBlock.
 */
export function resolveListContainerStyle(
  block?: Partial<ListBlock> | null,
): React.CSSProperties & Record<string, string | number | undefined> {
  const styleObj: React.CSSProperties & Record<string, string | number | undefined> = {};
  const style = block?.style;

  const fontSize = style?.fontSize ?? block?.fontSize;
  if (fontSize) {
    styleObj.fontSize = `${fontSize}px`;
  }

  const lineHeight = style?.lineHeight ?? block?.lineHeight;
  if (lineHeight) {
    styleObj["--blog-list-line-height"] = lineHeight;
    styleObj.lineHeight = lineHeight;
  }

  const itemSpacing = style?.itemSpacing ?? block?.itemSpacing;
  if (typeof itemSpacing === "number") {
    styleObj["--blog-list-item-spacing"] = `${itemSpacing}px`;
  }

  if (style?.fontFamily) {
    styleObj.fontFamily = style.fontFamily;
  }
  if (style?.fontWeight) {
    styleObj.fontWeight = style.fontWeight;
  }
  if (style?.color) {
    styleObj.color = style.color;
  }
  if (style?.backgroundColor) {
    styleObj.backgroundColor = style.backgroundColor;
  }
  if (style?.borderColor) {
    styleObj.borderColor = style.borderColor;
  }
  if (typeof style?.borderWidth === "number") {
    styleObj.borderWidth = `${style.borderWidth}px`;
    styleObj.borderStyle = style.borderWidth > 0 ? "solid" : "none";
  }
  if (typeof style?.borderRadius === "number") {
    styleObj.borderRadius = `${style.borderRadius}px`;
  }
  if (typeof style?.padding === "number" && style.padding > 0) {
    styleObj.padding = `${style.padding}px`;
  }

  return styleObj;
}

// ─── Recursive Tree Traversal & Hierarchy Types ───────────────

export interface TreeLocation {
  item: ListItem;
  parent: ListItem | null;
  siblings: ListItem[];
  index: number;
  depth: number;
}

export interface FlatListItemInfo {
  item: ListItem;
  depth: number;
  canIndent: boolean;
  canOutdent: boolean;
  parent: ListItem | null;
}

/**
 * Searches for a ListItem within the tree by ID.
 * Returns the item, its parent, its sibling list, its index, and its depth.
 */
export function findItemLocation(
  items: ListItem[],
  targetId: string,
  parent: ListItem | null = null,
  depth = 0,
): TreeLocation | null {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === targetId) {
      return {
        item: items[i],
        parent,
        siblings: items,
        index: i,
        depth,
      };
    }
    if (items[i].children && items[i].children.length > 0) {
      const found = findItemLocation(items[i].children, targetId, items[i], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Measures the maximum relative depth of an item's children subtree.
 */
export function getSubtreeHeight(item: ListItem): number {
  if (!item.children || item.children.length === 0) return 0;
  let maxHeight = 0;
  for (const child of item.children) {
    maxHeight = Math.max(maxHeight, 1 + getSubtreeHeight(child));
  }
  return maxHeight;
}

/**
 * Flattens the recursive tree of ListItems into depth-annotated flat array for sequential editor display.
 */
export function flattenListItems(
  items: ListItem[],
  depth = 0,
  parent: ListItem | null = null,
): FlatListItemInfo[] {
  const result: FlatListItemInfo[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const canIndent = i > 0 && depth < MAX_LIST_DEPTH - 1;
    result.push({
      item,
      depth,
      canIndent,
      canOutdent: depth > 0,
      parent,
    });

    if (item.children && item.children.length > 0) {
      result.push(...flattenListItems(item.children, depth + 1, item));
    }
  }

  return result;
}

/**
 * Recursively updates the content of a ListItem by ID at any nesting depth.
 */
export function updateListItemContent(
  items: ListItem[],
  targetId: string,
  content: string,
): ListItem[] {
  return items.map((item) => {
    if (item.id === targetId) {
      return { ...item, content };
    }
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: updateListItemContent(item.children, targetId, content),
      };
    }
    return item;
  });
}

// ─── Hierarchy Operations: Indent & Outdent ───────────────────

/**
 * Indents an item (Tab):
 * The target item becomes the last child of its immediately preceding sibling.
 * Preserves any children that targetItem already possesses.
 * Guarded by MAX_LIST_DEPTH = 6.
 * Returns { items: updatedTree, success: true } or { items, success: false } if item cannot indent.
 */
export function indentListItem(
  items: ListItem[],
  targetId: string,
): { items: ListItem[]; success: boolean } {
  const cloned = cloneTree(items);
  const loc = findItemLocation(cloned, targetId);

  // Cannot indent if item doesn't exist or is the first item among its siblings
  if (!loc || loc.index === 0) {
    return { items, success: false };
  }

  const prevSibling = loc.siblings[loc.index - 1];
  const targetSubtreeHeight = getSubtreeHeight(loc.item);
  const newDepth = loc.depth + 1 + targetSubtreeHeight;

  // Enforce max depth guard
  if (newDepth >= MAX_LIST_DEPTH) {
    return { items, success: false };
  }

  const [targetItem] = loc.siblings.splice(loc.index, 1);

  if (!prevSibling.children) {
    prevSibling.children = [];
  }
  prevSibling.children.push(targetItem);

  return { items: cloned, success: true };
}

/**
 * Outdents an item (Shift + Tab):
 * The target item is moved out of its parent and inserted immediately after its former parent.
 * Preserves all children of targetItem, and keeps any other siblings of targetItem inside the parent.
 * Returns { items: updatedTree, success: true } or { items, success: false } if item cannot outdent (depth 0).
 */
export function outdentListItem(
  items: ListItem[],
  targetId: string,
): { items: ListItem[]; success: boolean } {
  const cloned = cloneTree(items);
  const loc = findItemLocation(cloned, targetId);

  // Cannot outdent if item doesn't exist or is already at root level (depth 0, no parent)
  if (!loc || !loc.parent) {
    return { items, success: false };
  }

  const [targetItem] = loc.siblings.splice(loc.index, 1);
  const parentLoc = findItemLocation(cloned, loc.parent.id);

  if (!parentLoc) {
    return { items, success: false };
  }

  // Insert targetItem immediately after its parent
  parentLoc.siblings.splice(parentLoc.index + 1, 0, targetItem);

  return { items: cloned, success: true };
}

/**
 * Duplicates a ListItem and all its nested children, regenerating all IDs cleanly.
 * Inserts the duplicate immediately after targetId in the same sibling array.
 */
export function duplicateListItem(
  items: ListItem[],
  targetId: string,
): { items: ListItem[]; newItemId?: string } {
  const cloned = cloneTree(items);
  const loc = findItemLocation(cloned, targetId);
  if (!loc) return { items, newItemId: undefined };

  const deepCloneWithNewIds = (item: ListItem): ListItem => ({
    id: generateListItemId(),
    content: item.content,
    ...(typeof item.checked === "boolean" ? { checked: item.checked } : {}),
    children: (item.children || []).map(deepCloneWithNewIds),
  });

  const duplicatedItem = deepCloneWithNewIds(loc.item);
  loc.siblings.splice(loc.index + 1, 0, duplicatedItem);

  return { items: cloned, newItemId: duplicatedItem.id };
}

/**
 * Splits an item within the tree at cursorPosition.
 * The new item is placed as a sibling immediately following the current item at the same level.
 */
export function splitListItemInTree(
  items: ListItem[],
  targetId: string,
  cursorPosition: number,
): { items: ListItem[]; newItemId: string } {
  const cloned = cloneTree(items);
  const loc = findItemLocation(cloned, targetId);
  const newItemId = generateListItemId();

  if (!loc) {
    const newItem: ListItem = { id: newItemId, content: "", children: [] };
    cloned.push(newItem);
    return { items: cloned, newItemId };
  }

  const currentItem = loc.item;
  const fullText = currentItem.content;
  const safeCursor = Math.max(0, Math.min(cursorPosition, fullText.length));

  const leftContent = fullText.substring(0, safeCursor);
  const rightContent = fullText.substring(safeCursor);

  currentItem.content = leftContent;
  const newItem: ListItem = { id: newItemId, content: rightContent, children: [] };

  loc.siblings.splice(loc.index + 1, 0, newItem);

  return { items: cloned, newItemId };
}

/**
 * Deletes an item from the tree by ID.
 * If the item has children, they are promoted into siblings in-place so no content is lost.
 */
export function deleteListItemInTree(
  items: ListItem[],
  targetId: string,
): { items: ListItem[]; targetFocusId?: string; targetItemId?: string } {
  const cloned = cloneTree(items);
  const loc = findItemLocation(cloned, targetId);

  if (!loc) return { items };

  const flatList = flattenListItems(cloned);
  if (flatList.length <= 1) {
    loc.item.content = "";
    loc.item.children = [];
    return { items: cloned, targetFocusId: loc.item.id, targetItemId: loc.item.id };
  }

  const flatIndex = flatList.findIndex((it) => it.item.id === targetId);
  const targetFocusId = flatIndex > 0
    ? flatList[flatIndex - 1].item.id
    : flatList[flatIndex + 1]?.item.id;

  const childrenToPromote = loc.item.children || [];
  loc.siblings.splice(loc.index, 1, ...childrenToPromote);

  return { items: cloned, targetFocusId, targetItemId: targetFocusId };
}

/**
 * Appends a new item at the root level or directly after a target item.
 */
export function addListItem(
  items: ListItem[],
  targetOrIndex?: number | string,
  content = "",
): { items: ListItem[]; newItemId: string } {
  const newItemId = generateListItemId();
  const newItem: ListItem = { id: newItemId, content, children: [] };
  const nextItems = cloneTree(items);

  if (typeof targetOrIndex === "number" && targetOrIndex >= 0 && targetOrIndex <= nextItems.length) {
    nextItems.splice(targetOrIndex, 0, newItem);
  } else if (typeof targetOrIndex === "string" && targetOrIndex.trim()) {
    const loc = findItemLocation(nextItems, targetOrIndex);
    if (loc) {
      loc.siblings.splice(loc.index + 1, 0, newItem);
    } else {
      nextItems.push(newItem);
    }
  } else {
    nextItems.push(newItem);
  }

  return { items: nextItems, newItemId };
}

/**
 * Splits an item at cursorPosition in 1D array (Phase 2 legacy helper maintained).
 */
export function splitListItem(
  items: ListItem[],
  index: number,
  cursorPosition: number,
): { items: ListItem[]; newItemId: string } {
  if (index < 0 || index >= items.length) {
    return addListItem(items);
  }
  return splitListItemInTree(items, items[index].id, cursorPosition);
}

/**
 * Merges an item with the item immediately preceding it in document order.
 */
export function mergeListItemWithPrevious(
  items: ListItem[],
  index: number,
): { items: ListItem[]; targetCursorPos: number; targetItemId: string } | null {
  if (index <= 0 || index >= items.length) {
    return null;
  }

  const prevItem = items[index - 1];
  const currentItem = items[index];

  const targetCursorPos = prevItem.content.length;
  const mergedContent = prevItem.content + currentItem.content;
  const mergedChildren = [...(prevItem.children || []), ...(currentItem.children || [])];

  const updatedPrev: ListItem = {
    ...prevItem,
    content: mergedContent,
    children: mergedChildren,
  };

  const nextItems = [...items];
  nextItems.splice(index - 1, 2, updatedPrev);

  return {
    items: nextItems,
    targetCursorPos,
    targetItemId: prevItem.id,
  };
}

/**
 * Deletes an item by index in 1D array (Phase 2 legacy helper maintained).
 */
export function deleteListItem(
  items: ListItem[],
  index: number,
): { items: ListItem[]; targetItemId?: string; targetFocusId?: string } {
  if (index < 0 || index >= items.length) {
    return { items };
  }
  return deleteListItemInTree(items, items[index].id);
}

/**
 * Inserts an array of parsed ListItems into the tree at the location of targetId.
 * Slices text around cursorPosition if targetId has existing content.
 * Replaces targetId completely if targetId was empty.
 */
export function insertPastedItemsInTree(
  items: ListItem[],
  targetId: string,
  pastedItems: ListItem[],
  cursorPosition?: number,
): { items: ListItem[]; targetFocusId: string; targetCursorPos: number } {
  if (pastedItems.length === 0) {
    return { items, targetFocusId: targetId, targetCursorPos: cursorPosition ?? 0 };
  }

  const cloned = cloneTree(items);
  const loc = findItemLocation(cloned, targetId);
  const clonedPasted = cloneTree(pastedItems);

  if (!loc) {
    cloned.push(...clonedPasted);
    const last = clonedPasted[clonedPasted.length - 1];
    return {
      items: cloned,
      targetFocusId: last.id,
      targetCursorPos: last.content.length,
    };
  }

  const currentContent = loc.item.content;

  // Case A: Target item is completely empty
  if (currentContent === "") {
    // Preserve any existing children of targetItem by attaching them to the last pasted item
    if (loc.item.children && loc.item.children.length > 0) {
      const lastPasted = clonedPasted[clonedPasted.length - 1];
      lastPasted.children = [...lastPasted.children, ...loc.item.children];
    }

    loc.siblings.splice(loc.index, 1, ...clonedPasted);
    const last = clonedPasted[clonedPasted.length - 1];
    return {
      items: cloned,
      targetFocusId: last.id,
      targetCursorPos: last.content.length,
    };
  }

  // Case B: Target item has text -> slice around cursor
  const safeCursor = Math.max(
    0,
    Math.min(cursorPosition ?? currentContent.length, currentContent.length),
  );
  const prefix = currentContent.substring(0, safeCursor);
  const suffix = currentContent.substring(safeCursor);

  clonedPasted[0].content = prefix + clonedPasted[0].content;
  const lastPasted = clonedPasted[clonedPasted.length - 1];
  lastPasted.content = lastPasted.content + suffix;

  if (loc.item.children && loc.item.children.length > 0) {
    lastPasted.children = [...lastPasted.children, ...loc.item.children];
  }

  loc.siblings.splice(loc.index, 1, ...clonedPasted);

  return {
    items: cloned,
    targetFocusId: lastPasted.id,
    targetCursorPos: lastPasted.content.length - suffix.length,
  };
}

/**
 * Moves an item up or down among its siblings.
 */
export function moveListItem(
  items: ListItem[],
  targetId: string,
  direction: "up" | "down",
): { items: ListItem[]; success: boolean } {
  const cloned = cloneTree(items);
  const loc = findItemLocation(cloned, targetId);

  if (!loc) return { items, success: false };

  const targetIdx = direction === "up" ? loc.index - 1 : loc.index + 1;
  if (targetIdx < 0 || targetIdx >= loc.siblings.length) {
    return { items, success: false };
  }

  const [moved] = loc.siblings.splice(loc.index, 1);
  loc.siblings.splice(targetIdx, 0, moved);

  return { items: cloned, success: true };
}
