import * as React from "react";

// ─── Types ───────────────────────────────────────────────────

export type SpinnerVariant = "border" | "grow";

export type SpinnerColor =
  | "current"
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual style of the spinner (border or grow) */
  variant?: SpinnerVariant;
  /** Color theme */
  color?: SpinnerColor;
  /** Size */
  size?: SpinnerSize;
  /** Visually hidden text for screen readers */
  label?: string;
}

// ─── Color Maps ──────────────────────────────────────────────

const colorClasses: Record<SpinnerColor, string> = {
  current: "text-current",
  primary: "text-primary",
  secondary: "text-secondary",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  light: "text-white",
  dark: "text-dark",
};

// ─── Size Maps ───────────────────────────────────────────────

const sizeClasses = {
  border: {
    sm: "h-4 w-4 border-[2px]",
    md: "h-8 w-8 border-[4px]",
    lg: "h-12 w-12 border-[6px]",
  },
  grow: {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  },
};

// ═════════════════════════════════════════════════════════════
//  Spinner
// ═════════════════════════════════════════════════════════════

export function Spinner({
  variant = "border",
  color = "primary",
  size = "md",
  label = "Loading...",
  className = "",
  ...props
}: SpinnerProps) {
  const baseClasses = "inline-block rounded-full align-[-0.125em]";
  const colorClass = colorClasses[color];
  const sizeClass = sizeClasses[variant][size];

  // Specific styles for variants
  const variantClass =
    variant === "border"
      ? "animate-[spin_0.75s_linear_infinite] border-current border-r-transparent"
      : "animate-spinner-grow bg-current opacity-0";

  return (
    <span
      className={`${baseClasses} ${variantClass} ${colorClass} ${sizeClass} ${className}`}
      role="status"
      {...props}
    >
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
