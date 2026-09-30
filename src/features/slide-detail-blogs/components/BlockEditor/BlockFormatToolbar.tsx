"use client";

import React, { useState } from "react";
import type { FormatAction, FormatActionOptions } from "../../hooks/useHtmlShortcuts";

export interface BlockFormatToolbarProps {
  onApply: (action: FormatAction, options?: FormatActionOptions) => void;
  className?: string;
  size?: "xs" | "sm";
  showClear?: boolean;
  activeActions?: FormatAction[];
  showHeadings?: boolean;
  onHeadingSelect?: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
}

interface FormatButton {
  action: FormatAction;
  label: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  title: string | ((isActive: boolean) => string);
  className?: string;
}

const COLOR_SWATCHES = [
  { label: "Mặc định (Reset)", color: "inherit" },
  { label: "Đen (#000000)", color: "#000000" },
  { label: "Xanh Navy VDCD (#011A42)", color: "#011A42" },
  { label: "Đỏ VDCD (#CA2A30)", color: "#CA2A30" },
  { label: "Xanh dương (#2563EB)", color: "#2563EB" },
  { label: "Xanh lá (#16A34A)", color: "#16A34A" },
  { label: "Cam (#D97706)", color: "#D97706" },
  { label: "Tím (#9333EA)", color: "#9333EA" },
  { label: "Xám (#64748B)", color: "#64748B" },
];

const FONT_SIZES = [
  { label: "14px (Nhỏ)", value: "14px" },
  { label: "16px (Chuẩn)", value: "16px" },
  { label: "18px (Vừa)", value: "18px" },
  { label: "20px (Lớn)", value: "20px" },
  { label: "24px (Rất lớn)", value: "24px" },
];

const HEADINGS: { level: 1 | 2 | 3; label: string; title: string }[] = [
  { level: 1, label: "H1", title: "Chuyển thành Tiêu đề H1 (hoặc tách đoạn bôi đen)" },
  { level: 2, label: "H2", title: "Chuyển thành Tiêu đề H2 (hoặc tách đoạn bôi đen)" },
  { level: 3, label: "H3", title: "Chuyển thành Tiêu đề H3 (hoặc tách đoạn bôi đen)" },
];

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
  showHeadings = true,
  onHeadingSelect,
}: BlockFormatToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  const btnPadding = size === "xs" ? "h-6 px-1.5 text-xs" : "h-7 px-2 text-xs";

  return (
    <div
      className={`relative inline-flex flex-wrap items-center gap-0.5 rounded-md border border-border/80 bg-surface-muted/90 p-0.5 shadow-2xs backdrop-blur-xs ${className}`}
      role="toolbar"
      aria-label="Định dạng văn bản"
    >
      {/* ── Headings (H1, H2, H3) ── */}
      {showHeadings && (
        <>
          <div className="flex items-center gap-0.5">
            {HEADINGS.map((h) => (
              <button
                key={h.level}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onHeadingSelect?.(h.level);
                  onApply("heading", { headingLevel: h.level });
                }}
                title={h.title}
                className={`inline-flex items-center justify-center font-bold rounded transition-colors ${btnPadding} text-text hover:bg-surface hover:text-primary active:bg-primary/10`}
              >
                {h.label}
              </button>
            ))}
          </div>
          <div className="mx-0.5 h-3.5 w-px bg-border/60" />
        </>
      )}

      {/* ── Standard inline format buttons ── */}
      {BUTTONS.slice(0, 4).map((btn) => {
        const isActive = Boolean(activeActions?.includes(btn.action));
        const renderedLabel =
          typeof btn.label === "function" ? btn.label(isActive) : btn.label;
        const renderedTitle =
          typeof btn.title === "function" ? btn.title(isActive) : btn.title;

        return (
          <button
            key={btn.action}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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

      <div className="mx-0.5 h-3.5 w-px bg-border/60" />

      {/* ── Color Picker Popover ── */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShowColorPicker((prev) => !prev);
            setShowSizePicker(false);
          }}
          title="Màu chữ đoạn bôi đen"
          className={`inline-flex items-center justify-center rounded transition-colors ${btnPadding} ${
            showColorPicker ? "bg-primary/20 text-primary" : "text-text hover:bg-surface hover:text-primary"
          }`}
        >
          <span className="flex flex-col items-center justify-center font-bold leading-none">
            <span className="text-[10px]">A</span>
            <span className="h-[2px] w-2.5 rounded-full bg-primary" />
          </span>
        </button>
        {showColorPicker && (
          <div
            className="absolute left-0 top-full z-50 mt-1 grid grid-cols-3 gap-1 rounded-md border border-border bg-surface p-1.5 shadow-xl min-w-[100px]"
            onMouseDown={(e) => e.preventDefault()}
          >
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.color}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onApply("color", { color: swatch.color });
                  setShowColorPicker(false);
                }}
                title={swatch.label}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-border/60 transition-transform hover:scale-115 focus:outline-none"
                style={{ backgroundColor: swatch.color === "inherit" ? "#ffffff" : swatch.color }}
              >
                {swatch.color === "inherit" && (
                  <span className="text-[9px] font-bold text-text-muted">✕</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Font Size Selector Popover ── */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShowSizePicker((prev) => !prev);
            setShowColorPicker(false);
          }}
          title="Kích thước chữ đoạn bôi đen"
          className={`inline-flex items-center justify-center gap-0.5 rounded transition-colors ${btnPadding} ${
            showSizePicker ? "bg-primary/20 text-primary" : "text-text hover:bg-surface hover:text-primary"
          }`}
        >
          <span className="text-[11px] font-medium leading-none">T▾</span>
        </button>
        {showSizePicker && (
          <div
            className="absolute left-0 top-full z-50 mt-1 flex flex-col gap-0.5 rounded-md border border-border bg-surface p-1 shadow-xl min-w-[110px]"
            onMouseDown={(e) => e.preventDefault()}
          >
            {FONT_SIZES.map((sizeOpt) => (
              <button
                key={sizeOpt.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onApply("fontSize", { fontSize: sizeOpt.value });
                  setShowSizePicker(false);
                }}
                className="rounded px-2 py-1 text-left text-xs text-text hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {sizeOpt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Indent Button ── */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onApply("indent")}
        title="Thụt lề đoạn văn (Tab)"
        className={`inline-flex items-center justify-center rounded transition-colors ${btnPadding} text-text hover:bg-surface hover:text-primary active:bg-primary/10`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM7.25 9.25a.75.75 0 01.75-.75h9.25a.75.75 0 010 1.5H8a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5A.75.75 0 012 10zm2.22 1.97a.75.75 0 010-1.06l1.5-1.5a.75.75 0 011.06 1.06L5.81 11.5l.97.97a.75.75 0 01-1.06 1.06l-1.5-1.5z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="mx-0.5 h-3.5 w-px bg-border/60" />

      {/* ── Remaining buttons (code, highlight, link, clear) ── */}
      {BUTTONS.slice(4).map((btn) => {
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
            onMouseDown={(e) => e.preventDefault()}
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
