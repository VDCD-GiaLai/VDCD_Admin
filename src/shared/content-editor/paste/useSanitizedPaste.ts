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

/**
 * Sanitizes pasted HTML from external sources (Word, Google Docs, browser):
 * - Strips all script tags, event handlers, and javascript: protocols.
 * - Strips mso-*, inline fonts, colors, and styling wrappers.
 * - Preserves plain text, semantic tags (b, i, strong, em), Unicode, and line breaks.
 */
export function sanitizePastedHtml(html: string): string {
  if (!html) return "";
  let clean = html;

  // 1. Remove dangerous tags
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<meta[\s\S]*?>/gi, "");
  clean = clean.replace(/<link[\s\S]*?>/gi, "");

  // 2. Remove inline event handlers (onerror, onclick, etc.) and javascript: protocols
  clean = clean.replace(/\s+on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "");
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

  // 3. Strip Microsoft Word comments and mso tags
  clean = clean.replace(/<!--[\s\S]*?-->/g, "");
  clean = clean.replace(/<\/?\w+:[^>]*>/gi, "");

  // 4. Strip inline styles (colors, font-family, font-size, etc.)
  clean = clean.replace(/\s+style\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "");

  // 5. Strip class attributes (e.g. Word or GDocs internal classes)
  clean = clean.replace(/\s+class\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "");

  // 6. Unwrap span or div tags that only held formatting
  clean = clean.replace(/<\/?(span|div)[^>]*>/gi, " ");

  // 7. Normalize multiple whitespaces and trim
  return clean.replace(/\s{2,}/g, " ").trim();
}

export const cleanHtmlContent = sanitizePastedHtml;

