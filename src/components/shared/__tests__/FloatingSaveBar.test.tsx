import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FloatingSaveBar } from "../FloatingSaveBar";

describe("FloatingSaveBar", () => {
  it("renders nothing when isVisible is false", () => {
    const { container } = render(
      <FloatingSaveBar isVisible={false}>
        <button type="button">Lưu</button>
      </FloatingSaveBar>
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("region", { name: /thao tác lưu nhanh bài viết/i })).not.toBeInTheDocument();
  });

  it("renders status text and action buttons when isVisible is true", () => {
    render(
      <FloatingSaveBar isVisible={true}>
        <button type="button">Lưu bản nháp</button>
        <button type="button">Xuất bản bài viết</button>
      </FloatingSaveBar>
    );

    expect(screen.getByRole("region", { name: /thao tác lưu nhanh bài viết/i })).toBeInTheDocument();
    expect(screen.getByText("Có thay đổi chưa lưu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu bản nháp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xuất bản bài viết" })).toBeInTheDocument();
  });

  it("supports custom status text", () => {
    render(
      <FloatingSaveBar isVisible={true} statusText="Đang có 3 thay đổi">
        <button type="button">Lưu</button>
      </FloatingSaveBar>
    );

    expect(screen.getByText("Đang có 3 thay đổi")).toBeInTheDocument();
  });

  it("triggers button clicks correctly", () => {
    const onSave = vi.fn();
    render(
      <FloatingSaveBar isVisible={true}>
        <button type="button" onClick={onSave}>
          Lưu bản nháp
        </button>
      </FloatingSaveBar>
    );

    fireEvent.click(screen.getByRole("button", { name: "Lưu bản nháp" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("hides with transition classes when bottom bar is in view", () => {
    let observerCallback: (entries: IntersectionObserverEntry[]) => void = () => {};
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();

    class MockIntersectionObserver {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        observerCallback = callback;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    }

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    const targetDiv = document.createElement("div");
    const ref = { current: targetDiv };

    render(
      <FloatingSaveBar isVisible={true} hideWhenInViewRef={ref}>
        <button type="button">Lưu</button>
      </FloatingSaveBar>
    );

    const bar = screen.getByRole("region", { name: /thao tác lưu nhanh bài viết/i });
    expect(bar).toBeInTheDocument();
    expect(mockObserve).toHaveBeenCalledWith(targetDiv);

    // Simulate intersecting (bottom bar scrolled into view)
    act(() => {
      observerCallback([
        {
          isIntersecting: true,
          target: targetDiv,
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    expect(bar).toHaveClass("opacity-0");
    expect(bar).toHaveClass("pointer-events-none");

    // Simulate not intersecting (scrolled back up)
    act(() => {
      observerCallback([
        {
          isIntersecting: false,
          target: targetDiv,
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    expect(bar).toHaveClass("opacity-100");
    expect(bar).toHaveClass("pointer-events-auto");

    vi.unstubAllGlobals();
  });
});


