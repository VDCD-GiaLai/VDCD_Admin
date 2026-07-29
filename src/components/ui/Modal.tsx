"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// ─── Types ───────────────────────────────────────────────────

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";
export type ModalPlacement = "auto" | "top" | "center" | "bottom";
export type ModalScrollBehavior = "inside" | "outside";

export interface ModalProps {
  /** Controls if the modal is open */
  isOpen: boolean;
  /** Callback when the modal requests to close */
  onClose: () => void;
  /** Maximum width of the modal */
  size?: ModalSize;
  /** Vertical placement */
  placement?: ModalPlacement;
  /** Scroll behavior (inside = body scrolls, outside = modal container scrolls) */
  scrollBehavior?: ModalScrollBehavior;
  /** Can the modal be closed by clicking outside or pressing Escape? */
  isDismissable?: boolean;
  /** Hide the default close button in the header */
  hideCloseButton?: boolean;
  children: ReactNode;
}

interface ModalContextValue {
  onClose: () => void;
  hideCloseButton: boolean;
  scrollBehavior: ModalScrollBehavior;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("Modal components must be used within a Modal provider.");
  }
  return context;
};

// ─── Size Maps ───────────────────────────────────────────────

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg", // standard
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[100vw] h-[100dvh] m-0 rounded-none",
};

const placementClasses: Record<ModalPlacement, string> = {
  auto: "items-center",
  center: "items-center",
  top: "items-start pt-4 sm:pt-10",
  bottom: "items-end pb-4 sm:pb-10",
};

// ═════════════════════════════════════════════════════════════
//  Modal (Root & Portal)
// ═════════════════════════════════════════════════════════════

export function Modal({
  isOpen,
  onClose,
  size = "md",
  placement = "auto",
  scrollBehavior = "outside",
  isDismissable = true,
  hideCloseButton = false,
  children,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !isDismissable) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDismissable, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isDismissable) {
      onClose();
    }
  };

  const containerClasses = [
    "fixed inset-0 z-50 flex w-screen justify-center bg-black/50 backdrop-blur-sm",
    "animate-in fade-in duration-200",
    placementClasses[placement],
    scrollBehavior === "outside" ? "overflow-y-auto" : "overflow-hidden",
  ].join(" ");

  const contentClasses = [
    "relative flex flex-col w-full bg-surface shadow-2xl animate-in zoom-in-95 duration-200",
    sizeClasses[size],
    size === "full" ? "" : "m-4 rounded-xl",
    scrollBehavior === "inside" ? "max-h-[calc(100vh-2rem)]" : "",
  ].join(" ");

  return createPortal(
    <ModalContext.Provider value={{ onClose, hideCloseButton, scrollBehavior }}>
      <div
        className={containerClasses}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
        <div className={contentClasses} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════
//  Modal Sub-Components
// ═════════════════════════════════════════════════════════════

export function ModalContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex h-full flex-col ${className}`}>{children}</div>;
}

export function ModalHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { onClose, hideCloseButton } = useModalContext();

  return (
    <div className={`flex shrink-0 items-center justify-between border-b border-border px-5 py-4 ${className}`}>
      <div className="text-lg font-semibold text-text">{children}</div>
      {!hideCloseButton && (
        <button
          type="button"
          onClick={onClose}
          className="ml-auto inline-flex items-center justify-center rounded-md p-1.5 text-text-muted hover:bg-surface-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Close"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { scrollBehavior } = useModalContext();

  return (
    <div
      className={`flex-1 p-5 text-sm text-text-muted ${
        scrollBehavior === "inside" ? "overflow-y-auto" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}
