/**
 * Word & Rich HTML Parser
 * Converts pasted HTML from Microsoft Word, Google Docs, or web browsers
 * into structured ContentBlock[] with full support for:
 * - Headings (levels 1-6, colors, text alignment)
 * - Paragraphs (inline bold/italic/underline/links, color, backgroundColor, textAlign)
 * - Images (data URLs, web URLs, alt text, captions)
 * - Lists (bullet & ordered, nested hierarchy)
 * - Blockquotes (quotes)
 */

import type { ContentBlock } from "../model/document.types";

/**
 * Generate a unique ID for a block or item
 */
function uid(prefix = "blk"): string {
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
 * Detect heading level from tag, class, or font-size
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

  // Check font size & bold in inline style
  const fontSize = el.style.fontSize || "";
  const fontWeight = el.style.fontWeight || "";
  const isBold = fontWeight === "bold" || parseInt(fontWeight, 10) >= 600 || el.querySelector("b, strong") !== null;

  if (fontSize && isBold) {
    const pt = parseFloat(fontSize);
    if (fontSize.includes("pt")) {
      if (pt >= 20) return 1;
      if (pt >= 16) return 2;
      if (pt >= 14) return 3;
      if (pt >= 12.5) return 4;
    } else if (fontSize.includes("px")) {
      if (pt >= 26) return 1;
      if (pt >= 22) return 2;
      if (pt >= 18) return 3;
      if (pt >= 16) return 4;
    }
  }

  return null;
}

import { replaceFileUrlsWithRtfImages } from "./rtfImageExtractor";

/**
 * Clean inline HTML: preserves <strong>, <em>, <u>, <del>, <s>, <a>, <mark>, <br>,
 * and inline styling for colors (<span style="color: #...">, <span style="background-color: #...">)
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
    const blockTags = (html.match(/<(p|h[1-6]|ul|ol|table|figure|blockquote|img|tr)\b/gi) || []).length;
    if (blockTags > 1) return true;
    if (html.includes("<img") && html.replace(/<[^>]+>/g, "").trim().length > 0) return true;
    // Word document signature
    if (html.includes("class=\"Mso") || html.includes("class='Mso") || html.includes("urn:schemas-microsoft-com:office")) {
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
 * Main Word & Rich HTML Parser
 * Converts raw HTML string from clipboard into ContentBlock[]
 * Supports optional RTF string to recover embedded images from Microsoft Word desktop.
 */
export function parseWordHtmlToBlocks(html: string, rtf?: string): ContentBlock[] {
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
            /^(hình|ảnh|figure|photo)\s+\d+/i.test(nextText)
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
          spacing: { marginTop: 12, marginBottom: 12 },
        });
      }
    });
    return imgBlocks;
  }

  // Process child elements
  const children = Array.from(body.children) as HTMLElement[];

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

    // 2.5 Tables from Word: convert to structured list or blockquote
    if (tagName === "table") {
      const rows = Array.from(el.querySelectorAll("tr"));
      const headers: string[] = [];
      const ths = rows[0]?.querySelectorAll("th, td");
      if (ths && ths.length > 0) {
        ths.forEach((th) => headers.push(th.textContent?.trim() || ""));
      }

      const listItems: { id: string; content: string; children: never[] }[] = [];
      rows.forEach((row, rIdx) => {
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells.length === 0) return;
        if (rIdx === 0 && row.querySelector("th")) return;

        const cellTexts = cells.map((c, cIdx) => {
          const headerName = headers[cIdx] && headers[cIdx] !== c.textContent?.trim() ? `<strong>${headers[cIdx]}:</strong> ` : "";
          const val = sanitizeInlineHtml(c as HTMLElement);
          return `${headerName}${val}`;
        });

        listItems.push({
          id: uid("li"),
          content: cellTexts.join(" &nbsp;|&nbsp; "),
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

    // 3. Lists (<ul>, <ol>)
    if (tagName === "ul" || tagName === "ol") {
      const isOrdered = tagName === "ol";
      const liElements = Array.from(el.querySelectorAll(":scope > li"));
      const items = liElements.map((li) => {
        const childList = li.querySelector("ul, ol");
        const itemContent = sanitizeInlineHtml(li as HTMLElement);
        const childrenItems = childList
          ? Array.from(childList.querySelectorAll(":scope > li")).map((subLi) => ({
              id: uid("li"),
              content: sanitizeInlineHtml(subLi as HTMLElement),
              children: [],
            }))
          : [];

        return {
          id: uid("li"),
          content: itemContent,
          children: childrenItems,
        };
      });

      if (items.length > 0) {
        blocks.push({
          id: uid("list"),
          type: "list",
          listType: isOrdered ? "ordered" : "bullet",
          items,
          spacing: { marginTop: 4, marginBottom: 8 },
        });
      }
      i++;
      continue;
    }

    // 4. Word List Paragraphs (<p class="MsoListParagraph"> or bullet-prefixed paragraphs)
    const isMsoList =
      (el.className || "").toLowerCase().includes("msolistparagraph") ||
      /^[•·\-\*]\s+/.test(textContent) ||
      /^\d+[\.\)]\s+/.test(textContent);

    if (isMsoList) {
      // Collect consecutive list paragraphs
      const listItems = [];
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
          spacing: { marginTop: 4, marginBottom: 8 },
        });
      }
      continue;
    }

    // 5. Blockquote / Quote
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

    // 6. Heading
    const headingLevel = detectHeadingLevel(el);
    if (headingLevel) {
      const headingText = sanitizeInlineHtml(el);
      if (headingText) {
        const color = extractColor(el);
        const textAlign = extractTextAlign(el);

        blocks.push({
          id: uid("hd"),
          type: "heading",
          level: headingLevel,
          text: headingText,
          color,
          textAlign,
          spacing: { marginTop: headingLevel <= 2 ? 16 : 12, marginBottom: 8 },
        });
      }
      i++;
      continue;
    }

    // 7. If paragraph contains inline images + text, split them
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

        blocks.push({
          id: uid("par"),
          type: "paragraph",
          text: remainingText,
          color,
          backgroundColor,
          textAlign,
          spacing: { marginTop: 0, marginBottom: 8 },
        });
      }

      blocks.push(...imgs);
      i++;
      continue;
    }

    // 8. Regular Paragraph
    const pText = sanitizeInlineHtml(el);
    if (pText && pText !== "&nbsp;" && pText.trim() !== "") {
      const color = extractColor(el);
      const textAlign = extractTextAlign(el);
      const backgroundColor = extractBackgroundColor(el);

      blocks.push({
        id: uid("par"),
        type: "paragraph",
        text: pText,
        color,
        backgroundColor,
        textAlign,
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
      const text = currentParagraphLines.join("<br>");
      if (text.trim()) {
        blocks.push({
          id: uid("par"),
          type: "paragraph",
          text,
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

    // Check if line is a heading: e.g. "1. Tiêu đề" or "I. Tiêu đề" or short uppercase line
    const isHeading1 = /^[A-Z0-9\s\.\-]{3,60}$/.test(line) && line === line.toUpperCase();
    const isNumberedHeading = /^(?:[1-9]\.|[IVXLCDM]+\.)\s+([^\.]+)/i.test(line) && line.length < 90;

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
      const listItems = [];
      const isOrdered = isNumberedList;

      while (i < lines.length) {
        const itemLine = lines[i].trim();
        const bulletMatch = itemLine.match(/^[•·\-\*]\s+(.+)/);
        const numMatch = itemLine.match(/^\d+[\.\)]\s+(.+)/);

        if (isOrdered && numMatch) {
          listItems.push({ id: uid("li"), content: numMatch[1], children: [] });
          i++;
        } else if (!isOrdered && bulletMatch) {
          listItems.push({ id: uid("li"), content: bulletMatch[1], children: [] });
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
          spacing: { marginTop: 4, marginBottom: 8 },
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
