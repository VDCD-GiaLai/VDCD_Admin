import { useCallback, useState } from "react";

export type FormatAction =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "code"
  | "highlight"
  | "link"
  | "clear";

interface TagConfig {
  canonical: string;
  openTag: string;
  closeTag: string;
  aliases: string[];
}

const TAG_CONFIGS: Record<Exclude<FormatAction, "link" | "clear">, TagConfig> = {
  bold: {
    canonical: "strong",
    openTag: "<strong>",
    closeTag: "</strong>",
    aliases: ["strong", "b"],
  },
  italic: {
    canonical: "em",
    openTag: "<em>",
    closeTag: "</em>",
    aliases: ["em", "i"],
  },
  underline: {
    canonical: "u",
    openTag: "<u>",
    closeTag: "</u>",
    aliases: ["u"],
  },
  strikethrough: {
    canonical: "del",
    openTag: "<del>",
    closeTag: "</del>",
    aliases: ["del", "s", "strike"],
  },
  code: {
    canonical: "code",
    openTag: "<code>",
    closeTag: "</code>",
    aliases: ["code"],
  },
  highlight: {
    canonical: "mark",
    openTag: "<mark>",
    closeTag: "</mark>",
    aliases: ["mark"],
  },
};

export interface FormatResult {
  newValue: string;
  cursorStart: number;
  cursorEnd: number;
}

function matchEndingOpenTag(text: string, tagNames: string[]): { tag: string; length: number } | null {
  const pattern = new RegExp(`(<(?:${tagNames.join("|")})(?:\\s[^>]*)?>)$`, "i");
  const match = text.match(pattern);
  if (match && match[1]) {
    return { tag: match[1], length: match[1].length };
  }
  return null;
}

function matchStartingCloseTag(text: string, tagNames: string[]): { tag: string; length: number } | null {
  const pattern = new RegExp(`^(<\\/(?:${tagNames.join("|")})>)`, "i");
  const match = text.match(pattern);
  if (match && match[1]) {
    return { tag: match[1], length: match[1].length };
  }
  return null;
}

export function formatHtmlText(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  action: FormatAction,
  options?: { linkUrl?: string },
): FormatResult | null {
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(0, Math.min(selectionEnd, value.length));
  const selected = value.substring(start, end);

  if (action === "clear") {
    if (start < end) {
      const stripped = selected.replace(/<\/?[^>]+(>|$)/g, "");
      const newValue = value.substring(0, start) + stripped + value.substring(end);
      return {
        newValue,
        cursorStart: start,
        cursorEnd: start + stripped.length,
      };
    }
    return null;
  }

  // 2. LINK (<a>...</a>)
  if (action === "link") {
    // Check if the selection or cursor is already in/on an existing link
    const linkRegex = /<a(\s+[^>]*)?>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    let foundMatch: {
      tagStart: number;
      tagEnd: number;
      openTag: string;
      innerText: string;
    } | null = null;

    while ((match = linkRegex.exec(value)) !== null) {
      const tagStart = match.index;
      const tagEnd = tagStart + match[0].length;
      const openTagMatch = match[0].match(/^<a(\s+[^>]*)?>/i);
      const openTag = openTagMatch ? openTagMatch[0] : "<a>";
      const innerText = match[2];

      const isInsideOrOverlapping =
        (start === end && tagStart <= start && start <= tagEnd) ||
        (start < end && start < tagEnd && end > tagStart);

      if (isInsideOrOverlapping) {
        foundMatch = {
          tagStart,
          tagEnd,
          openTag,
          innerText,
        };
        break;
      }
    }

    // TOGGLE OFF: If already on a link and no new URL provided, unwrap the link!
    if (foundMatch && (!options?.linkUrl || options.linkUrl.trim() === "")) {
      const before = value.substring(0, foundMatch.tagStart);
      const after = value.substring(foundMatch.tagEnd);
      const newValue = before + foundMatch.innerText + after;

      const removedOpenLen = foundMatch.openTag.length;
      let newStart = start;
      let newEnd = end;

      if (start === end) {
        if (start <= foundMatch.tagStart) {
          newStart = start;
        } else if (start <= foundMatch.tagStart + removedOpenLen) {
          newStart = foundMatch.tagStart;
        } else if (start >= foundMatch.tagEnd - 4) {
          newStart = foundMatch.tagStart + foundMatch.innerText.length;
        } else {
          newStart = start - removedOpenLen;
        }
        newEnd = newStart;
      } else {
        newStart = Math.max(foundMatch.tagStart, start - removedOpenLen);
        newEnd = Math.min(
          foundMatch.tagStart + foundMatch.innerText.length,
          end - removedOpenLen,
        );
        if (newEnd < newStart) {
          newStart = foundMatch.tagStart;
          newEnd = foundMatch.tagStart + foundMatch.innerText.length;
        }
      }

      return {
        newValue,
        cursorStart: newStart,
        cursorEnd: newEnd,
      };
    }

    // UPDATE URL on existing link:
    if (foundMatch && options?.linkUrl) {
      const url = options.linkUrl.trim();
      const wrapped = `<a href="${url}" target="_blank" rel="noopener noreferrer">${foundMatch.innerText}</a>`;
      const newValue =
        value.substring(0, foundMatch.tagStart) + wrapped + value.substring(foundMatch.tagEnd);
      return {
        newValue,
        cursorStart: foundMatch.tagStart,
        cursorEnd: foundMatch.tagStart + wrapped.length,
      };
    }

    // CREATE NEW LINK:
    const rawUrl = options?.linkUrl;
    if (rawUrl === undefined) {
      return null;
    }
    const url = rawUrl.trim();
    if (!url) return null;

    if (start < end) {
      const wrapped = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selected}</a>`;
      const newValue = value.substring(0, start) + wrapped + value.substring(end);
      return {
        newValue,
        cursorStart: start,
        cursorEnd: start + wrapped.length,
      };
    } else {
      const placeholder = "liên kết";
      const wrapped = `<a href="${url}" target="_blank" rel="noopener noreferrer">${placeholder}</a>`;
      const newValue = value.substring(0, start) + wrapped + value.substring(end);
      return {
        newValue,
        cursorStart: start,
        cursorEnd: start + wrapped.length,
      };
    }
  }

  const config = TAG_CONFIGS[action];
  if (!config) return null;

  const { openTag, closeTag, aliases } = config;

  if (start < end) {
    const tagNamesPattern = aliases.join("|");
    const selfWrappedRegex = new RegExp(
      `^<(${tagNamesPattern})(\\s[^>]*)?>([\\s\\S]*)<\\/\\1>$`,
      "i",
    );
    const selfMatch = selected.match(selfWrappedRegex);
    if (selfMatch) {
      const innerText = selfMatch[3] ?? "";
      const newValue = value.substring(0, start) + innerText + value.substring(end);
      return {
        newValue,
        cursorStart: start,
        cursorEnd: start + innerText.length,
      };
    }

    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);
    const endingOpen = matchEndingOpenTag(textBefore, aliases);
    const startingClose = matchStartingCloseTag(textAfter, aliases);

    if (endingOpen && startingClose) {
      const newValue =
        value.substring(0, start - endingOpen.length) +
        selected +
        value.substring(end + startingClose.length);
      const newStart = start - endingOpen.length;
      return {
        newValue,
        cursorStart: newStart,
        cursorEnd: newStart + selected.length,
      };
    }

    const wrapped = `${openTag}${selected}${closeTag}`;
    const newValue = value.substring(0, start) + wrapped + value.substring(end);
    return {
      newValue,
      cursorStart: start + openTag.length,
      cursorEnd: start + openTag.length + selected.length,
    };
  }

  const textBefore = value.substring(0, start);
  const textAfter = value.substring(start);
  const endingOpen = matchEndingOpenTag(textBefore, aliases);
  const startingClose = matchStartingCloseTag(textAfter, aliases);

  if (endingOpen && startingClose) {
    const newValue =
      value.substring(0, start - endingOpen.length) +
      value.substring(start + startingClose.length);
    const newPos = start - endingOpen.length;
    return {
      newValue,
      cursorStart: newPos,
      cursorEnd: newPos,
    };
  }

  const inserted = `${openTag}${closeTag}`;
  const newValue = value.substring(0, start) + inserted + value.substring(start);
  return {
    newValue,
    cursorStart: start + openTag.length,
    cursorEnd: start + openTag.length,
  };
}

export function restoreSelection(
  element: HTMLTextAreaElement | HTMLInputElement,
  start: number,
  end: number,
) {
  element.focus();
  try {
    element.setSelectionRange(start, end);
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    requestAnimationFrame(() => {
      element.focus();
      try {
        element.setSelectionRange(start, end);
      } catch {
        // ignore
      }
    });

    setTimeout(() => {
      if (document.activeElement === element) {
        try {
          element.setSelectionRange(start, end);
        } catch {
          // ignore
        }
      }
    }, 0);
  }
}

export interface ShortcutMapping {
  key: string;
  action?: FormatAction;
  openTag?: string;
  closeTag?: string;
  shiftKey?: boolean;
}

export const DEFAULT_SHORTCUTS: ShortcutMapping[] = [
  { key: "b", action: "bold" },
  { key: "i", action: "italic" },
  { key: "u", action: "underline" },
  { key: "x", shiftKey: true, action: "strikethrough" },
  { key: "s", shiftKey: true, action: "strikethrough" },
  { key: "c", shiftKey: true, action: "code" },
  { key: "e", action: "code" },
  { key: "`", action: "code" },
  { key: "h", shiftKey: true, action: "highlight" },
  { key: "k", action: "link" },
  { key: "\\", action: "clear" },
];

/**
 * Detects active formatting actions (e.g. bold, italic, link, etc.) at the given
 * selection inside a plain text / HTML string (used for textarea/input).
 */
export function detectActiveFormatsInText(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): FormatAction[] {
  if (!value) return [];
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(0, Math.min(selectionEnd, value.length));
  const active: FormatAction[] = [];

  // 1. Check link (<a>...</a>)
  const linkRegex = /<a(\s+[^>]*)?>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(value)) !== null) {
    const tagStart = match.index;
    const tagEnd = tagStart + match[0].length;
    const isInsideOrOverlapping =
      (start === end && tagStart <= start && start <= tagEnd) ||
      (start < end && start < tagEnd && end > tagStart);
    if (isInsideOrOverlapping) {
      if (!active.includes("link")) active.push("link");
      break;
    }
  }

  // 2. Check standard tags
  const configs: [FormatAction, string[]][] = [
    ["bold", ["strong", "b"]],
    ["italic", ["em", "i"]],
    ["underline", ["u"]],
    ["strikethrough", ["del", "s", "strike"]],
    ["code", ["code"]],
    ["highlight", ["mark"]],
  ];

  for (const [action, aliases] of configs) {
    const pattern = new RegExp(
      `<(${aliases.join("|")})(\\s[^>]*)?>([\\s\\S]*?)<\\/\\1>`,
      "gi",
    );
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(value)) !== null) {
      const tagStart = m.index;
      const tagEnd = tagStart + m[0].length;
      const isInsideOrOverlapping =
        (start === end && tagStart <= start && start <= tagEnd) ||
        (start < end && start < tagEnd && end > tagStart);
      if (isInsideOrOverlapping) {
        if (!active.includes(action)) active.push(action);
        break;
      }
    }
  }

  return active;
}

/**
 * Detects active formatting actions in a contentEditable HTML element
 * based on current window selection or provided Range.
 */
export function detectActiveFormatsInElement(
  element: HTMLElement,
  range?: Range | null,
): FormatAction[] {
  if (typeof window === "undefined") return [];
  const sel = window.getSelection();
  const currentRange = range || (sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null);
  if (!currentRange) return [];

  const active: FormatAction[] = [];

  const findAncestor = (node: Node | null, tagNames: string[]): HTMLElement | null => {
    let curr: Node | null = node;
    const upperTags = tagNames.map((t) => t.toUpperCase());
    while (curr && curr !== element) {
      if (
        curr.nodeType === Node.ELEMENT_NODE &&
        upperTags.includes((curr as HTMLElement).tagName)
      ) {
        return curr as HTMLElement;
      }
      curr = curr.parentNode;
    }
    return null;
  };

  const checkAction = (action: FormatAction, tagNames: string[]) => {
    if (findAncestor(currentRange.commonAncestorContainer, tagNames)) {
      active.push(action);
      return;
    }
    const startParent = currentRange.startContainer.parentElement;
    const endParent = currentRange.endContainer.parentElement;
    for (const tag of tagNames) {
      if (startParent?.closest(tag) || endParent?.closest(tag)) {
        active.push(action);
        return;
      }
    }
    try {
      const selector = tagNames.map((t) => t.toLowerCase()).join(", ");
      if (currentRange.cloneContents().querySelectorAll(selector).length > 0) {
        active.push(action);
        return;
      }
    } catch {}
    try {
      const selector = tagNames.map((t) => t.toLowerCase()).join(", ");
      const matching = Array.from(element.querySelectorAll(selector));
      for (const node of matching) {
        if (currentRange.intersectsNode ? currentRange.intersectsNode(node) : false) {
          active.push(action);
          return;
        }
      }
    } catch {}
  };

  checkAction("link", ["a"]);
  checkAction("bold", ["strong", "b"]);
  checkAction("italic", ["em", "i"]);
  checkAction("underline", ["u"]);
  checkAction("strikethrough", ["del", "s", "strike"]);
  checkAction("code", ["code"]);
  checkAction("highlight", ["mark"]);

  return active;
}

/**
 * Format a contentEditable DOM element directly using DOM Range and Selection.
 * Provides smart toggle for bold (<strong>), italic (<em>), underline (<u>),
 * strikethrough (<del>), code (<code>), highlight (<mark>), link (<a>), and clear.
 */
export function formatContentEditable(
  element: HTMLElement,
  action: FormatAction,
  options?: { linkUrl?: string },
): boolean {
  if (typeof window === "undefined") return false;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  let range = selection.getRangeAt(0);

  // Check if selection is within element
  if (!element.contains(range.commonAncestorContainer)) {
    if (document.activeElement === element || element.contains(document.activeElement)) {
      const newRange = document.createRange();
      newRange.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(newRange);
      range = newRange;
    } else {
      return false;
    }
  }

  const formatTagNames = [
    "STRONG",
    "B",
    "EM",
    "I",
    "U",
    "DEL",
    "S",
    "STRIKE",
    "CODE",
    "MARK",
    "A",
  ];

  const unwrapNode = (el: HTMLElement) => {
    const parent = el.parentNode;
    if (!parent) return;
    const first = el.firstChild;
    const last = el.lastChild;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);

    if (first && last && selection) {
      try {
        const newRange = document.createRange();
        newRange.setStartBefore(first);
        newRange.setEndAfter(last);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch {}
    }
  };

  const findAncestor = (node: Node | null, tagNames: string[]): HTMLElement | null => {
    let curr: Node | null = node;
    const upperTags = tagNames.map((t) => t.toUpperCase());
    while (curr && curr !== element) {
      if (curr.nodeType === Node.ELEMENT_NODE && upperTags.includes((curr as HTMLElement).tagName)) {
        return curr as HTMLElement;
      }
      curr = curr.parentNode;
    }
    return null;
  };

  // ── 1. Clear formatting ──
  if (action === "clear") {
    let current: Node | null = range.commonAncestorContainer;
    while (current && current !== element) {
      if (current.nodeType === Node.ELEMENT_NODE && formatTagNames.includes((current as HTMLElement).tagName)) {
        unwrapNode(current as HTMLElement);
      }
      current = current.parentNode;
    }

    if (!range.collapsed) {
      const fragment = range.extractContents();
      const els = fragment.querySelectorAll(
        "strong, b, em, i, u, del, s, strike, code, mark, a",
      );
      els.forEach((el) => unwrapNode(el as HTMLElement));
      range.insertNode(fragment);
    }

    element.normalize();
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  // ── 2. Link action ──
  if (action === "link") {
    const existingA =
      findAncestor(range.commonAncestorContainer, ["A"]) ||
      (range.startContainer.parentElement?.closest("a") as HTMLElement | null) ||
      (range.endContainer.parentElement?.closest("a") as HTMLElement | null);

    const allLinks = Array.from(element.querySelectorAll("a"));
    const intersectingLinks = allLinks.filter((a) => {
      try {
        return range.intersectsNode ? range.intersectsNode(a) : false;
      } catch {
        return false;
      }
    });

    const hasLink = Boolean(existingA || intersectingLinks.length > 0);

    // TOGGLE OFF: If link already exists and no new URL provided, unwrap immediately without prompt!
    if (hasLink && !options?.linkUrl) {
      if (existingA) {
        unwrapNode(existingA);
      }
      intersectingLinks.forEach((a) => {
        if (a.parentNode) {
          unwrapNode(a);
        }
      });
      element.normalize();
      element.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    // UPDATE URL on existing link:
    if (existingA && options?.linkUrl) {
      existingA.setAttribute("href", options.linkUrl);
      existingA.setAttribute("target", "_blank");
      existingA.setAttribute("rel", "noopener noreferrer");
      element.normalize();
      element.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    // CREATE NEW LINK:
    let linkUrl = options?.linkUrl;
    if (linkUrl === undefined) {
      const input = window.prompt("Nhập đường dẫn liên kết (URL):", "https://");
      if (input === null) return false;
      linkUrl = input.trim();
      if (!linkUrl) return false;
    }

    if (range.collapsed) {
      const a = document.createElement("a");
      a.href = linkUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = linkUrl;
      range.insertNode(a);
      const newRange = document.createRange();
      newRange.selectNodeContents(a);
      selection.removeAllRanges();
      selection.addRange(newRange);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    const a = document.createElement("a");
    a.href = linkUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    try {
      a.appendChild(range.extractContents());
      range.insertNode(a);
      const newRange = document.createRange();
      newRange.selectNodeContents(a);
      selection.removeAllRanges();
      selection.addRange(newRange);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    } catch {
      return false;
    }
  }

  // ── 3. Standard tag formatting (bold, italic, underline, strikethrough, code, highlight) ──
  const tagConfig = TAG_CONFIGS[action];
  if (!tagConfig) return false;

  const matchingAncestor = findAncestor(range.commonAncestorContainer, tagConfig.aliases);
  if (matchingAncestor) {
    unwrapNode(matchingAncestor);
    element.normalize();
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  if (!range.collapsed) {
    const cloned = range.cloneContents();
    const innerMatching = cloned.querySelectorAll(tagConfig.aliases.join(", "));
    if (innerMatching.length > 0) {
      const extracted = range.extractContents();
      const els = extracted.querySelectorAll(tagConfig.aliases.join(", "));
      els.forEach((el) => unwrapNode(el as HTMLElement));
      range.insertNode(extracted);
      element.normalize();
      element.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
  }

  if (range.collapsed) {
    const newEl = document.createElement(tagConfig.canonical);
    const textNode = document.createTextNode("\u200B");
    newEl.appendChild(textNode);
    range.insertNode(newEl);

    const newRange = document.createRange();
    newRange.setStart(textNode, 1);
    newRange.setEnd(textNode, 1);
    selection.removeAllRanges();
    selection.addRange(newRange);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  try {
    const newEl = document.createElement(tagConfig.canonical);
    newEl.appendChild(range.extractContents());
    range.insertNode(newEl);

    const newRange = document.createRange();
    newRange.selectNodeContents(newEl);
    selection.removeAllRanges();
    selection.addRange(newRange);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  } catch {
    return false;
  }
}

export function useHtmlShortcuts(
  onChange?: (newValue: string) => void,
  shortcuts: ShortcutMapping[] = DEFAULT_SHORTCUTS,
) {
  const [activeActions, setActiveActions] = useState<FormatAction[]>([]);

  const syncActiveFormats = useCallback((element: HTMLElement | null) => {
    if (!element) {
      setActiveActions([]);
      return;
    }
    const isInput =
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element.tagName === "INPUT" ||
      element.tagName === "TEXTAREA";

    if (isInput) {
      const inputEl = element as HTMLInputElement | HTMLTextAreaElement;
      const start = inputEl.selectionStart ?? 0;
      const end = inputEl.selectionEnd ?? 0;
      const detected = detectActiveFormatsInText(inputEl.value, start, end);
      setActiveActions(detected);
    } else {
      const detected = detectActiveFormatsInElement(element);
      setActiveActions(detected);
    }
  }, []);

  const handleSelect = useCallback(
    (e: React.SyntheticEvent<HTMLElement>) => {
      syncActiveFormats(e.currentTarget);
    },
    [syncActiveFormats],
  );

  const applyFormat = useCallback(
    (
      element: HTMLTextAreaElement | HTMLInputElement | HTMLElement | null,
      action: FormatAction,
      customUrl?: string,
    ) => {
      if (!element) return;

      const isInput =
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA";

      if (isInput) {
        const inputEl = element as HTMLInputElement | HTMLTextAreaElement;
        const start = inputEl.selectionStart ?? 0;
        const end = inputEl.selectionEnd ?? 0;

        let linkUrl = customUrl;
        if (action === "link" && linkUrl === undefined) {
          const activeFormats = detectActiveFormatsInText(inputEl.value, start, end);
          if (activeFormats.includes("link")) {
            // TOGGLE OFF: unlink immediately without prompting!
            const result = formatHtmlText(inputEl.value, start, end, "link");
            if (result) {
              onChange?.(result.newValue);
              restoreSelection(inputEl, result.cursorStart, result.cursorEnd);
              syncActiveFormats(inputEl);
            }
            return;
          }

          const input = window.prompt("Nhập đường dẫn liên kết (URL):", "https://");
          if (input === null) return;
          linkUrl = input.trim();
          if (!linkUrl) return;
        }

        const result = formatHtmlText(inputEl.value, start, end, action, { linkUrl });

        if (result) {
          onChange?.(result.newValue);
          restoreSelection(inputEl, result.cursorStart, result.cursorEnd);
          syncActiveFormats(inputEl);
        }
      } else {
        const success = formatContentEditable(element, action, { linkUrl: customUrl });
        if (success) {
          onChange?.(element.innerHTML);
          element.dispatchEvent(new Event("input", { bubbles: true }));
          syncActiveFormats(element);
        }
      }
    },
    [onChange, syncActiveFormats],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!e.ctrlKey && !e.metaKey) return;

      const pressedKey = e.key.toLowerCase();
      const isShift = e.shiftKey;

      const match = shortcuts.find((s) => {
        if (s.key.toLowerCase() !== pressedKey) return false;
        if (s.shiftKey !== undefined && s.shiftKey !== isShift) return false;
        return true;
      });

      if (!match) return;

      e.preventDefault();
      e.stopPropagation?.();
      const element = e.currentTarget;

      if (match.action) {
        applyFormat(element, match.action);
        syncActiveFormats(element);
      } else if (match.openTag && match.closeTag) {
        const isInput =
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element.tagName === "INPUT" ||
          element.tagName === "TEXTAREA";

        if (isInput) {
          const inputEl = element as HTMLInputElement | HTMLTextAreaElement;
          const start = inputEl.selectionStart ?? 0;
          const end = inputEl.selectionEnd ?? 0;
          const selected = inputEl.value.substring(start, end);
          const wrapped = `${match.openTag}${selected}${match.closeTag}`;
          const newValue =
            inputEl.value.substring(0, start) + wrapped + inputEl.value.substring(end);
          onChange?.(newValue);
          restoreSelection(
            inputEl,
            start + match.openTag.length,
            start + match.openTag.length + selected.length,
          );
          syncActiveFormats(inputEl);
        }
      }
    },
    [applyFormat, onChange, shortcuts, syncActiveFormats],
  );

  return {
    handleKeyDown,
    applyFormat,
    activeActions,
    syncActiveFormats,
    handleSelect,
  };
}
