"use client";

import {
  type ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

// ─── Types ───────────────────────────────────────────────────

export type PopoverPlacement = "top" | "bottom" | "left" | "right";
export type PopoverTriggerMode = "click" | "hover";

export type PopoverColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "dark"
  | "orange"
  | "teal"
  | "purple";

export type PopoverVariant = "default" | "solid" | "soft" | "header";

// ─── Placement CSS ───────────────────────────────────────────

const placementClasses: Record<PopoverPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

// ─── Arrow placement CSS ─────────────────────────────────────

const arrowClasses: Record<PopoverPlacement, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-px border-l-transparent border-r-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-px border-l-transparent border-r-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 -ml-px border-t-transparent border-b-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 -mr-px border-t-transparent border-b-transparent border-l-transparent",
};

const arrowBorderSide: Record<PopoverPlacement, string> = {
  top: "border-t-[var(--popover-arrow-color)]",
  bottom: "border-b-[var(--popover-arrow-color)]",
  left: "border-l-[var(--popover-arrow-color)]",
  right: "border-r-[var(--popover-arrow-color)]",
};

// ─── Color maps ──────────────────────────────────────────────

interface PopoverColorTokens {
  solid: { bg: string; text: string; arrowVar: string };
  soft: { bg: string; text: string; arrowVar: string };
  header: { bg: string; text: string };
}

const colorTokens: Record<Exclude<PopoverColor, "default">, PopoverColorTokens> = {
  primary: {
    solid: { bg: "bg-primary", text: "text-white", arrowVar: "#ca2a30" },
    soft: { bg: "bg-primary/10", text: "text-primary", arrowVar: "rgba(152,95,253,0.1)" },
    header: { bg: "bg-primary", text: "text-white" },
  },
  secondary: {
    solid: { bg: "bg-secondary", text: "text-white", arrowVar: "#FF49CD" },
    soft: { bg: "bg-secondary/10", text: "text-secondary", arrowVar: "rgba(255,73,205,0.1)" },
    header: { bg: "bg-secondary", text: "text-white" },
  },
  success: {
    solid: { bg: "bg-success", text: "text-white", arrowVar: "#32D484" },
    soft: { bg: "bg-success/10", text: "text-success", arrowVar: "rgba(50,212,132,0.1)" },
    header: { bg: "bg-success", text: "text-white" },
  },
  warning: {
    solid: { bg: "bg-warning", text: "text-dark", arrowVar: "#FDAF22" },
    soft: { bg: "bg-warning/10", text: "text-warning", arrowVar: "rgba(253,175,34,0.1)" },
    header: { bg: "bg-warning", text: "text-dark" },
  },
  danger: {
    solid: { bg: "bg-danger", text: "text-white", arrowVar: "#FF6757" },
    soft: { bg: "bg-danger/10", text: "text-danger", arrowVar: "rgba(255,103,87,0.1)" },
    header: { bg: "bg-danger", text: "text-white" },
  },
  info: {
    solid: { bg: "bg-info", text: "text-white", arrowVar: "#00C9FF" },
    soft: { bg: "bg-info/10", text: "text-info", arrowVar: "rgba(0,201,255,0.1)" },
    header: { bg: "bg-info", text: "text-white" },
  },
  dark: {
    solid: { bg: "bg-dark", text: "text-white", arrowVar: "#0A0A0A" },
    soft: { bg: "bg-dark/10", text: "text-dark", arrowVar: "rgba(10,10,10,0.1)" },
    header: { bg: "bg-dark", text: "text-white" },
  },
  orange: {
    solid: { bg: "bg-orange", text: "text-white", arrowVar: "#FA8128" },
    soft: { bg: "bg-orange/10", text: "text-orange", arrowVar: "rgba(250,129,40,0.1)" },
    header: { bg: "bg-orange", text: "text-white" },
  },
  teal: {
    solid: { bg: "bg-teal", text: "text-white", arrowVar: "#35B5AA" },
    soft: { bg: "bg-teal/10", text: "text-teal", arrowVar: "rgba(53,181,170,0.1)" },
    header: { bg: "bg-teal", text: "text-white" },
  },
  purple: {
    solid: { bg: "bg-purple", text: "text-white", arrowVar: "#BE2BEB" },
    soft: { bg: "bg-purple/10", text: "text-purple", arrowVar: "rgba(190,43,235,0.1)" },
    header: { bg: "bg-purple", text: "text-white" },
  },
};

// ═════════════════════════════════════════════════════════════
//  Popover
// ═════════════════════════════════════════════════════════════

export interface PopoverProps {
  /** Trigger element */
  trigger: ReactNode;
  /** Popover title/header */
  title?: ReactNode;
  /** Popover body content */
  children: ReactNode;
  /** Placement */
  placement?: PopoverPlacement;
  /** Trigger mode */
  triggerMode?: PopoverTriggerMode;
  /** Color theme */
  color?: PopoverColor;
  /** Style variant */
  variant?: PopoverVariant;
  /** Show arrow */
  showArrow?: boolean;
  /** Max width (px) */
  maxWidth?: number;
  /** Disabled (prevent opening) */
  disabled?: boolean;
  /** Additional class for popover panel */
  className?: string;
}

export function Popover({
  trigger,
  title,
  children,
  placement = "top",
  triggerMode = "click",
  color = "default",
  variant = "default",
  showArrow = true,
  maxWidth = 276,
  disabled = false,
  className,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Click outside to close
  useEffect(() => {
    if (triggerMode !== "click" || !isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, triggerMode]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClick = useCallback(() => {
    if (disabled || triggerMode !== "click") return;
    setIsOpen((prev) => !prev);
  }, [disabled, triggerMode]);

  const handleMouseEnter = useCallback(() => {
    if (disabled || triggerMode !== "hover") return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen(true);
  }, [disabled, triggerMode]);

  const handleMouseLeave = useCallback(() => {
    if (triggerMode !== "hover") return;
    hoverTimeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  }, [triggerMode]);

  // Resolve styles
  const isColored = color !== "default" && variant !== "default";
  const tokens = color !== "default" ? colorTokens[color] : null;

  let panelBg = "bg-surface";
  let panelText = "text-text";
  let headerBg = "";
  let headerText = "";
  let arrowColor = "#ffffff";
  let panelBorder = "border border-border";

  if (tokens && variant === "solid") {
    panelBg = tokens.solid.bg;
    panelText = tokens.solid.text;
    arrowColor = tokens.solid.arrowVar;
    panelBorder = "border-0";
  } else if (tokens && variant === "soft") {
    panelBg = tokens.soft.bg;
    panelText = tokens.soft.text;
    arrowColor = tokens.soft.arrowVar;
    panelBorder = "border-0";
  } else if (tokens && variant === "header") {
    headerBg = tokens.header.bg;
    headerText = tokens.header.text;
    panelBorder = "border border-border";
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <div
        onClick={handleClick}
        className={`inline-flex ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        {trigger}
      </div>

      {/* Panel */}
      {isOpen && (
        <div
          className={[
            "absolute z-50 rounded-lg shadow-lg",
            panelBorder,
            isColored ? "" : panelBg,
            isColored ? panelBg : "",
            isColored ? panelText : "",
            placementClasses[placement],
            className ?? "",
          ].join(" ")}
          style={{
            maxWidth,
            "--popover-arrow-color": arrowColor,
          } as React.CSSProperties}
          role="tooltip"
        >
          {/* Header (title) */}
          {title && (
            <div
              className={[
                "rounded-t-lg px-3 py-2 text-sm font-semibold",
                variant === "header" && headerBg ? `${headerBg} ${headerText}` : "",
                variant === "default" ? "border-b border-border text-text" : "",
                variant === "solid" || variant === "soft" ? panelText : "",
              ].join(" ")}
            >
              {title}
            </div>
          )}

          {/* Body */}
          <div className={`px-3 py-2 text-sm ${isColored ? "" : "text-text-muted"}`}>
            {children}
          </div>

          {/* Arrow */}
          {showArrow && (
            <span
              className={[
                "absolute h-0 w-0 border-[6px] border-solid",
                arrowClasses[placement],
                arrowBorderSide[placement],
              ].join(" ")}
            />
          )}
        </div>
      )}
    </div>
  );
}
