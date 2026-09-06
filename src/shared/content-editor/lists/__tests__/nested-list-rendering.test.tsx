import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListBlockRenderer } from "../../renderer/renderers/ListBlockRenderer";
import type { ListBlock } from "../../model/document.types";
import { parseClipboardTextToList } from "../../paste/list-parser";
import {
  indentListItem,
  outdentListItem,
  addListItem,
  deleteListItemInTree,
} from "../../paste/list-helpers";

describe("PHASE 10 — Recursive List Editor & Tree Structure", () => {
  const threeLevelList: ListBlock = {
    id: "lst_tree_1",
    type: "list",
    listType: "bullet",
    items: [
      {
        id: "lvl1-1",
        content: "Giải pháp",
        children: [
          {
            id: "lvl2-1",
            content: "GIS",
            children: [
              { id: "lvl3-1", content: "WebGIS", children: [] },
              { id: "lvl3-2", content: "3DGIS", children: [] },
            ],
          },
          {
            id: "lvl2-2",
            content: "AI",
            children: [
              { id: "lvl3-3", content: "Computer Vision", children: [] },
              { id: "lvl3-4", content: "Machine Learning", children: [] },
            ],
          },
        ],
      },
    ],
  };

  it("renders multi-level nested tree recursively without flat item blocks", () => {
    render(<ListBlockRenderer block={threeLevelList} />);

    // Verify all 3 levels appear in rendered DOM
    expect(screen.getByText("Giải pháp")).toBeInTheDocument();
    expect(screen.getByText("GIS")).toBeInTheDocument();
    expect(screen.getByText("WebGIS")).toBeInTheDocument();
    expect(screen.getByText("3DGIS")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("Computer Vision")).toBeInTheDocument();
    expect(screen.getByText("Machine Learning")).toBeInTheDocument();
  });

  it("indents an item into its previous sibling's children[] (Tab UX)", () => {
    const flatItems = [
      { id: "item-1", content: "Mục 1", children: [] },
      { id: "item-2", content: "Mục 2", children: [] },
    ];

    const { items: indentedItems, success } = indentListItem(flatItems, "item-2");

    expect(success).toBe(true);
    expect(indentedItems.length).toBe(1);
    expect(indentedItems[0].content).toBe("Mục 1");
    expect(indentedItems[0].children.length).toBe(1);
    expect(indentedItems[0].children[0].content).toBe("Mục 2");
  });

  it("outdents a nested child to the parent's level (Shift + Tab UX)", () => {
    const nestedItems = [
      {
        id: "parent",
        content: "Mục cha",
        children: [{ id: "child", content: "Mục con", children: [] }],
      },
    ];

    const { items: outdentedItems, success } = outdentListItem(nestedItems, "child");

    expect(success).toBe(true);
    expect(outdentedItems.length).toBe(2);
    expect(outdentedItems[0].content).toBe("Mục cha");
    expect(outdentedItems[0].children.length).toBe(0);
    expect(outdentedItems[1].content).toBe("Mục con");
  });

  it("parses indented multiline pasted text directly into recursive tree items", () => {
    const pastedText = `Giải pháp\n  GIS\n    WebGIS\n    3DGIS\n  AI\n    Computer Vision\n    Machine Learning`;

    const parsed = parseClipboardTextToList(pastedText);

    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0].content).toBe("Giải pháp");

    const children = parsed.items[0].children;
    expect(children.length).toBe(2);
    expect(children[0].content).toBe("GIS");
    expect(children[0].children.length).toBe(2);
    expect(children[0].children[0].content).toBe("WebGIS");
    expect(children[0].children[1].content).toBe("3DGIS");

    expect(children[1].content).toBe("AI");
    expect(children[1].children.length).toBe(2);
    expect(children[1].children[0].content).toBe("Computer Vision");
    expect(children[1].children[1].content).toBe("Machine Learning");
  });

  it("removes empty items on backspace and adds new items on enter", () => {
    const initial = [{ id: "1", content: "Dòng 1", children: [] }];
    const afterAdd = addListItem(initial, "1");
    expect(afterAdd.items.length).toBe(2);

    const afterDelete = deleteListItemInTree(afterAdd.items, afterAdd.items[1].id);
    expect(afterDelete.items.length).toBe(1);
    expect(afterDelete.items[0].content).toBe("Dòng 1");
  });
});
