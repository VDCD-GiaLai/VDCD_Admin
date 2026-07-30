"use client";

import {
  type ReactNode,
  useState,
  useRef,
  useCallback,
} from "react";

// ─── Types ───────────────────────────────────────────────────

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export type TooltipColor =
  | "default" // usually dark/black like standard bootstrap
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "light"
  | "dark";

// ─── Placement CSS ───────────────────────────────────────────

const placementClasses: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

// ─── Arrow placement CSS ─────────────────────────────────────

const arrowClasses: Record<TooltipPlacement, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-px border-l-transparent border-r-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-px border-l-transparent border-r-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 -ml-px border-t-transparent border-b-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 -mr-px border-t-transparent border-b-transparent border-l-transparent",
};

const arrowBorderSide: Record<TooltipPlacement, string> = {
  top: "border-t-[var(--tooltip-bg)]",
  bottom: "border-b-[var(--tooltip-bg)]",
  left: "border-l-[var(--tooltip-bg)]",
  right: "border-r-[var(--tooltip-bg)]",
};

// ─── Color maps ──────────────────────────────────────────────

interface TooltipColorTokens {
  bg: string;
  text: string;
  arrowHex: string;
}

const colorTokens: Record<TooltipColor, TooltipColorTokens> = {
  default: { bg: "bg-black/90", text: "text-white", arrowHex: "rgba(0,0,0,0.9)" },
  primary: { bg: "bg-primary", text: "text-white", arrowHex: "#ca2a30" },
  secondary: { bg: "bg-secondary", text: "text-white", arrowHex: "#FF49CD" },
  success: { bg: "bg-success", text: "text-white", arrowHex: "#32D484" },
  warning: { bg: "bg-warning", text: "text-dark", arrowHex: "#FDAF22" },
  danger: { bg: "bg-danger", text: "text-white", arrowHex: "#FF6757" },
  info: { bg: "bg-info", text: "text-white", arrowHex: "#00C9FF" },
  dark: { bg: "bg-dark", text: "text-white", arrowHex: "#0A0A0A" },
  light: { bg: "bg-surface shadow border border-border", text: "text-text", arrowHex: "#FFFFFF" },
};

// ═════════════════════════════════════════════════════════════
//  Tooltip
// ═════════════════════════════════════════════════════════════

export interface TooltipProps {
  /** The element that triggers the tooltip on hover */
  children: ReactNode;
  /** The tooltip content (usually string, but can be HTML) */
  content: ReactNode;
  /** Direction of the tooltip */
  placement?: TooltipPlacement;
  /** Color theme */
  color?: TooltipColor;
  /** Show arrow */
  showArrow?: boolean;
  /** Max width for text wrapping (px) */
  maxWidth?: number;
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Is the trigger element disabled? If true, wraps in a span to allow hover */
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  placement = "top",
  color = "default",
  showArrow = true,
  maxWidth = 250,
  delay = 200,
  disabled = false,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delay);
  }, [delay]);

  const handleMouseLeave = useCallback(() => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  }, []);

  const tokens = colorTokens[color];

  // For disabled elements, pointer-events are none, so hover doesn't trigger.
  // We wrap them in a span that has pointer events.
  const trigger = disabled ? (
    <span className="inline-block cursor-not-allowed">
      {/* We need to apply pointer-events: none to the child so the span catches the hover */}
      <span className="pointer-events-none inline-block">{children}</span>
    </span>
  ) : (
    children
  );

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {trigger}

      {isOpen && (
        <div
          className={[
            "absolute z-50 rounded px-2.5 py-1.5 text-xs font-medium shadow-sm",
            "animate-in fade-in zoom-in-95 duration-200",
            tokens.bg,
            tokens.text,
            placementClasses[placement],
          ].join(" ")}
          style={{
            maxWidth,
            "--tooltip-bg": tokens.arrowHex,
            // Ensure long unbroken text doesn't blow out width
            wordWrap: "break-word",
          } as React.CSSProperties}
          role="tooltip"
        >
          {content}

          {showArrow && (
            <span
              className={[
                "absolute h-0 w-0 border-[5px] border-solid",
                arrowClasses[placement],
                arrowBorderSide[placement],
                // Special case for light tooltip arrow to match border
                color === "light" && placement === "top" ? "border-t-border" : "",
                color === "light" && placement === "bottom" ? "border-b-border" : "",
                color === "light" && placement === "left" ? "border-l-border" : "",
                color === "light" && placement === "right" ? "border-r-border" : "",
              ].join(" ")}
            />
          )}
        </div>
      )}
    </div>
  );
}
