import type {
  SlideDetailBlogContent,
  SlideDetailBlogBlock,
} from "@/types/slide-detail-blog";
import type { ArticleFormData } from "../schema";

/**
 * Parses article raw content from backend (which may be a JSON string, a JSON object,
 * or legacy HTML text) into a valid SlideDetailBlogContent block document.
 */
export function parseArticleContent(
  rawContent: unknown,
): {
  content: SlideDetailBlogContent;
  subtitle?: string | null;
  excerpt?: string | null;
} {
  if (!rawContent) {
    return {
      content: { version: 1, blocks: [] },
    };
  }

  // Already an object
  if (typeof rawContent === "object" && rawContent !== null && "blocks" in rawContent) {
    const doc = rawContent as SlideDetailBlogContent & {
      subtitle?: string | null;
      excerpt?: string | null;
    };
    return {
      content: {
        version: doc.version || 1,
        blocks: Array.isArray(doc.blocks) ? doc.blocks : [],
        heroMeta: doc.heroMeta,
      },
      subtitle: doc.subtitle ?? null,
      excerpt: doc.excerpt ?? null,
    };
  }

  // If stored as JSON string
  if (typeof rawContent === "string") {
    const trimmed = rawContent.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed) as SlideDetailBlogContent & {
          subtitle?: string | null;
          excerpt?: string | null;
        };
        if (parsed && Array.isArray(parsed.blocks)) {
          return {
            content: {
              version: parsed.version || 1,
              blocks: parsed.blocks,
              heroMeta: parsed.heroMeta,
            },
            subtitle: parsed.subtitle ?? null,
            excerpt: parsed.excerpt ?? null,
          };
        }
      } catch {
        // Not valid JSON, treat as legacy HTML below
      }
    }

    // Convert legacy HTML string to initial blocks
    return {
      content: convertLegacyHtmlToContent(trimmed),
    };
  }

  return {
    content: { version: 1, blocks: [] },
  };
}

/**
 * Converts legacy raw HTML string into structured blocks.
 */
export function convertLegacyHtmlToContent(html: string): SlideDetailBlogContent {
  if (!html || !html.trim()) {
    return { version: 1, blocks: [] };
  }

  const blocks: SlideDetailBlogBlock[] = [];

  // Simple browser-safe regex parser for basic elements
  // Matches <h1> - <h6>, <p>, <ul>, <ol>, <img>
  const tagRegex = /<(h[1-6]|p|ul|ol|blockquote)[^>]*>([\s\S]*?)<\/\1>|<img[^>]+>/gi;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = (match[1] || "").toLowerCase();
    const innerHtml = match[2] || "";

    if (tagName.startsWith("h")) {
      const level = parseInt(tagName.charAt(1), 10) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({
        id: `h_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: "heading",
        level: level >= 1 && level <= 6 ? level : 2,
        text: innerHtml.replace(/<[^>]+>/g, "").trim(),
      });
    } else if (tagName === "p" || tagName === "blockquote") {
      const cleanText = innerHtml.trim();
      if (cleanText) {
        blocks.push({
          id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: "paragraph",
          text: cleanText,
        });
      }
    } else if (tagName === "ul" || tagName === "ol") {
      const liMatches = innerHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
      const items = liMatches.map((li, idx) => ({
        id: `li_${Date.now()}_${idx}`,
        content: li.replace(/<[^>]+>/g, "").trim(),
        children: [],
      }));

      if (items.length > 0) {
        blocks.push({
          id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: "list",
          listType: tagName === "ol" ? "ordered" : "bullet",
          items,
        });
      }
    } else if (fullTag.toLowerCase().startsWith("<img")) {
      const srcMatch = fullTag.match(/src=["']([^"']+)["']/i);
      const altMatch = fullTag.match(/alt=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        blocks.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: "image",
          url: srcMatch[1],
          alt: altMatch ? altMatch[1] : "",
          caption: null,
        });
      }
    }
  }

  // Fallback: If no structured tags were matched, wrap entire content as one paragraph

  if (blocks.length === 0 && html.trim()) {
    blocks.push({
      id: `p_fallback_${Date.now()}`,
      type: "paragraph",
      text: html.trim(),
    });
  }

  return {
    version: 1,
    blocks,
  };
}

/**
 * Prepares the payload to submit to Backend API.
 * Passes content as a structured JSON object to comply with Backend's @IsObject() validation,
 * and passes subtitle and excerpt as first-class entity columns.
 */
export function serializeArticlePayload(data: ArticleFormData): Record<string, unknown> {
  const contentObj =
    typeof data.content === "string"
      ? parseArticleContent(data.content).content
      : (data.content ?? { version: 1, blocks: [] });

  return {
    title: data.title,
    subtitle: data.subtitle || undefined,
    slug: data.slug || undefined,
    excerpt: data.excerpt || undefined,
    content: contentObj,
    thumbnail: data.thumbnail || null,
    thumbnailFileId: data.thumbnailFileId || null,
    category: data.category || undefined,
    tags: data.tags || undefined,
    projectId: data.projectId || null,
    programId: data.programId || null,
    solutionId: data.solutionId || null,
    metaTitle: data.metaTitle || undefined,
    metaDescription: data.metaDescription || undefined,
    isPublished: data.isPublished ?? false,
    publishedAt: data.publishedAt || null,
  };
}
