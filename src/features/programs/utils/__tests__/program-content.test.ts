import { describe, it, expect } from "vitest";
import {
  isDocumentContentString,
  parseProgramContent,
  serializeProgramContent,
  serializeProgramPayload,
} from "../program-content";
import type { DocumentContent, HeadingBlock } from "@/shared/content-editor";

describe("Program Content Parser & Serializer", () => {
  it("identifies valid DocumentContent JSON string", () => {
    const validJson = JSON.stringify({
      version: 1,
      blocks: [{ id: "h1", type: "heading", level: 2, text: "Tiêu đề" }],
    });
    expect(isDocumentContentString(validJson)).toBe(true);
    expect(isDocumentContentString("<p>HTML text</p>")).toBe(false);
    expect(isDocumentContentString("")).toBe(false);
    expect(isDocumentContentString(null)).toBe(false);
  });

  it("parses valid DocumentContent JSON string correctly", () => {
    const doc: DocumentContent = {
      version: 1,
      blocks: [
        { id: "h1", type: "heading", level: 2, text: "Chương trình đổi mới" },
        { id: "p1", type: "paragraph", text: "Nội dung chi tiết chương trình" },
      ],
      heroMeta: {
        placement: "above_title",
        position: "center",
        caption: "Ảnh minh hoạ",
      },
    };

    const parsed = parseProgramContent(JSON.stringify(doc));
    expect(parsed.version).toBe(1);
    expect(parsed.blocks.length).toBe(2);
    expect(parsed.blocks[0].type).toBe("heading");
    expect(parsed.blocks[1].type).toBe("paragraph");
  });

  it("parses valid DocumentContent object directly (modern backend JSONB)", () => {
    const doc: DocumentContent = {
      version: 1,
      blocks: [
        { id: "h1", type: "heading", level: 2, text: "Chương trình ươm tạo" },
        { id: "p1", type: "paragraph", text: "Nội dung chương trình..." },
      ],
    };

    const parsed = parseProgramContent(doc);
    expect(parsed.version).toBe(1);
    expect(parsed.blocks.length).toBe(2);
    expect((parsed.blocks[0] as HeadingBlock).text).toBe("Chương trình ươm tạo");
  });

  it("converts legacy HTML string to structured DocumentContent blocks", () => {
    const html = "<h2>Mục tiêu chương trình</h2><p>Hỗ trợ doanh nghiệp.</p><img src=\"https://example.com/demo.jpg\" alt=\"Ảnh demo\" /><ul><li>Giai đoạn 1</li></ul>";

    const parsed = parseProgramContent(html);
    expect(parsed.version).toBe(1);
    expect(parsed.blocks.length).toBe(4);
    expect(parsed.blocks[0].type).toBe("heading");
    expect(parsed.blocks[1].type).toBe("paragraph");
    expect(parsed.blocks[2].type).toBe("image");
    expect(parsed.blocks[3].type).toBe("list");
  });

  it("returns default DocumentContent when raw content is empty", () => {
    const parsed = parseProgramContent("");
    expect(parsed.version).toBe(1);
    expect(parsed.blocks).toEqual([]);
    expect(parsed.heroMeta?.placement).toBe("above_title");
  });

  it("serializes DocumentContent into JSON string", () => {
    const doc: DocumentContent = {
      version: 1,
      blocks: [{ id: "p_1", type: "paragraph", text: "Nội dung" }],
      heroMeta: { placement: "above_title" },
    };

    const str = serializeProgramContent(doc);
    expect(typeof str).toBe("string");
    const restored = JSON.parse(str);
    expect(restored.version).toBe(1);
    expect(restored.blocks[0].text).toBe("Nội dung");
  });

  it("serializes program payload with structured object content for backend", () => {
    const payload = serializeProgramPayload({
      title: "Chương trình thử nghiệm",
      slug: "chuong-trinh-thu-nghiem",
      content: {
        version: 1,
        blocks: [{ id: "b1", type: "paragraph", text: "Paragraph test" }],
      },
    });

    expect(payload.title).toBe("Chương trình thử nghiệm");
    expect(typeof payload.content).toBe("object");
    expect((payload.content as DocumentContent).version).toBe(1);
    expect((payload.content as DocumentContent).blocks.length).toBe(1);
  });
});
