import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider } from "@/components/ui";
import { BlockFormatToolbar } from "../../BlockEditor/BlockFormatToolbar";
import { VisualEditorCanvas } from "../VisualEditorCanvas";
import type { SlideDetailBlogContent } from "@/types/slide-detail-blog";

// Mock upload context
vi.mock("../../../context/SlideDetailBlogUploadContext", () => ({
  useSlideDetailBlogUpload: () => ({
    subfolder: "test",
    folder: "slide",
    uploadBlogImage: vi.fn(),
    onGalleryFileSelect: vi.fn(),
  }),
}));

describe("BlockFormatToolbar - Upgraded Rich Formats", () => {
  it("renders H1, H2, H3 buttons and triggers heading format action with level", () => {
    const onApply = vi.fn();
    render(<BlockFormatToolbar onApply={onApply} showHeadings={true} />);

    const h1Btn = screen.getByTitle(/Tiêu đề H1/i);
    const h2Btn = screen.getByTitle(/Tiêu đề H2/i);
    const h3Btn = screen.getByTitle(/Tiêu đề H3/i);

    expect(h1Btn).toBeInTheDocument();
    expect(h2Btn).toBeInTheDocument();
    expect(h3Btn).toBeInTheDocument();

    fireEvent.click(h2Btn);
    expect(onApply).toHaveBeenCalledWith("heading", { headingLevel: 2 });

    fireEvent.click(h1Btn);
    expect(onApply).toHaveBeenCalledWith("heading", { headingLevel: 1 });
  });

  it("renders Color picker and applies selected color", () => {
    const onApply = vi.fn();
    render(<BlockFormatToolbar onApply={onApply} />);

    const colorBtn = screen.getByTitle(/Màu chữ đoạn bôi đen/i);
    expect(colorBtn).toBeInTheDocument();

    // Open color popover
    fireEvent.click(colorBtn);

    // Pick VDCD brand red swatch
    const redSwatch = screen.getByTitle(/Đỏ VDCD/i);
    expect(redSwatch).toBeInTheDocument();

    fireEvent.click(redSwatch);
    expect(onApply).toHaveBeenCalledWith("color", { color: "#CA2A30" });
  });

  it("renders Font Size picker and applies chosen font size", () => {
    const onApply = vi.fn();
    render(<BlockFormatToolbar onApply={onApply} />);

    const sizeBtn = screen.getByTitle(/Kích thước chữ đoạn bôi đen/i);
    expect(sizeBtn).toBeInTheDocument();

    // Open size popover
    fireEvent.click(sizeBtn);

    // Pick 20px
    const size20 = screen.getByText(/20px \(Lớn\)/i);
    expect(size20).toBeInTheDocument();

    fireEvent.click(size20);
    expect(onApply).toHaveBeenCalledWith("fontSize", { fontSize: "20px" });
  });

  it("renders Indent button and triggers indent action", () => {
    const onApply = vi.fn();
    render(<BlockFormatToolbar onApply={onApply} />);

    const indentBtn = screen.getByTitle(/Thụt lề đoạn văn/i);
    expect(indentBtn).toBeInTheDocument();

    fireEvent.click(indentBtn);
    expect(onApply).toHaveBeenCalledWith("indent");
  });
});

describe("VisualEditorCanvas - Smart Selection Split to Heading", () => {
  it("converts whole paragraph to heading when no range is split", () => {
    const onContentChange = vi.fn();
    const initialContent: SlideDetailBlogContent = {
      version: 1,
      blocks: [
        {
          id: "blk_p1",
          type: "paragraph",
          text: "Timelapse là kỹ thuật ghi lại nhiều hình ảnh.",
        },
      ],
    };

    render(
      <ToastProvider>
        <VisualEditorCanvas
          title="Bài viết Timelapse"
          content={initialContent}
          onContentChange={onContentChange}
          onTitleChange={vi.fn()}
          onSubtitleChange={vi.fn()}
        />
      </ToastProvider>,
    );

    expect(screen.getByText("Timelapse là kỹ thuật ghi lại nhiều hình ảnh.")).toBeInTheDocument();
  });

  it("splits a paragraph into [before, heading, after] when selecting middle sentence and clicking H2", async () => {
    const onContentChange = vi.fn();
    const initialContent: SlideDetailBlogContent = {
      version: 1,
      blocks: [
        {
          id: "blk_p1",
          type: "paragraph",
          text: "Đoạn mở đầu. Timelapse là kỹ thuật tua nhanh. Đoạn kết thúc.",
        },
      ],
    };

    render(
      <ToastProvider>
        <VisualEditorCanvas
          title="Bài viết Timelapse"
          content={initialContent}
          onContentChange={onContentChange}
          onTitleChange={vi.fn()}
          onSubtitleChange={vi.fn()}
        />
      </ToastProvider>,
    );

    const paragraphEl = screen.getByText(/Đoạn mở đầu/);
    expect(paragraphEl).toBeInTheDocument();

    // Select "Timelapse là kỹ thuật tua nhanh."
    const textNode = paragraphEl.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 13);
    range.setEnd(textNode, 45);

    // Mock getBoundingClientRect
    range.getBoundingClientRect = () => ({
      top: 100,
      left: 100,
      width: 150,
      height: 20,
      bottom: 120,
      right: 250,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    await act(async () => {
      document.dispatchEvent(new Event("selectionchange"));
      await new Promise((r) => setTimeout(r, 60));
    });

    // Toolbar should appear with H2 button
    const h2Btn = await screen.findByTitle(/Tiêu đề H2/i);
    expect(h2Btn).toBeInTheDocument();

    act(() => {
      fireEvent.click(h2Btn);
    });

    expect(onContentChange).toHaveBeenCalled();
    const updatedBlocks = onContentChange.mock.calls[0][0].blocks;
    expect(updatedBlocks).toHaveLength(3);
    expect(updatedBlocks[0].type).toBe("paragraph");
    expect(updatedBlocks[0].text).toBe("Đoạn mở đầu.");
    expect(updatedBlocks[1].type).toBe("heading");
    expect(updatedBlocks[1].level).toBe(2);
    expect(updatedBlocks[1].text).toBe("Timelapse là kỹ thuật tua nhanh.");
    expect(updatedBlocks[2].type).toBe("paragraph");
    expect(updatedBlocks[2].text).toBe("Đoạn kết thúc.");
  });
});
