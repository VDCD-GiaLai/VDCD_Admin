"use client";

import { type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────

export type BadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "dark"
  | "light"
  | "orange"
  | "teal"
  | "purple";

export type BadgeVariant = "solid" | "soft" | "outline" | "gradient";
export type BadgeSize = "xs" | "sm" | "md" | "lg";
export type BadgeRadius = "md" | "full";

// ─── Color mappings (fully static for Tailwind) ──────────────

interface BadgeColorTokens {
  solid: string;
  soft: string;
  outline: string;
  gradient: string;
}

const palette: Record<BadgeColor, BadgeColorTokens> = {
  primary: {
    solid: "bg-primary text-white",
    soft: "bg-primary/10 text-primary",
    outline: "bg-transparent text-primary border border-primary",
    gradient: "bg-gradient-to-r from-primary to-primary/70 text-white",
  },
  secondary: {
    solid: "bg-secondary text-white",
    soft: "bg-secondary/10 text-secondary",
    outline: "bg-transparent text-secondary border border-secondary",
    gradient: "bg-gradient-to-r from-secondary to-secondary/70 text-white",
  },
  success: {
    solid: "bg-success text-white",
    soft: "bg-success/10 text-success",
    outline: "bg-transparent text-success border border-success",
    gradient: "bg-gradient-to-r from-success to-success/70 text-white",
  },
  warning: {
    solid: "bg-warning text-dark",
    soft: "bg-warning/10 text-warning",
    outline: "bg-transparent text-warning border border-warning",
    gradient: "bg-gradient-to-r from-warning to-warning/70 text-dark",
  },
  danger: {
    solid: "bg-danger text-white",
    soft: "bg-danger/10 text-danger",
    outline: "bg-transparent text-danger border border-danger",
    gradient: "bg-gradient-to-r from-danger to-danger/70 text-white",
  },
  info: {
    solid: "bg-info text-white",
    soft: "bg-info/10 text-info",
    outline: "bg-transparent text-info border border-info",
    gradient: "bg-gradient-to-r from-info to-info/70 text-white",
  },
  dark: {
    solid: "bg-dark text-white",
    soft: "bg-dark/10 text-dark",
    outline: "bg-transparent text-dark border border-dark",
    gradient: "bg-gradient-to-r from-dark to-dark/70 text-white",
  },
  light: {
    solid: "bg-surface-muted text-text",
    soft: "bg-surface-muted/50 text-text-muted",
    outline: "bg-transparent text-text-muted border border-border",
    gradient: "bg-gradient-to-r from-surface-muted to-border text-text",
  },
  orange: {
    solid: "bg-orange text-white",
    soft: "bg-orange/10 text-orange",
    outline: "bg-transparent text-orange border border-orange",
    gradient: "bg-gradient-to-r from-orange to-orange/70 text-white",
  },
  teal: {
    solid: "bg-teal text-white",
    soft: "bg-teal/10 text-teal",
    outline: "bg-transparent text-teal border border-teal",
    gradient: "bg-gradient-to-r from-teal to-teal/70 text-white",
  },
  purple: {
    solid: "bg-purple text-white",
    soft: "bg-purple/10 text-purple",
    outline: "bg-transparent text-purple border border-purple",
    gradient: "bg-gradient-to-r from-purple to-purple/70 text-white",
  },
};

// ─── Size tokens ─────────────────────────────────────────────

const sizeClasses: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[9px] leading-tight",
  sm: "px-2 py-0.5 text-[10px] leading-tight",
  md: "px-2.5 py-1 text-xs leading-tight",
  lg: "px-3 py-1.5 text-sm leading-tight",
};

// ─── Radius tokens ───────────────────────────────────────────

const radiusClasses: Record<BadgeRadius, string> = {
  md: "rounded",
  full: "rounded-full",
};

// ═════════════════════════════════════════════════════════════
//  Badge — inline label/tag
// ═════════════════════════════════════════════════════════════

export interface BadgeProps {
  /** Badge content */
  children: ReactNode;
  /** Color theme */
  color?: BadgeColor;
  /** Style variant */
  variant?: BadgeVariant;
  /** Size */
  size?: BadgeSize;
  /** Border radius */
  radius?: BadgeRadius;
  /** Icon or content before the text */
  startContent?: ReactNode;
  /** Icon or content after the text */
  endContent?: ReactNode;
  /** Show a dismiss/close button */
  isDismissible?: boolean;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
  /** Additional class */
  className?: string;
}

export function Badge({
  children,
  color = "primary",
  variant = "solid",
  size = "md",
  radius = "md",
  startContent,
  endContent,
  isDismissible = false,
  onDismiss,
  className,
}: BadgeProps) {
  const classes = [
    "inline-flex items-center gap-1 font-medium whitespace-nowrap",
    sizeClasses[size],
    radiusClasses[radius],
    palette[color][variant],
    className ?? "",
  ].join(" ");

  return (
    <span className={classes}>
      {startContent}
      {children}
      {endContent}
      {isDismissible && (
        <button
          type="button"
          className="ml-0.5 inline-flex shrink-0 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════
//  BadgeDot — notification dot indicator (no text)
// ═════════════════════════════════════════════════════════════

export interface BadgeDotProps {
  /** Color */
  color?: BadgeColor;
  /** Dot size */
  size?: "sm" | "md" | "lg";
  /** Show a ping animation */
  isPing?: boolean;
  /** Additional class */
  className?: string;
}

const dotSizeClasses: Record<string, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

const dotColorClasses: Record<BadgeColor, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  dark: "bg-dark",
  light: "bg-border",
  orange: "bg-orange",
  teal: "bg-teal",
  purple: "bg-purple",
};

export function BadgeDot({
  color = "success",
  size = "md",
  isPing = false,
  className,
}: BadgeDotProps) {
  return (
    <span className={`relative inline-flex ${className ?? ""}`}>
      {isPing && (
        <span
          className={[
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            dotColorClasses[color],
          ].join(" ")}
        />
      )}
      <span
        className={[
          "relative inline-flex rounded-full",
          dotSizeClasses[size],
          dotColorClasses[color],
        ].join(" ")}
      />
    </span>
  );
}

// ═════════════════════════════════════════════════════════════
//  BadgeOverlay — positioned badge on a container (button/avatar)
//  Wraps children in a relative container and positions the badge.
// ═════════════════════════════════════════════════════════════

export type BadgePosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

export interface BadgeOverlayProps {
  /** The element to overlay (button, avatar, icon, etc.) */
  children: ReactNode;
  /** Badge content (number, text). If omitted, renders a dot. */
  content?: ReactNode;
  /** Badge color */
  color?: BadgeColor;
  /** Position */
  position?: BadgePosition;
  /** Render as dot (no content, small circle) */
  isDot?: boolean;
  /** Show a ping animation (dot mode only) */
  isPing?: boolean;
  /** Badge variant */
  variant?: BadgeVariant;
  /** Additional class for the badge itself */
  badgeClassName?: string;
  /** Additional class for the wrapper */
  className?: string;
}

const positionClasses: Record<BadgePosition, string> = {
  "top-right": "top-0 right-0 -translate-y-1/2 translate-x-1/2",
  "top-left": "top-0 left-0 -translate-y-1/2 -translate-x-1/2",
  "bottom-right": "bottom-0 right-0 translate-y-1/2 translate-x-1/2",
  "bottom-left": "bottom-0 left-0 translate-y-1/2 -translate-x-1/2",
};

export function BadgeOverlay({
  children,
  content,
  color = "danger",
  position = "top-right",
  isDot = false,
  isPing = false,
  variant = "solid",
  badgeClassName,
  className,
}: BadgeOverlayProps) {
  return (
    <span className={`relative inline-flex ${className ?? ""}`}>
      {children}
      <span
        className={[
          "absolute",
          positionClasses[position],
        ].join(" ")}
      >
        {isDot ? (
          <BadgeDot color={color} size="sm" isPing={isPing} />
        ) : (
          <Badge
            color={color}
            variant={variant}
            size="xs"
            radius="full"
            className={[
              "min-w-[18px] justify-center shadow-sm border-2 border-white",
              badgeClassName ?? "",
            ].join(" ")}
          >
            {content}
          </Badge>
        )}
      </span>
    </span>
  );
}
