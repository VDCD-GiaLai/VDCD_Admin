import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListBlockItem } from "../ListBlockItem";
import { ListBlockRenderer, ListItemRenderer } from "../../BlogPreview/renderers/ListBlockRenderer";
import type { ListBlock } from "@/types/slide-detail-blog";

const sampleBlock: ListBlock = {
  id: "ls_test",
  type: "list",
  items: [
    { id: "item_1", content: "Mục đầu tiên", children: [] },
    { id: "item_2", content: "Mục thứ hai", children: [] },
  ],
};

describe("ListBlockItem component (BlockEditor)", () => {
  it("renders all list items and input placeholders", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    expect(screen.getByDisplayValue("Mục đầu tiên")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Mục thứ hai")).toBeInTheDocument();
    expect(screen.getByText("2 mục")).toBeInTheDocument();
  });

  it("handles text input change and calls onChange", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    const firstInput = screen.getByDisplayValue("Mục đầu tiên");
    fireEvent.change(firstInput, { target: { value: "Mục đã sửa" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedBlock = onChange.mock.calls[0][0] as ListBlock;
    expect(updatedBlock.items[0].content).toBe("Mục đã sửa");
    expect(updatedBlock.items[0].id).toBe("item_1");
  });

  it("Enter key creates a new item below", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    const firstInput = screen.getByDisplayValue("Mục đầu tiên");
    fireEvent.keyDown(firstInput, { key: "Enter" });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedBlock = onChange.mock.calls[0][0] as ListBlock;
    expect(updatedBlock.items).toHaveLength(3);
    expect(updatedBlock.items[0].content).toBe("Mục đầu tiên");
    expect(updatedBlock.items[1].content).toBe("");
  });

  it("Backspace on empty item deletes it", () => {
    const blockWithEmpty: ListBlock = {
      id: "ls_empty",
      type: "list",
      items: [
        { id: "item_1", content: "Item 1", children: [] },
        { id: "item_2", content: "", children: [] },
      ],
    };
    const onChange = vi.fn();
    render(<ListBlockItem block={blockWithEmpty} onChange={onChange} />);

    const emptyInput = screen.getByPlaceholderText("Nội dung mục 2...");
    fireEvent.keyDown(emptyInput, { key: "Backspace" });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedBlock = onChange.mock.calls[0][0] as ListBlock;
    expect(updatedBlock.items).toHaveLength(1);
    expect(updatedBlock.items[0].id).toBe("item_1");
  });

  it("Add button adds a new item", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    const addBtn = screen.getByText("+ Thêm dòng vào danh sách");
    fireEvent.click(addBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedBlock = onChange.mock.calls[0][0] as ListBlock;
    expect(updatedBlock.items).toHaveLength(3);
  });

  it("Tab key indents item into previous item", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    const secondInput = screen.getByDisplayValue("Mục thứ hai");
    fireEvent.keyDown(secondInput, { key: "Tab" });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedBlock = onChange.mock.calls[0][0] as ListBlock;
    expect(updatedBlock.items).toHaveLength(1);
    expect(updatedBlock.items[0].id).toBe("item_1");
    expect(updatedBlock.items[0].children).toHaveLength(1);
    expect(updatedBlock.items[0].children[0].id).toBe("item_2");
  });

  it("Shift+Tab key outdents nested item to root level", () => {
    const nestedBlock: ListBlock = {
      id: "ls_nested",
      type: "list",
      items: [
        {
          id: "item_1",
          content: "Mục cha",
          children: [{ id: "item_2", content: "Mục con", children: [] }],
        },
      ],
    };

    const onChange = vi.fn();
    render(<ListBlockItem block={nestedBlock} onChange={onChange} />);

    const childInput = screen.getByDisplayValue("Mục con");
    fireEvent.keyDown(childInput, { key: "Tab", shiftKey: true });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedBlock = onChange.mock.calls[0][0] as ListBlock;
    expect(updatedBlock.items).toHaveLength(2);
    expect(updatedBlock.items[0].id).toBe("item_1");
    expect(updatedBlock.items[1].id).toBe("item_2");
  });

  it("Toolbar Indent and Outdent buttons trigger hierarchy changes", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    const indentButtons = screen.getAllByTitle("Thụt vào một cấp (Tab)");
    expect(indentButtons[0]).toBeDisabled(); // First item cannot indent
    expect(indentButtons[1]).not.toBeDisabled(); // Second item can indent

    const outdentButtons = screen.getAllByTitle("Lùi một cấp (Shift + Tab)");
    expect(outdentButtons[0]).toBeDisabled(); // Root level cannot outdent
    expect(outdentButtons[1]).toBeDisabled(); // Root level cannot outdent

    // Click indent on second item
    fireEvent.click(indentButtons[1]);
    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedBlock = onChange.mock.calls[0][0] as ListBlock;
    expect(updatedBlock.items[0].children[0].id).toBe("item_2");
  });

  it("handles multi-line paste and parses into multiple items", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    const firstInput = screen.getByDisplayValue("Mục đầu tiên");
    const pasteText = `Dòng dán 1
Dòng dán 2
Dòng dán 3`;

    fireEvent.paste(firstInput, {
      clipboardData: {
        getData: (format: string) => (format === "text/plain" ? pasteText : ""),
      },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as ListBlock;
    expect(updated.items.length).toBeGreaterThanOrEqual(4);
  });

  it("handles list type and marker style changes", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    // Switch to Ordered
    const orderedBtn = screen.getByText("Số thứ tự");
    fireEvent.click(orderedBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as ListBlock;
    expect(updated.listType).toBe("ordered");
    expect(updated.listStyle).toBe("decimal");

    // Change marker style via select
    const select = screen.getByLabelText("Kiểu ký hiệu danh sách");
    fireEvent.change(select, { target: { value: "square" } });

    expect(onChange).toHaveBeenCalledTimes(2);
    const updatedStyle = onChange.mock.calls[1][0] as ListBlock;
    expect(updatedStyle.listStyle).toBe("square");
  });

  it("toggles typography settings panel and adjusts font size", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    const typoBtn = screen.getByText("Kiểu chữ");
    fireEvent.click(typoBtn);

    expect(screen.getByText(/Cỡ chữ/)).toBeInTheDocument();
    expect(screen.getByText(/Độ cao dòng/)).toBeInTheDocument();
    expect(screen.getByText(/Khoảng cách mục/)).toBeInTheDocument();
  });
});

describe("ListBlockRenderer & ListItemRenderer", () => {
  it("renders ListBlockRenderer with semantic <ul> and ListItemRenderer children", () => {
    const block: ListBlock = {
      id: "ls_render",
      type: "list",
      items: [
        { id: "1", content: "Dòng <strong>đậm</strong>", children: [] },
        { id: "2", content: "Dòng 2", children: [] },
      ],
    };

    const { container } = render(<ListBlockRenderer block={block} />);
    const ul = container.querySelector("ul.blog-preview-list");
    expect(ul).toBeInTheDocument();

    const lis = container.querySelectorAll("li");
    expect(lis).toHaveLength(2);
    expect(container.querySelector("strong")?.textContent).toBe("đậm");
  });

  it("renders ordered list with semantic <ol> and custom typography", () => {
    const orderedBlock: ListBlock = {
      id: "ls_ol",
      type: "list",
      listType: "ordered",
      listStyle: "decimal",
      fontSize: 18,
      lineHeight: 1.8,
      itemSpacing: 10,
      items: [
        { id: "1", content: "Bước một", children: [] },
        { id: "2", content: "Bước hai", children: [] },
      ],
    };

    const { container } = render(<ListBlockRenderer block={orderedBlock} />);
    const ol = container.querySelector("ol.blog-preview-list");
    expect(ol).toBeInTheDocument();
    expect(ol).toHaveStyle({ fontSize: "18px" });
  });

  it("renders multi-level nested list recursively using semantic HTML", () => {
    const multiLevelBlock: ListBlock = {
      id: "ls_multi",
      type: "list",
      items: [
        {
          id: "1",
          content: "Sản phẩm",
          children: [
            {
              id: "1.1",
              content: "Bản đồ",
              children: [
                {
                  id: "1.1.1",
                  content: "Bản đồ địa chính",
                  children: [
                    { id: "1.1.1.1", content: "Cấp 4 chi tiết", children: [] },
                  ],
                },
                { id: "1.1.2", content: "Bản đồ hiện trạng", children: [] },
              ],
            },
            { id: "1.2", content: "Dữ liệu", children: [] },
          ],
        },
        {
          id: "2",
          content: "Mô hình",
          children: [{ id: "2.1", content: "Mô hình 3D", children: [] }],
        },
      ],
    };

    const { container } = render(<ListBlockRenderer block={multiLevelBlock} />);

    // Verify root ul
    const rootUl = container.querySelector("ul.blog-preview-list");
    expect(rootUl).toBeInTheDocument();

    // Verify nested uls
    const allUls = container.querySelectorAll("ul.blog-preview-list");
    // root (1) + under Sản phẩm (1) + under Bản đồ (1) + under Bản đồ địa chính (1) + under Mô hình (1) = 5
    expect(allUls.length).toBe(5);

    // Verify correct parent-child nesting
    const allLis = container.querySelectorAll("li");
    expect(allLis.length).toBe(8);

    // Check level 4 content is rendered
    expect(container).toHaveTextContent("Cấp 4 chi tiết");
  });

  it("renders individual ListItemRenderer", () => {
    const item = { id: "li_sub", content: "Mục con độc lập", children: [] };
    const { container } = render(<ListItemRenderer item={item} />);
    expect(container.querySelector("li")?.textContent).toBe("Mục con độc lập");
  });

  it("renders legacy string[] items seamlessly (backward compatibility)", () => {
    const legacyBlock = {
      id: "ls_legacy",
      type: "list",
      items: ["Legacy 1", "Legacy 2"],
    } as unknown as ListBlock;

    const { container } = render(<ListBlockRenderer block={legacyBlock} />);
    const lis = container.querySelectorAll("li");
    expect(lis).toHaveLength(2);
    expect(lis[0].textContent).toBe("Legacy 1");
    expect(lis[1].textContent).toBe("Legacy 2");
  });

  it("switches list type to checklist and renders interactive checkboxes", () => {
    const onChange = vi.fn();
    const checklistBlock: ListBlock = {
      id: "ls_check",
      type: "list",
      listType: "checklist",
      listStyle: "checklist",
      items: [
        { id: "c1", content: "Việc 1", checked: true, children: [] },
        { id: "c2", content: "Việc 2", checked: false, children: [] },
      ],
    };

    render(<ListBlockItem block={checklistBlock} onChange={onChange} />);

    // Checkboxes are rendered for items
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);

    // Toggle checkbox
    fireEvent.click(checkboxes[1]);
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as ListBlock;
    expect(updated.items[1].checked).toBe(true);
  });

  it("moves item up and down with action buttons", () => {
    const onChange = vi.fn();
    render(<ListBlockItem block={sampleBlock} onChange={onChange} />);

    // Move down button for first item
    const moveDownButtons = screen.getAllByTitle("Di chuyển xuống");
    expect(moveDownButtons).toHaveLength(2);

    // First item can move down
    expect(moveDownButtons[0]).not.toBeDisabled();
    fireEvent.click(moveDownButtons[0]);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as ListBlock;
    expect(updated.items[0].id).toBe("item_2");
    expect(updated.items[1].id).toBe("item_1");
  });

  it("renders checklist in ListBlockRenderer with checkboxes", () => {
    const checklistBlock: ListBlock = {
      id: "ls_preview_check",
      type: "list",
      listType: "checklist",
      listStyle: "checklist",
      items: [
        { id: "c1", content: "Nhiệm vụ xong", checked: true, children: [] },
        { id: "c2", content: "Nhiệm vụ đang làm", checked: false, children: [] },
      ],
    };

    const { container } = render(<ListBlockRenderer block={checklistBlock} />);
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    expect(checkboxes).toHaveLength(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
  });

  it("ListBlockRenderer (editable) renders without temp_new_item and syncs on blur when content is empty", () => {
    const onItemsChange = vi.fn();
    const emptyBlock: ListBlock = {
      id: "ls_empty_test",
      type: "list",
      items: [{ id: "li_orig_1", content: "", children: [] }],
    };

    const { container } = render(
      <ListBlockRenderer block={emptyBlock} editable onItemsChange={onItemsChange} />,
    );

    const listTag = container.querySelector(".ve-editable");
    expect(listTag).toBeInTheDocument();

    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(1);
    expect(items[0].getAttribute("data-item-id")).not.toBe("temp_new_item");
    expect(items[0].getAttribute("data-item-id")).toBe("li_orig_1");

    // Trigger blur on empty list: must still call onItemsChange with 1 empty item
    fireEvent.blur(listTag!);
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    const updatedItems = onItemsChange.mock.calls[0][0];
    expect(updatedItems).toHaveLength(1);
    expect(updatedItems[0].content).toBe("");
  });

  it("ListBlockRenderer (editable) executes indent on Tab key", () => {
    const onItemsChange = vi.fn();
    const originalExecCommand = document.execCommand;
    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    const { container } = render(
      <ListBlockRenderer block={sampleBlock} editable onItemsChange={onItemsChange} />,
    );

    const listTag = container.querySelector(".ve-editable");
    fireEvent.keyDown(listTag!, { key: "Tab" });
    expect(execCommandMock).toHaveBeenCalledWith("indent");

    fireEvent.keyDown(listTag!, { key: "Tab", shiftKey: true });
    expect(execCommandMock).toHaveBeenCalledWith("outdent");

    if (originalExecCommand) {
      document.execCommand = originalExecCommand;
    } else {
      delete (document as unknown as Record<string, unknown>).execCommand;
    }
  });

  it("ListBlockRenderer (editable) syncs typed text on blur even when DOM contains arbitrary text nodes or elements", () => {
    const onItemsChange = vi.fn();
    const block: ListBlock = {
      id: "ls_sync_test",
      type: "list",
      items: [{ id: "li_1", content: "danh dc", children: [] }],
    };

    const { container } = render(
      <ListBlockRenderer block={block} editable onItemsChange={onItemsChange} />,
    );

    const listTag = container.querySelector(".ve-editable");
    const li = container.querySelector("li")!;

    // Simulate user typing after or outside existing content (browser contentEditable behavior)
    li.innerHTML = "<span>danh dc</span> dddddddddddddddddddddđ";

    fireEvent.blur(listTag!);
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    const updated = onItemsChange.mock.calls[0][0];
    expect(updated[0].content).toBe("danh dc dddddddddddddddddddddđ");
  });
});

