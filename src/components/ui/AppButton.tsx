"use client";

import {
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

// ─── Types ───────────────────────────────────────────────────

export type ButtonColor =
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

export type ButtonVariant =
  | "solid"
  | "outline"
  | "soft"
  | "ghost";

export type ButtonSize = "xs" | "sm" | "md" | "lg";
export type ButtonRadius = "none" | "md" | "full";

export type ButtonShadow =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "colored"
  | "raised";

// ─── Color palette ───────────────────────────────────────────

interface ColorTokens {
  solid: string;
  outline: string;
  soft: string;
  ghost: string;
  coloredShadow: string;
}

const palette: Record<ButtonColor, ColorTokens> = {
  primary: {
    solid: "bg-primary text-primary-fg hover:bg-primary/90 border border-transparent",
    outline: "bg-transparent text-primary border border-primary hover:bg-primary hover:text-white",
    soft: "bg-primary/10 text-primary hover:bg-primary/20 border border-transparent",
    ghost: "bg-transparent text-primary hover:bg-primary/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(152,95,253,0.45)]",
  },
  secondary: {
    solid: "bg-secondary text-secondary-fg hover:bg-secondary/90 border border-transparent",
    outline: "bg-transparent text-secondary border border-secondary hover:bg-secondary hover:text-white",
    soft: "bg-secondary/10 text-secondary hover:bg-secondary/20 border border-transparent",
    ghost: "bg-transparent text-secondary hover:bg-secondary/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(255,73,205,0.45)]",
  },
  success: {
    solid: "bg-success text-white hover:bg-success/90 border border-transparent",
    outline: "bg-transparent text-success border border-success hover:bg-success hover:text-white",
    soft: "bg-success/10 text-success hover:bg-success/20 border border-transparent",
    ghost: "bg-transparent text-success hover:bg-success/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(50,212,132,0.45)]",
  },
  warning: {
    solid: "bg-warning text-dark hover:bg-warning/90 border border-transparent",
    outline: "bg-transparent text-warning border border-warning hover:bg-warning hover:text-dark",
    soft: "bg-warning/10 text-warning hover:bg-warning/20 border border-transparent",
    ghost: "bg-transparent text-warning hover:bg-warning/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(253,175,34,0.45)]",
  },
  danger: {
    solid: "bg-danger text-white hover:bg-danger/90 border border-transparent",
    outline: "bg-transparent text-danger border border-danger hover:bg-danger hover:text-white",
    soft: "bg-danger/10 text-danger hover:bg-danger/20 border border-transparent",
    ghost: "bg-transparent text-danger hover:bg-danger/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(255,103,87,0.45)]",
  },
  info: {
    solid: "bg-info text-white hover:bg-info/90 border border-transparent",
    outline: "bg-transparent text-info border border-info hover:bg-info hover:text-white",
    soft: "bg-info/10 text-info hover:bg-info/20 border border-transparent",
    ghost: "bg-transparent text-info hover:bg-info/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(0,201,255,0.45)]",
  },
  dark: {
    solid: "bg-dark text-white hover:bg-dark/90 border border-transparent",
    outline: "bg-transparent text-dark border border-dark hover:bg-dark hover:text-white",
    soft: "bg-dark/10 text-dark hover:bg-dark/20 border border-transparent",
    ghost: "bg-transparent text-dark hover:bg-dark/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(10,10,10,0.45)]",
  },
  light: {
    solid: "bg-surface-muted text-text hover:bg-border/60 border border-transparent",
    outline: "bg-transparent text-text-muted border border-border hover:bg-surface-muted hover:text-text",
    soft: "bg-surface-muted/50 text-text-muted hover:bg-surface-muted border border-transparent",
    ghost: "bg-transparent text-text-muted hover:bg-surface-muted/60 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(0,0,0,0.08)]",
  },
  orange: {
    solid: "bg-orange text-white hover:bg-orange/90 border border-transparent",
    outline: "bg-transparent text-orange border border-orange hover:bg-orange hover:text-white",
    soft: "bg-orange/10 text-orange hover:bg-orange/20 border border-transparent",
    ghost: "bg-transparent text-orange hover:bg-orange/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(250,129,40,0.45)]",
  },
  teal: {
    solid: "bg-teal text-white hover:bg-teal/90 border border-transparent",
    outline: "bg-transparent text-teal border border-teal hover:bg-teal hover:text-white",
    soft: "bg-teal/10 text-teal hover:bg-teal/20 border border-transparent",
    ghost: "bg-transparent text-teal hover:bg-teal/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(53,181,170,0.45)]",
  },
  purple: {
    solid: "bg-purple text-white hover:bg-purple/90 border border-transparent",
    outline: "bg-transparent text-purple border border-purple hover:bg-purple hover:text-white",
    soft: "bg-purple/10 text-purple hover:bg-purple/20 border border-transparent",
    ghost: "bg-transparent text-purple hover:bg-purple/10 border border-transparent",
    coloredShadow: "shadow-[0_4px_14px_-2px_rgba(190,43,235,0.45)]",
  },
};

// ─── Size tokens ─────────────────────────────────────────────

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-6 px-2 text-[10px] gap-1",
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2.5",
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

// ─── Radius tokens ───────────────────────────────────────────

const radiusClasses: Record<ButtonRadius, string> = {
  none: "rounded-none",
  md: "rounded-md",
  full: "rounded-full",
};

// ─── Shadow tokens ───────────────────────────────────────────

const shadowBaseClasses: Record<ButtonShadow, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  colored: "", // resolved per-color below
  raised: "shadow-[0_5px_15px_-3px] hover:shadow-[0_8px_20px_-4px] hover:-translate-y-0.5",
};

// ─── Resolve shadow class ────────────────────────────────────

function getShadowClass(shadow: ButtonShadow, color: ButtonColor): string {
  if (shadow === "colored") return palette[color].coloredShadow;
  return shadowBaseClasses[shadow];
}

// ─── Build variant classes ───────────────────────────────────

function getVariantClasses(variant: ButtonVariant, color: ButtonColor): string {
  return palette[color][variant];
}

// ═════════════════════════════════════════════════════════════
//  AppButton — the main button component
// ═════════════════════════════════════════════════════════════

export interface AppButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** Color theme */
  color?: ButtonColor;
  /** Style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Border radius */
  radius?: ButtonRadius;
  /** Shadow style */
  shadow?: ButtonShadow;
  /** Full width */
  isBlock?: boolean;
  /** Icon-only mode (no padding, square aspect) */
  isIconOnly?: boolean;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Loading spinner position */
  loadingPlacement?: "start" | "end";
  /** Loading text (shown next to spinner) */
  loadingText?: string;
  /** Content before the label */
  startContent?: ReactNode;
  /** Content after the label */
  endContent?: ReactNode;
  /** Render as a different element (e.g., "a") via wrapper */
  as?: "button" | "a";
  /** href (only when as="a") */
  href?: string;
  /** target (only when as="a") */
  target?: string;
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  function AppButton(
    {
      color = "primary",
      variant = "solid",
      size = "md",
      radius = "md",
      shadow = "none",
      isBlock = false,
      isIconOnly = false,
      isLoading = false,
      loadingPlacement = "start",
      loadingText,
      startContent,
      endContent,
      as = "button",
      href,
      target,
      disabled,
      className,
      children,
      ...buttonProps
    },
    ref,
  ) {
    const isDisabled = disabled || isLoading;

    // Build class list
    const classes = [
      // Base
      "inline-flex items-center justify-center font-medium",
      "select-none whitespace-nowrap transition-all duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
      "active:scale-[0.97]",
      "disabled:pointer-events-none disabled:opacity-60",

      // Size
      isIconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],

      // Radius
      radiusClasses[radius],

      // Variant + Color
      getVariantClasses(variant, color),

      // Shadow
      getShadowClass(shadow, color),

      // Block
      isBlock ? "w-full" : "",

      // Custom class
      className ?? "",
    ].join(" ");

    // Spinner element
    const spinner = (
      <svg
        className="h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    );

    // Content rendering
    const renderContent = () => {
      if (isLoading) {
        if (loadingText) {
          return loadingPlacement === "start" ? (
            <>{spinner}<span>{loadingText}</span></>
          ) : (
            <><span>{loadingText}</span>{spinner}</>
          );
        }
        // Spinner only (replaces content)
        if (isIconOnly) return spinner;
        return (
          <>
            {loadingPlacement === "start" && spinner}
            {children}
            {loadingPlacement === "end" && spinner}
          </>
        );
      }

      return (
        <>
          {startContent}
          {children}
          {endContent}
        </>
      );
    };

    // Render as anchor
    if (as === "a") {
      return (
        <a
          href={href}
          target={target}
          className={classes}
          aria-disabled={isDisabled || undefined}
          tabIndex={isDisabled ? -1 : undefined}
          onClick={isDisabled ? (e) => e.preventDefault() : undefined}
        >
          {renderContent()}
        </a>
      );
    }

    // Render as button
    return (
      <button
        ref={ref}
        type={buttonProps.type ?? "button"}
        disabled={isDisabled}
        className={classes}
        {...buttonProps}
      >
        {renderContent()}
      </button>
    );
  },
);

// ═════════════════════════════════════════════════════════════
//  ButtonGroup — horizontal group of buttons
// ═════════════════════════════════════════════════════════════

export interface ButtonGroupProps {
  children: ReactNode;
  /** Additional class */
  className?: string;
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div
      className={[
        "inline-flex [&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none",
        "[&>*+*]:-ml-px",
        className ?? "",
      ].join(" ")}
      role="group"
    >
      {children}
    </div>
  );
}
