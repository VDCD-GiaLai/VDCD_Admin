/**
 * Word & Docs HTML Parser for Quick Import
 * Converts rich pasted HTML from Microsoft Word, Google Docs, or web browsers
 * into structured ContentBlock[] with full style preservation:
 * - Headings (h1-h6, colors, text alignment, font sizes)
 * - Paragraphs (inline bold/italic/underline/strikethrough/links, color, backgroundColor, textAlign, indent)
 * - Images (data URLs, web URLs, alt text, auto-detected captions)
 * - Lists (bullet & ordered, nested hierarchy, Word list paragraphs)
 * - Blockquotes (quotes)
 * - Tables (converted to structured readable list blocks)
 */

import type { ContentBlock, ListItem } from "../../model/document.types";
import { replaceFileUrlsWithRtfImages } from "./rtfImageExtractor";

/**
 * Generate a unique ID for a block or item
 */
export function uid(prefix = "blk"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Converts CSS RGB/RGBA string to Hex color (#rrggbb)
 */
export function rgbToHex(rgbStr: string): string | undefined {
  if (!rgbStr || rgbStr === "inherit" || rgbStr === "transparent" || rgbStr === "initial") {
    return undefined;
  }
  if (rgbStr.startsWith("#")) {
    return rgbStr.toLowerCase();
  }
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return undefined;
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  // If color is default black/near-black or transparent, return undefined so it inherits theme
  if (r === 0 && g === 0 && b === 0) return undefined;
  if (r === 15 && g === 23 && b === 42) return undefined; // slate-900

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extract clean alignment: left | center | right | justify
 */
export function extractTextAlign(
  el: HTMLElement,
): "left" | "center" | "right" | "justify" | undefined {
  const align = (
    el.style.textAlign ||
    el.getAttribute("align") ||
    ""
  ).toLowerCase();
  if (align === "center") return "center";
  if (align === "right") return "right";
  if (align === "justify") return "justify";
  if (align === "left") return "left";
  return undefined;
}

/**
 * Extract color from element style or child spans
 */
export function extractColor(el: HTMLElement): string | undefined {
  if (el.style.color) {
    const hex = rgbToHex(el.style.color);
    if (hex) return hex;
  }
  const styledChild = el.querySelector("[style*='color'], font[color]") as HTMLElement | null;
  if (styledChild) {
    if (styledChild.style.color) {
      const hex = rgbToHex(styledChild.style.color);
      if (hex) return hex;
    }
    const fontColor = styledChild.getAttribute("color");
    if (fontColor) return fontColor.startsWith("#") ? fontColor.toLowerCase() : fontColor;
  }
  return undefined;
}

/**
 * Extract background color from element style
 */
export function extractBackgroundColor(el: HTMLElement): string | undefined {
  if (el.style.backgroundColor) {
    return rgbToHex(el.style.backgroundColor);
  }
  const styledChild = el.querySelector("[style*='background-color']") as HTMLElement | null;
  if (styledChild?.style.backgroundColor) {
    return rgbToHex(styledChild.style.backgroundColor);
  }
  return undefined;
}

/**
 * Extract indentation level from element style
 */
export function extractIndent(el: HTMLElement): number | undefined {
  const marginStr = el.style.marginLeft || el.style.paddingLeft || "";
  if (!marginStr) return undefined;
  const num = parseFloat(marginStr);
  if (isNaN(num) || num <= 0) return undefined;

  // Convert px/pt to indentation steps (approx 20-30px per step)
  if (marginStr.includes("pt")) {
    return Math.min(5, Math.max(1, Math.round(num / 18)));
  }
  return Math.min(5, Math.max(1, Math.round(num / 24)));
}

/**
 * Detect heading level from tag, class, or font-size + bold
 */
export function detectHeadingLevel(el: HTMLElement): (1 | 2 | 3 | 4 | 5 | 6) | null {
  const tag = el.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) {
    return parseInt(tag[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
  }

  // Word classes
  const cls = (el.className || "").toLowerCase();
  if (cls.includes("msotitle") || cls.includes("title")) return 1;
  if (cls.includes("msoheading1")) return 1;
  if (cls.includes("msoheading2")) return 2;
  if (cls.includes("msoheading3")) return 3;
  if (cls.includes("msoheading4")) return 4;
  if (cls.includes("msoheading5")) return 5;
  if (cls.includes("msoheading6")) return 6;

  // Check font size & bold in inline style of el OR child span
  let fontSize = el.style.fontSize || "";
  let fontWeight = el.style.fontWeight || "";
  const hasBoldTag = el.querySelector("b, strong") !== null;

  if (!fontSize) {
    const styledChild = el.querySelector("[style*='font-size']") as HTMLElement | null;
    if (styledChild) {
      fontSize = styledChild.style.fontSize || "";
      if (!fontWeight) fontWeight = styledChild.style.fontWeight || "";
    }
  }

  if (!fontWeight) {
    const boldChild = el.querySelector("[style*='font-weight']") as HTMLElement | null;
    if (boldChild) {
      fontWeight = boldChild.style.fontWeight || "";
    }
  }

  const isBold =
    fontWeight === "bold" ||
    parseInt(fontWeight, 10) >= 600 ||
    hasBoldTag;

  const textLen = (el.textContent || "").trim().length;
  // A heading shouldn't be an extremely long paragraph
  if (textLen > 250) {
    return null;
  }

  if (fontSize && isBold) {
    const pt = parseFloat(fontSize);
    if (fontSize.includes("pt")) {
      if (pt >= 20) return 1;
      if (pt >= 15.5) return 2;
      if (pt >= 13.5) return 3;
      if (pt >= 12.5) return 4;
    } else if (fontSize.includes("px")) {
      if (pt >= 26) return 1;
      if (pt >= 20) return 2;
      if (pt >= 17) return 3;
      if (pt >= 15) return 4;
    }
  }

  // Check Roman numeral / numbered heading pattern if bold and short
  // e.g. "I. TỔNG QUAN", "1. ĐẶT VẤN ĐỀ", "PHẦN I: ..."
  if (isBold && textLen > 3 && textLen < 120) {
    const cleanText = (el.textContent || "").trim();
    if (/^[IVXLCDM]+\.\s+/i.test(cleanText) || /^phần\s+[IVXLCDM0-9]+/i.test(cleanText)) {
      return 2;
    }
  }

  return null;
}

/**
 * Clean inline HTML: preserves <strong>, <em>, <u>, <del>, <s>, <a>, <mark>, <br>,
 * and inline styling for colors (<span style="color: #...">, <span style="background-color: #...">).
 * Strips script, style, comments, and empty or non-semantic wrappers.
 */
export function sanitizeInlineHtml(element: HTMLElement): string {
  // Clone element to avoid mutating original
  const clone = element.cloneNode(true) as HTMLElement;

  // 1. Remove dangerous or non-content tags
  clone.querySelectorAll("script, style, meta, link, noscript, xml, defs").forEach((n) => n.remove());

  // 2. Unwrap mso-*, o:p tags
  clone.querySelectorAll("o\\:p, *[class*='Mso']").forEach((n) => {
    if (n.tagName.toLowerCase().includes(":")) {
      n.replaceWith(...Array.from(n.childNodes));
    }
  });

  // 3. Process spans and font tags to preserve colors, bold, italic, underline
  const allSpans = Array.from(clone.querySelectorAll("span, font"));
  allSpans.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const color = extractColor(htmlEl);
    const bgColor = extractBackgroundColor(htmlEl);
    const isBold =
      htmlEl.style.fontWeight === "bold" ||
      parseInt(htmlEl.style.fontWeight || "0", 10) >= 600;
    const isItalic = htmlEl.style.fontStyle === "italic";
    const isUnderline =
      (htmlEl.style.textDecoration || "").includes("underline");
    const isStrike =
      (htmlEl.style.textDecoration || "").includes("line-through");

    // Build preserved style string
    const styles: string[] = [];
    if (color) styles.push(`color: ${color}`);
    if (bgColor) styles.push(`background-color: ${bgColor}`);

    // If element has formatting or colors, wrap or retain
    let inner = htmlEl.innerHTML;
    if (isStrike) inner = `<del>${inner}</del>`;
    if (isUnderline) inner = `<u>${inner}</u>`;
    if (isItalic) inner = `<em>${inner}</em>`;
    if (isBold) inner = `<strong>${inner}</strong>`;

    if (styles.length > 0) {
      const styledSpan = `<span style="${styles.join("; ")}">${inner}</span>`;
      htmlEl.outerHTML = styledSpan;
    } else if (inner !== htmlEl.innerHTML) {
      htmlEl.outerHTML = inner;
    } else {
      // Span has no meaningful styles: unwrap it
      htmlEl.replaceWith(...Array.from(htmlEl.childNodes));
    }
  });

  let html = clone.innerHTML;

  // Clean Microsoft Word comment wrappers
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  // Clean empty span tags
  html = html.replace(/<span\s*>\s*<\/span>/gi, "");

  // Normalize non-breaking spaces
  html = html.replace(/&nbsp;/g, " ");

  return html.trim();
}

/**
 * Checks whether pasted HTML or plain text represents multiple blocks
 */
export function isMultiBlockContent(html?: string | null, text?: string | null): boolean {
  if (html) {
    // Google Docs signature
    if (html.includes("docs-internal-guid")) return true;
    const blockTags = (html.match(/<(p|h[1-6]|ul|ol|table|figure|blockquote|img|tr)\b/gi) || []).length;
    if (blockTags > 1) return true;
    if (html.includes("<img") && html.replace(/<[^>]+>/g, "").trim().length > 0) return true;
    // Word document signature
    if (html.includes('class="Mso') || html.includes("class='Mso") || html.includes("urn:schemas-microsoft-com:office")) {
      return true;
    }
  }
  if (text) {
    const paragraphs = text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length > 1) return true;
  }
  return false;
}

/**
 * Standard leaf block tags that represent individual document blocks
 */
export const LEAF_BLOCK_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "table",
  "blockquote",
  "figure",
  "hr",
  "pre",
]);

/**
 * Checks if an element acts as a container for other blocks (rather than a leaf block).
 */
export function isBlockContainer(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  // Leaf block tags are never containers
  if (LEAF_BLOCK_TAGS.has(tag)) {
    return false;
  }

  // Google Docs internal root wrapper: <b id="docs-internal-guid-..." ...>
  if (el.id && el.id.startsWith("docs-internal-guid")) {
    return true;
  }

  // Microsoft Word document container: <div class="WordSection1"> or "Section1"
  const cls = (el.className || "").toLowerCase();
  if (cls.includes("wordsection") || cls.includes("section1")) {
    return true;
  }

  // Generic containers: div, section, article, main, header, footer, aside, center, body, form
  const isGenericContainer = /^(div|section|article|main|header|footer|aside|center|body|form)$/i.test(tag);

  // Check if it has any block-level descendant
  const hasBlockDescendant =
    el.querySelector("p, h1, h2, h3, h4, h5, h6, ul, ol, table, blockquote, figure, hr, pre, div, section, article") !== null;

  return hasBlockDescendant || (isGenericContainer && el.children.length > 0);
}

/**
 * Splits a paragraph or leaf div on double <br> tags into multiple separate paragraphs
 */
export function splitOnDoubleBr(el: HTMLElement, doc: Document): HTMLElement[] {
  const tag = el.tagName.toLowerCase();
  if (tag !== "p" && tag !== "div") {
    return [el];
  }

  const html = el.innerHTML;
  const brRegex = /(?:<br\s*\/?>\s*(?:&nbsp;)?\s*){2,}/gi;
  if (!brRegex.test(html)) {
    return [el];
  }

  const parts = html.split(brRegex);
  const result: HTMLElement[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const newP = doc.createElement("p");
    newP.innerHTML = trimmed;
    if (el.getAttribute("style")) {
      newP.setAttribute("style", el.getAttribute("style") || "");
    }
    if (el.className) {
      newP.className = el.className;
    }

    if ((newP.textContent || "").trim() || newP.querySelector("img")) {
      result.push(newP);
    }
  }

  return result.length > 0 ? result : [el];
}

/**
 * Extracts and flattens top-level block elements from a DOM tree,
 * unpacking Google Docs wrapper (<b id="docs-internal-guid-...">),
 * Microsoft Word containers (WordSection1), nested <div> sections,
 * and wrapping orphan text/spans into <p> tags.
 */
export function extractBlockElements(root: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  const doc = root.ownerDocument || document;

  function collectFrom(container: HTMLElement) {
    let pendingInlines: Node[] = [];

    const flushPendingInlines = () => {
      if (pendingInlines.length === 0) return;

      const hasContent = pendingInlines.some((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return (node.textContent || "").trim().length > 0;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName.toLowerCase() === "img") return true;
          if (el.querySelector("img")) return true;
          return (el.textContent || "").trim().length > 0;
        }
        return false;
      });

      if (hasContent) {
        const p = doc.createElement("p");
        pendingInlines.forEach((n) => p.appendChild(n.cloneNode(true)));
        const splitPs = splitOnDoubleBr(p, doc);
        result.push(...splitPs);
      }
      pendingInlines = [];
    };

    const childNodes = Array.from(container.childNodes);

    for (const node of childNodes) {
      if (node.nodeType === Node.COMMENT_NODE) {
        continue;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        pendingInlines.push(node);
        continue;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        // Skip non-rendering tags
        if (/^(script|style|meta|link|noscript|xml|defs)$/.test(tag)) {
          continue;
        }

        // If it's a container (Google Docs wrapper, Word section, div containing blocks, etc.)
        if (isBlockContainer(el)) {
          flushPendingInlines();
          collectFrom(el);
          continue;
        }

        // If it's a leaf block or div/section without block children
        if (LEAF_BLOCK_TAGS.has(tag) || /^(div|section|article|header|footer|aside)$/.test(tag)) {
          flushPendingInlines();
          const splitBlocks = splitOnDoubleBr(el, doc);
          result.push(...splitBlocks);
          continue;
        }

        // If it's a standalone img tag
        if (tag === "img") {
          flushPendingInlines();
          result.push(el);
          continue;
        }

        // Otherwise inline node (span, b, i, strong, em, a, font, br, etc.)
        pendingInlines.push(node);
      }
    }

    flushPendingInlines();
  }

  collectFrom(root);
  return result;
}

/**
 * Main Word & Rich HTML Parser
 * Converts raw HTML string from clipboard into ContentBlock[]
 * Supports optional RTF string to recover embedded images from Microsoft Word desktop.
 */
export function parseHtmlToBlocks(html: string, rtf?: string): ContentBlock[] {
  if (!html || typeof html !== "string" || !html.trim()) {
    return [];
  }

  // If RTF clipboard stream is present, replace file:/// image URLs with base64 data URLs
  const preparedHtml = rtf ? replaceFileUrlsWithRtfImages(html, rtf) : html;

  // Create DOMParser to parse HTML safely in browser environment
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return parseHtmlWithRegexFallback(preparedHtml);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(preparedHtml, "text/html");
  const body = doc.body;

  // Remove non-rendering tags
  body.querySelectorAll("script, style, meta, link, noscript, xml, defs").forEach((n) => n.remove());

  const blocks: ContentBlock[] = [];

  // Helper to extract images from a node
  function extractImagesFromNode(node: HTMLElement, nextEl?: HTMLElement | null): ContentBlock[] {
    const imgBlocks: ContentBlock[] = [];
    const imgs = node.querySelectorAll("img");
    imgs.forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (src) {
        const alt = img.getAttribute("alt") || img.getAttribute("title") || "";
        // Look for caption in parent figure or next element
        let caption: string | null = null;
        const figcaption = node.querySelector("figcaption");
        if (figcaption) {
          caption = figcaption.textContent?.trim() || null;
        } else if (nextEl) {
          const nextCls = (nextEl.className || "").toLowerCase();
          const nextText = nextEl.textContent?.trim() || "";
          if (
            nextCls.includes("caption") ||
            nextCls.includes("msocaption") ||
            /^(hình|ảnh|figure|photo|chú thích|h\.)\s*[:\d]/i.test(nextText)
          ) {
            caption = nextText;
          }
        }

        imgBlocks.push({
          id: uid("img"),
          type: "image",
          url: src,
          alt: alt || "Hình ảnh bài viết",
          caption,
          layout: "single",
          spacing: { marginTop: 16, marginBottom: 16 },
        });
      }
    });
    return imgBlocks;
  }

  // Extract flat list of block elements, unwrapping Google Docs and Word wrappers
  const children = extractBlockElements(body);

  // If body has no direct child elements but has innerHTML, wrap it
  if (children.length === 0 && body.innerHTML.trim()) {
    const tempP = doc.createElement("p");
    tempP.innerHTML = body.innerHTML;
    children.push(tempP);
  }

  let i = 0;
  while (i < children.length) {
    const el = children[i];
    const tagName = el.tagName.toLowerCase();

    // 1. Image or Figure
    const nextSibling = children[i + 1] as HTMLElement | undefined;
    if (tagName === "figure" || tagName === "img") {
      const imgs = extractImagesFromNode(el, nextSibling);
      if (imgs.length > 0) {
        blocks.push(...imgs);
        // If nextSibling was consumed as caption, advance past it
        if (imgs.some((img) => img.type === "image" && img.caption && nextSibling?.textContent?.includes(img.caption))) {
          i++;
        }
      }
      i++;
      continue;
    }

    // 2. Standalone paragraph containing ONLY an image
    const singleImg = el.querySelector("img");
    const textContent = el.textContent?.trim() || "";
    if (singleImg && textContent.length === 0) {
      const imgs = extractImagesFromNode(el, nextSibling);
      if (imgs.length > 0) {
        blocks.push(...imgs);
        if (imgs.some((img) => img.type === "image" && img.caption && nextSibling?.textContent?.includes(img.caption))) {
          i++;
        }
      }
      i++;
      continue;
    }

    // 3. Tables: convert to structured list items
    if (tagName === "table") {
      const rows = Array.from(el.querySelectorAll("tr"));
      const headers: string[] = [];
      const ths = rows[0]?.querySelectorAll("th, td");
      if (ths && ths.length > 0) {
        ths.forEach((th) => headers.push(th.textContent?.trim() || ""));
      }

      const listItems: ListItem[] = [];
      rows.forEach((row, rIdx) => {
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells.length === 0) return;
        if (rIdx === 0 && row.querySelector("th")) return;

        const cellTexts = cells.map((c, cIdx) => {
          const headerName = headers[cIdx] && headers[cIdx] !== c.textContent?.trim() ? `<strong>${headers[cIdx]}:</strong> ` : "";
          const val = sanitizeInlineHtml(c as HTMLElement);
          return `${headerName}${val}`;
        });

        const fullRowText = cellTexts.join(" &nbsp;|&nbsp; ");
        listItems.push({
          id: uid("li"),
          content: fullRowText,
          text: fullRowText.replace(/<[^>]+>/g, ""),
          children: [],
        });
      });

      if (listItems.length > 0) {
        blocks.push({
          id: uid("list"),
          type: "list",
          listType: "bullet",
          items: listItems,
          spacing: { marginTop: 8, marginBottom: 8 },
        });
      }
      i++;
      continue;
    }

    // 4. Lists (<ul>, <ol>)
    if (tagName === "ul" || tagName === "ol") {
      const isOrdered = tagName === "ol";
      const liElements = Array.from(el.querySelectorAll(":scope > li"));
      const items: ListItem[] = liElements.map((li) => {
        const childList = li.querySelector("ul, ol");
        const itemContent = sanitizeInlineHtml(li as HTMLElement);
        const childrenItems: ListItem[] = childList
          ? Array.from(childList.querySelectorAll(":scope > li")).map((subLi) => {
              const subContent = sanitizeInlineHtml(subLi as HTMLElement);
              return {
                id: uid("li"),
                content: subContent,
                text: subContent.replace(/<[^>]+>/g, ""),
                children: [],
              };
            })
          : [];

        return {
          id: uid("li"),
          content: itemContent,
          text: itemContent.replace(/<[^>]+>/g, ""),
          children: childrenItems,
        };
      });

      if (items.length > 0) {
        blocks.push({
          id: uid("list"),
          type: "list",
          listType: isOrdered ? "ordered" : "bullet",
          items,
          spacing: { marginTop: 6, marginBottom: 10 },
        });
      }
      i++;
      continue;
    }

    // 5. Heading (detect before list paragraphs so numbered headings like '1. MỤC TIÊU' become headings, not lists)
    const headingLevel = detectHeadingLevel(el);
    if (headingLevel) {
      let headingText = sanitizeInlineHtml(el);
      // Strip redundant outer wrappers since headings are inherently bold and inherit block styles (color, textAlign, bg)
      headingText = headingText.replace(/^<strong>([\s\S]*)<\/strong>$/i, "$1");
      headingText = headingText.replace(/^<b>([\s\S]*)<\/b>$/i, "$1");
      headingText = headingText.replace(/^<span[^>]*>([\s\S]*)<\/span>$/i, "$1");
      headingText = headingText.replace(/^<strong>([\s\S]*)<\/strong>$/i, "$1");
      headingText = headingText.replace(/^<b>([\s\S]*)<\/b>$/i, "$1");

      if (headingText) {
        const color = extractColor(el);
        const textAlign = extractTextAlign(el);
        const backgroundColor = extractBackgroundColor(el);

        blocks.push({
          id: uid("hd"),
          type: "heading",
          level: headingLevel,
          text: headingText,
          color,
          textAlign,
          backgroundColor,
          spacing: { marginTop: headingLevel <= 2 ? 18 : 14, marginBottom: 8 },
        });
      }
      i++;
      continue;
    }

    // 6. Blockquote / Quote
    if (tagName === "blockquote") {
      const quoteText = sanitizeInlineHtml(el);
      if (quoteText) {
        blocks.push({
          id: uid("quote"),
          type: "quote",
          text: quoteText,
          author: null,
          spacing: { marginTop: 12, marginBottom: 12 },
        });
      }
      i++;
      continue;
    }

    // 7. Word List Paragraphs (<p class="MsoListParagraph"> or bullet-prefixed paragraphs)
    const isMsoList =
      (el.className || "").toLowerCase().includes("msolistparagraph") ||
      /^[•·\-\*]\s+/.test(textContent) ||
      /^\d+[\.\)]\s+/.test(textContent);

    if (isMsoList) {
      // Collect consecutive list paragraphs
      const listItems: ListItem[] = [];
      const isOrdered = /^\d+[\.\)]\s+/.test(textContent);

      while (i < children.length) {
        const current = children[i];
        const currentText = current.textContent?.trim() || "";
        const isCurrentList =
          (current.className || "").toLowerCase().includes("msolistparagraph") ||
          /^[•·\-\*]\s+/.test(currentText) ||
          /^\d+[\.\)]\s+/.test(currentText);

        if (!isCurrentList) break;

        // Strip bullet / number marker from item text
        let cleanText = sanitizeInlineHtml(current);
        cleanText = cleanText.replace(/^[•·\-\*]\s*/, "");
        cleanText = cleanText.replace(/^\d+[\.\)]\s*/, "");

        if (cleanText.trim()) {
          listItems.push({
            id: uid("li"),
            content: cleanText,
            text: cleanText.replace(/<[^>]+>/g, ""),
            children: [],
          });
        }
        i++;
      }

      if (listItems.length > 0) {
        blocks.push({
          id: uid("list"),
          type: "list",
          listType: isOrdered ? "ordered" : "bullet",
          items: listItems,
          spacing: { marginTop: 6, marginBottom: 10 },
        });
      }
      continue;
    }

    // 8. If paragraph contains inline images + text, split them
    if (singleImg && textContent.length > 0) {
      const imgs = extractImagesFromNode(el);
      // Remove images from el to get text
      const elCopy = el.cloneNode(true) as HTMLElement;
      elCopy.querySelectorAll("img, figure").forEach((img) => img.remove());
      const remainingText = sanitizeInlineHtml(elCopy);

      if (remainingText) {
        const color = extractColor(el);
        const textAlign = extractTextAlign(el);
        const backgroundColor = extractBackgroundColor(el);
        const indent = extractIndent(el);

        blocks.push({
          id: uid("par"),
          type: "paragraph",
          text: remainingText,
          color,
          backgroundColor,
          textAlign,
          indent,
          spacing: { marginTop: 0, marginBottom: 8 },
        });
      }

      blocks.push(...imgs);
      i++;
      continue;
    }

    // 9. Regular Paragraph
    const pText = sanitizeInlineHtml(el);
    if (pText && pText !== "&nbsp;" && pText.trim() !== "") {
      const color = extractColor(el);
      const textAlign = extractTextAlign(el);
      const backgroundColor = extractBackgroundColor(el);
      const indent = extractIndent(el);

      blocks.push({
        id: uid("par"),
        type: "paragraph",
        text: pText,
        color,
        backgroundColor,
        textAlign,
        indent,
        spacing: { marginTop: 0, marginBottom: 8 },
      });
    }

    i++;
  }

  return blocks;
}

/**
 * Plain text fallback parser for non-HTML clipboard content
 */
export function parsePlainTextToBlocks(text: string): ContentBlock[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());
  const blocks: ContentBlock[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const paragraphText = currentParagraphLines.join("<br>");
      if (paragraphText.trim()) {
        blocks.push({
          id: uid("par"),
          type: "paragraph",
          text: paragraphText,
          spacing: { marginTop: 0, marginBottom: 8 },
        });
      }
      currentParagraphLines = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      flushParagraph();
      i++;
      continue;
    }

    // Check if line is metadata label: SEO Title, Meta Description, etc.
    const isMetadataLine = /^(seo\s*title|seo\s*desc|meta\s*desc|tiêu\s*đề\s*seo|mô\s*tả\s*seo)\s*:/i.test(line);
    if (isMetadataLine) {
      flushParagraph();
      blocks.push({
        id: uid("par"),
        type: "paragraph",
        text: line,
        spacing: { marginTop: 0, marginBottom: 8 },
      });
      i++;
      continue;
    }

    // Check if line is a heading: e.g. "I. Tiêu đề" or short uppercase line
    const isHeading1 =
      /^[\p{Lu}\p{Nd}\s\.\-]{3,80}$/u.test(line) &&
      line === line.toUpperCase() &&
      !/^[•·\-\*]/.test(line);
    const isNumberedHeading = /^[IVXLCDM]+\.\s+([^\.]+)/i.test(line) && line.length < 90;

    if (isHeading1 || isNumberedHeading) {
      flushParagraph();
      blocks.push({
        id: uid("hd"),
        type: "heading",
        level: isHeading1 ? 1 : 2,
        text: line,
        spacing: { marginTop: 16, marginBottom: 8 },
      });
      i++;
      continue;
    }

    // Check bullet list item
    const isBullet = /^[•·\-\*]\s+(.+)/.test(line);
    const isNumberedList = /^\d+[\.\)]\s+(.+)/.test(line);

    if (isBullet || isNumberedList) {
      flushParagraph();
      const listItems: ListItem[] = [];
      const isOrdered = isNumberedList;

      while (i < lines.length) {
        const itemLine = lines[i].trim();
        const bulletMatch = itemLine.match(/^[•·\-\*]\s+(.+)/);
        const numMatch = itemLine.match(/^\d+[\.\)]\s+(.+)/);

        if (isOrdered && numMatch) {
          listItems.push({
            id: uid("li"),
            content: numMatch[1],
            text: numMatch[1],
            children: [],
          });
          i++;
        } else if (!isOrdered && bulletMatch) {
          listItems.push({
            id: uid("li"),
            content: bulletMatch[1],
            text: bulletMatch[1],
            children: [],
          });
          i++;
        } else {
          break;
        }
      }

      if (listItems.length > 0) {
        blocks.push({
          id: uid("list"),
          type: "list",
          listType: isOrdered ? "ordered" : "bullet",
          items: listItems,
          spacing: { marginTop: 6, marginBottom: 10 },
        });
      }
      continue;
    }

    currentParagraphLines.push(line);
    i++;
  }

  flushParagraph();
  return blocks;
}

/**
 * Fallback regex-based parser when DOMParser is unavailable (e.g. Node.js environment)
 */
function parseHtmlWithRegexFallback(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const pRegex = /<(p|h[1-6]|figure|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = pRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2].trim();

    if (tag.startsWith("h")) {
      const level = parseInt(tag[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({
        id: uid("hd"),
        type: "heading",
        level,
        text: inner.replace(/<[^>]+>/g, ""),
      });
    } else {
      // Check for img in paragraph
      const imgMatch = inner.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
      if (imgMatch) {
        blocks.push({
          id: uid("img"),
          type: "image",
          url: imgMatch[1],
        });
      }
      const text = inner.replace(/<img[^>]*>/gi, "").trim();
      if (text) {
        blocks.push({
          id: uid("par"),
          type: "paragraph",
          text,
        });
      }
    }
  }

  return blocks;
}
