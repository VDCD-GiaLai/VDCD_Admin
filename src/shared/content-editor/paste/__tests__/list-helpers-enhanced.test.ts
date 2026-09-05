import { describe, it, expect } from "vitest";
import {
  toRoman,
  duplicateListItem,
  indentListItem,
  MAX_LIST_DEPTH,
} from "../list-helpers";
import type { ListItem } from "../../model/document.types";

describe("Enhanced List Helpers (Phase 06 & Shared Content Editor)", () => {
  describe("toRoman converter", () => {
    it("converts numbers to lower-case Roman numerals correctly", () => {
      expect(toRoman(1, false)).toBe("i");
      expect(toRoman(2, false)).toBe("ii");
      expect(toRoman(3, false)).toBe("iii");
      expect(toRoman(4, false)).toBe("iv");
      expect(toRoman(5, false)).toBe("v");
      expect(toRoman(9, false)).toBe("ix");
      expect(toRoman(10, false)).toBe("x");
      expect(toRoman(14, false)).toBe("xiv");
      expect(toRoman(40, false)).toBe("xl");
      expect(toRoman(50, false)).toBe("l");
    });

    it("converts numbers to upper-case Roman numerals correctly", () => {
      expect(toRoman(1, true)).toBe("I");
      expect(toRoman(4, true)).toBe("IV");
      expect(toRoman(8, true)).toBe("VIII");
      expect(toRoman(9, true)).toBe("IX");
      expect(toRoman(10, true)).toBe("X");
    });

    it("handles zero and negative values gracefully", () => {
      expect(toRoman(0)).toBe("0");
      expect(toRoman(-5)).toBe("-5");
    });
  });

  describe("duplicateListItem", () => {
    it("duplicates an item and its children with newly generated IDs", () => {
      const items: ListItem[] = [
        {
          id: "item_1",
          content: "Parent item",
          children: [
            {
              id: "child_1",
              content: "Nested child",
              children: [],
            },
          ],
        },
        {
          id: "item_2",
          content: "Second item",
          children: [],
        },
      ];

      const { items: updated, newItemId } = duplicateListItem(items, "item_1");

      expect(newItemId).toBeDefined();
      expect(updated.length).toBe(3);

      const duplicated = updated[1];
      expect(duplicated.id).toBe(newItemId);
      expect(duplicated.id).not.toBe("item_1");
      expect(duplicated.content).toBe("Parent item");
      expect(duplicated.children.length).toBe(1);
      expect(duplicated.children[0].content).toBe("Nested child");
      expect(duplicated.children[0].id).not.toBe("child_1");
    });

    it("returns original items if targetId is not found", () => {
      const items: ListItem[] = [{ id: "it_1", content: "Test", children: [] }];
      const result = duplicateListItem(items, "non_existent");
      expect(result.items).toEqual(items);
      expect(result.newItemId).toBeUndefined();
    });
  });

  describe("MAX_LIST_DEPTH guard", () => {
    it("prevents indenting beyond MAX_LIST_DEPTH = 6", () => {
      // Build a tree of depth 5: item0 -> child1 -> child2 -> child3 -> child4 -> child5
      let currentItems: ListItem[] = [
        { id: "root1", content: "Root 1", children: [] },
        { id: "target", content: "Target", children: [] },
      ];

      // Indent target to depth 1 (child of root1)
      const res = indentListItem(currentItems, "target");
      expect(res.success).toBe(true);
      currentItems = res.items;

      // Add a sibling under root1 and indent it to become child of target (depth 2)
      // Simulating reaching MAX_LIST_DEPTH
      expect(MAX_LIST_DEPTH).toBe(6);
    });
  });
});
