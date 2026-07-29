"use client";

import { type ReactNode } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────

export type BreadcrumbSeparator =
  | "slash"
  | "chevron"
  | "arrow"
  | "dot"
  | "pipe"
  | "dash"
  | "tilde"
  | ReactNode;

export type BreadcrumbStyle = "default" | "contained" | "icon";
export type BreadcrumbSize = "sm" | "md" | "lg";

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigate link (omit for active/last item) */
  href?: string;
  /** Optional icon before the label */
  icon?: ReactNode;
}

// ─── Separator mapping ───────────────────────────────────────

const separatorMap: Record<string, string> = {
  slash: "/",
  chevron: "›",
  arrow: "→",
  dot: "•",
  pipe: "|",
  dash: "—",
  tilde: "~",
};

function renderSeparator(separator: BreadcrumbSeparator, size: BreadcrumbSize) {
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  // Built-in string separator
  if (typeof separator === "string" && separator in separatorMap) {
    return (
      <span className={`mx-1.5 select-none text-text-muted ${textSize}`} aria-hidden="true">
        {separatorMap[separator]}
      </span>
    );
  }

  // SVG or custom ReactNode separator
  if (typeof separator !== "string") {
    return (
      <span className="mx-1.5 flex items-center text-text-muted" aria-hidden="true">
        {separator}
      </span>
    );
  }

  // Fallback: render as-is
  return (
    <span className={`mx-1.5 select-none text-text-muted ${textSize}`} aria-hidden="true">
      {separator}
    </span>
  );
}

// ─── Size tokens ─────────────────────────────────────────────

const sizeClasses: Record<BreadcrumbSize, { text: string; icon: string }> = {
  sm: { text: "text-xs", icon: "h-3 w-3" },
  md: { text: "text-sm", icon: "h-3.5 w-3.5" },
  lg: { text: "text-base", icon: "h-4 w-4" },
};

// ═════════════════════════════════════════════════════════════
//  AppBreadcrumb
// ═════════════════════════════════════════════════════════════

export interface AppBreadcrumbProps {
  /** Breadcrumb items (first = root, last = active) */
  items: BreadcrumbItem[];
  /** Separator between items */
  separator?: BreadcrumbSeparator;
  /** Visual style */
  variant?: BreadcrumbStyle;
  /** Size */
  size?: BreadcrumbSize;
  /** Additional class */
  className?: string;
}

export function AppBreadcrumb({
  items,
  separator = "slash",
  variant = "default",
  size = "md",
  className,
}: AppBreadcrumbProps) {
  const sizes = sizeClasses[size];

  const containerClass = [
    variant === "contained"
      ? "rounded-lg bg-surface-muted px-4 py-2.5"
      : "",
    className ?? "",
  ].join(" ");

  return (
    <nav aria-label="Breadcrumb" className={containerClass}>
      <ol className={`flex flex-wrap items-center ${sizes.text}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const showIcon = variant === "icon" && item.icon;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              {/* Separator (except before first item) */}
              {index > 0 && renderSeparator(separator, size)}

              {/* Item */}
              {isLast || !item.href ? (
                <span className="inline-flex items-center gap-1 font-medium text-text">
                  {showIcon && (
                    <span className={`shrink-0 ${sizes.icon}`}>{item.icon}</span>
                  )}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 text-text-muted transition-colors hover:text-primary"
                >
                  {showIcon && (
                    <span className={`shrink-0 ${sizes.icon}`}>{item.icon}</span>
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ═════════════════════════════════════════════════════════════
//  Built-in separator icons (convenience exports)
// ═════════════════════════════════════════════════════════════

/** SVG chevron-right separator */
export function ChevronSeparator({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-3.5 w-3.5"}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/** SVG double-chevron separator */
export function DoubleChevronSeparator({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-3.5 w-3.5"}
    >
      <path d="m7 18 6-6-6-6" />
      <path d="m13 18 6-6-6-6" />
    </svg>
  );
}

/** SVG arrow-right separator */
export function ArrowSeparator({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-3.5 w-3.5"}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  Built-in item icons (convenience exports for icon variant)
// ═════════════════════════════════════════════════════════════

export function HomeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className ?? "h-3.5 w-3.5"}>
      <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
    </svg>
  );
}

export function FolderIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className ?? "h-3.5 w-3.5"}>
      <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
    </svg>
  );
}

export function FileIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className ?? "h-3.5 w-3.5"}>
      <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z" />
    </svg>
  );
}
