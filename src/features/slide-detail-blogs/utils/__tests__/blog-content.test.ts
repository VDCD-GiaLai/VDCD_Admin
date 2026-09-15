import { describe, it, expect } from "vitest";
import {
  sanitizeListItems,
  normalizeSlideDetailBlogBlocks,
  normalizeSlideDetailBlogContent,
} from "../blog-content";
import type {
  ListBlock,
  SectionBlock,
  SlideDetailBlogContent,
  SlideDetailBlogBlock,
} from "@/types/slide-detail-blog";

describe("blog-content utility tests", () => {
  describe("sanitizeListItems", () => {
    it("synchronizes both content and text when only content is provided", () => {
      const input = [
        { id: "li_1", content: "Dữ liệu địa chính", children: [] },
      ];
      const result = sanitizeListItems(input);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Dữ liệu địa chính");
      expect(result[0].text).toBe("Dữ liệu địa chính");
    });

    it("synchronizes both content and text when only text is provided", () => {
      const input = [
        { id: "li_2", text: "Trích đo bản đồ", children: [] },
      ];
      const result = sanitizeListItems(input as unknown as import("@/types/slide-detail-blog").ListItem[]);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Trích đo bản đồ");
      expect(result[0].text).toBe("Trích đo bản đồ");
    });

    it("handles legacy string items cleanly", () => {
      const input = ["Mục thứ nhất", "Mục thứ hai"];
      const result = sanitizeListItems(input);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Mục thứ nhất");
      expect(result[0].text).toBe("Mục thứ nhất");
      expect(result[1].content).toBe("Mục thứ hai");
      expect(result[1].text).toBe("Mục thứ hai");
    });

    it("prunes trailing empty items when valid items exist", () => {
      const input = [
        { id: "li_1", content: "Mục hợp lệ", children: [] },
        { id: "li_2", content: "   ", children: [] },
        { id: "li_3", content: "", children: [] },
      ];
      const result = sanitizeListItems(input);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Mục hợp lệ");
      expect(result[0].text).toBe("Mục hợp lệ");
    });

    it("provides fallback item when all items are empty or input is empty", () => {
      const emptyInput: unknown[] = [];
      const resultEmpty = sanitizeListItems(emptyInput);
      expect(resultEmpty).toHaveLength(1);
      expect(resultEmpty[0].content).toBe("Mục danh sách");
      expect(resultEmpty[0].text).toBe("Mục danh sách");

      const blankItems = [{ id: "li_1", content: "   ", children: [] }];
      const resultBlank = sanitizeListItems(blankItems);
      expect(resultBlank).toHaveLength(1);
      expect(resultBlank[0].content).toBe("Mục danh sách");
      expect(resultBlank[0].text).toBe("Mục danh sách");
    });

    it("recursively sanitizes nested children list items", () => {
      const nestedInput = [
        {
          id: "li_parent",
          content: "Cha",
          children: [
            { id: "li_child_1", content: "Con 1", children: [] },
            { id: "li_child_2", text: "Con 2", children: [] },
            { id: "li_child_empty", content: "", children: [] },
          ],
        },
      ];
      const result = sanitizeListItems(nestedInput);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Cha");
      expect(result[0].text).toBe("Cha");
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0].content).toBe("Con 1");
      expect(result[0].children[0].text).toBe("Con 1");
      expect(result[0].children[1].content).toBe("Con 2");
      expect(result[0].children[1].text).toBe("Con 2");
    });
  });

  describe("normalizeSlideDetailBlogBlocks", () => {
    it("normalizes top-level list blocks ensuring non-empty text", () => {
      const blocks: SlideDetailBlogBlock[] = [
        {
          id: "blk_list",
          type: "list",
          items: [
            { id: "item_0", content: "Quy hoạch đất", children: [] },
          ],
        },
      ];
      const normalized = normalizeSlideDetailBlogBlocks(blocks);
      const list = normalized[0] as ListBlock;
      expect(list.items[0].content).toBe("Quy hoạch đất");
      expect(list.items[0].text).toBe("Quy hoạch đất");
    });

    it("normalizes list blocks nested inside section.children", () => {
      const blocks: SlideDetailBlogBlock[] = [
        {
          id: "sec_1",
          type: "section",
          number: "01",
          title: "Hiện trạng",
          children: [
            {
              id: "sec_list",
              type: "list",
              items: [
                { id: "item_sec", content: "Khu vực đô thị", children: [] },
              ],
            },
          ],
        },
      ];
      const normalized = normalizeSlideDetailBlogBlocks(blocks);
      const section = normalized[0] as SectionBlock;
      const nestedList = section.children[0] as ListBlock;
      expect(nestedList.items[0].content).toBe("Khu vực đô thị");
      expect(nestedList.items[0].text).toBe("Khu vực đô thị");
    });
  });

  describe("normalizeSlideDetailBlogContent", () => {
    it("handles null/undefined gracefully", () => {
      expect(normalizeSlideDetailBlogContent(null)).toEqual({ version: 1, blocks: [] });
      expect(normalizeSlideDetailBlogContent(undefined)).toEqual({ version: 1, blocks: [] });
    });

    it("processes complete document structure without mutating unchanged blocks", () => {
      const doc: SlideDetailBlogContent = {
        version: 1,
        blocks: [
          { id: "p1", type: "paragraph", text: "Đoạn văn mở đầu" },
          {
            id: "l1",
            type: "list",
            items: [{ id: "li_1", content: "Nội dung mục", children: [] }],
          },
        ],
      };
      const result = normalizeSlideDetailBlogContent(doc);
      expect(result.blocks).toHaveLength(2);
      expect((result.blocks[0] as { text: string }).text).toBe("Đoạn văn mở đầu");
      const listBlock = result.blocks[1] as ListBlock;
      expect(listBlock.items[0].text).toBe("Nội dung mục");
      expect(listBlock.items[0].content).toBe("Nội dung mục");
    });
  });
});
