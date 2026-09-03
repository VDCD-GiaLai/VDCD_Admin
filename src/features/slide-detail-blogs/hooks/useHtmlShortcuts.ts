import { useCallback } from "react";

/**
 * Wraps selected text in an HTML tag within a textarea or input element.
 * If no text is selected, inserts the tag pair and places the cursor inside.
 * Returns the new full value and the cursor position to restore after React re-render.
 */
function wrapSelectionWithTag(
  element: HTMLTextAreaElement | HTMLInputElement,
  openTag: string,
  closeTag: string,
): { newValue: string; cursorStart: number; cursorEnd: number } {
  const { selectionStart, selectionEnd, value } = element;
  const start = selectionStart ?? 0;
  const end = selectionEnd ?? 0;
  const selected = value.substring(start, end);

  if (selected.length > 0) {
    // Wrap selected text
    const wrapped = `${openTag}${selected}${closeTag}`;
    const newValue = value.substring(0, start) + wrapped + value.substring(end);
    return {
      newValue,
      cursorStart: start + openTag.length,
      cursorEnd: start + openTag.length + selected.length,
    };
  } else {
    // No selection — insert empty tag pair and place cursor inside
    const inserted = `${openTag}${closeTag}`;
    const newValue = value.substring(0, start) + inserted + value.substring(end);
    return {
      newValue,
      cursorStart: start + openTag.length,
      cursorEnd: start + openTag.length,
    };
  }
}

interface ShortcutMapping {
  key: string;
  openTag: string;
  closeTag: string;
}

const DEFAULT_SHORTCUTS: ShortcutMapping[] = [
  { key: "b", openTag: "<strong>", closeTag: "</strong>" },
  { key: "i", openTag: "<em>", closeTag: "</em>" },
  { key: "u", openTag: "<u>", closeTag: "</u>" },
];

/**
 * Hook that returns an `onKeyDown` handler for textarea/input elements.
 * Intercepts Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline)
 * and wraps the selected text in the corresponding HTML tag.
 *
 * @param onChange — callback receiving the new full string value (triggers form state update)
 * @param shortcuts — optional custom shortcut list (defaults to bold/italic/underline)
 */
export function useHtmlShortcuts(
  onChange: (newValue: string) => void,
  shortcuts: ShortcutMapping[] = DEFAULT_SHORTCUTS,
) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      // Only handle Ctrl/Cmd + key combos
      if (!e.ctrlKey && !e.metaKey) return;

      const mapping = shortcuts.find((s) => s.key === e.key.toLowerCase());
      if (!mapping) return;

      e.preventDefault();

      const element = e.currentTarget;
      const { newValue, cursorStart, cursorEnd } = wrapSelectionWithTag(
        element,
        mapping.openTag,
        mapping.closeTag,
      );

      // Notify parent of the new value
      onChange(newValue);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        element.setSelectionRange(cursorStart, cursorEnd);
        element.focus();
      });
    },
    [onChange, shortcuts],
  );

  return { handleKeyDown };
}
