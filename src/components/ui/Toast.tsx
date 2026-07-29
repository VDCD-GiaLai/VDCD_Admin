"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

// ─── Types ───────────────────────────────────────────────────

export type ToastColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "dark";

export type ToastVariant = "default" | "solid" | "soft";

export type ToastPlacement =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  id: string;
  /** Main message body */
  title?: ReactNode;
  /** Description or secondary text */
  description?: ReactNode;
  /** Timestamp string (e.g. "11 mins ago") */
  time?: string;
  /** Custom logo/icon for the header (only shown if title exists and variant is default) */
  icon?: ReactNode;
  /** Color theme */
  color?: ToastColor;
  /** Visual variant */
  variant?: ToastVariant;
  /** Auto close duration in ms (0 to disable) */
  duration?: number;
  /** Callback when toast is closed */
  onClose?: () => void;
  /** Action button */
  action?: ToastAction;
}

// ─── Color Maps ──────────────────────────────────────────────

interface ToastColorTokens {
  solid: string;
  soft: string;
  textSolid: string;
  textSoft: string;
}

const colorTokens: Record<Exclude<ToastColor, "default">, ToastColorTokens> = {
  primary: { solid: "bg-primary", soft: "bg-primary/10", textSolid: "text-white", textSoft: "text-primary" },
  secondary: { solid: "bg-secondary", soft: "bg-secondary/10", textSolid: "text-white", textSoft: "text-secondary" },
  success: { solid: "bg-success", soft: "bg-success/10", textSolid: "text-white", textSoft: "text-success" },
  danger: { solid: "bg-danger", soft: "bg-danger/10", textSolid: "text-white", textSoft: "text-danger" },
  warning: { solid: "bg-warning", soft: "bg-warning/10", textSolid: "text-dark", textSoft: "text-warning" },
  info: { solid: "bg-info", soft: "bg-info/10", textSolid: "text-white", textSoft: "text-info" },
  dark: { solid: "bg-dark", soft: "bg-dark/10", textSolid: "text-white", textSoft: "text-dark" },
};

// ═════════════════════════════════════════════════════════════
//  ToastItem (Visual Component)
// ═════════════════════════════════════════════════════════════

function ToastItem({
  title,
  description,
  time,
  icon,
  color = "default",
  variant = "default",
  duration = 5000,
  onClose,
  action,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const isColored = color !== "default";
  const tokens = isColored ? colorTokens[color as keyof typeof colorTokens] : null;

  // Resolve visual styles
  let containerClass = "bg-surface border border-border text-text shadow-lg";
  let closeBtnClass = "text-text-muted hover:text-text";
  let dividerClass = "border-border";
  let actionBtnClass = "bg-primary text-white hover:bg-primary-hover";
  let headerTextClass = "text-text";

  if (tokens) {
    if (variant === "solid") {
      containerClass = `${tokens.solid} ${tokens.textSolid} shadow-lg border-0`;
      closeBtnClass = "text-white/80 hover:text-white";
      dividerClass = "border-white/20";
      actionBtnClass = "bg-white text-dark hover:bg-gray-100";
      headerTextClass = tokens.textSolid;
    } else if (variant === "soft") {
      containerClass = `${tokens.soft} ${tokens.textSoft} shadow-sm border border-transparent`;
      closeBtnClass = `${tokens.textSoft} opacity-80 hover:opacity-100`;
      dividerClass = "border-current opacity-20";
      actionBtnClass = "bg-surface text-text hover:bg-surface-muted";
      headerTextClass = tokens.textSoft;
    }
  }

  // If there's a title AND it's the default variant, show the Vyzor-style header
  const showHeader = title && variant === "default";

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg ${containerClass} animate-in slide-in-from-right-5 fade-in duration-300`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {showHeader ? (
        <>
          {/* Header */}
          <div className={`flex items-center justify-between border-b px-4 py-2 ${dividerClass}`}>
            <div className="flex items-center gap-2">
              {icon && <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-white">{icon}</span>}
              {!icon && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              )}
              <strong className={`font-semibold ${headerTextClass}`}>{title}</strong>
              {time && <small className="ml-2 text-xs opacity-70">{time}</small>}
            </div>
            <button
              type="button"
              className={`ml-2 p-1 transition-colors ${closeBtnClass}`}
              onClick={onClose}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
          {/* Body */}
          <div className="px-4 py-3 text-sm opacity-90">
            {description}
            {action && (
              <div className="mt-3 flex gap-2 border-t pt-3 border-border">
                <button
                  type="button"
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${actionBtnClass}`}
                  onClick={() => {
                    action.onClick();
                    onClose?.();
                  }}
                >
                  {action.label}
                </button>
                <button
                  type="button"
                  className="rounded bg-surface-muted px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-border"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* No Header (inline close button) - Used for Colored/Soft/Solid variants or missing title */
        <div className="flex items-start justify-between p-4">
          <div className="flex gap-3">
            {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
            <div className="flex flex-col gap-1">
              {title && <strong className={`font-semibold ${headerTextClass}`}>{title}</strong>}
              <span className="text-sm opacity-90">{description}</span>
            </div>
          </div>
          <div className="ml-4 flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              {time && <small className="text-xs opacity-70">{time}</small>}
              <button
                type="button"
                className={`p-1 transition-colors ${closeBtnClass}`}
                onClick={onClose}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            {action && (
              <button
                type="button"
                className={`mt-1 rounded px-3 py-1 text-xs font-medium transition-colors ${actionBtnClass}`}
                onClick={() => {
                  action.onClick();
                  onClose?.();
                }}
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  ToastContext & Provider
// ═════════════════════════════════════════════════════════════

interface ToastContextValue {
  toast: (options: Omit<ToastProps, "id" | "onClose">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export interface ToastProviderProps {
  children: ReactNode;
  /** Default placement for all toasts */
  placement?: ToastPlacement;
}

let toastIdCounter = 0;

export function ToastProvider({ children, placement = "bottom-right" }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((options: Omit<ToastProps, "id" | "onClose">) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  // Determine placement CSS for container
  const placementClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "top-center": "top-0 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
  };

  const isTop = placement.startsWith("top");

  // Reverse list if bottom so newest is at the bottom (or top if top)
  const displayToasts = isTop ? [...toasts].reverse() : toasts;

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`fixed z-[9999] m-4 flex flex-col gap-3 ${placementClasses[placement]} pointer-events-none`}
      >
        {displayToasts.map((t) => (
          <ToastItem
            key={t.id}
            {...t}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ═════════════════════════════════════════════════════════════
//  useToast Hook
// ═════════════════════════════════════════════════════════════

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
