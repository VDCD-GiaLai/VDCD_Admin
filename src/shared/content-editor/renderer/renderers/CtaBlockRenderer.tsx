import React, { useCallback, useMemo } from "react";
import { useSanitizedPaste } from "../../paste/useSanitizedPaste";
import {
  getCtaButtons,
  type CtaBlock,
  type CtaAlign,
  type CtaShape,
  type CtaLayout,
} from "../../model/document.types";

export interface CtaBlockRendererProps {
  block: CtaBlock;
  editable?: boolean;
  onLabelChange?: (label: string) => void;
  onSecondaryLabelChange?: (secondaryLabel: string) => void;
  onButtonLabelChange?: (buttonIndex: number, label: string) => void;
  onSelect?: () => void;
}

export function CtaBlockRenderer({
  block,
  editable,
  onLabelChange,
  onSecondaryLabelChange,
  onButtonLabelChange,
  onSelect,
}: CtaBlockRendererProps) {
  const { handlePaste } = useSanitizedPaste({ preserveLineBreaks: false });
  const fontStyle = useMemo(
    () => (block.fontSize ? { fontSize: `${block.fontSize}px` } : undefined),
    [block.fontSize],
  );

  const handleButtonBlur = useCallback(
    (btnIndex: number, newText: string) => {
      if (btnIndex === 0 && onLabelChange) {
        onLabelChange(newText);
      } else if (btnIndex === 1 && onSecondaryLabelChange) {
        onSecondaryLabelChange(newText);
      }
      if (onButtonLabelChange) {
        onButtonLabelChange(btnIndex, newText);
      }
    },
    [onLabelChange, onSecondaryLabelChange, onButtonLabelChange],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement)?.blur();
    }
  }, []);

  const currentShape: CtaShape = block.shape ?? "square";
  const currentAlign: CtaAlign = block.align ?? "center";
  const currentGap = block.gap ?? (block.layout === "flex" ? 8 : 16);
  const currentLayout: CtaLayout =
    block.layout ?? (block.align === "between" ? "between" : "flex");
  const isSpaceBetween = currentLayout === "between" || currentAlign === "between";

  const buttons = useMemo(() => getCtaButtons(block), [block]);

  const getAlignClass = (align: CtaAlign) => {
    switch (align) {
      case "between":
        return "justify-between w-full";
      case "start":
        return "justify-start";
      case "end":
        return "justify-end";
      case "center":
      default:
        return "justify-center";
    }
  };

  const getShapeClass = (shape: CtaShape) => {
    return shape === "pill" ? "rounded-full" : "rounded-lg";
  };

  return (
    <div
      className={`blog-preview-cta w-full ${editable ? "cursor-pointer" : ""}`}
      onClick={editable ? onSelect : undefined}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
    >
      <div
        className={`flex items-center flex-wrap max-w-full py-1 ${
          isSpaceBetween ? "justify-between w-full" : getAlignClass(currentAlign)
        }`}
        style={{ gap: `${currentGap}px` }}
      >
        {buttons.map((btn, index) => {
          const isOutline = btn.variant === "outline";

          return (
            <div
              key={btn.id || `btn_${index}`}
              className="flex flex-col items-center flex-shrink-0"
            >
              {editable ? (
                <div
                  className={`blog-preview-cta-button group inline-flex flex-shrink-0 whitespace-nowrap items-center justify-center gap-2.5 px-6 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${getShapeClass(
                    currentShape,
                  )} ${
                    isOutline
                      ? "border-2 border-primary bg-surface text-primary shadow-xs hover:bg-primary hover:text-white"
                      : "bg-gradient-to-r from-primary to-[#b82228] text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
                  }`}
                >
                  <span
                    className="ve-editable outline-none"
                    style={fontStyle}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleButtonBlur(index, e.currentTarget.textContent ?? "")
                    }
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onClick={(e) => e.stopPropagation()}
                    data-placeholder={`Nút ${index + 1}`}
                    dangerouslySetInnerHTML={{ __html: btn.label || "" }}
                  />
                  <span
                    className={`blog-preview-cta-icon flex h-5 w-5 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${
                      isOutline
                        ? "bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              ) : (
                <a
                  href={btn.url || "#"}
                  target={btn.url?.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`blog-preview-cta-button group inline-flex flex-shrink-0 whitespace-nowrap items-center justify-center gap-2.5 px-6 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${getShapeClass(
                    currentShape,
                  )} ${
                    isOutline
                      ? "border-2 border-primary bg-surface text-primary shadow-xs hover:bg-primary hover:text-white"
                      : "bg-gradient-to-r from-primary to-[#b82228] text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
                  }`}
                  style={fontStyle}
                  onClick={(e) => {
                    if (!btn.url) e.preventDefault();
                  }}
                >
                  <span>{btn.label || `Nút ${index + 1}`}</span>
                  <span
                    className={`blog-preview-cta-icon flex h-5 w-5 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${
                      isOutline
                        ? "bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </a>
              )}

              {editable && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface px-2.5 py-0.5 text-[11px] text-text-muted transition-colors hover:border-primary/40 hover:text-primary shadow-xs">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3 w-3 text-text-muted/80"
                  >
                    <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                    <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                  </svg>
                  <span className="font-mono text-[10px]">
                    {btn.url ? btn.url : "Chưa gắn liên kết"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
