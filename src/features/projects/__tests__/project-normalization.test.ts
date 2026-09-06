import { describe, it, expect } from "vitest";
import { projectSchema } from "../schema";
import { parseProjectContent } from "../utils/project-content";

describe("Project Schema & Legacy Content Normalization Tests", () => {
  it("normalizes legacy database blocks with { text } list items and passes schema validation", () => {
    const legacyRawContent = {
      version: 1,
      blocks: [
        {
          id: "blk-sec-overview-08a0962f",
          type: "section",
          title: "Tổng quan",
          number: "01",
          children: [
            {
              id: "blk-ovw-p-08a0962f",
              text: "Trọn gói sản phẩm trắc địa toàn diện phục vụ xây dựng quy hoạch bán đảo Sơn Trà.",
              type: "paragraph",
            },
            {
              id: "blk-srv-lst-08a0962f",
              type: "list",
              items: [
                { text: "Sản phẩm bản vẽ 2D" },
                { text: "Bản vẽ 1/500 chi tiết" },
                { text: "Mô hình 3D" },
              ],
            },
          ],
        },
      ],
    };

    const parsed = parseProjectContent(legacyRawContent);

    // Verify list items normalized to { id, content, children }
    const section = parsed.blocks[0] as import("@/shared/content-editor").SectionBlock;
    const listBlock = section.children[1] as import("@/shared/content-editor").ListBlock;
    expect(listBlock.items[0].content).toBe("Sản phẩm bản vẽ 2D");
    expect(listBlock.items[0].id).toBeDefined();
    expect(Array.isArray(listBlock.items[0].children)).toBe(true);

    // Verify zod schema passes cleanly
    const validation = projectSchema.safeParse({
      title: "Sơn Trà – Đà Nẵng",
      slug: "son-tra-da-nang",
      content: parsed,
      year: 2026,
    });

    expect(validation.success).toBe(true);
  });
});
