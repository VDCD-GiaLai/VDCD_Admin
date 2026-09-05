import { describe, it, expect } from "vitest";
import {
  parseSolutionContent,
  serializeSolutionPayload,
  isDocumentContentString,
} from "../solution-content";
import type { SolutionFormData } from "../../schema";
import type { ParagraphBlock, DocumentContent } from "@/shared/content-editor";

describe("solution-content utility", () => {
  it("should detect valid JSON document content string", () => {
    const validJson = JSON.stringify({
      version: 1,
      blocks: [{ id: "p1", type: "paragraph", text: "Hello world" }],
    });
    expect(isDocumentContentString(validJson)).toBe(true);
    expect(isDocumentContentString("Plain text string")).toBe(false);
    expect(isDocumentContentString(null)).toBe(false);
  });

  it("should convert plain text (legacy 19 DB solutions) into a ParagraphBlock", () => {
    const legacyText =
      "Cung cấp các dịch vụ bay quét 3D, trắc địa số hóa và thành lập bản đồ địa hình độ chính xác cao bằng máy bay không người lái.";
    const result = parseSolutionContent(legacyText);

    expect(result.version).toBe(1);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe("paragraph");
    const pBlock = result.blocks[0] as ParagraphBlock;
    expect(pBlock.text).toBe(legacyText);
  });

  it("should parse valid DocumentContent object without altering blocks", () => {
    const docObj = {
      version: 1,
      blocks: [
        { id: "h1", type: "heading", level: 2 as const, text: "Tiêu đề giải pháp" },
        { id: "p1", type: "paragraph", text: "Nội dung giải pháp" },
      ],
    };
    const result = parseSolutionContent(docObj);
    expect(result.version).toBe(1);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].type).toBe("heading");
    expect(result.blocks[1].type).toBe("paragraph");
  });

  it("should return default empty document content when input is null or empty", () => {
    const resNull = parseSolutionContent(null);
    expect(resNull.version).toBe(1);
    expect(resNull.blocks).toHaveLength(0);

    const resEmpty = parseSolutionContent("");
    expect(resEmpty.version).toBe(1);
    expect(resEmpty.blocks).toHaveLength(0);
  });

  it("should serialize SolutionFormData into payload retaining websiteUrl and structured content", () => {
    const formData: SolutionFormData = {
      title: "Giải pháp chuyển đổi số",
      slug: "giai-phap-chuyen-doi-so",
      shortDescription: "Mô tả ngắn",
      websiteUrl: "https://vdcd.vn/giai-phap-cds",
      fieldId: "field-123",
      thumbnail: "https://ik.imagekit.io/vdcd/solutions/test.jpg",
      thumbnailFileId: "ik_file_123",
      metaTitle: "SEO Title",
      metaDescription: "SEO Desc",
      isPublished: true,
      content: {
        version: 1,
        blocks: [
          { id: "h1", type: "heading", level: 2, text: "Đặc điểm nổi bật" },
        ],
      },
    };

    const payload = serializeSolutionPayload(formData);
    expect(payload.title).toBe("Giải pháp chuyển đổi số");
    expect(payload.websiteUrl).toBe("https://vdcd.vn/giai-phap-cds");
    expect(payload.isPublished).toBe(true);
    expect(typeof payload.content).toBe("object");
    const docContent = payload.content as DocumentContent;
    expect(docContent.blocks).toHaveLength(1);
  });
});
