"use client";

import {
  type ReactNode,
  type ComponentProps,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import {
  Popover as HeroPopover,
  PopoverTrigger as HeroPopoverTrigger,
  PopoverContent as HeroPopoverContent,
} from "@heroui/react";

// ─── Types ───────────────────────────────────────────────────

export type DropdownPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

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

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <DropdownContext.Provider value={{ close, autoClose }}>
      <HeroPopover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <HeroPopoverTrigger>
          {/* Wrap in an inline-flex div to ensure the trigger receives popover ref and onClick events correctly */}
          <div className="inline-flex cursor-pointer" role="button">
            {trigger}
          </div>
        </HeroPopoverTrigger>
        <HeroPopoverContent
          placement={
            placement.replace("-", " ") as ComponentProps<
              typeof HeroPopoverContent
            >["placement"]
          }
          className={[
            "p-1 bg-surface border border-border shadow-lg rounded-md overflow-hidden",
            className ?? "",
          ].join(" ")}
          style={{ minWidth }}
        >
          <div className="w-full flex flex-col">{children}</div>
        </HeroPopoverContent>
      </HeroPopover>
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
    "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors rounded-md",
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
        <span className="flex-1 text-left">{children}</span>
        {endContent && <span className="shrink-0">{endContent}</span>}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={itemClasses}
      role="menuitem"
      onClick={handleClick}
      disabled={disabled}
    >
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
        "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted select-none",
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
    <div className={`px-3 py-2 text-xs text-text-muted select-none ${className ?? ""}`}>
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

// ═════════════════════════════════════════════════════════════
//  DropdownSelect — select-like dropdown menu
// ═════════════════════════════════════════════════════════════

export interface DropdownSelectOption<T = string> {
  value: T;
  label: ReactNode;
}

export interface DropdownSelectProps<T = string> {
  /** Selected value */
  value: T;
  /** Selection change callback */
  onChange: (value: T) => void;
  /** Option list */
  options: DropdownSelectOption<T>[];
  /** Placeholder text */
  placeholder?: string;
  /** Dropdown placement */
  placement?: DropdownPlacement;
  /** Min width of the dropdown menu */
  minWidth?: number;
  /** Trigger button custom className */
  className?: string;
}

export function DropdownSelect<T = string>({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  placement = "bottom-start",
  minWidth = 160,
  className,
}: DropdownSelectProps<T>) {
  const currentOption = options.find((opt) => opt.value === value);

  return (
    <Dropdown
      placement={placement}
      minWidth={minWidth}
      trigger={
        <button
          type="button"
          className={[
            "flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-all duration-200 hover:border-primary hover:text-primary focus:border-primary focus:outline-none",
            className ?? "",
          ].join(" ")}
        >
          <span className="font-medium">
            {currentOption ? currentOption.label : placeholder}
          </span>
          <svg
            className="h-3.5 w-3.5 text-text-muted transition-colors"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      }
    >
      {options.map((opt) => (
        <DropdownItem
          key={String(opt.value)}
          isActive={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
