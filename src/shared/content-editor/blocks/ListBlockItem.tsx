import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { AppButton } from "@/components/ui";
import { useHtmlShortcuts } from "../paste/useHtmlShortcuts";
import type { ListBlock, ListType, ListStyle, ListItem } from "../model/document.types";
import {
  normalizeListItems,
  flattenListItems,
  indentListItem,
  outdentListItem,
  splitListItemInTree,
  deleteListItemInTree,
  updateListItemContent,
  findItemLocation,
  addListItem,
  moveListItem,
  duplicateListItem,
  insertPastedItemsInTree,
  type FlatListItemInfo,
  resolveListLevelStyle,
  toRoman,
  MAX_LIST_DEPTH,
} from "../paste/list-helpers";
import { parseClipboardTextToList } from "../paste/list-parser";

export interface ListBlockItemProps {
  block: ListBlock;
  onChange: (updated: ListBlock) => void;
}

interface ListItemInputProps {
  value: string;
  index: number;
  depth: number;
  style?: React.CSSProperties;
  onChange: (newValue: string) => void;
  onEnter: (cursorPosition: number) => void;
  onBackspace: (cursorPosition: number) => void;
  onDeleteKey: (cursorPosition: number) => void;
  onTab: (isShift: boolean, cursorPosition: number) => void;
  onPaste: (text: string, cursorPosition: number) => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
}

function getItemMarker(
  index: number,
  depth: number,
  listType: ListType,
  listStyle?: ListStyle,
): string {
  if (listType === "checklist" || listStyle === "checklist") {
    return "☑";
  }
  if (listType === "ordered") {
    const num = index + 1;
    if (listStyle === "lower-roman") {
      return `${toRoman(num, false)}.`;
    }
    if (listStyle === "upper-roman") {
      return `${toRoman(num, true)}.`;
    }
    if (listStyle === "lower-alpha" || (depth === 1 && !listStyle)) {
      return `${String.fromCharCode(96 + ((num - 1) % 26) + 1)}.`;
    }
    if (listStyle === "upper-alpha") {
      return `${String.fromCharCode(64 + ((num - 1) % 26) + 1)}.`;
    }
    return `${num}.`;
  }

  // Bullet styles
  if (listStyle === "circle" || depth === 1) return "◦";
  if (listStyle === "square" || depth === 2) return "▪";
  if (depth >= 3) return "▫";
  return "•";
}

/** Individual list item input with HTML shortcuts, Tab/Shift+Tab indenting, and multi-line paste */
function ListItemInput({
  value,
  index,
  depth,
  style,
  onChange,
  onEnter,
  onBackspace,
  onDeleteKey,
  onTab,
  onPaste,
  onNavigateUp,
  onNavigateDown,
  inputRef,
}: ListItemInputProps) {
  const { handleKeyDown: handleShortcutKeyDown } = useHtmlShortcuts(onChange);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Text formatting shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)
    if ((e.ctrlKey || e.metaKey) && ["b", "i", "u"].includes(e.key.toLowerCase())) {
      handleShortcutKeyDown(e);
      return;
    }

    const input = e.currentTarget;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;

    // 2. Tab / Shift+Tab: Indent / Outdent hierarchy
    if (e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      onTab(e.shiftKey, start);
      return;
    }

    // 3. Enter: create item / split item
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onEnter(start);
      return;
    }

    // 4. Backspace: outdent nested item or merge / delete empty item
    if (e.key === "Backspace") {
      if ((start === 0 && end === 0) || value === "") {
        e.preventDefault();
        e.stopPropagation();
        onBackspace(start);
        return;
      }
    }

    // 5. Delete: merge next item into current item when cursor is at end
    if (e.key === "Delete") {
      if (start === value.length && end === value.length) {
        e.preventDefault();
        e.stopPropagation();
        onDeleteKey(start);
        return;
      }
    }

    // 6. Arrow navigation between items
    if (e.key === "ArrowUp" && start === 0) {
      e.preventDefault();
      onNavigateUp?.();
      return;
    }

    if (e.key === "ArrowDown" && start === value.length) {
      e.preventDefault();
      onNavigateDown?.();
      return;
    }
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    const isMultiLine = text.includes("\n");
    const hasMarker = /^[•◦▪▫*\-–—+]|\d+[\.\)]/.test(text.trim());

    if (isMultiLine || hasMarker) {
      e.preventDefault();
      e.stopPropagation();
      const input = e.currentTarget;
      const start = input.selectionStart ?? value.length;
      onPaste(text, start);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      style={style}
      className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
      placeholder={`Nội dung mục ${index + 1}...`}
      title={`Mục ${index + 1} (Cấp ${depth + 1})`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={handleInputPaste}
    />
  );
}

export function ListBlockItem({ block, onChange }: ListBlockItemProps) {
  const [showStylePanel, setShowStylePanel] = useState(false);

  // Normalize legacy string items or unnested items to ListItem[]
  const items = useMemo(() => normalizeListItems(block.items), [block.items]);
  const flatItems = useMemo(() => flattenListItems(items), [items]);

  const listType: ListType = block.listType ?? "bullet";
  const listStyle: ListStyle | undefined = block.listStyle;

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const pendingFocusRef = useRef<{ id: string; cursorPosition?: number } | null>(null);

  // Sync legacy format to normalized format once if needed
  useEffect(() => {
    if (Array.isArray(block.items) && block.items.some((it) => typeof it === "string")) {
      onChange({ ...block, items });
    }
  }, [block, items, onChange]);

  // Focus restoration after item mutations
  useEffect(() => {
    if (pendingFocusRef.current) {
      const { id, cursorPosition } = pendingFocusRef.current;
      const el = inputRefs.current.get(id);
      if (el) {
        el.focus();
        if (typeof cursorPosition === "number") {
          el.setSelectionRange(cursorPosition, cursorPosition);
        }
      }
      pendingFocusRef.current = null;
    }
  }, [items]);

  const handleItemContentChange = useCallback(
    (id: string, newContent: string) => {
      const nextItems = updateListItemContent(items, id, newContent);
      onChange({ ...block, items: nextItems });
    },
    [block, items, onChange],
  );

  const handleTab = useCallback(
    (id: string, isShift: boolean, cursorPosition: number) => {
      if (isShift) {
        const { items: nextItems, success } = outdentListItem(items, id);
        if (success) {
          pendingFocusRef.current = { id, cursorPosition };
          onChange({ ...block, items: nextItems });
        }
      } else {
        const { items: nextItems, success } = indentListItem(items, id);
        if (success) {
          pendingFocusRef.current = { id, cursorPosition };
          onChange({ ...block, items: nextItems });
        }
      }
    },
    [block, items, onChange],
  );

  const handleEnter = useCallback(
    (id: string, cursorPosition: number) => {
      const { items: nextItems, newItemId } = splitListItemInTree(items, id, cursorPosition);
      pendingFocusRef.current = { id: newItemId, cursorPosition: 0 };
      onChange({ ...block, items: nextItems });
    },
    [block, items, onChange],
  );

  const handlePaste = useCallback(
    (targetId: string, text: string, cursorPosition: number) => {
      const { items: parsed, suggestedListType, suggestedListStyle } = parseClipboardTextToList(text);
      if (parsed.length === 0) return;

      const { items: nextItems, targetFocusId, targetCursorPos } = insertPastedItemsInTree(
        items,
        targetId,
        parsed,
        cursorPosition,
      );

      pendingFocusRef.current = { id: targetFocusId, cursorPosition: targetCursorPos };

      onChange({
        ...block,
        items: nextItems,
        listType: block.listType ?? suggestedListType,
        listStyle: block.listStyle ?? suggestedListStyle,
      });
    },
    [block, items, onChange],
  );

  const handleBackspace = useCallback(
    (info: FlatListItemInfo, flatIndex: number, cursorPosition: number) => {
      // 1. If item is empty:
      if (info.item.content === "") {
        if (info.depth > 0) {
          handleTab(info.item.id, true, 0);
          return;
        }

        if (flatItems.length <= 1) return;

        const { items: nextItems, targetFocusId } = deleteListItemInTree(items, info.item.id);
        if (targetFocusId) {
          const flatAfter = flattenListItems(nextItems);
          const target = flatAfter.find((it) => it.item.id === targetFocusId);
          pendingFocusRef.current = {
            id: targetFocusId,
            cursorPosition: target?.item.content.length ?? 0,
          };
        }
        onChange({ ...block, items: nextItems });
        return;
      }

      // 2. If cursor is at start of non-empty item:
      if (cursorPosition === 0) {
        if (info.depth > 0) {
          handleTab(info.item.id, true, 0);
          return;
        }

        if (flatIndex > 0) {
          const prevFlat = flatItems[flatIndex - 1];
          const targetCursorPos = prevFlat.item.content.length;
          const mergedContent = prevFlat.item.content + info.item.content;
          const nextItems = updateListItemContent(items, prevFlat.item.id, mergedContent);

          if (info.item.children && info.item.children.length > 0) {
            const loc = findItemLocation(nextItems, prevFlat.item.id);
            if (loc) {
              loc.item.children = [...(loc.item.children || []), ...info.item.children];
            }
          }
          const delRes = deleteListItemInTree(nextItems, info.item.id);
          pendingFocusRef.current = {
            id: prevFlat.item.id,
            cursorPosition: targetCursorPos,
          };
          onChange({ ...block, items: delRes.items });
        }
      }
    },
    [block, flatItems, handleTab, items, onChange],
  );

  const handleDeleteKey = useCallback(
    (info: FlatListItemInfo, flatIndex: number, cursorPosition: number) => {
      if (cursorPosition === info.item.content.length && flatIndex < flatItems.length - 1) {
        const nextFlat = flatItems[flatIndex + 1];
        const mergedContent = info.item.content + nextFlat.item.content;
        const nextItems = updateListItemContent(items, info.item.id, mergedContent);

        if (nextFlat.item.children && nextFlat.item.children.length > 0) {
          const loc = findItemLocation(nextItems, info.item.id);
          if (loc) {
            loc.item.children = [...(loc.item.children || []), ...nextFlat.item.children];
          }
        }
        const delRes = deleteListItemInTree(nextItems, nextFlat.item.id);
        pendingFocusRef.current = {
          id: info.item.id,
          cursorPosition,
        };
        onChange({ ...block, items: delRes.items });
      }
    },
    [block, flatItems, items, onChange],
  );

  const handleAddItem = useCallback(() => {
    const { items: nextItems, newItemId } = addListItem(items);
    pendingFocusRef.current = { id: newItemId, cursorPosition: 0 };
    onChange({ ...block, items: nextItems });
  }, [block, items, onChange]);

  const handleDuplicateItem = useCallback(
    (targetId: string) => {
      const { items: nextItems, newItemId } = duplicateListItem(items, targetId);
      if (newItemId) {
        pendingFocusRef.current = { id: newItemId, cursorPosition: 0 };
        onChange({ ...block, items: nextItems });
      }
    },
    [block, items, onChange],
  );

  const handleRemoveItem = useCallback(
    (id: string) => {
      if (flatItems.length <= 1) return;
      const { items: nextItems, targetFocusId } = deleteListItemInTree(items, id);
      if (targetFocusId) {
        const flatAfter = flattenListItems(nextItems);
        const target = flatAfter.find((it) => it.item.id === targetFocusId);
        pendingFocusRef.current = {
          id: targetFocusId,
          cursorPosition: target?.item.content.length ?? 0,
        };
      }
      onChange({ ...block, items: nextItems });
    },
    [block, flatItems.length, items, onChange],
  );

  const handleNavigateUp = useCallback(
    (flatIndex: number) => {
      if (flatIndex > 0) {
        const prev = flatItems[flatIndex - 1];
        const el = inputRefs.current.get(prev.item.id);
        if (el) {
          el.focus();
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      }
    },
    [flatItems],
  );

  const handleNavigateDown = useCallback(
    (flatIndex: number) => {
      if (flatIndex < flatItems.length - 1) {
        const next = flatItems[flatIndex + 1];
        const el = inputRefs.current.get(next.item.id);
        if (el) {
          el.focus();
          el.setSelectionRange(0, 0);
        }
      }
    },
    [flatItems],
  );

  const handleMoveItem = useCallback(
    (targetId: string, direction: "up" | "down") => {
      const { items: nextItems, success } = moveListItem(items, targetId, direction);
      if (success) {
        onChange({ ...block, items: nextItems });
      }
    },
    [block, items, onChange],
  );

  const handleToggleCheck = useCallback(
    (targetId: string, checked: boolean) => {
      const toggleInItems = (itemList: ListItem[]): ListItem[] => {
        return itemList.map((it) => {
          if (it.id === targetId) {
            return { ...it, checked };
          }
          if (it.children && it.children.length > 0) {
            return { ...it, children: toggleInItems(it.children) };
          }
          return it;
        });
      };
      onChange({ ...block, items: toggleInItems(items) });
    },
    [block, items, onChange],
  );

  // List Style / Type changes
  const handleListTypeChange = (type: ListType) => {
    const defaultStyle: ListStyle =
      type === "ordered" ? "decimal" : type === "checklist" ? "checklist" : "disc";
    onChange({
      ...block,
      listType: type,
      listStyle: defaultStyle,
    });
  };

  const handleMarkerStyleChange = (style: ListStyle) => {
    onChange({ ...block, listStyle: style });
  };

  const handleFontSizeChange = (fontSize: number) => {
    onChange({ ...block, fontSize });
  };

  const handleLineHeightChange = (lineHeight: number) => {
    onChange({ ...block, lineHeight });
  };

  const handleItemSpacingChange = (itemSpacing: number) => {
    onChange({ ...block, itemSpacing });
  };

  return (
    <div className="space-y-3">
      {/* List Block Header Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-1.5">
          {/* Type Toggle: Bullet vs Numbered vs Checklist */}
          <button
            type="button"
            onClick={() => handleListTypeChange("bullet")}
            className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors ${
              listType === "bullet"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
            title="Danh sách gạch đầu dòng (• Bullet)"
          >
            <span>•</span> Bullet
          </button>
          <button
            type="button"
            onClick={() => handleListTypeChange("ordered")}
            className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors ${
              listType === "ordered"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
            title="Danh sách đánh số (1. Numbered)"
          >
            <span>1.</span> Số thứ tự
          </button>
          <button
            type="button"
            onClick={() => handleListTypeChange("checklist")}
            className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors ${
              listType === "checklist"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
            title="Danh sách việc cần làm (☑ Checklist)"
          >
            <span>☑</span> Checklist
          </button>

          {/* Marker Style Dropdown */}
          <select
            value={listStyle ?? (listType === "ordered" ? "decimal" : listType === "checklist" ? "checklist" : "disc")}
            onChange={(e) => handleMarkerStyleChange(e.target.value as ListStyle)}
            aria-label="Kiểu ký hiệu danh sách"
            className="h-7 rounded border border-border bg-surface px-2 text-xs text-text focus:border-primary focus:outline-none"
          >
            {listType === "bullet" && (
              <>
                <option value="disc">Chấm tròn (Disc •)</option>
                <option value="circle">Vòng tròn (Circle ◦)</option>
                <option value="square">Hình vuông (Square ▪)</option>
              </>
            )}
            {listType === "ordered" && (
              <>
                <option value="decimal">Số thập phân (1, 2, 3)</option>
                <option value="lower-alpha">Chữ thường (a, b, c)</option>
                <option value="upper-alpha">Chữ in hoa (A, B, C)</option>
                <option value="lower-roman">Số La Mã thường (i, ii, iii)</option>
                <option value="upper-roman">Số La Mã in hoa (I, II, III)</option>
              </>
            )}
            {listType === "checklist" && (
              <option value="checklist">Hộp kiểm (Checklist ☑)</option>
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Typography Settings */}
          <button
            type="button"
            onClick={() => setShowStylePanel((prev) => !prev)}
            className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors ${
              showStylePanel
                ? "bg-primary text-white"
                : "border border-border bg-surface-muted text-text-muted hover:text-text"
            }`}
            title="Tuỳ chỉnh cỡ chữ & khoảng cách dòng"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Kiểu chữ
          </button>
          <span className="text-[11px] text-text-muted">
            {flatItems.length} mục
          </span>
        </div>
      </div>

      {/* Typography / Spacing Popdown */}
      {showStylePanel && (
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-surface-muted/40 p-3 text-xs">
          <div>
            <label className="mb-1 block text-text-muted">Cỡ chữ (px):</label>
            <input
              type="number"
              min={10}
              max={48}
              value={block.fontSize ?? ""}
              placeholder="16"
              onChange={(e) => handleFontSizeChange(Number(e.target.value) || 16)}
              className="w-full rounded border border-border bg-surface px-2 py-1 text-text"
            />
          </div>
          <div>
            <label className="mb-1 block text-text-muted">Chiều cao dòng:</label>
            <input
              type="number"
              step="0.1"
              min={1.0}
              max={3.0}
              value={block.lineHeight ?? ""}
              placeholder="1.6"
              onChange={(e) => handleLineHeightChange(Number(e.target.value) || 1.6)}
              className="w-full rounded border border-border bg-surface px-2 py-1 text-text"
            />
          </div>
          <div>
            <label className="mb-1 block text-text-muted">Khoảng cách mục (px):</label>
            <input
              type="number"
              min={0}
              max={32}
              value={block.itemSpacing ?? ""}
              placeholder="6"
              onChange={(e) => handleItemSpacingChange(Number(e.target.value) || 6)}
              className="w-full rounded border border-border bg-surface px-2 py-1 text-text"
            />
          </div>
        </div>
      )}

      {/* Items List Container */}
      <div className="space-y-1.5">
        {flatItems.map((flat, index) => {
          const levelStyle = resolveListLevelStyle(block, flat.depth);
          const canMoveUp = index > 0;
          const canMoveDown = index < flatItems.length - 1;

          return (
            <div
              key={flat.item.id}
              className="group flex items-center gap-1.5 transition-all"
              style={{
                paddingLeft: `${flat.depth * levelStyle.indentation}px`,
                marginBottom:
                  typeof levelStyle.itemSpacing === "number"
                    ? `${levelStyle.itemSpacing}px`
                    : undefined,
              }}
            >
              {listType === "checklist" ? (
                <input
                  type="checkbox"
                  checked={!!flat.item.checked}
                  onChange={(e) => handleToggleCheck(flat.item.id, e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary"
                  title={flat.item.checked ? "Đã xong" : "Chưa hoàn thành"}
                />
              ) : (
                <span
                  className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted px-1 text-xs font-semibold text-text-muted select-none"
                  title={`Cấp ${flat.depth + 1}`}
                >
                  {getItemMarker(index, flat.depth, listType, levelStyle.marker)}
                </span>
              )}

              <ListItemInput
                value={flat.item.content}
                index={index}
                depth={flat.depth}
                style={{
                  fontSize: levelStyle.fontSize ? `${levelStyle.fontSize}px` : undefined,
                  fontWeight:
                    levelStyle.fontWeight === "bold"
                      ? 700
                      : levelStyle.fontWeight === "semibold"
                        ? 600
                        : levelStyle.fontWeight === "medium"
                          ? 500
                          : undefined,
                  color: levelStyle.color,
                  fontFamily: levelStyle.fontFamily,
                }}
                onChange={(newContent) => handleItemContentChange(flat.item.id, newContent)}
                onEnter={(cursorPos) => handleEnter(flat.item.id, cursorPos)}
                onBackspace={(cursorPos) => handleBackspace(flat, index, cursorPos)}
                onDeleteKey={(cursorPos) => handleDeleteKey(flat, index, cursorPos)}
                onTab={(isShift, cursorPos) => handleTab(flat.item.id, isShift, cursorPos)}
                onPaste={(text, cursorPos) => handlePaste(flat.item.id, text, cursorPos)}
                onNavigateUp={() => handleNavigateUp(index)}
                onNavigateDown={() => handleNavigateDown(index)}
                inputRef={(el) => {
                  if (el) {
                    inputRefs.current.set(flat.item.id, el);
                  } else {
                    inputRefs.current.delete(flat.item.id);
                  }
                }}
              />

              <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleMoveItem(flat.item.id, "up")}
                  disabled={!canMoveUp}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-20"
                  title="Di chuyển lên"
                  aria-label="Di chuyển lên"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveItem(flat.item.id, "down")}
                  disabled={!canMoveDown}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-20"
                  title="Di chuyển xuống"
                  aria-label="Di chuyển xuống"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleTab(flat.item.id, true, 0)}
                  disabled={!flat.canOutdent}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-20"
                  title="Lùi một cấp (Shift + Tab)"
                  aria-label="Lùi một cấp (Shift + Tab)"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleTab(flat.item.id, false, 0)}
                  disabled={!flat.canIndent || flat.depth >= MAX_LIST_DEPTH - 1}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-20"
                  title="Thụt vào một cấp (Tab)"
                  aria-label="Thụt vào một cấp (Tab)"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateItem(flat.item.id)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-primary"
                  title="Nhân bản dòng này"
                  aria-label="Nhân bản dòng này"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V14.5A1.5 1.5 0 0115.5 16h-7A1.5 1.5 0 017 14.5v-11z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-.75a.75.75 0 00-1.5 0v.75a.25.25 0 01-.25.25h-7a.25.25 0 01-.25-.25v-9a.25.25 0 01.25-.25h.75a.75.75 0 000-1.5h-.75z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(flat.item.id)}
                  disabled={flatItems.length <= 1}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-20"
                  title="Xoá mục này"
                  aria-label="Xoá mục này"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AppButton
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAddItem}
        className="w-full border border-dashed border-border py-1.5 text-xs text-text-muted hover:border-primary hover:text-primary"
      >
        + Thêm dòng vào danh sách
      </AppButton>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
        <span className="font-medium text-text">Mẹo soạn thảo:</span>
        <span>Paste nhiều dòng từ Word/Docs</span>
        <span>•</span>
        <span>Nhấn <kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd> xuống dòng</span>
        <span>•</span>
        <span><kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[10px]">Tab</kbd> thụt cấp (tối đa {MAX_LIST_DEPTH})</span>
        <span>•</span>
        <span><kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[10px]">Shift+Tab</kbd> lùi cấp</span>
        <span>•</span>
        <span><kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[10px]">Backspace</kbd> gộp / xoá</span>
        <span>•</span>
        <kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[10px]">Ctrl+B</kbd>
        <span>Đậm</span>
        <kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[10px]">Ctrl+I</kbd>
        <span>Nghiêng</span>
        <kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[10px]">Ctrl+U</kbd>
        <span>Gạch chân</span>
      </div>
    </div>
  );
}
