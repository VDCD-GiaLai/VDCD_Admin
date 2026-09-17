import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropertyPanel } from "../PropertyPanel";
import type { ListBlock } from "@/types/slide-detail-blog";

vi.mock("../../context/SlideDetailBlogUploadContext", () => ({
  useSlideDetailBlogUpload: () => ({
    subfolder: "test",
    uploadBlogImage: vi.fn(),
  }),
}));

vi.mock("@/components/ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/components/ui");
  return {
    ...actual,
    useToast: () => ({
      toast: vi.fn(),
    }),
  };
});

describe("PropertyPanel component (VisualEditor - List Block Controls)", () => {
  const sampleListBlock: ListBlock = {
    id: "ls_panel_test",
    type: "list",
    listType: "bullet",
    listStyle: "disc",
    fontSize: 16,
    lineHeight: 1.75,
    itemSpacing: 6,
    items: [
      { id: "item_1", content: "Mục số một", children: [] },
      { id: "item_2", content: "Mục số hai", children: [] },
    ],
  };

  it("renders list block type controls, typography and item manager", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    render(
      <PropertyPanel
        block={sampleListBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    // List type buttons
    expect(screen.getByText("• Chấm tròn")).toBeInTheDocument();
    expect(screen.getByText("1. Thứ tự")).toBeInTheDocument();
    expect(screen.getByText("☑ Hộp kiểm")).toBeInTheDocument();

    // Items count and inputs
    expect(screen.getByText("Các mục (2)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Mục số một")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Mục số hai")).toBeInTheDocument();

    // Bulk paste toggle button
    expect(screen.getByText("Mở khung dán")).toBeInTheDocument();
  });

  it("switches list type when clicking type buttons", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    render(
      <PropertyPanel
        block={sampleListBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    // Click on Ordered list
    fireEvent.click(screen.getByText("1. Thứ tự"));
    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updatedOrdered = onBlockChange.mock.calls[0][0] as ListBlock;
    expect(updatedOrdered.listType).toBe("ordered");
    expect(updatedOrdered.listStyle).toBe("decimal");

    // Click on Checklist
    fireEvent.click(screen.getByText("☑ Hộp kiểm"));
    expect(onBlockChange).toHaveBeenCalledTimes(2);
    const updatedChecklist = onBlockChange.mock.calls[1][0] as ListBlock;
    expect(updatedChecklist.listType).toBe("checklist");
    expect(updatedChecklist.listStyle).toBe("checklist");
  });

  it("updates item content inline in property panel", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    render(
      <PropertyPanel
        block={sampleListBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    const firstInput = screen.getByDisplayValue("Mục số một");
    fireEvent.change(firstInput, { target: { value: "Mục số một đã sửa" } });

    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0] as ListBlock;
    expect(updated.items[0].content).toBe("Mục số một đã sửa");
  });

  it("moves items up/down via property panel action buttons", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    render(
      <PropertyPanel
        block={sampleListBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    const moveDownBtns = screen.getAllByTitle("Di chuyển xuống");
    expect(moveDownBtns[0]).not.toBeDisabled();
    fireEvent.click(moveDownBtns[0]);

    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0] as ListBlock;
    expect(updated.items[0].id).toBe("item_2");
    expect(updated.items[1].id).toBe("item_1");
  });

  it("indents and outdents items in property panel", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    render(
      <PropertyPanel
        block={sampleListBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    // Indent second item under first item
    const indentBtns = screen.getAllByTitle("Thụt vào một cấp (Tăng thụt lề)");
    expect(indentBtns[1]).not.toBeDisabled();
    fireEvent.click(indentBtns[1]);

    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0] as ListBlock;
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].children).toHaveLength(1);
    expect(updated.items[0].children[0].id).toBe("item_2");
  });

  it("handles bulk paste in property panel drawer", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    render(
      <PropertyPanel
        block={sampleListBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    // Open bulk paste drawer
    fireEvent.click(screen.getByText("Mở khung dán"));

    const textarea = screen.getByPlaceholderText(/Dán văn bản nhiều dòng/);
    expect(textarea).toBeInTheDocument();

    const rawText = `1. Thửa đất 101\n2. Thửa đất 102\n3. Thửa đất 103`;
    fireEvent.change(textarea, { target: { value: rawText } });

    fireEvent.click(screen.getByText("Chuyển thành danh sách"));
    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0] as ListBlock;
    expect(updated.items).toHaveLength(3);
    expect(updated.items[0].content).toBe("Thửa đất 101");
    expect(updated.items[1].content).toBe("Thửa đất 102");
    expect(updated.items[2].content).toBe("Thửa đất 103");
  });

  it("adds a new item from property panel", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    render(
      <PropertyPanel
        block={sampleListBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("+ Thêm mục"));
    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0] as ListBlock;
    expect(updated.items).toHaveLength(3);
  });
});

describe("PropertyPanel component (VisualEditor - Heading Block Level Controls)", () => {
  const headingBlock = {
    id: "head_test_1",
    type: "heading" as const,
    level: 2 as const,
    text: "Tiêu đề ban đầu",
  };

  it("preserves live heading text when switching level while heading is active/focused", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    // Create a mock DOM element acting as the active focused contentEditable heading
    const activeHeadingEl = document.createElement("h2");
    activeHeadingEl.contentEditable = "true";
    activeHeadingEl.dataset.blockId = headingBlock.id;
    activeHeadingEl.innerHTML = "Nội dung vừa gõ chưa lưu blur";
    document.body.appendChild(activeHeadingEl);
    activeHeadingEl.focus();

    render(
      <PropertyPanel
        block={headingBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    // Click H3 button
    fireEvent.click(screen.getByText("H3"));

    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0];
    expect(updated.level).toBe(3);
    expect(updated.text).toBe("Nội dung vừa gõ chưa lưu blur");

    document.body.removeChild(activeHeadingEl);
  });

  it("preserves live heading text when switching from H2 to H1 while focused", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    const activeHeadingEl = document.createElement("h2");
    activeHeadingEl.contentEditable = "true";
    activeHeadingEl.dataset.blockId = headingBlock.id;
    activeHeadingEl.innerHTML = "Tiêu đề chuyển sang H1";
    document.body.appendChild(activeHeadingEl);
    activeHeadingEl.focus();

    render(
      <PropertyPanel
        block={headingBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("H1"));

    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0];
    expect(updated.level).toBe(1);
    expect(updated.text).toBe("Tiêu đề chuyển sang H1");

    document.body.removeChild(activeHeadingEl);
  });

  it("preserves live heading text when switching from H2 to H4 while focused", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    const activeHeadingEl = document.createElement("h2");
    activeHeadingEl.contentEditable = "true";
    activeHeadingEl.dataset.blockId = headingBlock.id;
    activeHeadingEl.innerHTML = "Tiêu đề chuyển sang H4";
    document.body.appendChild(activeHeadingEl);
    activeHeadingEl.focus();

    render(
      <PropertyPanel
        block={headingBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("H4"));

    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0];
    expect(updated.level).toBe(4);
    expect(updated.text).toBe("Tiêu đề chuyển sang H4");

    document.body.removeChild(activeHeadingEl);
  });

  it("preserves live heading text when switching from H2 to H5 while focused", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    const activeHeadingEl = document.createElement("h2");
    activeHeadingEl.contentEditable = "true";
    activeHeadingEl.dataset.blockId = headingBlock.id;
    activeHeadingEl.innerHTML = "Tiêu đề chuyển sang H5";
    document.body.appendChild(activeHeadingEl);
    activeHeadingEl.focus();

    render(
      <PropertyPanel
        block={headingBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("H5"));

    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0];
    expect(updated.level).toBe(5);
    expect(updated.text).toBe("Tiêu đề chuyển sang H5");

    document.body.removeChild(activeHeadingEl);
  });

  it("preserves heading text via DOM query fallback when switching level while unfocused", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    // Create a mock DOM heading element in the canvas, but NOT focused
    const headingEl = document.createElement("h3");
    headingEl.contentEditable = "true";
    headingEl.dataset.blockId = headingBlock.id;
    headingEl.innerHTML = "Nội dung đang có trong canvas";
    document.body.appendChild(headingEl);

    // Ensure activeElement is body, not heading
    (document.activeElement as HTMLElement)?.blur();

    render(
      <PropertyPanel
        block={{ ...headingBlock, level: 3, text: "Tiêu đề cũ" }}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    // Click H4 button while unfocused
    fireEvent.click(screen.getByText("H4"));

    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0];
    expect(updated.level).toBe(4);
    expect(updated.text).toBe("Nội dung đang có trong canvas");

    document.body.removeChild(headingEl);
  });

  it("correctly sets empty text when heading has been cleared by user", () => {
    const onBlockChange = vi.fn();
    const onClose = vi.fn();

    const headingEl = document.createElement("h2");
    headingEl.contentEditable = "true";
    headingEl.dataset.blockId = headingBlock.id;
    headingEl.innerHTML = "<br>"; // browser empty contentEditable artifact
    document.body.appendChild(headingEl);

    render(
      <PropertyPanel
        block={headingBlock}
        onBlockChange={onBlockChange}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("H5"));

    expect(onBlockChange).toHaveBeenCalledTimes(1);
    const updated = onBlockChange.mock.calls[0][0];
    expect(updated.level).toBe(5);
    expect(updated.text).toBe("");

    document.body.removeChild(headingEl);
  });
});

