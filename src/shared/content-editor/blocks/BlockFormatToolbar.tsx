"use client";

import React from "react";
import type { FormatAction } from "../paste/useHtmlShortcuts";

export interface BlockFormatToolbarProps {
  onApply: (action: FormatAction) => void;
  className?: string;
  size?: "xs" | "sm";
  showClear?: boolean;
  activeActions?: FormatAction[];
}

interface FormatButton {
  action: FormatAction;
  label: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  title: string | ((isActive: boolean) => string);
  className?: string;
}

const BUTTONS: FormatButton[] = [
  {
    action: "bold",
    label: <span className="font-bold">B</span>,
    title: "In đậm (Ctrl + B)",
    className: "font-serif font-bold",
  },
  {
    action: "italic",
    label: <span className="italic">I</span>,
    title: "In nghiêng (Ctrl + I)",
    className: "font-serif italic",
  },
  {
    action: "underline",
    label: <span className="underline decoration-1 underline-offset-2">U</span>,
    title: "Gạch chân (Ctrl + U)",
    className: "font-serif",
  },
  {
    action: "strikethrough",
    label: <span className="line-through">S</span>,
    title: "Gạch ngang (Ctrl + Shift + X)",
    className: "font-serif",
  },
  {
    action: "code",
    label: <span className="font-mono text-[10px]">&lt;/&gt;</span>,
    title: "Mã inline (Ctrl + Shift + C)",
  },
  {
    action: "highlight",
    label: (isActive: boolean) => (
      <span
        className={`rounded px-1 py-0.2 font-medium text-[10px] ${
          isActive
            ? "bg-white/20 text-white"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
        }`}
      >
        HL
      </span>
    ),
    title: "Đánh dấu highlight (Ctrl + Shift + H)",
  },
  {
    action: "link",
    label: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
        <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
      </svg>
    ),
    title: (isActive: boolean) =>
      isActive ? "Hủy bỏ liên kết (Ctrl + K)" : "Chèn liên kết (Ctrl + K)",
  },
  {
    action: "clear",
    label: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-text-muted">
        <path fillRule="evenodd" d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" clipRule="evenodd" />
      </svg>
    ),
    title: "Xóa định dạng (Ctrl + \\)",
  },
];

export function BlockFormatToolbar({
  onApply,
  className = "",
  size = "xs",
  showClear = true,
  activeActions,
}: BlockFormatToolbarProps) {
  const btnPadding = size === "xs" ? "h-6 px-1.5 text-xs" : "h-7 px-2 text-xs";

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-0.5 rounded-md border border-border/80 bg-surface-muted/60 p-0.5 shadow-2xs backdrop-blur-xs ${className}`}
      role="toolbar"
      aria-label="Định dạng văn bản"
    >
      {BUTTONS.map((btn) => {
        if (btn.action === "clear" && !showClear) return null;

        const isActive = Boolean(activeActions?.includes(btn.action));
        const renderedLabel =
          typeof btn.label === "function" ? btn.label(isActive) : btn.label;
        const renderedTitle =
          typeof btn.title === "function" ? btn.title(isActive) : btn.title;

        return (
          <button
            key={btn.action}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => onApply(btn.action)}
            title={renderedTitle}
            className={`inline-flex items-center justify-center rounded transition-colors ${btnPadding} ${
              isActive
                ? "bg-primary text-white shadow-2xs hover:bg-primary/90 hover:text-white"
                : "text-text hover:bg-surface hover:text-primary active:bg-primary/10"
            } ${btn.className ?? ""}`}
          >
            {renderedLabel}
          </button>
        );
      })}
    </div>
  );
}
