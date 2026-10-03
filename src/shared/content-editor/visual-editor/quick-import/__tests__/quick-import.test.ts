import { describe, it, expect } from "vitest";
import {
  parseHtmlToBlocks,
  parsePlainTextToBlocks,
} from "../parseHtmlToBlocks";
import {
  dataUrlToFile,
  isUploadCandidate,
} from "../uploadEmbeddedImages";
import {
  replaceFileUrlsWithRtfImages,
} from "../rtfImageExtractor";
import type { HeadingBlock, ParagraphBlock, ImageBlock, ListBlock } from "@/types/slide-detail-blog";

describe("Quick Import — HTML to Blocks Parser", () => {
  it("converts standard headings with level, alignment, and color", () => {
    const html = `
      <h1 style="text-align: center; color: rgb(220, 38, 38);">Tiêu đề chính cấp 1</h1>
      <h2 style="text-align: left; color: #2563eb;">Tiêu đề phụ cấp 2</h2>
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("heading");
    const h1 = blocks[0] as HeadingBlock;
    expect(h1.level).toBe(1);
    expect(h1.text).toBe("Tiêu đề chính cấp 1");
    expect(h1.textAlign).toBe("center");
    expect(h1.color).toBe("#dc2626");

    const h2 = blocks[1] as HeadingBlock;
    expect(h2.level).toBe(2);
    expect(h2.text).toBe("Tiêu đề phụ cấp 2");
    expect(h2.color).toBe("#2563eb");
  });

  it("converts paragraphs with inline styles (bold, italic, colors, align)", () => {
    const html = `
      <p style="text-align: justify;">
        Đây là đoạn văn có chữ <strong>đậm</strong>, <em>nghiêng</em> và <span style="color: rgb(16, 185, 129);">màu xanh</span>.
      </p>
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
    const p = blocks[0] as ParagraphBlock;
    expect(p.textAlign).toBe("justify");
    expect(p.text).toContain("<strong>đậm</strong>");
    expect(p.text).toContain("<em>nghiêng</em>");
    expect(p.text).toContain('style="color: #10b981"');
  });

  it("extracts images with figcaption or adjacent caption", () => {
    const html = `
      <figure>
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Ảnh vệ tinh" />
        <figcaption>Hình 1: Bản đồ giám sát nông nghiệp</figcaption>
      </figure>
      <p>Nội dung đoạn tiếp theo</p>
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("image");
    const img = blocks[0] as ImageBlock;
    expect(img.alt).toBe("Ảnh vệ tinh");
    expect(img.caption).toBe("Hình 1: Bản đồ giám sát nông nghiệp");
    expect(img.url).toContain("data:image/png;base64");

    expect(blocks[1].type).toBe("paragraph");
  });

  it("associates adjacent caption paragraph with image and does not duplicate it", () => {
    const html = `
      <p><img src="https://example.com/satellite.jpg" alt="Vệ tinh" /></p>
      <p class="caption">Hình 2: Dữ liệu ảnh viễn thám Gia Lai</p>
      <p>Đoạn văn bình thường sau ảnh</p>
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("image");
    const img = blocks[0] as ImageBlock;
    expect(img.caption).toBe("Hình 2: Dữ liệu ảnh viễn thám Gia Lai");

    expect(blocks[1].type).toBe("paragraph");
    const p = blocks[1] as ParagraphBlock;
    expect(p.text).toBe("Đoạn văn bình thường sau ảnh");
  });

  it("parses bullet and ordered lists including nested lists", () => {
    const html = `
      <ul>
        <li>Mục 1</li>
        <li>
          Mục 2
          <ul>
            <li>Mục 2.1</li>
          </ul>
        </li>
      </ul>
      <ol>
        <li>Bước 1</li>
        <li>Bước 2</li>
      </ol>
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("list");
    const ul = blocks[0] as ListBlock;
    expect(ul.listType).toBe("bullet");
    expect(ul.items).toHaveLength(2);
    expect(ul.items[1].children).toHaveLength(1);

    expect(blocks[1].type).toBe("list");
    const ol = blocks[1] as ListBlock;
    expect(ol.listType).toBe("ordered");
    expect(ol.items).toHaveLength(2);
  });

  it("converts Word MsoListParagraph into structured list blocks", () => {
    const html = `
      <p class="MsoListParagraph">· Mục đầu tiên từ Word</p>
      <p class="MsoListParagraph">· Mục thứ hai từ Word</p>
      <p>Một đoạn văn bình thường</p>
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("list");
    const list = blocks[0] as ListBlock;
    expect(list.items).toHaveLength(2);
    expect(list.items[0].content).toBe("Mục đầu tiên từ Word");
    expect(list.items[1].content).toBe("Mục thứ hai từ Word");

    expect(blocks[1].type).toBe("paragraph");
  });

  it("parses blockquotes", () => {
    const html = `
      <blockquote>Đổi mới sáng tạo là chìa khóa phát triển bền vững</blockquote>
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("quote");
  });

  it("parses plain text with headings and bullet lists", () => {
    const text = `
TIÊU ĐỀ IN HOA

Đây là một đoạn văn bản.

- Ý số 1
- Ý số 2

1. Bước 1
2. Bước 2
    `.trim();

    const blocks = parsePlainTextToBlocks(text);

    expect(blocks.length).toBeGreaterThanOrEqual(4);
    expect(blocks[0].type).toBe("heading");
    expect(blocks[1].type).toBe("paragraph");
    expect(blocks[2].type).toBe("list");
    expect(blocks[3].type).toBe("list");
  });
});

describe("Quick Import — Image Upload Candidates & Conversion", () => {
  it("identifies upload candidates correctly", () => {
    expect(isUploadCandidate("data:image/png;base64,abc")).toBe(true);
    expect(isUploadCandidate("blob:http://localhost:3000/12345")).toBe(true);
    expect(isUploadCandidate("https://lh3.googleusercontent.com/abc=w800")).toBe(true);
    expect(isUploadCandidate("https://ik.imagekit.io/vdcd/my-image.png")).toBe(false);
  });

  it("converts base64 dataUrl to File object", () => {
    // 1x1 transparent PNG data URL
    const pngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const file = dataUrlToFile(pngDataUrl, "test.png");

    expect(file).not.toBeNull();
    expect(file?.type).toBe("image/png");
    expect(file?.name).toBe("test.png");
    expect(file?.size).toBeGreaterThan(0);
  });
});

describe("Quick Import — RTF Image Recovery", () => {
  it("replaces file:/// URLs with base64 data URLs from RTF pict stream", () => {
    // Construct minimal valid RTF with a 1x1 PNG hex stream
    const hexPng = "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6364f8cf0000020401458e0a1b0000000049454e44ae426082";
    const rtf = `{\\rtf1\\ansi {\\pict\\pngblip ${hexPng}} }`;

    const html = `<p><img src="file:///C:/Users/test/AppData/Local/Temp/clip_image001.png" alt="Test" /></p>`;

    const replaced = replaceFileUrlsWithRtfImages(html, rtf);

    expect(replaced).toContain("data:image/png;base64,");
    expect(replaced).not.toContain("file:///");
  });
});
