import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { HeadingBlockRenderer } from "../HeadingBlockRenderer";
import type { HeadingBlock } from "../../../model/document.types";

describe("Shared HeadingBlockRenderer", () => {
  const mockBlock: HeadingBlock = {
    id: "test-heading-shared-1",
    type: "heading",
    level: 2,
    text: "Tiêu đề shared mẫu",
  };

  it("renders with correct HTML tag based on block level", () => {
    const { container, rerender } = render(
      <HeadingBlockRenderer block={mockBlock} editable />,
    );

    const h2El = container.querySelector("h2");
    expect(h2El).not.toBeNull();
    expect(h2El?.textContent).toBe("Tiêu đề shared mẫu");

    rerender(<HeadingBlockRenderer block={{ ...mockBlock, level: 1 }} editable />);
    const h1El = container.querySelector("h1");
    expect(h1El).not.toBeNull();
    expect(container.querySelector("h2")).toBeNull();
  });

  it("calls onTextChange on standard blur when text is edited", () => {
    const onTextChange = vi.fn();
    const { container } = render(
      <HeadingBlockRenderer block={mockBlock} editable onTextChange={onTextChange} />,
    );

    const headingEl = container.querySelector("h2")!;
    headingEl.innerHTML = "Nội dung mới";
    fireEvent.blur(headingEl);

    expect(onTextChange).toHaveBeenCalledWith("Nội dung mới");
  });

  it("ignores blur event when tag level changes (prevents unmount-blur race condition)", () => {
    const onTextChange = vi.fn();
    const { container, rerender } = render(
      <HeadingBlockRenderer block={mockBlock} editable onTextChange={onTextChange} />,
    );

    const oldH2 = container.querySelector("h2")!;
    oldH2.innerHTML = "Văn bản đang gõ";

    rerender(
      <HeadingBlockRenderer
        block={{ ...mockBlock, level: 4, text: "Văn bản đang gõ" }}
        editable
        onTextChange={onTextChange}
      />,
    );

    fireEvent.blur(oldH2);

    expect(onTextChange).not.toHaveBeenCalled();

    const h4El = container.querySelector("h4");
    expect(h4El).not.toBeNull();
    expect(h4El?.textContent).toBe("Văn bản đang gõ");
  });
});
