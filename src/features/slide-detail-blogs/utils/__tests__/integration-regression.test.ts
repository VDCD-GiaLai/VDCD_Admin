import { describe, it, expect } from "vitest";
import {
  createListBlock,
  normalizeListItems,
  flattenListItems,
  indentListItem,
  outdentListItem,
  moveListItem,
  deleteListItemInTree,
  updateListItemContent,
  addListItem,
  splitListItemInTree,
  cloneTree,
  resolveListLevelStyle,
  resolveListContainerStyle,
} from "../list-helpers";
import { parseClipboardTextToList } from "../list-parser";
import { exportListBlockToHTML, exportBlogToJSON } from "../blog-exporter";
import type { ListBlock, ListItem } from "@/types/slide-detail-blog";

describe("PHASE 5 — Integration & Full Regression Test Suite", () => {
  // ─────────────────────────────────────────────────────────────
  // 1. Test Scale: 1 item, 10 items, 100+ items
  // ─────────────────────────────────────────────────────────────
  describe("Scale Matrix (1 item, 10 items, 100+ items)", () => {
    it("handles 1 single item without errors", () => {
      const block = createListBlock({ initialTexts: ["Duy nhất một mục"] });
      expect(block.items).toHaveLength(1);
      expect(block.items[0].content).toBe("Duy nhất một mục");

      const flat = flattenListItems(block.items);
      expect(flat).toHaveLength(1);
      expect(flat[0].canIndent).toBe(false);
      expect(flat[0].canOutdent).toBe(false);
    });

    it("handles 10 items with reordering and depth navigation", () => {
      const texts = Array.from({ length: 10 }, (_, i) => `Mục kiểm thử ${i + 1}`);
      const block = createListBlock({ initialTexts: texts });
      expect(block.items).toHaveLength(10);

      // Move item 5 up
      const item5 = block.items[4];
      const { items: movedUp, success: s1 } = moveListItem(block.items, item5.id, "up");
      expect(s1).toBe(true);
      expect(movedUp[3].id).toBe(item5.id);

      // Move item 5 down twice
      const { items: movedDown, success: s2 } = moveListItem(movedUp, item5.id, "down");
      expect(s2).toBe(true);
      expect(movedDown[4].id).toBe(item5.id);
    });

    it("handles 150+ items in bulk paste and stress operations seamlessly", () => {
      const largeInput = Array.from({ length: 150 }, (_, i) => `  - Thửa đất số ${i + 1}`).join("\n");
      const { items: parsed } = parseClipboardTextToList(largeInput);

      expect(parsed).toHaveLength(150);

      const flat = flattenListItems(parsed);
      expect(flat).toHaveLength(150);

      // Test export speed & stability with 150 items
      const block: ListBlock = {
        id: "ls_large",
        type: "list",
        items: parsed,
      };
      const html = exportListBlockToHTML(block);
      expect(html).toContain("Thửa đất số 1");
      expect(html).toContain("Thửa đất số 150");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Nested Hierarchy: 2 levels, 3–5 levels
  // ─────────────────────────────────────────────────────────────
  describe("Deep Hierarchy (2 levels, 3–5 levels)", () => {
    it("creates and traverses 2-level hierarchy", () => {
      const rootItems: ListItem[] = [
        {
          id: "p_1",
          content: "Sản phẩm",
          children: [
            { id: "c_1", content: "Bản đồ địa chính", children: [] },
            { id: "c_2", content: "Mô hình 3D", children: [] },
          ],
        },
      ];

      const flat = flattenListItems(rootItems);
      expect(flat).toHaveLength(3);
      expect(flat[0].depth).toBe(0);
      expect(flat[1].depth).toBe(1);
      expect(flat[2].depth).toBe(1);
    });

    it("supports deep nesting up to 5 levels (Level 1 → 2 → 3 → 4 → 5)", () => {
      // Build 5-level deep nested tree
      const l5: ListItem = { id: "lvl_5", content: "Cấp 5 cực sâu", children: [] };
      const l4: ListItem = { id: "lvl_4", content: "Cấp 4", children: [l5] };
      const l3: ListItem = { id: "lvl_3", content: "Cấp 3", children: [l4] };
      const l2: ListItem = { id: "lvl_2", content: "Cấp 2", children: [l3] };
      const l1: ListItem = { id: "lvl_1", content: "Cấp 1", children: [l2] };

      const flat = flattenListItems([l1]);
      expect(flat).toHaveLength(5);
      expect(flat[4].depth).toBe(4);
      expect(flat[4].item.content).toBe("Cấp 5 cực sâu");

      // Test outdent on level 5 item
      const { items: afterOutdent, success } = outdentListItem([l1], "lvl_5");
      expect(success).toBe(true);

      const flatAfter = flattenListItems(afterOutdent);
      const target = flatAfter.find((f) => f.item.id === "lvl_5");
      expect(target?.depth).toBe(3); // Promoted to depth 3
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Tree Manipulation: Move, Indent, Outdent, Delete, Split
  // ─────────────────────────────────────────────────────────────
  describe("Tree Manipulation & Invariant Verification", () => {
    it("indents item B into previous sibling item A", () => {
      const items: ListItem[] = [
        { id: "a", content: "Item A", children: [] },
        { id: "b", content: "Item B", children: [] },
      ];

      const { items: nextItems, success } = indentListItem(items, "b");
      expect(success).toBe(true);
      expect(nextItems).toHaveLength(1);
      expect(nextItems[0].id).toBe("a");
      expect(nextItems[0].children).toHaveLength(1);
      expect(nextItems[0].children[0].id).toBe("b");
    });

    it("outdents nested item B to root level next to A", () => {
      const items: ListItem[] = [
        {
          id: "a",
          content: "Item A",
          children: [{ id: "b", content: "Item B", children: [] }],
        },
      ];

      const { items: nextItems, success } = outdentListItem(items, "b");
      expect(success).toBe(true);
      expect(nextItems).toHaveLength(2);
      expect(nextItems[0].id).toBe("a");
      expect(nextItems[0].children).toHaveLength(0);
      expect(nextItems[1].id).toBe("b");
    });

    it("splits item when pressing Enter in the middle of text", () => {
      const items: ListItem[] = [
        { id: "a", content: "Hello World", children: [] },
      ];

      const { items: nextItems, newItemId } = splitListItemInTree(items, "a", 5);
      expect(nextItems).toHaveLength(2);
      expect(nextItems[0].content).toBe("Hello");
      expect(nextItems[1].content).toBe(" World");
      expect(nextItems[1].id).toBe(newItemId);
    });

    it("deletes item and maintains non-empty list invariant", () => {
      const items: ListItem[] = [{ id: "only_one", content: "Mục duy nhất", children: [] }];
      const { items: afterDel } = deleteListItemInTree(items, "only_one");
      // Must maintain at least 1 item
      expect(afterDel).toHaveLength(1);
      expect(afterDel[0].content).toBe("");
    });

    it("updates item content without mutating original state object", () => {
      const original: ListItem[] = [{ id: "item_x", content: "Cũ", children: [] }];
      const updated = updateListItemContent(original, "item_x", "Mới");

      expect(updated[0].content).toBe("Mới");
      expect(original[0].content).toBe("Cũ"); // Immutability preserved
    });

    it("adds item directly after current active item", () => {
      const items: ListItem[] = [
        { id: "item_1", content: "Số 1", children: [] },
        { id: "item_2", content: "Số 2", children: [] },
      ];

      const { items: nextItems } = addListItem(items, "item_1");
      expect(nextItems).toHaveLength(3);
      expect(nextItems[0].id).toBe("item_1");
      expect(nextItems[1].content).toBe("");
      expect(nextItems[2].id).toBe("item_2");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Backward Compatibility & Migration (Old Document -> New Model)
  // ─────────────────────────────────────────────────────────────
  describe("Legacy Backward Compatibility & Migration", () => {
    it("seamlessly migrates legacy string[] items to normalized ListItem[] tree", () => {
      const legacyRaw = ["Khảo sát 1", "Khảo sát 2", "Khảo sát 3"];
      const migrated = normalizeListItems(legacyRaw);

      expect(migrated).toHaveLength(3);
      expect(migrated[0].content).toBe("Khảo sát 1");
      expect(migrated[0].children).toEqual([]);
      expect(typeof migrated[0].id).toBe("string");
      expect(migrated[0].id.startsWith("li_")).toBe(true);
    });

    it("preserves stable IDs during subsequent cloneTree or normalization cycles", () => {
      const items: ListItem[] = [
        { id: "stable_id_1", content: "Nội dung", children: [], checked: true },
      ];

      const cloned = cloneTree(items);
      expect(cloned[0].id).toBe("stable_id_1");
      expect(cloned[0].checked).toBe(true);

      const normalizedAgain = normalizeListItems(cloned);
      expect(normalizedAgain[0].id).toBe("stable_id_1");
      expect(normalizedAgain[0].checked).toBe(true);
    });

    it("cascades styles correctly from legacy root fields into resolveListLevelStyle", () => {
      const legacyBlock: ListBlock = {
        id: "ls_legacy_styles",
        type: "list",
        fontSize: 18,
        lineHeight: 1.8,
        itemSpacing: 10,
        listStyle: "square",
        items: [{ id: "l_1", content: "Item", children: [] }],
      };

      const resolved = resolveListLevelStyle(legacyBlock, 0);
      expect(resolved.fontSize).toBe(18);
      expect(resolved.lineHeight).toBe(1.8);
      expect(resolved.itemSpacing).toBe(10);
      expect(resolved.marker).toBe("square");
    });

    it("allows new style config to cleanly override legacy root fields", () => {
      const modernBlock: ListBlock = {
        id: "ls_modern",
        type: "list",
        fontSize: 14, // legacy root
        itemSpacing: 4, // legacy root
        style: {
          fontSize: 16, // modern override
          fontWeight: "semibold",
          color: "#011A42",
          levelStyles: {
            2: {
              fontSize: 13,
              color: "#ca2a30",
            },
          },
        },
        items: [{ id: "m_1", content: "Root", children: [] }],
      };

      // Level 1: modern global overrides legacy root
      const level1 = resolveListLevelStyle(modernBlock, 0);
      expect(level1.fontSize).toBe(16);
      expect(level1.fontWeight).toBe("semibold");
      expect(level1.color).toBe("#011A42");

      // Level 2: level-specific override
      const level2 = resolveListLevelStyle(modernBlock, 1);
      expect(level2.fontSize).toBe(13);
      expect(level2.fontWeight).toBe("semibold"); // inherited from base style
      expect(level2.color).toBe("#ca2a30"); // overridden for level 2
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. End-to-End Parity: Editor Live === Preview === HTML Export === JSON Backup
  // ─────────────────────────────────────────────────────────────
  describe("Strict 1:1 Parity Matrix (Live Canvas === Preview === Export HTML === JSON)", () => {
    it("preserves exact content and structure across JSON serialization and restore", () => {
      const originalBlock = createListBlock({
        initialTexts: ["Thửa 1", "Thửa 2"],
        listType: "ordered",
        listStyle: "decimal",
        style: {
          fontFamily: '"Be Vietnam Pro", sans-serif',
          fontSize: 15,
          fontWeight: "bold",
          color: "#011A42",
          indentation: 32,
        },
      });

      const jsonString = exportBlogToJSON({
        version: 1,
        blocks: [originalBlock],
      });

      const parsedDocument = JSON.parse(jsonString);
      const restoredBlock = parsedDocument.blocks[0] as ListBlock;

      expect(restoredBlock.id).toBe(originalBlock.id);
      expect(restoredBlock.listType).toBe("ordered");
      expect(restoredBlock.listStyle).toBe("decimal");
      expect(restoredBlock.style?.fontFamily).toBe('"Be Vietnam Pro", sans-serif');
      expect(restoredBlock.style?.fontSize).toBe(15);
      expect(restoredBlock.style?.fontWeight).toBe("bold");
      expect(restoredBlock.style?.color).toBe("#011A42");
      expect(restoredBlock.style?.indentation).toBe(32);
      expect(restoredBlock.items[0].content).toBe("Thửa 1");
      expect(restoredBlock.items[1].content).toBe("Thửa 2");
    });

    it("verifies container CSS inline styles match between resolveListContainerStyle and HTML Export", () => {
      const styledBlock: ListBlock = {
        id: "ls_styled",
        type: "list",
        style: {
          backgroundColor: "#FFF5F5",
          borderWidth: 2,
          borderColor: "#ca2a30",
          borderRadius: 12,
          padding: 20,
        },
        items: [{ id: "it_1", content: "Nội dung khối đặc biệt", children: [] }],
      };

      const containerStyle = resolveListContainerStyle(styledBlock);
      expect(containerStyle.backgroundColor).toBe("#FFF5F5");
      expect(containerStyle.borderWidth).toBe("2px");
      expect(containerStyle.borderRadius).toBe("12px");
      expect(containerStyle.padding).toBe("20px");

      const html = exportListBlockToHTML(styledBlock);
      expect(html).toContain("background-color: #FFF5F5");
      expect(html).toContain("border-width: 2px");
      expect(html).toContain("border-radius: 12px");
      expect(html).toContain("padding: 20px");
    });
  });
});
