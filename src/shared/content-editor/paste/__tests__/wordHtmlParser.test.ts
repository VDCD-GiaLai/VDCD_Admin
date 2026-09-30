import { describe, it, expect } from "vitest";
import {
  parseWordHtmlToBlocks,
  parsePlainTextToBlocks,
  isMultiBlockContent,
  rgbToHex,
} from "../wordHtmlParser";
import type { HeadingBlock, ParagraphBlock, ImageBlock, ListBlock } from "../../model/document.types";

describe("wordHtmlParser", () => {
  describe("rgbToHex", () => {
    it("converts standard rgb colors to hex", () => {
      expect(rgbToHex("rgb(255, 0, 0)")).toBe("#ff0000");
      expect(rgbToHex("rgb(46, 116, 181)")).toBe("#2e74b5");
    });

    it("returns undefined for black/inherit to allow theme defaults", () => {
      expect(rgbToHex("rgb(0, 0, 0)")).toBeUndefined();
      expect(rgbToHex("inherit")).toBeUndefined();
      expect(rgbToHex("")).toBeUndefined();
    });
  });

  describe("isMultiBlockContent", () => {
    it("identifies multi-block HTML", () => {
      const html = "<p>Đoạn 1</p><p>Đoạn 2</p>";
      expect(isMultiBlockContent(html, null)).toBe(true);
    });

    it("identifies content with image and text", () => {
      const html = "<p>Mô tả ảnh</p><img src='https://example.com/a.jpg' />";
      expect(isMultiBlockContent(html, null)).toBe(true);
    });

    it("returns false for single paragraph", () => {
      const html = "<p>Chỉ một đoạn văn ngắn</p>";
      expect(isMultiBlockContent(html, "Chỉ một đoạn văn ngắn")).toBe(false);
    });
  });

  describe("parseWordHtmlToBlocks", () => {
    it("parses headings with level, color and alignment", () => {
      const html = `
        <h1 style="color: rgb(31, 73, 125); text-align: center;">Tiêu đề chính H1</h1>
        <h2 style="text-align: right;">Tiêu đề phụ H2</h2>
      `;
      const blocks = parseWordHtmlToBlocks(html);
      expect(blocks).toHaveLength(2);

      const h1 = blocks[0] as HeadingBlock;
      expect(h1.type).toBe("heading");
      expect(h1.level).toBe(1);
      expect(h1.text).toBe("Tiêu đề chính H1");
      expect(h1.color).toBe("#1f497d");
      expect(h1.textAlign).toBe("center");

      const h2 = blocks[1] as HeadingBlock;
      expect(h2.type).toBe("heading");
      expect(h2.level).toBe(2);
      expect(h2.text).toBe("Tiêu đề phụ H2");
      expect(h2.textAlign).toBe("right");
    });

    it("parses Word MsoHeading classes and large font-size", () => {
      const html = `
        <p class="MsoHeading1"><strong>Mục 1: Tổng quan</strong></p>
        <p class="MsoHeading2"><strong>1.1 Chi tiết</strong></p>
      `;
      const blocks = parseWordHtmlToBlocks(html);
      expect(blocks).toHaveLength(2);
      expect((blocks[0] as HeadingBlock).level).toBe(1);
      expect((blocks[1] as HeadingBlock).level).toBe(2);
    });

    it("parses images with data URL and web URL", () => {
      const html = `
        <p>Văn bản mở đầu</p>
        <p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Ảnh test" /></p>
        <figure>
          <img src="https://example.com/photo.jpg" alt="Ảnh phong cảnh" />
          <figcaption>Chú thích ảnh phong cảnh</figcaption>
        </figure>
      `;
      const blocks = parseWordHtmlToBlocks(html);
      expect(blocks).toHaveLength(3);

      expect(blocks[0].type).toBe("paragraph");

      const img1 = blocks[1] as ImageBlock;
      expect(img1.type).toBe("image");
      expect(img1.url).toContain("data:image/png;base64,");
      expect(img1.alt).toBe("Ảnh test");

      const img2 = blocks[2] as ImageBlock;
      expect(img2.type).toBe("image");
      expect(img2.url).toBe("https://example.com/photo.jpg");
      expect(img2.caption).toBe("Chú thích ảnh phong cảnh");
    });

    it("splits paragraph containing both text and image", () => {
      const html = `
        <p>Nội dung trước ảnh <img src="https://example.com/inline.jpg" alt="Inline" /> và tiếp tục nội dung</p>
      `;
      const blocks = parseWordHtmlToBlocks(html);
      expect(blocks.length).toBeGreaterThanOrEqual(2);
      expect(blocks.some((b) => b.type === "image")).toBe(true);
      expect(blocks.some((b) => b.type === "paragraph")).toBe(true);
    });

    it("parses bullet and numbered lists with items", () => {
      const html = `
        <ul>
          <li>Mục danh sách 1</li>
          <li>Mục danh sách 2</li>
        </ul>
        <ol>
          <li>Bước 1</li>
          <li>Bước 2</li>
        </ol>
      `;
      const blocks = parseWordHtmlToBlocks(html);
      expect(blocks).toHaveLength(2);

      const ul = blocks[0] as ListBlock;
      expect(ul.type).toBe("list");
      expect(ul.listType).toBe("bullet");
      expect(ul.items).toHaveLength(2);
      expect(ul.items[0].content).toBe("Mục danh sách 1");

      const ol = blocks[1] as ListBlock;
      expect(ol.type).toBe("list");
      expect(ol.listType).toBe("ordered");
      expect(ol.items).toHaveLength(2);
      expect(ol.items[0].content).toBe("Bước 1");
    });

    it("parses Word MsoListParagraph consecutive list items into a single list block", () => {
      const html = `
        <p class="MsoListParagraph">• Mục gạch đầu dòng A</p>
        <p class="MsoListParagraph">• Mục gạch đầu dòng B</p>
        <p class="MsoNormal">Đoạn văn ngăn cách</p>
        <p class="MsoListParagraph">1. Đánh số 1</p>
        <p class="MsoListParagraph">2. Đánh số 2</p>
      `;
      const blocks = parseWordHtmlToBlocks(html);
      expect(blocks).toHaveLength(3);

      const list1 = blocks[0] as ListBlock;
      expect(list1.type).toBe("list");
      expect(list1.listType).toBe("bullet");
      expect(list1.items).toHaveLength(2);
      expect(list1.items[0].content).toBe("Mục gạch đầu dòng A");

      expect(blocks[1].type).toBe("paragraph");

      const list2 = blocks[2] as ListBlock;
      expect(list2.type).toBe("list");
      expect(list2.listType).toBe("ordered");
      expect(list2.items).toHaveLength(2);
      expect(list2.items[0].content).toBe("Đánh số 1");
    });

    it("preserves rich inline formatting in paragraphs", () => {
      const html = `
        <p style="text-align: justify; color: rgb(51, 51, 51);">
          Đoạn văn có <strong>in đậm</strong>, <em>in nghiêng</em>, <u>gạch chân</u> và <a href="https://vdcd.vn">liên kết</a>.
        </p>
      `;
      const blocks = parseWordHtmlToBlocks(html);
      expect(blocks).toHaveLength(1);

      const p = blocks[0] as ParagraphBlock;
      expect(p.type).toBe("paragraph");
      expect(p.textAlign).toBe("justify");
      expect(p.color).toBe("#333333");
      expect(p.text).toContain("<strong>in đậm</strong>");
      expect(p.text).toContain("<em>in nghiêng</em>");
      expect(p.text).toContain("<u>gạch chân</u>");
      expect(p.text).toContain('<a href="https://vdcd.vn">liên kết</a>');
    });

    it("replaces Word file:/// image URLs using RTF stream and consumes caption", () => {
      const pngHex = "89504e470d0a1a0a" + "aa".repeat(60);
      const rtf = `{\\rtf1 {\\pict\\pngblip ${pngHex}}}`;
      const html = `
        <p class="MsoNormal">Văn bản trước ảnh</p>
        <p class="MsoNormal"><img src="file:///C:/Users/AppData/Local/Temp/clip_image001.png" alt="Sơ đồ" /></p>
        <p class="MsoCaption">Hình 1. Sơ đồ hệ thống</p>
      `;
      const blocks = parseWordHtmlToBlocks(html, rtf);
      expect(blocks).toHaveLength(2); // Paragraph + Image (caption consumed)

      expect(blocks[0].type).toBe("paragraph");
      const img = blocks[1] as ImageBlock;
      expect(img.type).toBe("image");
      expect(img.url).toMatch(/^data:image\/png;base64,/);
      expect(img.caption).toBe("Hình 1. Sơ đồ hệ thống");
    });

    it("converts Word tables to structured list items", () => {
      const html = `
        <table>
          <tr><th>Mã hiệu</th><th>Tên thiết bị</th><th>Số lượng</th></tr>
          <tr><td>GNSS-01</td><td>Bộ thu RTK CHCNAV</td><td>04 bộ</td></tr>
          <tr><td>UAV-02</td><td>Máy bay Matrice 350</td><td>02 chiếc</td></tr>
        </table>
      `;
      const blocks = parseWordHtmlToBlocks(html);
      expect(blocks).toHaveLength(1);
      const list = blocks[0] as ListBlock;
      expect(list.type).toBe("list");
      expect(list.items).toHaveLength(2);
      expect(list.items[0].content).toContain("GNSS-01");
      expect(list.items[0].content).toContain("Bộ thu RTK CHCNAV");
    });
  });

  describe("parsePlainTextToBlocks", () => {
    it("parses plain text with numbered headings and bullet items", () => {
      const text = `
1. Giới thiệu dự án
Đây là đoạn giới thiệu về dự án.

2. Các tính năng
- Tính năng 1
- Tính năng 2

Kết luận
      `.trim();

      const blocks = parsePlainTextToBlocks(text);
      expect(blocks.length).toBeGreaterThanOrEqual(4);
      expect(blocks[0].type).toBe("heading");
      expect(blocks[1].type).toBe("paragraph");
      expect(blocks[2].type).toBe("heading");
      expect(blocks[3].type).toBe("list");
    });
  });
});
