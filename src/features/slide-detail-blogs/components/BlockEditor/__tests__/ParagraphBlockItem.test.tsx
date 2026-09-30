import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParagraphBlockItem } from "../ParagraphBlockItem";
import { BlockEditor } from "../BlockEditor";
import type { ParagraphBlock, SlideDetailBlogContent } from "@/types/slide-detail-blog";

describe("ParagraphBlockItem - Heading split support", () => {
  it("renders heading buttons when onSplit is provided and triggers onSplit on selection", () => {
    const block: ParagraphBlock = {
      id: "p1",
      type: "paragraph",
      text: "Đoạn 1. Timelapse là kỹ thuật tua nhanh. Đoạn 2.",
    };
    const onChange = vi.fn();
    const onSplit = vi.fn();

    render(<ParagraphBlockItem block={block} onChange={onChange} onSplit={onSplit} />);

    // H2 button should be visible when onSplit is provided
    const h2Btn = screen.getByRole("button", { name: "H2" });
    expect(h2Btn).toBeInTheDocument();

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Đoạn 1. Timelapse là kỹ thuật tua nhanh. Đoạn 2.");

    // Simulate selection of middle text: "Timelapse là kỹ thuật tua nhanh."
    const start = block.text.indexOf("Timelapse");
    const end = start + "Timelapse là kỹ thuật tua nhanh.".length;
    textarea.selectionStart = start;
    textarea.selectionEnd = end;

    // Click H2
    fireEvent.click(h2Btn);

    expect(onSplit).toHaveBeenCalledTimes(1);
    expect(onSplit).toHaveBeenCalledWith(
      "Đoạn 1.",
      "Timelapse là kỹ thuật tua nhanh.",
      2,
      "Đoạn 2.",
    );
  });
});

describe("BlockEditor - Paragraph splitting integration", () => {
  it("splits a paragraph into [before, heading, after] blocks when onSplit is executed", () => {
    const onChange = vi.fn();
    const content: SlideDetailBlogContent = {
      version: 1,
      blocks: [
        {
          id: "p1",
          type: "paragraph",
          text: "Đoạn trước. Tiêu đề cần tách. Đoạn sau.",
        },
      ],
    };

    render(<BlockEditor value={content} onChange={onChange} />);

    const h2Btn = screen.getByRole("button", { name: "H2" });
    const textarea = screen.getByPlaceholderText("Nhập nội dung văn bản cho bài viết...") as HTMLTextAreaElement;

    const start = textarea.value.indexOf("Tiêu đề cần tách.");
    const end = start + "Tiêu đề cần tách.".length;
    textarea.selectionStart = start;
    textarea.selectionEnd = end;

    fireEvent.click(h2Btn);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedBlocks = onChange.mock.calls[0][0].blocks;
    expect(updatedBlocks).toHaveLength(3);
    expect(updatedBlocks[0].type).toBe("paragraph");
    expect(updatedBlocks[0].text).toBe("Đoạn trước.");
    expect(updatedBlocks[1].type).toBe("heading");
    expect(updatedBlocks[1].level).toBe(2);
    expect(updatedBlocks[1].text).toBe("Tiêu đề cần tách.");
    expect(updatedBlocks[2].type).toBe("paragraph");
    expect(updatedBlocks[2].text).toBe("Đoạn sau.");
  });
});
