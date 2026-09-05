"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { BlockPicker } from "../blocks/BlockPicker";
import type { ContentBlock } from "../model/document.types";

export interface InsertZoneProps {
  onInsert: (type: ContentBlock["type"]) => void;
}

/**
 * Thin horizontal insert zone shown between blocks in the visual editor.
 * On hover: shows + button. On click: opens block picker popover.
 * Smart positioning: opens upward if near the bottom of viewport to avoid being cut off.
 */
export function InsertZone({ onInsert }: InsertZoneProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (!showPicker && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If there is less than 320px below, open upward
      setOpenUpward(spaceBelow < 320);
    }
    setShowPicker((prev) => !prev);
  }, [showPicker]);

  // Close picker on click outside
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  return (
    <div ref={containerRef} className="ve-insert-zone group relative">
      {/* Line + button */}
      <div className="ve-insert-zone-line" />
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

      {/* Picker popover */}
      {showPicker && (
        <div
          className={`ve-insert-zone-picker ${
            openUpward ? "ve-insert-zone-picker-up" : ""
          }`}
        >
          <BlockPicker
            onSelect={(type) => {
              onInsert(type);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        </div>
      )}
    </div>
  );
}
