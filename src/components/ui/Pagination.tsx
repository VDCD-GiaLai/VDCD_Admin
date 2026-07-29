"use client";

import { type ReactNode, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────

export type PaginationSize = "sm" | "md" | "lg";
export type PaginationVariant = "default" | "outlined" | "filled" | "minimal";
export type PaginationRadius = "md" | "full";

export type PaginationColor =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "dark";

// ─── Color maps (static classes for Tailwind) ────────────────

interface PaginationColorTokens {
  active: string;
  hover: string;
}

const colorClasses: Record<PaginationColor, PaginationColorTokens> = {
  primary: { active: "bg-primary text-white border-primary", hover: "hover:bg-primary/10 hover:text-primary" },
  secondary: { active: "bg-secondary text-white border-secondary", hover: "hover:bg-secondary/10 hover:text-secondary" },
  success: { active: "bg-success text-white border-success", hover: "hover:bg-success/10 hover:text-success" },
  danger: { active: "bg-danger text-white border-danger", hover: "hover:bg-danger/10 hover:text-danger" },
  warning: { active: "bg-warning text-dark border-warning", hover: "hover:bg-warning/10 hover:text-warning" },
  info: { active: "bg-info text-white border-info", hover: "hover:bg-info/10 hover:text-info" },
  dark: { active: "bg-dark text-white border-dark", hover: "hover:bg-dark/10 hover:text-dark" },
};

// ─── Size tokens ─────────────────────────────────────────────

const sizeClasses: Record<PaginationSize, { item: string; text: string }> = {
  sm: { item: "h-7 min-w-7 px-2", text: "text-xs" },
  md: { item: "h-9 min-w-9 px-3", text: "text-sm" },
  lg: { item: "h-11 min-w-11 px-4", text: "text-base" },
};

// ─── Radius tokens ───────────────────────────────────────────

const radiusClasses: Record<PaginationRadius, string> = {
  md: "rounded-md",
  full: "rounded-full",
};

// ─── Page number generation ──────────────────────────────────

function generatePages(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): (number | "ellipsis")[] {
  const totalSlots = siblingCount * 2 + 5; // siblings + first + last + 2 ellipsis + current

  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 2);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const pages: (number | "ellipsis")[] = [1];

  if (showLeftEllipsis) {
    pages.push("ellipsis");
  } else {
    for (let i = 2; i < leftSibling; i++) {
      pages.push(i);
    }
  }

  for (let i = leftSibling; i <= rightSibling; i++) {
    pages.push(i);
  }

  if (showRightEllipsis) {
    pages.push("ellipsis");
  } else {
    for (let i = rightSibling + 1; i < totalPages; i++) {
      pages.push(i);
    }
  }

  pages.push(totalPages);
  return pages;
}

// ═════════════════════════════════════════════════════════════
//  Pagination
// ═════════════════════════════════════════════════════════════

export interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of sibling pages around current page */
  siblingCount?: number;
  /** Show previous/next buttons */
  showPrevNext?: boolean;
  /** Previous button content */
  prevContent?: ReactNode;
  /** Next button content */
  nextContent?: ReactNode;
  /** Size */
  size?: PaginationSize;
  /** Visual variant */
  variant?: PaginationVariant;
  /** Border radius */
  radius?: PaginationRadius;
  /** Active page color */
  color?: PaginationColor;
  /** Disable all interaction */
  disabled?: boolean;
  /** Alignment */
  align?: "start" | "center" | "end";
  /** Additional class */
  className?: string;
}

const defaultPrev = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
  </svg>
);

const defaultNext = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
  </svg>
);

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showPrevNext = true,
  prevContent,
  nextContent,
  size = "md",
  variant = "default",
  radius = "md",
  color = "primary",
  disabled = false,
  align = "start",
  className,
}: PaginationProps) {
  const pages = useMemo(
    () => generatePages(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount],
  );

  const sizes = sizeClasses[size];
  const colors = colorClasses[color];
  const rad = radiusClasses[radius];

  // Alignment
  const alignClass =
    align === "center"
      ? "justify-center"
      : align === "end"
        ? "justify-end"
        : "justify-start";

  // Base item classes (shared by all items)
  const baseItemClass = [
    "inline-flex items-center justify-center font-medium transition-all duration-150 select-none",
    sizes.item,
    sizes.text,
    rad,
    disabled ? "pointer-events-none opacity-50" : "",
  ].join(" ");

  // Variant-specific item styling
  function getItemClass(isActive: boolean, isDisabled: boolean): string {
    if (isDisabled) {
      return `${baseItemClass} cursor-not-allowed text-text-muted opacity-50`;
    }

    if (isActive) {
      switch (variant) {
        case "filled":
          return `${baseItemClass} ${colors.active} cursor-default shadow-sm`;
        case "outlined":
          return `${baseItemClass} border-2 ${colors.active} cursor-default`;
        case "minimal":
          return `${baseItemClass} ${colors.active} cursor-default`;
        default:
          return `${baseItemClass} border border-border ${colors.active} cursor-default`;
      }
    }

    // Inactive item
    switch (variant) {
      case "filled":
        return `${baseItemClass} text-text-muted cursor-pointer ${colors.hover}`;
      case "outlined":
        return `${baseItemClass} border border-border text-text-muted cursor-pointer ${colors.hover}`;
      case "minimal":
        return `${baseItemClass} text-text-muted cursor-pointer ${colors.hover}`;
      default:
        return `${baseItemClass} border border-border text-text cursor-pointer ${colors.hover}`;
    }
  }

  const handleClick = (page: number) => {
    if (disabled || page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  // Gap between items
  const gapClass = variant === "default" ? "gap-1" : "gap-1.5";

  return (
    <nav aria-label="Pagination" className={className}>
      <ul className={`flex flex-wrap items-center ${gapClass} ${alignClass}`}>
        {/* Previous */}
        {showPrevNext && (
          <li>
            <button
              type="button"
              className={getItemClass(false, isFirstPage)}
              onClick={() => handleClick(currentPage - 1)}
              disabled={isFirstPage || disabled}
              aria-label="Previous page"
            >
              {prevContent ?? defaultPrev}
            </button>
          </li>
        )}

        {/* Page items */}
        {pages.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <li key={`ellipsis-${index}`}>
                <span className={`${baseItemClass} cursor-default text-text-muted`}>
                  &hellip;
                </span>
              </li>
            );
          }

          const isActive = page === currentPage;
          return (
            <li key={page}>
              <button
                type="button"
                className={getItemClass(isActive, false)}
                onClick={() => handleClick(page)}
                disabled={disabled}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </button>
            </li>
          );
        })}

        {/* Next */}
        {showPrevNext && (
          <li>
            <button
              type="button"
              className={getItemClass(false, isLastPage)}
              onClick={() => handleClick(currentPage + 1)}
              disabled={isLastPage || disabled}
              aria-label="Next page"
            >
              {nextContent ?? defaultNext}
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
