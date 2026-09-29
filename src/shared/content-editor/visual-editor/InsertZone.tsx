"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { BlockPicker } from "../blocks/BlockPicker";
import type { ContentBlock } from "../model/document.types";

export interface InsertZoneProps {
  onInsert: (type: ContentBlock["type"]) => void;
}

/**
 * Thin horizontal insert zone shown between blocks in the visual editor.
 * On hover: shows + button. On click: opens block picker popover.
 * Uses a React Portal so the picker floats above ALL content (no z-index stacking issues).
 */
export function InsertZone({ onInsert }: InsertZoneProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (!showPicker && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 320;
      setPickerPos({
        top: openUpward ? rect.top : rect.bottom,
        left: rect.left + rect.width / 2,
        openUpward,
      });
    }
    setShowPicker((prev) => !prev);
  }, [showPicker]);

  // Close picker on click outside
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ignore clicks inside the portal picker
      if (target.closest?.(".ve-insert-zone-picker-portal")) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  // Recalculate position on scroll/resize while open
  useEffect(() => {
    if (!showPicker || !containerRef.current) return;
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 320;
      setPickerPos({
        top: openUpward ? rect.top : rect.bottom,
        left: rect.left + rect.width / 2,
        openUpward,
      });
    };
    // Listen on the scrollable ancestor, not just window
    const scrollParent = containerRef.current.closest(".overflow-y-auto, .overflow-auto, [data-scroll-container]") || window;
    scrollParent.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      scrollParent.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [showPicker]);

  return (
    <>
      <div
        ref={containerRef}
        className="ve-insert-zone group relative"
      >
        {/* Line + button — only visible when picker is closed */}
        {!showPicker && <div className="ve-insert-zone-line" />}
        {!showPicker && (
          <button
            type="button"
            className="ve-insert-zone-button"
            onClick={handleToggle}
            aria-label="Thêm khối nội dung"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Portal: backdrop + picker rendered at document.body level */}
      {showPicker && pickerPos &&
        createPortal(
          <>
            {/* Invisible backdrop to block interactions + close on click */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setShowPicker(false)}
            />
            {/* Picker floating above everything */}
            <div
              className="ve-insert-zone-picker-portal fixed z-[9999]"
              style={{
                left: pickerPos.left,
                transform: "translateX(-50%)",
                ...(pickerPos.openUpward
                  ? { bottom: window.innerHeight - pickerPos.top + 8 }
                  : { top: pickerPos.top + 8 }),
              }}
            >
              <div className="ve-insert-zone-picker-card">
                <BlockPicker
                  onSelect={(type) => {
                    onInsert(type);
                    setShowPicker(false);
                  }}
                  onClose={() => setShowPicker(false)}
                />
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
