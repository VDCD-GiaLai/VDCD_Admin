import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropertyPanel } from "../PropertyPanel";
import { HeadingBlockRenderer } from "../../BlogPreview/renderers/HeadingBlockRenderer";
import type { HeadingBlock } from "@/types/slide-detail-blog";

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

function TestHarness({ initialLevel = 2 }: { initialLevel?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const [block, setBlock] = useState<HeadingBlock>({
    id: "test-heading-1",
    type: "heading",
    level: initialLevel,
    text: "KIEM_TRA_TIEU_DE_FIX",
  });

  return (
    <div>
      <HeadingBlockRenderer
        block={block}
        editable
        onTextChange={(text) => setBlock((prev) => ({ ...prev, text }))}
      />
      <PropertyPanel
        block={block}
        onBlockChange={(updated) => setBlock(updated as HeadingBlock)}
        onClose={() => {}}
      />
    </div>
  );
}

describe("Heading Level Switch Bug Investigation", () => {
  it("switches from H2 to H1 and preserves DOM content", () => {
    const { container } = render(<TestHarness initialLevel={2} />);

    // Initially H2
    const h2El = container.querySelector("h2");
    expect(h2El).not.toBeNull();
    expect(h2El?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");

    // Click H1
    fireEvent.click(screen.getByText("H1"));

    const h1El = container.querySelector("h1");
    expect(h1El).not.toBeNull();
    expect(h1El?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");
  });

  it("switches from H2 to H5 and preserves DOM content", () => {
    const { container } = render(<TestHarness initialLevel={2} />);

    fireEvent.click(screen.getByText("H5"));

    const h5El = container.querySelector("h5");
    expect(h5El).not.toBeNull();
    expect(h5El?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");
  });

  it("switches from H2 to H3 and preserves DOM content", () => {
    const { container } = render(<TestHarness initialLevel={2} />);
    fireEvent.click(screen.getByText("H3"));
    const h3El = container.querySelector("h3");
    expect(h3El).not.toBeNull();
    expect(h3El?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");
  });

  it("switches from H2 to H4 and preserves DOM content", () => {
    const { container } = render(<TestHarness initialLevel={2} />);
    fireEvent.click(screen.getByText("H4"));
    const h4El = container.querySelector("h4");
    expect(h4El).not.toBeNull();
    expect(h4El?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");
  });

  it("switches from H2 to H6 and preserves DOM content", () => {
    const { container } = render(<TestHarness initialLevel={2} />);
    fireEvent.click(screen.getByText("H6"));
    const h6El = container.querySelector("h6");
    expect(h6El).not.toBeNull();
    expect(h6El?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");
  });

  it("switches sequentially across all heading levels H2 -> H1 -> H5 -> H6 -> H3 -> H4", () => {
    const { container } = render(<TestHarness initialLevel={2} />);

    // H2 -> H1
    fireEvent.click(screen.getByText("H1"));
    expect(container.querySelector("h1")?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");

    // H1 -> H5
    fireEvent.click(screen.getByText("H5"));
    expect(container.querySelector("h5")?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");

    // H5 -> H6
    fireEvent.click(screen.getByText("H6"));
    expect(container.querySelector("h6")?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");

    // H6 -> H3
    fireEvent.click(screen.getByText("H3"));
    expect(container.querySelector("h3")?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");

    // H3 -> H4
    fireEvent.click(screen.getByText("H4"));
    expect(container.querySelector("h4")?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");

    // H4 -> H2
    fireEvent.click(screen.getByText("H2"));
    expect(container.querySelector("h2")?.textContent).toBe("KIEM_TRA_TIEU_DE_FIX");
  });
});
