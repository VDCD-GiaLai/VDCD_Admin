import { useEffect, useLayoutEffect, useRef } from "react";

// Server-safe layout effect to avoid React SSR hydration warnings
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface UseContentEditableSyncOptions {
  html: string;
  enabled?: boolean;
}

/**
 * Safely syncs external HTML into a contentEditable element without wiping out
 * user typing or breaking text selection during parent re-renders.
 */
export function useContentEditableSync(
  elementRef: React.RefObject<HTMLElement | null>,
  options: UseContentEditableSyncOptions,
) {
  const { html, enabled = true } = options;
  const lastHtmlRef = useRef(html);
  const isMountedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (!enabled || !elementRef.current) return;

    if (!isMountedRef.current) {
      isMountedRef.current = true;
      elementRef.current.innerHTML = html || "";
      lastHtmlRef.current = html;
      return;
    }

    // Only update the DOM when the html prop changed from an external source
    // (e.g., undo/redo, template loading, or property panel update)
    if (html !== lastHtmlRef.current) {
      lastHtmlRef.current = html;
      if (elementRef.current.innerHTML !== (html || "")) {
        elementRef.current.innerHTML = html || "";
      }
    }
  }, [html, enabled]);

  // Keep internal ref in sync with latest DOM content when user types or formats
  const handleInput = () => {
    if (elementRef.current) {
      lastHtmlRef.current = elementRef.current.innerHTML;
    }
  };

  return { handleInput, lastHtmlRef };
}
