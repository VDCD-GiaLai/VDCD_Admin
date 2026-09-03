import { useCallback } from "react";

/**
 * Creates a paste event handler for contentEditable elements that strips all
 * external formatting and inserts only plain text. Line breaks are preserved.
 *
 * This prevents Word, Google Docs, websites, and other sources from injecting
 * HTML styles, fonts, colors, or markup into the editor.
 *
 * Internal editor formatting (bold/italic via Ctrl+B/I done inside the editor)
 * is unaffected because this only intercepts the paste event — it does not
 * remove existing DOM content.
 *
 * @param options.preserveLineBreaks - If true (default), newlines in pasted text
 *   are converted to <br> tags so multi-line pastes don't collapse into one line.
 *   Set to false for single-line elements (headings, CTA labels, etc.).
 */
export function useSanitizedPaste(options?: { preserveLineBreaks?: boolean }) {
  const preserveLineBreaks = options?.preserveLineBreaks ?? true;

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLElement>) => {
      e.preventDefault();

      // Always prefer plain text from the clipboard
      const plainText = e.clipboardData.getData("text/plain");
      if (!plainText) return;

      if (preserveLineBreaks) {
        // Convert newlines to <br> to preserve multi-line structure,
        // but escape any HTML entities first to prevent injection.
        const escaped = plainText
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/\n/g, "<br>");

        // Use insertHTML so the text lands at the current cursor position
        // and respects existing selection (overwrites selected text).
        document.execCommand("insertHTML", false, escaped);
      } else {
        // For single-line elements, strip all newlines and insert as plain text
        const singleLine = plainText.replace(/[\r\n]+/g, " ").trim();
        document.execCommand("insertText", false, singleLine);
      }
    },
    [preserveLineBreaks],
  );

  return { handlePaste };
}
