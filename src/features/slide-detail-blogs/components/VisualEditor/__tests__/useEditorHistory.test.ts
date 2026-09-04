import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEditorHistory } from "../useEditorHistory";
import type { SlideDetailBlogContent } from "@/types/slide-detail-blog";

const initialContent: SlideDetailBlogContent = {
  version: 1,
  blocks: [{ id: "b1", type: "paragraph", text: "Initial" }],
};

const updatedContent: SlideDetailBlogContent = {
  version: 1,
  blocks: [{ id: "b1", type: "paragraph", text: "Updated" }],
};

describe("useEditorHistory hook", () => {
  it("initializes with canUndo and canRedo as false", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useEditorHistory(initialContent, onChange));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("pushState enables canUndo and clears redo stack", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useEditorHistory(initialContent, onChange));

    act(() => {
      result.current.pushState();
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("undo restores previous state without setState-in-render side effects", () => {
    const onChange = vi.fn();
    let current = initialContent;
    const { result, rerender } = renderHook(
      ({ c }) => useEditorHistory(c, onChange),
      { initialProps: { c: current } },
    );

    // Save initial state before update
    act(() => {
      result.current.pushState();
    });

    // Update to new content
    current = updatedContent;
    rerender({ c: current });

    expect(result.current.canUndo).toBe(true);

    // Call undo
    act(() => {
      result.current.undo();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(initialContent);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("redo restores future state properly", () => {
    const onChange = vi.fn();
    let current = initialContent;
    const { result, rerender } = renderHook(
      ({ c }) => useEditorHistory(c, onChange),
      { initialProps: { c: current } },
    );

    act(() => {
      result.current.pushState();
    });

    current = updatedContent;
    rerender({ c: current });

    act(() => {
      result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(updatedContent);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndo).toBe(true);
  });
});
