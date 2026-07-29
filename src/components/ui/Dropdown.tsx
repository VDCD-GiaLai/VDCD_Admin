"use client";

import {
  type ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";

// ─── Types ───────────────────────────────────────────────────

export type DropdownPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end" | "left" | "right";

// ─── Placement CSS ───────────────────────────────────────────

const placementClasses: Record<DropdownPlacement, string> = {
  "bottom-start": "top-full left-0 mt-1",
  "bottom-end": "top-full right-0 mt-1",
  "top-start": "bottom-full left-0 mb-1",
  "top-end": "bottom-full right-0 mb-1",
  left: "right-full top-0 mr-1",
  right: "left-full top-0 ml-1",
};

// ─── Context for auto-close ──────────────────────────────────

interface DropdownContextValue {
  close: () => void;
  autoClose: boolean;
}

const DropdownContext = createContext<DropdownContextValue>({
  close: () => undefined,
  autoClose: true,
});

// ═════════════════════════════════════════════════════════════
//  Dropdown — root container (trigger + menu)
// ═════════════════════════════════════════════════════════════

export interface DropdownProps {
  /** Trigger element (button, link, etc.) */
  trigger: ReactNode;
  /** Menu content */
  children: ReactNode;
  /** Dropdown placement */
  placement?: DropdownPlacement;
  /** Close when clicking an item inside */
  autoClose?: boolean;
  /** Min width of the menu */
  minWidth?: number;
  /** Additional wrapper class */
  className?: string;
}

export function Dropdown({
  trigger,
  children,
  placement = "bottom-start",
  autoClose = true,
  minWidth = 160,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <DropdownContext.Provider value={{ close, autoClose }}>
      <div ref={containerRef} className={`relative inline-flex ${className ?? ""}`}>
        {/* Trigger — clone onClick to toggle */}
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex cursor-pointer"
          role="button"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {trigger}
        </div>

        {/* Menu */}
        {isOpen && (
          <div
            className={[
              "absolute z-50 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-150",
              placementClasses[placement],
            ].join(" ")}
            style={{ minWidth }}
            role="menu"
          >
            {children}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

// ═════════════════════════════════════════════════════════════
//  DropdownItem — clickable menu item
// ═════════════════════════════════════════════════════════════

export interface DropdownItemProps {
  /** Item content */
  children: ReactNode;
  /** Icon before the text */
  startContent?: ReactNode;
  /** Icon/badge after the text */
  endContent?: ReactNode;
  /** Active (highlighted) state */
  isActive?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Render as link */
  href?: string;
  /** Additional class */
  className?: string;
}

export function DropdownItem({
  children,
  startContent,
  endContent,
  isActive = false,
  disabled = false,
  onClick,
  href,
  className,
}: DropdownItemProps) {
  const { close, autoClose } = useContext(DropdownContext);

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    if (autoClose) close();
  };

  const itemClasses = [
    "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
    disabled
      ? "cursor-not-allowed opacity-50 text-text-muted"
      : "cursor-pointer hover:bg-surface-muted",
    isActive
      ? "bg-primary/10 text-primary font-medium"
      : "text-text",
    className ?? "",
  ].join(" ");

  if (href && !disabled) {
    return (
      <a href={href} className={itemClasses} role="menuitem" onClick={handleClick}>
        {startContent && <span className="shrink-0">{startContent}</span>}
        <span className="flex-1">{children}</span>
        {endContent && <span className="shrink-0">{endContent}</span>}
      </a>
    );
  }

  return (
    <button type="button" className={itemClasses} role="menuitem" onClick={handleClick} disabled={disabled}>
      {startContent && <span className="shrink-0">{startContent}</span>}
      <span className="flex-1 text-left">{children}</span>
      {endContent && <span className="shrink-0">{endContent}</span>}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════
//  DropdownHeader — section header inside the menu
// ═════════════════════════════════════════════════════════════

export interface DropdownHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DropdownHeader({ children, className }: DropdownHeaderProps) {
  return (
    <div
      className={[
        "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  DropdownDivider — horizontal rule inside the menu
// ═════════════════════════════════════════════════════════════

export function DropdownDivider({ className }: { className?: string }) {
  return <hr className={`my-1 border-t border-border ${className ?? ""}`} />;
}

// ═════════════════════════════════════════════════════════════
//  DropdownText — non-interactive text block inside the menu
// ═════════════════════════════════════════════════════════════

export interface DropdownTextProps {
  children: ReactNode;
  className?: string;
}

export function DropdownText({ children, className }: DropdownTextProps) {
  return (
    <div className={`px-3 py-2 text-xs text-text-muted ${className ?? ""}`}>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  DropdownCustom — arbitrary content inside the menu (forms, etc.)
// ═════════════════════════════════════════════════════════════

export interface DropdownCustomProps {
  children: ReactNode;
  className?: string;
}

export function DropdownCustom({ children, className }: DropdownCustomProps) {
  return (
    <div className={`px-3 py-2 ${className ?? ""}`}>
      {children}
    </div>
  );
}
