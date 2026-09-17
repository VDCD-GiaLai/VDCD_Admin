import { useEffect, useLayoutEffect, useRef } from "react";

// Server-safe layout effect to avoid React SSR hydration warnings
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface UseContentEditableSyncOptions {
  html: string;
  enabled?: boolean;
  nodeKey?: unknown;
}

/**
 * Safely syncs external HTML into a contentEditable element without wiping out
 * user typing or breaking text selection during parent re-renders.
 *
 * Also handles the case where the underlying DOM node changes (e.g., heading
 * level change: h1 → h2 causes React to unmount/remount the element) — in that
 * case the hook detects the new node and re-initialises the content correctly.
 */
export function useContentEditableSync(
  elementRef: React.RefObject<HTMLElement | null>,
  options: UseContentEditableSyncOptions,
) {
  const { html, enabled = true, nodeKey } = options;
  const lastHtmlRef = useRef(html);
  const isMountedRef = useRef(false);
  // Track the actual DOM node so we detect when React swaps it out
  const elementNodeRef = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!enabled || !elementRef.current) return;

    // Detect DOM node replacement (e.g., h1 -> h2 tag change)
    const isNewNode = elementRef.current !== elementNodeRef.current;
    if (isNewNode) {
      // New DOM node — must initialise its content regardless of previous state
      elementNodeRef.current = elementRef.current;
      isMountedRef.current = true;
      const nextHtml = html || lastHtmlRef.current || "";
      elementRef.current.innerHTML = nextHtml;
      lastHtmlRef.current = nextHtml;
      return;
    }

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
  }, [html, enabled, nodeKey]);

  // Keep internal ref in sync with latest DOM content when user types or formats
  const handleInput = () => {
    if (elementRef.current) {
      lastHtmlRef.current = elementRef.current.innerHTML;
    }
  };

  return { handleInput, lastHtmlRef };
}
