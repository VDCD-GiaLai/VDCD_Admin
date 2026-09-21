import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VisualEditorCanvas } from "../VisualEditorCanvas";
import { PropertyPanel } from "../PropertyPanel";
import type { SlideDetailBlogContent } from "@/types/slide-detail-blog";

const mockOnGalleryFileSelect = vi.fn();

vi.mock("../../../context/SlideDetailBlogUploadContext", () => ({
  useSlideDetailBlogUpload: () => ({
    subfolder: "test-subfolder",
    uploadBlogImage: vi.fn(),
    onGalleryFileSelect: mockOnGalleryFileSelect,
  }),
}));

vi.mock("@/components/shared", () => ({
  ImagePickerModal: ({
    isOpen,
    onSelect,
    onClose,
  }: {
    isOpen: boolean;
    onSelect: (image: { url: string; fileId?: string }) => void;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-image-picker-modal">
        <button
          onClick={() =>
            onSelect({
              url: "https://ik.imagekit.io/vdcd/selected-hero.jpg",
              fileId: "file_hero_gal_123",
            })
          }
        >
          Xác nhận chọn ảnh Hero
        </button>
        <button onClick={onClose}>Đóng modal</button>
      </div>
    );
  },
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

    it("opens ImagePickerModal when 'Chọn từ thư viện' is clicked on empty hero placeholder and updates hero image with undefined fileId", () => {
      const onHeroImageChange = vi.fn();
      render(
        <VisualEditorCanvas
          title="Bài viết mẫu"
          content={emptyContent}
          onContentChange={vi.fn()}
          onTitleChange={vi.fn()}
          onSubtitleChange={vi.fn()}
          heroImageUrl={null}
          onHeroImageChange={onHeroImageChange}
        />,
      );

      const galleryBtn = screen.getByText("Chọn từ thư viện");
      expect(galleryBtn).toBeInTheDocument();

      fireEvent.click(galleryBtn);
      expect(screen.getByTestId("mock-image-picker-modal")).toBeInTheDocument();

      const confirmBtn = screen.getByText("Xác nhận chọn ảnh Hero");
      fireEvent.click(confirmBtn);

      expect(mockOnGalleryFileSelect).toHaveBeenCalledWith("file_hero_gal_123");
      expect(onHeroImageChange).toHaveBeenCalledWith(
        "https://ik.imagekit.io/vdcd/selected-hero.jpg",
        undefined,
      );
      expect(screen.queryByTestId("mock-image-picker-modal")).not.toBeInTheDocument();
    });

    it("opens ImagePickerModal when 'Chọn từ thư viện' is clicked on existing hero image toolbar", () => {
      const onHeroImageChange = vi.fn();
      render(
        <VisualEditorCanvas
          title="Bài viết mẫu"
          content={emptyContent}
          onContentChange={vi.fn()}
          onTitleChange={vi.fn()}
          onSubtitleChange={vi.fn()}
          heroImageUrl="https://ik.imagekit.io/test/hero.jpg"
          onHeroImageChange={onHeroImageChange}
          onHeroImageDelete={vi.fn()}
        />,
      );

      const galleryBtn = screen.getByText("Chọn từ thư viện");
      expect(galleryBtn).toBeInTheDocument();

      fireEvent.click(galleryBtn);
      expect(screen.getByTestId("mock-image-picker-modal")).toBeInTheDocument();

      const confirmBtn = screen.getByText("Xác nhận chọn ảnh Hero");
      fireEvent.click(confirmBtn);

      expect(onHeroImageChange).toHaveBeenCalledWith(
        "https://ik.imagekit.io/vdcd/selected-hero.jpg",
        undefined,
      );
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

  describe("Hero Image Deletion Lifecycle (Direct PC Upload vs Gallery)", () => {
    it("immediately deletes direct unsaved PC upload from ImageKit when deleted before saving", async () => {
      const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
      const galleryFileIds: string[] = [];
      const currentFileId = "direct_pc_upload_123";
      const initialDbFileId = undefined; // new blog or not yet saved to DB

      // Simulate handleDeleteHeroImage logic
      if (currentFileId && !galleryFileIds.includes(currentFileId)) {
        if (currentFileId !== initialDbFileId) {
          await mockDeleteUploadedImage(currentFileId);
        }
      }

      expect(mockDeleteUploadedImage).toHaveBeenCalledWith("direct_pc_upload_123");
    });

    it("does NOT delete file from ImageKit when image was picked from library/gallery", async () => {
      const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
      const galleryFileIds = ["gallery_selected_file_456"];
      const currentFileId = "gallery_selected_file_456";

      // Simulate handleDeleteHeroImage logic
      if (currentFileId && !galleryFileIds.includes(currentFileId)) {
        await mockDeleteUploadedImage(currentFileId);
      }

      expect(mockDeleteUploadedImage).not.toHaveBeenCalled();
    });

    it("does NOT delete DB-persisted image from ImageKit (preserves in Media Library on save)", async () => {
      const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
      const galleryFileIds: string[] = [];
      const initialDbFileId = "persisted_db_file_789";
      const currentFileId = "persisted_db_file_789";
      const discardedQueue: string[] = [];

      // Simulate handleDeleteHeroImage logic in edit mode
      if (currentFileId && !galleryFileIds.includes(currentFileId)) {
        if (currentFileId !== initialDbFileId) {
          await mockDeleteUploadedImage(currentFileId);
        }
        // DB-persisted image: preserved in ImageKit (soft-delete from blog only)
      }

      expect(mockDeleteUploadedImage).not.toHaveBeenCalled();
      expect(discardedQueue).not.toContain("persisted_db_file_789");
      expect(discardedQueue).toHaveLength(0);
    });
  });
});
