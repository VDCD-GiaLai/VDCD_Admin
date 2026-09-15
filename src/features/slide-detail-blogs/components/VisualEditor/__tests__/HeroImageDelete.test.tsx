import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VisualEditorCanvas } from "../VisualEditorCanvas";
import { PropertyPanel } from "../PropertyPanel";
import type { SlideDetailBlogContent } from "@/types/slide-detail-blog";

vi.mock("../../context/SlideDetailBlogUploadContext", () => ({
  useSlideDetailBlogUpload: () => ({
    subfolder: "test-subfolder",
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

describe("Hero Image Delete Feature (VisualEditor & PropertyPanel)", () => {
  const emptyContent: SlideDetailBlogContent = {
    version: 1,
    blocks: [],
    heroMeta: {
      placement: "above_title",
      position: "center",
      caption: "",
    },
  };

  describe("VisualEditorCanvas - Hero Image controls", () => {
    it("renders 'Xoá ảnh bìa' button when heroImageUrl and onHeroImageDelete are provided", () => {
      const onHeroImageDelete = vi.fn();
      render(
        <VisualEditorCanvas
          title="Bài viết mẫu"
          content={emptyContent}
          onContentChange={vi.fn()}
          onTitleChange={vi.fn()}
          onSubtitleChange={vi.fn()}
          heroImageUrl="https://ik.imagekit.io/test/hero.jpg"
          onHeroImageDelete={onHeroImageDelete}
        />,
      );

      const deleteBtn = screen.getByText("Xoá ảnh bìa");
      expect(deleteBtn).toBeInTheDocument();

      fireEvent.click(deleteBtn);
      expect(onHeroImageDelete).toHaveBeenCalledTimes(1);
    });

    it("does not render 'Xoá ảnh bìa' when heroImageUrl is empty", () => {
      render(
        <VisualEditorCanvas
          title="Bài viết mẫu"
          content={emptyContent}
          onContentChange={vi.fn()}
          onTitleChange={vi.fn()}
          onSubtitleChange={vi.fn()}
          heroImageUrl={null}
          onHeroImageDelete={vi.fn()}
        />,
      );

      expect(screen.queryByText("Xoá ảnh bìa")).not.toBeInTheDocument();
      expect(
        screen.getByText(/Nhấn để tải ảnh bìa Hero từ máy tính/i),
      ).toBeInTheDocument();
    });
  });

  describe("PropertyPanel - Hero Image controls", () => {
    it("renders 'Xoá ảnh bìa này' button in PropertyPanel when heroImageUrl and onHeroImageDelete exist", () => {
      const onHeroImageDelete = vi.fn();
      render(
        <PropertyPanel
          heroImageUrl="https://ik.imagekit.io/test/hero.jpg"
          heroMeta={{ placement: "above_title", position: "center" }}
          onHeroMetaChange={vi.fn()}
          onHeroImageDelete={onHeroImageDelete}
          onClose={vi.fn()}
        />,
      );

      const deleteBtn = screen.getByText("Xoá ảnh bìa này");
      expect(deleteBtn).toBeInTheDocument();

      fireEvent.click(deleteBtn);
      expect(onHeroImageDelete).toHaveBeenCalledTimes(1);
    });

    it("does not render 'Xoá ảnh bìa này' button when heroImageUrl is null", () => {
      render(
        <PropertyPanel
          heroImageUrl={null}
          heroMeta={{ placement: "above_title", position: "center" }}
          onHeroMetaChange={vi.fn()}
          onHeroImageDelete={vi.fn()}
          onClose={vi.fn()}
        />,
      );

      expect(screen.queryByText("Xoá ảnh bìa này")).not.toBeInTheDocument();
      expect(screen.getByText("Chọn ảnh bìa từ máy tính")).toBeInTheDocument();
    });
  });
});
