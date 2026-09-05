import { describe, it, expect } from "vitest";
import {
  parseArticleContent,
  convertLegacyHtmlToContent,
  serializeArticlePayload,
} from "../article-content";
import type { ArticleFormData } from "../../schema";
import type { SlideDetailBlogContent, ListBlock, HeadingBlock } from "@/types/slide-detail-blog";

describe("article-content utils", () => {
  describe("parseArticleContent", () => {
    it("returns default content for null/undefined/empty string", () => {
      expect(parseArticleContent(null)).toEqual({
        content: { version: 1, blocks: [] },
      });
      expect(parseArticleContent("")).toEqual({
        content: { version: 1, blocks: [] },
      });
      expect(parseArticleContent(undefined as unknown as string)).toEqual({
        content: { version: 1, blocks: [] },
      });
    });

    it("parses valid JSON string with blocks and metadata", () => {
      const jsonStr = JSON.stringify({
        version: 1,
        subtitle: "Phụ đề bài viết",
        excerpt: "Tóm tắt bài viết",
        blocks: [
          { id: "h1", type: "heading", level: 1, text: "Tiêu đề chính" },
          { id: "p1", type: "paragraph", text: "Nội dung đoạn văn" },
        ],
      });

      const result = parseArticleContent(jsonStr);
      expect(result.subtitle).toBe("Phụ đề bài viết");
      expect(result.excerpt).toBe("Tóm tắt bài viết");
      expect(result.content.version).toBe(1);
      expect(result.content.blocks).toHaveLength(2);
      expect(result.content.blocks[0].type).toBe("heading");
      expect(result.content.blocks[1].type).toBe("paragraph");
    });

    it("accepts an already parsed object", () => {
      const obj: SlideDetailBlogContent = {
        version: 1,
        blocks: [{ id: "p1", type: "paragraph", text: "Xin chào" }],
      };

      const result = parseArticleContent(obj);
      expect(result.content.blocks).toHaveLength(1);
      expect(result.content.blocks[0].id).toBe("p1");
    });

    it("converts legacy HTML string to structured blocks", () => {
      const html = `
        <p>Đoạn mở đầu giới thiệu bài viết.</p>
        <h2>Nội dung quan trọng</h2>
        <ul>
          <li>Mục danh sách số 1</li>
          <li>Mục danh sách số 2</li>
        </ul>
        <img src="https://example.com/img.jpg" alt="Ảnh minh họa" />
        <blockquote>Trích dẫn đáng chú ý</blockquote>
      `;

      const result = parseArticleContent(html);
      expect(result.content.version).toBe(1);
      const blocks = result.content.blocks;
      expect(blocks.length).toBeGreaterThanOrEqual(4);

      const pBlock = blocks.find((b) => b.type === "paragraph");
      expect(pBlock).toBeDefined();

      const hBlock = blocks.find((b) => b.type === "heading");
      expect(hBlock).toBeDefined();
      if (hBlock && hBlock.type === "heading") {
        expect(hBlock.level).toBe(2);
        expect(hBlock.text).toBe("Nội dung quan trọng");
      }

      const listBlock = blocks.find((b) => b.type === "list") as ListBlock;
      expect(listBlock).toBeDefined();
      expect(listBlock.items).toHaveLength(2);
      expect(listBlock.items[0].content).toBe("Mục danh sách số 1");
      expect(listBlock.items[1].content).toBe("Mục danh sách số 2");

      const imgBlock = blocks.find((b) => b.type === "image");
      expect(imgBlock).toBeDefined();
      if (imgBlock && imgBlock.type === "image") {
        expect(imgBlock.url).toBe("https://example.com/img.jpg");
        expect(imgBlock.alt).toBe("Ảnh minh họa");
      }
    });
  });

  describe("convertLegacyHtmlToContent", () => {
    it("handles empty or whitespace-only HTML", () => {
      expect(convertLegacyHtmlToContent("   ")).toEqual({
        version: 1,
        blocks: [],
      });
    });

    it("extracts h1 through h6 with correct levels", () => {
      const html = "<h1>H1</h1><h3>H3</h3><h6>H6</h6>";
      const doc = convertLegacyHtmlToContent(html);
      expect(doc.blocks).toHaveLength(3);
      const [h1, h3, h6] = doc.blocks as [HeadingBlock, HeadingBlock, HeadingBlock];
      expect(h1.level).toBe(1);
      expect(h3.level).toBe(3);
      expect(h6.level).toBe(6);
    });

    it("extracts ordered lists with correct listType", () => {
      const html = "<ol><li>Bước 1</li><li>Bước 2</li></ol>";
      const doc = convertLegacyHtmlToContent(html);
      expect(doc.blocks).toHaveLength(1);
      const list = doc.blocks[0] as ListBlock;
      expect(list.type).toBe("list");
      expect(list.listType).toBe("ordered");
      expect(list.items).toHaveLength(2);
    });
  });

  describe("serializeArticlePayload", () => {
    it("serializes ArticleFormData into backend-compatible payload", () => {
      const formData: ArticleFormData = {
        title: "Tiêu đề bài viết",
        subtitle: "Phụ đề phụ",
        slug: "tieu-de-bai-viet",
        excerpt: "Đoạn trích tóm tắt",
        thumbnail: "https://example.com/thumb.jpg",
        thumbnailFileId: "file_123",
        category: "Công nghệ",
        tags: "AI, Tech",
        projectId: "proj-1",
        programId: "prog-1",
        solutionId: "sol-1",
        metaTitle: "Meta Title SEO",
        metaDescription: "Meta Description SEO",
        content: {
          version: 1,
          blocks: [
            { id: "p1", type: "paragraph", text: "Nội dung" },
          ],
        },
        isPublished: true,
        publishedAt: "2026-09-04T12:00",
      };

      const payload = serializeArticlePayload(formData);
      expect(payload.title).toBe("Tiêu đề bài viết");
      expect(payload.slug).toBe("tieu-de-bai-viet");
      expect(payload.thumbnail).toBe("https://example.com/thumb.jpg");
      expect(payload.projectId).toBe("proj-1");
      expect(payload.programId).toBe("prog-1");
      expect(payload.solutionId).toBe("sol-1");
      expect(payload.subtitle).toBe("Phụ đề phụ");
      expect(payload.excerpt).toBe("Đoạn trích tóm tắt");
      expect(typeof payload.content).toBe("object");

      const parsedContent = payload.content as SlideDetailBlogContent;
      expect(parsedContent.version).toBe(1);
      expect(parsedContent.blocks).toHaveLength(1);
    });
  });

  describe("PART D — Scalability & Performance Benchmarks", () => {
    it("handles 10, 50, 100, and 500 blocks efficiently (< 50ms)", () => {
      for (const count of [10, 50, 100, 500]) {
        const blocks = Array.from({ length: count }, (_, i) => ({
          id: `block_${i}`,
          type: (i % 2 === 0 ? "paragraph" : "heading") as "paragraph" | "heading",
          level: (i % 6 + 1) as 1 | 2 | 3 | 4 | 5 | 6,
          text: `Nội dung khối kiểm thử số ${i} - Thử nghiệm hiệu năng của Article Block Editor`,
        }));

        const doc: SlideDetailBlogContent = { version: 1, blocks };
        const formData: ArticleFormData = {
          title: `Bài viết kiểm thử ${count} blocks`,
          subtitle: "Performance Test",
          slug: `perf-test-${count}`,
          excerpt: "Kiểm tra tốc độ render và serialize",
          thumbnail: null,
          thumbnailFileId: null,
          category: "Performance",
          tags: "benchmark",
          projectId: null,
          programId: null,
          solutionId: null,
          metaTitle: "",
          metaDescription: "",
          content: doc,
          isPublished: false,
          publishedAt: null,
        };

        const t0 = performance.now();
        const serialized = serializeArticlePayload(formData);
        const t1 = performance.now();
        const deserialized = parseArticleContent(serialized.content as SlideDetailBlogContent);
        const t2 = performance.now();

        expect(deserialized.content.blocks).toHaveLength(count);
        expect(t1 - t0).toBeLessThan(50); // Serialization under 50ms even for 500 blocks
        expect(t2 - t1).toBeLessThan(50); // Deserialization under 50ms
      }
    });

    it("handles 100 and 500 list items with nested structures efficiently (< 50ms)", () => {
      for (const count of [100, 500]) {
        const items = Array.from({ length: count }, (_, i) => ({
          id: `li_${i}`,
          content: `Mục danh sách thứ ${i}`,
          children: i % 5 === 0 ? [{ id: `sub_${i}`, content: `Mục con của ${i}`, children: [] }] : [],
        }));

        const listBlock: ListBlock = {
          id: "huge_list",
          type: "list",
          listType: "bullet",
          items,
        };

        const doc: SlideDetailBlogContent = {
          version: 1,
          blocks: [listBlock],
        };

        const t0 = performance.now();
        const jsonStr = JSON.stringify(doc);
        const parsed = parseArticleContent(jsonStr);
        const t1 = performance.now();

        expect((parsed.content.blocks[0] as ListBlock).items).toHaveLength(count);
        expect(t1 - t0).toBeLessThan(50);
      }
    });
  });
});
