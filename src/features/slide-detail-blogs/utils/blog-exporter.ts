import type {
  SlideDetailBlogContent,
  SlideDetailBlogBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ListBlock,
  ListItem,
  SectionBlock,
  CtaBlock,
} from "@/types/slide-detail-blog";
import {
  normalizeListItems,
  resolveListContainerStyle,
  resolveListLevelStyle,
} from "./list-helpers";

export interface BlogExportMeta {
  title?: string;
  subtitle?: string;
  excerpt?: string;
  heroImageUrl?: string | null;
}

/**
 * Converts a React style object into inline CSS string.
 */
function styleObjectToCSS(styleObj: Record<string, string | number | undefined>): string {
  return Object.entries(styleObj)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([key, value]) => {
      const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      return `${kebabKey}: ${value};`;
    })
    .join(" ");
}

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Recursively exports a ListItem tree to semantic HTML with exact level styles.
 */
function exportListItemToHTML(
  item: ListItem,
  block: ListBlock,
  depth: number,
): string {
  const resolved = resolveListLevelStyle(block, depth);
  const listType = block.listType ?? "bullet";

  const itemStyleObj: Record<string, string | number | undefined> = {};
  if (resolved.fontSize) itemStyleObj.fontSize = `${resolved.fontSize}px`;
  if (resolved.fontWeight) itemStyleObj.fontWeight = resolved.fontWeight;
  if (resolved.color) itemStyleObj.color = resolved.color;
  if (typeof resolved.itemSpacing === "number") itemStyleObj.marginBottom = `${resolved.itemSpacing}px`;
  if (resolved.fontFamily) itemStyleObj.fontFamily = resolved.fontFamily;
  if (resolved.marker && listType !== "checklist") {
    itemStyleObj.listStyleType = resolved.marker;
  }

  const styleAttr = styleObjectToCSS(itemStyleObj);
  const styleString = styleAttr ? ` style="${styleAttr}"` : "";

  // Recursive children HTML
  let childrenHTML = "";
  if (item.children && item.children.length > 0) {
    const isOrdered = listType === "ordered";
    const subTag = isOrdered ? "ol" : "ul";
    const subListStyle = resolved.indentation
      ? ` style="padding-left: ${resolved.indentation}px; margin-top: ${resolved.itemSpacing ?? 4}px;"`
      : "";

    const innerItems = item.children
      .map((child) => exportListItemToHTML(child, block, depth + 1))
      .join("\n");

    childrenHTML = `\n<${subTag}${subListStyle}>\n${innerItems}\n</${subTag}>`;
  }

  // Checklist mode
  if (listType === "checklist") {
    const checkedAttr = item.checked ? " checked" : "";
    return `<li class="blog-checklist-item"${styleString} style="list-style: none; display: flex; align-items: flex-start; gap: 8px;">
  <input type="checkbox"${checkedAttr} disabled style="margin-top: 4px;" />
  <div style="flex: 1;">
    <span>${escapeHTML(item.content)}</span>${childrenHTML}
  </div>
</li>`;
  }

  return `<li${styleString}>
  <span>${escapeHTML(item.content)}</span>${childrenHTML}
</li>`;
}

/**
 * Exports a ListBlock into semantic HTML with container and level styles.
 */
export function exportListBlockToHTML(block: ListBlock): string {
  const listType = block.listType ?? "bullet";
  const isOrdered = listType === "ordered";
  const tag = isOrdered ? "ol" : "ul";

  const containerStyle = resolveListContainerStyle(block);
  const containerStyleStr = styleObjectToCSS(containerStyle as Record<string, string | number | undefined>);
  const styleAttr = containerStyleStr ? ` style="${containerStyleStr}"` : "";

  const items = normalizeListItems(block.items);
  const itemsHTML = items
    .map((item) => exportListItemToHTML(item, block, 0))
    .join("\n");

  return `<${tag} class="blog-list blog-list-${listType}"${styleAttr}>
${itemsHTML}
</${tag}>`;
}

/**
 * Exports an individual block to HTML.
 */
function exportBlockToHTML(block: SlideDetailBlogBlock): string {
  const spacingStyle: Record<string, string | number | undefined> = {};
  if (typeof block.spacing?.marginTop === "number") {
    spacingStyle.marginTop = `${block.spacing.marginTop}px`;
  }
  if (typeof block.spacing?.marginBottom === "number") {
    spacingStyle.marginBottom = `${block.spacing.marginBottom}px`;
  }
  const spacingAttr = styleObjectToCSS(spacingStyle);
  const spacingString = spacingAttr ? ` style="${spacingAttr}"` : "";

  switch (block.type) {
    case "heading": {
      const heading = block as HeadingBlock;
      const level = heading.level || 2;
      const hStyle: Record<string, string | number | undefined> = { ...spacingStyle };
      if (heading.fontSize) hStyle.fontSize = `${heading.fontSize}px`;
      const hStyleAttr = styleObjectToCSS(hStyle);
      const hStyleString = hStyleAttr ? ` style="${hStyleAttr}"` : "";
      return `<h${level}${hStyleString}>${escapeHTML(heading.text)}</h${level}>`;
    }
    case "paragraph": {
      const p = block as ParagraphBlock;
      const pStyle: Record<string, string | number | undefined> = { ...spacingStyle };
      if (p.fontSize) pStyle.fontSize = `${p.fontSize}px`;
      const pStyleAttr = styleObjectToCSS(pStyle);
      const pStyleString = pStyleAttr ? ` style="${pStyleAttr}"` : "";
      return `<p${pStyleString}>${escapeHTML(p.text)}</p>`;
    }
    case "image": {
      const img = block as ImageBlock;
      const captionHTML = img.caption
        ? `<figcaption style="text-align: center; font-size: 13px; color: #6C7E96; margin-top: 6px;">${escapeHTML(img.caption)}</figcaption>`
        : "";
      return `<figure${spacingString} style="margin: 0; text-align: center;">
  <img src="${escapeHTML(img.url)}" alt="${escapeHTML(img.alt || "")}" style="max-width: 100%; height: auto; border-radius: 8px;" />
  ${captionHTML}
</figure>`;
    }
    case "list": {
      const list = block as ListBlock;
      return `<div${spacingString}>\n${exportListBlockToHTML(list)}\n</div>`;
    }
    case "section": {
      const sec = block as SectionBlock;
      const childrenHTML = (sec.children || [])
        .map((child) => exportBlockToHTML(child as SlideDetailBlogBlock))
        .join("\n\n");

      return `<section class="blog-section"${spacingString}>
  <div class="blog-section-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <span style="font-size: 14px; font-weight: bold; color: #ca2a30;">${escapeHTML(sec.number)}</span>
    <h3 style="font-size: 20px; font-weight: bold; margin: 0;">${escapeHTML(sec.title)}</h3>
  </div>
  <div class="blog-section-body" style="padding-left: 16px;">
${childrenHTML}
  </div>
</section>`;
    }
    case "cta": {
      const cta = block as CtaBlock;
      const ctaStyle: Record<string, string | number | undefined> = {
        display: "inline-block",
        padding: "10px 24px",
        backgroundColor: "#ca2a30",
        color: "#ffffff",
        textDecoration: "none",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: cta.fontSize ? `${cta.fontSize}px` : "14px",
        ...spacingStyle,
      };
      const ctaStyleAttr = styleObjectToCSS(ctaStyle);
      return `<div style="text-align: center;">
  <a href="${escapeHTML(cta.url)}" class="blog-cta-button" style="${ctaStyleAttr}">${escapeHTML(cta.label)}</a>
</div>`;
    }
    default:
      return "";
  }
}

/**
 * Serializes blog content to formatted JSON string.
 */
export function exportBlogToJSON(
  content: SlideDetailBlogContent,
  meta?: BlogExportMeta,
): string {
  const fullDocument = meta
    ? {
        title: meta.title,
        subtitle: meta.subtitle,
        excerpt: meta.excerpt,
        heroImageUrl: meta.heroImageUrl,
        ...content,
      }
    : content;
  return JSON.stringify(fullDocument, null, 2);
}

/**
 * Exports complete blog document into clean, standalone HTML5.
 */
export function exportBlogToHTML(
  content: SlideDetailBlogContent,
  meta?: BlogExportMeta,
): string {
  const blocks = content.blocks || [];
  const blocksHTML = blocks.map(exportBlockToHTML).join("\n\n");

  const heroHTML = meta?.heroImageUrl
    ? `<div class="blog-hero" style="margin-bottom: 24px; text-align: center;">
  <img src="${escapeHTML(meta.heroImageUrl)}" alt="${escapeHTML(meta?.title || "Hero Image")}" style="max-width: 100%; height: auto; border-radius: 12px;" />
</div>`
    : "";

  const titleHTML = meta?.title
    ? `<header class="blog-header" style="margin-bottom: 32px;">
  <h1 style="font-size: 32px; font-weight: 800; color: #011A42; line-height: 1.3; margin-bottom: 8px;">${escapeHTML(meta.title)}</h1>
  ${meta.subtitle ? `<p style="font-size: 18px; color: #6C7E96; margin-bottom: 12px;">${escapeHTML(meta.subtitle)}</p>` : ""}
  ${meta.excerpt ? `<blockquote style="border-left: 4px solid #ca2a30; padding-left: 16px; font-style: italic; color: #4B5563;">${escapeHTML(meta.excerpt)}</blockquote>` : ""}
</header>`
    : "";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(meta?.title || "Bài viết chi tiết")}</title>
  <style>
    body {
      font-family: "Space Grotesk", "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.7;
      color: #011A42;
      background-color: #FFFFFF;
      margin: 0;
      padding: 24px;
    }
    .blog-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .blog-list {
      margin: 12px 0;
      padding-left: 24px;
    }
    .blog-list-checklist {
      padding-left: 0;
    }
    .blog-checklist-item {
      margin: 6px 0;
    }
    .blog-checklist-item input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #ca2a30;
      cursor: default;
    }
    @media (max-width: 640px) {
      body { padding: 16px; }
      h1 { font-size: 26px !important; }
    }
  </style>
</head>
<body>
  <article class="blog-container">
    ${heroHTML}
    ${titleHTML}
    <div class="blog-body">
${blocksHTML}
    </div>
  </article>
</body>
</html>`;
}
