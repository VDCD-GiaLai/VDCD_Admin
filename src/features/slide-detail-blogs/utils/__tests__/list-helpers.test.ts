import { describe, it, expect } from "vitest";
import {
  generateListItemId,
  normalizeListItem,
  normalizeListItems,
  createListBlock,
  addListItem,
  splitListItem,
  mergeListItemWithPrevious,
  deleteListItem,
  indentListItem,
  outdentListItem,
  findItemLocation,
  flattenListItems,
  updateListItemContent,
  deleteListItemInTree,
  splitListItemInTree,
  moveListItem,
} from "../list-helpers";
import type { ListBlock, ListItem, SlideDetailBlogContent } from "@/types/slide-detail-blog";

describe("Phase 2 — List Block & Fast Editing Unit Tests", () => {
  // 1. Create List
  it("1. Create List: creates a valid ListBlock with initial item", () => {
    const listBlock = createListBlock();
    expect(generateListItemId()).toMatch(/^li_/);
    expect(listBlock.type).toBe("list");
    expect(listBlock.id).toBeDefined();
    expect(listBlock.items).toHaveLength(1);
    expect(listBlock.items[0].id).toBeDefined();
    expect(listBlock.items[0].content).toBe("");
    expect(listBlock.items[0].children).toEqual([]);
  });

  // 2. Add item
  it("2. Add item: adds an item at the end and in between", () => {
    const initialItems: ListItem[] = [
      { id: "1", content: "Item 1", children: [] },
    ];
    const { items: afterAppend, newItemId: id2 } = addListItem(initialItems, undefined, "Item 2");
    expect(afterAppend).toHaveLength(2);
    expect(afterAppend[1].id).toBe(id2);
    expect(afterAppend[1].content).toBe("Item 2");

    const { items: afterInsert, newItemId: idBetween } = addListItem(afterAppend, 1, "Item 1.5");
    expect(afterInsert).toHaveLength(3);
    expect(afterInsert[1].id).toBe(idBetween);
    expect(afterInsert[1].content).toBe("Item 1.5");
  });

  // 3. Enter
  it("3. Enter: pressing Enter at end of text creates a new item immediately below", () => {
    const items: ListItem[] = [
      { id: "1", content: "Item A", children: [] },
    ];
    // Cursor at end of "Item A" (length 6)
    const { items: nextItems, newItemId } = splitListItem(items, 0, 6);
    expect(nextItems).toHaveLength(2);
    expect(nextItems[0].content).toBe("Item A");
    expect(nextItems[1].id).toBe(newItemId);
    expect(nextItems[1].content).toBe("");
  });

  // 4. Multiple Enter
  it("4. Multiple Enter: pressing Enter repeatedly creates consecutive items with unique IDs", () => {
    let items: ListItem[] = [
      { id: "1", content: "First", children: [] },
    ];
    const createdIds = new Set<string>(["1"]);

    for (let i = 1; i <= 5; i++) {
      const lastIndex = items.length - 1;
      const { items: updated, newItemId } = splitListItem(items, lastIndex, items[lastIndex].content.length);
      items = updated;
      expect(createdIds.has(newItemId)).toBe(false);
      createdIds.add(newItemId);
    }

    expect(items).toHaveLength(6);
    expect(createdIds.size).toBe(6);
  });

  // 5. Delete
  it("5. Delete: removes item and selects correct target item", () => {
    const items: ListItem[] = [
      { id: "1", content: "Item 1", children: [] },
      { id: "2", content: "Item 2", children: [] },
      { id: "3", content: "Item 3", children: [] },
    ];

    const { items: afterDelete, targetItemId } = deleteListItem(items, 1);
    expect(afterDelete).toHaveLength(2);
    expect(afterDelete.map((i) => i.id)).toEqual(["1", "3"]);
    expect(targetItemId).toBe("1");

    // List with 1 item remaining resets content instead of dropping to 0 items
    const singleItem: ListItem[] = [{ id: "solo", content: "Don't delete me completely", children: [] }];
    const { items: soloAfterDelete } = deleteListItem(singleItem, 0);
    expect(soloAfterDelete).toHaveLength(1);
    expect(soloAfterDelete[0].content).toBe("");
    expect(soloAfterDelete[0].id).toBe("solo");
  });

  // 6. Backspace
  it("6. Backspace on empty item deletes it and focuses previous item", () => {
    const items: ListItem[] = [
      { id: "1", content: "Item 1", children: [] },
      { id: "2", content: "", children: [] },
    ];
    // Backspace on empty item 1
    const { items: afterBackspace, targetItemId } = deleteListItem(items, 1);
    expect(afterBackspace).toHaveLength(1);
    expect(afterBackspace[0].id).toBe("1");
    expect(targetItemId).toBe("1");
  });

  // 7. Merge
  it("7. Merge: Backspace at start of item merges content into previous item and preserves cursor position", () => {
    const items: ListItem[] = [
      { id: "1", content: "Hello ", children: [] },
      { id: "2", content: "World", children: [] },
    ];
    const result = mergeListItemWithPrevious(items, 1);
    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].content).toBe("Hello World");
    expect(result!.targetCursorPos).toBe(6); // right after "Hello "
    expect(result!.targetItemId).toBe("1");

    // First item cannot merge with previous
    const cannotMerge = mergeListItemWithPrevious(items, 0);
    expect(cannotMerge).toBeNull();
  });

  // 8. Split
  it("8. Split: Enter at cursor position splits text into 2 items without losing content", () => {
    const items: ListItem[] = [
      { id: "1", content: "Item ABCDEF", children: [] },
    ];
    // Cursor after "ABC" (position 8)
    const { items: splitResult, newItemId } = splitListItem(items, 0, 8);
    expect(splitResult).toHaveLength(2);
    expect(splitResult[0].content).toBe("Item ABC");
    expect(splitResult[1].id).toBe(newItemId);
    expect(splitResult[1].content).toBe("DEF");
  });

  // 9. Undo & 10. Redo
  it("9 & 10. Undo and Redo: simulates snapshot history stack", () => {
    let content: SlideDetailBlogContent = {
      version: 1,
      blocks: [createListBlock({ initialTexts: ["Initial item"] })],
    };

    const past: string[] = [];
    const future: string[] = [];

    // Helper: snapshot before mutation
    const executeAction = (newContent: SlideDetailBlogContent) => {
      past.push(JSON.stringify(content));
      content = newContent;
      future.length = 0;
    };

    // Helper: undo
    const undo = () => {
      if (past.length === 0) return;
      future.push(JSON.stringify(content));
      content = JSON.parse(past.pop()!);
    };

    // Helper: redo
    const redo = () => {
      if (future.length === 0) return;
      past.push(JSON.stringify(content));
      content = JSON.parse(future.pop()!);
    };

    // Action 1: Add item
    const initialList = content.blocks[0] as ListBlock;
    const { items: step1Items } = addListItem(initialList.items, undefined, "Second item");
    executeAction({
      ...content,
      blocks: [{ ...initialList, items: step1Items }],
    });
    expect((content.blocks[0] as ListBlock).items).toHaveLength(2);

    // Action 2: Split item
    const currentList = content.blocks[0] as ListBlock;
    const { items: step2Items } = splitListItem(currentList.items, 1, 6);
    executeAction({
      ...content,
      blocks: [{ ...currentList, items: step2Items }],
    });
    expect((content.blocks[0] as ListBlock).items).toHaveLength(3);

    // Undo Action 2
    undo();
    expect((content.blocks[0] as ListBlock).items).toHaveLength(2);
    expect((content.blocks[0] as ListBlock).items[1].content).toBe("Second item");

    // Undo Action 1
    undo();
    expect((content.blocks[0] as ListBlock).items).toHaveLength(1);
    expect((content.blocks[0] as ListBlock).items[0].content).toBe("Initial item");

    // Redo Action 1
    redo();
    expect((content.blocks[0] as ListBlock).items).toHaveLength(2);

    // Redo Action 2
    redo();
    expect((content.blocks[0] as ListBlock).items).toHaveLength(3);
  });

  // 11. Old List content
  it("11. Old List content: normalizes legacy string[] items smoothly", () => {
    // Single string normalization
    const singleNormalized = normalizeListItem("Đo đạc địa chính");
    expect(singleNormalized.content).toBe("Đo đạc địa chính");
    expect(singleNormalized.id).toBeDefined();
    expect(singleNormalized.children).toEqual([]);

    const legacyStrings = [
      "Đo đạc và lập mô hình 3D địa hình với độ chính xác cao.",
      "Tự động phát hiện biến động ranh giới thửa đất.",
      "Tích hợp dữ liệu vào hệ thống GIS địa phương.",
    ];

    const normalized = normalizeListItems(legacyStrings);
    expect(normalized).toHaveLength(3);
    expect(normalized[0].content).toBe(legacyStrings[0]);
    expect(normalized[0].id).toBeDefined();
    expect(normalized[0].children).toEqual([]);

    expect(normalized[1].content).toBe(legacyStrings[1]);
    expect(normalized[2].content).toBe(legacyStrings[2]);

    // Handles empty or null input gracefully
    expect(normalizeListItems(null)).toHaveLength(1);
    expect(normalizeListItems([])).toHaveLength(1);
  });

  // 12. List with 10+ items
  it("12. List with 10+ items: handles large lists without collisions or performance issues", () => {
    let items: ListItem[] = [{ id: "root", content: "Item 0", children: [] }];
    for (let i = 1; i <= 20; i++) {
      const { items: next } = addListItem(items, undefined, `Item ${i}`);
      items = next;
    }

    expect(items).toHaveLength(21);
    const uniqueIds = new Set(items.map((it) => it.id));
    expect(uniqueIds.size).toBe(21);

    // Delete items in the middle
    const { items: afterMiddleDelete } = deleteListItem(items, 10);
    expect(afterMiddleDelete).toHaveLength(20);
    expect(afterMiddleDelete.find((it) => it.content === "Item 10")).toBeUndefined();
  });

  // Schema Validation Tests
  it("Schema validation: validates ListBlock and rejects empty items or items with empty content", async () => {
    const { listBlockSchema } = await import("../../schema");

    const validListBlock = {
      id: "ls_valid",
      type: "list",
      items: [
        { id: "li_1", content: "Valid item 1", children: [] },
        { id: "li_2", content: "Valid item 2", children: [] },
      ],
      fontSize: 16,
    };

    const validResult = listBlockSchema.safeParse(validListBlock);
    expect(validResult.success).toBe(true);

    // Empty items array
    const emptyListBlock = {
      id: "ls_empty",
      type: "list",
      items: [],
    };
    const emptyResult = listBlockSchema.safeParse(emptyListBlock);
    expect(emptyResult.success).toBe(false);

    // Item with empty content string
    const emptyContentBlock = {
      id: "ls_empty_item",
      type: "list",
      items: [{ id: "li_empty", content: "", children: [] }],
    };
    const emptyContentResult = listBlockSchema.safeParse(emptyContentBlock);
    expect(emptyContentResult.success).toBe(false);
  });
});

describe("Phase 3 — Nested List & Tab / Shift+Tab Hierarchy Tests", () => {
  // 1. Tab — Indent (Level 1 -> Level 2)
  it("Tab — Indent: B becomes child of A without creating new ListBlock", () => {
    const items: ListItem[] = [
      { id: "A", content: "Item A", children: [] },
      { id: "B", content: "Item B", children: [] },
    ];

    const { items: indented, success } = indentListItem(items, "B");
    expect(success).toBe(true);
    expect(indented).toHaveLength(1);
    expect(indented[0].id).toBe("A");
    expect(indented[0].children).toHaveLength(1);
    expect(indented[0].children[0].id).toBe("B");
    expect(indented[0].children[0].content).toBe("Item B");
  });

  // 2. Shift + Tab — Outdent (Level 2 -> Level 1)
  it("Shift + Tab — Outdent: B becomes sibling of A", () => {
    const items: ListItem[] = [
      {
        id: "A",
        content: "Item A",
        children: [{ id: "B", content: "Item B", children: [] }],
      },
    ];

    const { items: outdented, success } = outdentListItem(items, "B");
    expect(success).toBe(true);
    expect(outdented).toHaveLength(2);
    expect(outdented[0].id).toBe("A");
    expect(outdented[0].children).toEqual([]);
    expect(outdented[1].id).toBe("B");
    expect(outdented[1].content).toBe("Item B");
  });

  // 3. Multiple levels: Level 1 -> Level 2 -> Level 3 -> Level 4
  it("Multiple levels: supports Level 1, 2, 3, 4 deep nesting", () => {
    const deepTree: ListItem[] = [
      {
        id: "L1",
        content: "Level 1",
        children: [
          {
            id: "L2",
            content: "Level 2",
            children: [
              {
                id: "L3",
                content: "Level 3",
                children: [
                  {
                    id: "L4",
                    content: "Level 4",
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const loc1 = findItemLocation(deepTree, "L1");
    const loc2 = findItemLocation(deepTree, "L2");
    const loc3 = findItemLocation(deepTree, "L3");
    const loc4 = findItemLocation(deepTree, "L4");

    expect(loc1?.depth).toBe(0);
    expect(loc2?.depth).toBe(1);
    expect(loc3?.depth).toBe(2);
    expect(loc4?.depth).toBe(3);

    const flat = flattenListItems(deepTree);
    expect(flat).toHaveLength(4);
    expect(flat.map((f) => f.depth)).toEqual([0, 1, 2, 3]);

    // Outdent L4: becomes child of L2 (sibling of L3)
    const { items: afterOutdentL4 } = outdentListItem(deepTree, "L4");
    const flatAfterOutdent = flattenListItems(afterOutdentL4);
    expect(flatAfterOutdent.map((f) => f.depth)).toEqual([0, 1, 2, 2]);
  });

  // 4. Edge case: First item cannot indent
  it("First item edge case: Tab on first item cannot indent and does not corrupt tree", () => {
    const items: ListItem[] = [
      { id: "A", content: "Item A", children: [] },
      { id: "B", content: "Item B", children: [] },
    ];

    const { items: tried, success } = indentListItem(items, "A");
    expect(success).toBe(false);
    expect(tried).toEqual(items);

    const flat = flattenListItems(items);
    expect(flat[0].canIndent).toBe(false);
    expect(flat[0].canOutdent).toBe(false);
  });

  // 5. Edge case: Last item indent and outdent
  it("Last item: indent and outdent works properly", () => {
    const items: ListItem[] = [
      { id: "A", content: "Item A", children: [] },
      { id: "B", content: "Item B", children: [] },
      { id: "C", content: "Item C", children: [] },
    ];

    // Indent C under B
    const { items: indentedC, success: s1 } = indentListItem(items, "C");
    expect(s1).toBe(true);
    expect(indentedC).toHaveLength(2);
    expect(indentedC[1].children[0].id).toBe("C");

    // Outdent C back to root level
    const { items: outdentedC, success: s2 } = outdentListItem(indentedC, "C");
    expect(s2).toBe(true);
    expect(outdentedC).toHaveLength(3);
    expect(outdentedC[2].id).toBe("C");
  });

  // 6. Edge case: Child có children (Outdent preserves subtree)
  it("Child có children: outdent B does not lose C", () => {
    const items: ListItem[] = [
      {
        id: "A",
        content: "Item A",
        children: [
          {
            id: "B",
            content: "Item B",
            children: [{ id: "C", content: "Item C", children: [] }],
          },
        ],
      },
    ];

    const { items: outdented, success } = outdentListItem(items, "B");
    expect(success).toBe(true);
    expect(outdented).toHaveLength(2);
    expect(outdented[0].id).toBe("A");
    expect(outdented[0].children).toHaveLength(0);

    expect(outdented[1].id).toBe("B");
    expect(outdented[1].children).toHaveLength(1);
    expect(outdented[1].children[0].id).toBe("C");
    expect(outdented[1].children[0].content).toBe("Item C");
  });

  // 7. Edge case: Multiple siblings (Outdent B does not detach other siblings from parent)
  it("Multiple siblings: outdenting B does not make C lose parent", () => {
    const items: ListItem[] = [
      {
        id: "A",
        content: "Item A",
        children: [
          { id: "B", content: "Item B", children: [] },
          { id: "C", content: "Item C", children: [] },
        ],
      },
    ];

    const { items: outdented, success } = outdentListItem(items, "B");
    expect(success).toBe(true);
    // A now has only C as its child; B is right after A
    expect(outdented).toHaveLength(2);
    expect(outdented[0].id).toBe("A");
    expect(outdented[0].children).toHaveLength(1);
    expect(outdented[0].children[0].id).toBe("C");

    expect(outdented[1].id).toBe("B");
  });

  // 8. Undo / Redo: 1 Tab = 1 logical operation; 1 Shift+Tab = 1 logical operation
  it("Undo / Redo: 1 Tab or 1 Shift+Tab is a single atomic operation", () => {
    let tree: ListItem[] = [
      { id: "A", content: "Item A", children: [] },
      { id: "B", content: "Item B", children: [] },
    ];

    const history: ListItem[][] = [];
    const pushState = (newTree: ListItem[]) => {
      history.push(JSON.parse(JSON.stringify(tree)));
      tree = newTree;
    };

    // 1. Tab (Indent B)
    const { items: step1 } = indentListItem(tree, "B");
    pushState(step1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe("B");

    // Undo 1 step -> immediately restores original tree
    tree = history.pop()!;
    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe("A");
    expect(tree[0].children).toEqual([]);
    expect(tree[1].id).toBe("B");

    // 2. Outdent test with undo
    const nestedTree: ListItem[] = [
      { id: "A", content: "Item A", children: [{ id: "B", content: "Item B", children: [] }] },
    ];
    tree = nestedTree;
    const { items: step2 } = outdentListItem(tree, "B");
    pushState(step2);
    expect(tree).toHaveLength(2);

    // Undo 1 step -> immediately restores nested tree
    tree = history.pop()!;
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe("B");
  });

  // 9. Update content in deeply nested item
  it("updateListItemContent: updates content at any nesting depth", () => {
    const tree: ListItem[] = [
      {
        id: "1",
        content: "Root",
        children: [
          {
            id: "2",
            content: "Child",
            children: [{ id: "3", content: "Grandchild", children: [] }],
          },
        ],
      },
    ];

    const updated = updateListItemContent(tree, "3", "Updated Grandchild");
    expect(updated[0].children[0].children[0].content).toBe("Updated Grandchild");
    expect(updated[0].content).toBe("Root");
  });

  // 10. Split in tree: preserves level and parent
  it("splitListItemInTree: creates new sibling under the same parent", () => {
    const tree: ListItem[] = [
      {
        id: "A",
        content: "Item A",
        children: [{ id: "B", content: "FirstSecond", children: [] }],
      },
    ];

    const { items: split, newItemId } = splitListItemInTree(tree, "B", 5);
    expect(split[0].children).toHaveLength(2);
    expect(split[0].children[0].content).toBe("First");
    expect(split[0].children[1].id).toBe(newItemId);
    expect(split[0].children[1].content).toBe("Second");
  });

  // 11. Delete item in tree with children: promotes children in-place
  it("deleteListItemInTree: promotes children when parent is deleted", () => {
    const tree: ListItem[] = [
      {
        id: "A",
        content: "Item A",
        children: [
          {
            id: "B",
            content: "Item B",
            children: [{ id: "C", content: "Item C", children: [] }],
          },
        ],
      },
    ];

    const { items: deleted } = deleteListItemInTree(tree, "B");
    expect(deleted[0].children).toHaveLength(1);
    expect(deleted[0].children[0].id).toBe("C");
  });

  // 12. Move item up and down among siblings
  it("moveListItem: moves items up and down among siblings correctly", () => {
    const items: ListItem[] = [
      { id: "1", content: "Item 1", children: [] },
      { id: "2", content: "Item 2", children: [] },
      { id: "3", content: "Item 3", children: [] },
    ];

    // Cannot move first item up
    const cantMoveFirstUp = moveListItem(items, "1", "up");
    expect(cantMoveFirstUp.success).toBe(false);

    // Cannot move last item down
    const cantMoveLastDown = moveListItem(items, "3", "down");
    expect(cantMoveLastDown.success).toBe(false);

    // Move middle item up
    const moveMiddleUp = moveListItem(items, "2", "up");
    expect(moveMiddleUp.success).toBe(true);
    expect(moveMiddleUp.items.map((it) => it.id)).toEqual(["2", "1", "3"]);

    // Move middle item down
    const moveMiddleDown = moveListItem(items, "2", "down");
    expect(moveMiddleDown.success).toBe(true);
    expect(moveMiddleDown.items.map((it) => it.id)).toEqual(["1", "3", "2"]);

    // Move nested item among its siblings
    const nested: ListItem[] = [
      {
        id: "p",
        content: "Parent",
        children: [
          { id: "c1", content: "Child 1", children: [] },
          { id: "c2", content: "Child 2", children: [] },
        ],
      },
    ];
    const moveChildUp = moveListItem(nested, "c2", "up");
    expect(moveChildUp.success).toBe(true);
    expect(moveChildUp.items[0].children.map((c) => c.id)).toEqual(["c2", "c1"]);
  });

  // 13. ID Deduplication & temp_ prefix sanitization
  it("normalizeListItems: deduplicates duplicate IDs across the tree", () => {
    const rawWithDuplicates = [
      { id: "item-dup", content: "First", children: [] },
      { id: "item-dup", content: "Second", children: [] },
      {
        id: "item-dup",
        content: "Parent",
        children: [{ id: "item-dup", content: "Child", children: [] }],
      },
    ];

    const normalized = normalizeListItems(rawWithDuplicates);
    const allIds = [
      normalized[0].id,
      normalized[1].id,
      normalized[2].id,
      normalized[2].children[0].id,
    ];

    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(4);
    expect(allIds[0]).toBe("item-dup"); // First keeps original
    expect(allIds[1]).not.toBe("item-dup"); // Second gets regenerated
  });

  it("normalizeListItems: cleanses temp_ prefix IDs and generates unique IDs", () => {
    const rawWithTemp = [
      { id: "temp_new_item", content: "First", children: [] },
      { id: "temp_new_item", content: "Second", children: [] },
    ];

    const normalized = normalizeListItems(rawWithTemp);
    expect(normalized[0].id).not.toBe("temp_new_item");
    expect(normalized[0].id.startsWith("li_")).toBe(true);
    expect(normalized[1].id).not.toBe("temp_new_item");
    expect(normalized[0].id).not.toBe(normalized[1].id);
  });

  it("normalizeListItems: preserves empty items with unique IDs", () => {
    const emptyItems = [
      { id: "empty-1", content: "", children: [] },
      { id: "empty-2", content: "", children: [] },
    ];

    const normalized = normalizeListItems(emptyItems);
    expect(normalized).toHaveLength(2);
    expect(normalized[0].content).toBe("");
    expect(normalized[1].content).toBe("");
    expect(normalized[0].id).toBe("empty-1");
    expect(normalized[1].id).toBe("empty-2");
  });
});

