import type { ListItem, ListType, ListStyle } from "../model/document.types";
import { generateListItemId } from "./list-helpers";

export interface ParsedListResult {
  items: ListItem[];
  detectedType: "bullet" | "ordered" | "checklist" | "plain";
  isOrdered: boolean;
  suggestedListType: ListType;
  suggestedListStyle?: ListStyle;
}

interface RawLineInfo {
  content: string;
  indentSpaces: number;
  level: number;
  bulletMarker?: string;
  numberMarker?: number;
  checked?: boolean;
}

/**
 * Strips HTML tags if any are passed in raw strings (defense-in-depth).
 */
export function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Parses multi-line plain text from the clipboard into a structured ListItem[] hierarchy.
 *
 * Detects:
 * - Bullet markers: •, ◦, ▪, ▫, -, *, +, –, —
 * - Ordered list numbers: 1., 2., 1), 2), (1), (2), [1], [2]
 * - Checklist / Task list items: [ ], [x], [X], - [ ], - [x], * [ ]
 * - Nested hierarchy via leading tabs or 2-4 space increments
 *
 * Edge cases handled:
 * - Falls back cleanly to a flat list if indentation is ambiguous.
 * - Strips markers so renderers generate semantic markers.
 * - Sanitizes formatting and preserves Vietnamese Unicode characters.
 */
export function parseClipboardTextToList(rawText: string): ParsedListResult {
  if (!rawText || !rawText.trim()) {
    return {
      items: [],
      detectedType: "plain",
      isOrdered: false,
      suggestedListType: "bullet",
    };
  }

  // 1. Normalize line breaks and sanitize HTML
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = normalized
    .split("\n")
    .map((l) => stripHtmlTags(l))
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return {
      items: [],
      detectedType: "plain",
      isOrdered: false,
      suggestedListType: "bullet",
    };
  }

  // 2. Analyze lines for indentation and markers
  const checklistRegex = /^(?:[•*\-+]?\s*)?\[([ xX])\]\s+(.*)$/;
  const bulletRegex = /^([•◦▪▫*\-–—+])\s+(.*)$/;
  const numberRegex = /^(\d+)[\.\)]\s+(.*)$/;
  const bracketNumberRegex = /^(?:\((\d+)\)|\[(\d+)\])\s+(.*)$/;

  let checklistCount = 0;
  let bulletCount = 0;
  let numberCount = 0;
  const parsedLines: RawLineInfo[] = [];

  for (const line of lines) {
    // Measure leading whitespace
    const matchIndent = line.match(/^([ \t]*)/);
    const leadingWhitespace = matchIndent ? matchIndent[1] : "";
    let indentSpaces = 0;
    for (const char of leadingWhitespace) {
      indentSpaces += char === "\t" ? 4 : 1;
    }

    const trimmed = line.trim();
    let content = trimmed;
    let bulletMarker: string | undefined;
    let numberMarker: number | undefined;
    let checked: boolean | undefined;

    // Check checklist match first
    const cMatch = trimmed.match(checklistRegex);
    if (cMatch) {
      checked = cMatch[1].toLowerCase() === "x";
      content = cMatch[2].trim();
      checklistCount++;
    } else {
      // Check bullet match
      const bMatch = trimmed.match(bulletRegex);
      if (bMatch) {
        bulletMarker = bMatch[1];
        content = bMatch[2].trim();
        bulletCount++;
      } else {
        // Check number match
        const nMatch = trimmed.match(numberRegex);
        if (nMatch) {
          numberMarker = parseInt(nMatch[1], 10);
          content = nMatch[2].trim();
          numberCount++;
        } else {
          const bnMatch = trimmed.match(bracketNumberRegex);
          if (bnMatch) {
            numberMarker = parseInt(bnMatch[1] || bnMatch[2], 10);
            content = bnMatch[3].trim();
            numberCount++;
          }
        }
      }
    }

    parsedLines.push({
      content,
      indentSpaces,
      level: 0,
      bulletMarker,
      numberMarker,
      checked,
    });
  }

  // 3. Determine list type
  const isChecklist = checklistCount > 0 && checklistCount >= numberCount && checklistCount >= bulletCount;
  const isNumbered = !isChecklist && numberCount > 0 && numberCount >= bulletCount;
  const isBullet = !isChecklist && !isNumbered && bulletCount > 0;

  let detectedType: "bullet" | "ordered" | "checklist" | "plain" = "plain";
  let suggestedListType: ListType = "bullet";
  let suggestedListStyle: ListStyle = "disc";

  if (isChecklist) {
    detectedType = "checklist";
    suggestedListType = "checklist";
    suggestedListStyle = "checklist";
  } else if (isNumbered) {
    detectedType = "ordered";
    suggestedListType = "ordered";
    suggestedListStyle = "decimal";
  } else if (isBullet) {
    detectedType = "bullet";
    suggestedListType = "bullet";
    suggestedListStyle = "disc";
  }

  // 4. Calculate indentation levels
  const nonZeroIndents = parsedLines
    .map((p) => p.indentSpaces)
    .filter((s) => s > 0);

  if (nonZeroIndents.length > 0) {
    const minIndent = Math.min(...nonZeroIndents);
    const indentStep = minIndent >= 2 ? minIndent : 2;

    for (const p of parsedLines) {
      p.level = Math.floor(p.indentSpaces / indentStep);
    }
  }

  // 5. Build recursive hierarchy tree
  interface StackItem {
    item: ListItem;
    level: number;
  }

  const rootItems: ListItem[] = [];
  const stack: StackItem[] = [];

  for (const raw of parsedLines) {
    const itemNode: ListItem = {
      id: generateListItemId(),
      content: raw.content,
      children: [],
      checked: raw.checked,
    };

    if (raw.level === 0 || stack.length === 0) {
      rootItems.push(itemNode);
      stack.length = 0;
      stack.push({ item: itemNode, level: raw.level });
    } else {
      while (stack.length > 0 && stack[stack.length - 1].level >= raw.level) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].item.children.push(itemNode);
        stack.push({ item: itemNode, level: raw.level });
      } else {
        rootItems.push(itemNode);
        stack.push({ item: itemNode, level: raw.level });
      }
    }
  }

  return {
    items: rootItems,
    detectedType,
    isOrdered: isNumbered,
    suggestedListType,
    suggestedListStyle,
  };
}
