import { useCallback } from "react";

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
    const wrapped = `${openTag}${selected}${closeTag}`;
    const newValue = value.substring(0, start) + wrapped + value.substring(end);
    return {
      newValue,
      cursorStart: start + openTag.length,
      cursorEnd: start + openTag.length + selected.length,
    };
  } else {
    const inserted = `${openTag}${closeTag}`;
    const newValue = value.substring(0, start) + inserted + value.substring(end);
    return {
      newValue,
      cursorStart: start + openTag.length,
      cursorEnd: start + openTag.length,
    };
  }
}

export interface ShortcutMapping {
  key: string;
  openTag: string;
  closeTag: string;
}

const DEFAULT_SHORTCUTS: ShortcutMapping[] = [
  { key: "b", openTag: "<strong>", closeTag: "</strong>" },
  { key: "i", openTag: "<em>", closeTag: "</em>" },
  { key: "u", openTag: "<u>", closeTag: "</u>" },
];

export function useHtmlShortcuts(
  onChange: (newValue: string) => void,
  shortcuts: ShortcutMapping[] = DEFAULT_SHORTCUTS,
) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
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

      onChange(newValue);

      requestAnimationFrame(() => {
        element.setSelectionRange(cursorStart, cursorEnd);
        element.focus();
      });
    },
    [onChange, shortcuts],
  );

  return { handleKeyDown };
}
