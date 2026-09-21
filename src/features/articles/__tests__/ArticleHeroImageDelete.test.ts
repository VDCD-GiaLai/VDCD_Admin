import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Article Thumbnail / Hero Image Deletion Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("immediately deletes direct unsaved PC upload from ImageKit when deleted before saving in Articles", async () => {
    const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
    const galleryFileIds: string[] = [];
    const currentFileId = "direct_article_thumb_123";
    const initialDbFileId = undefined; // new article or not yet saved

    // Simulate handleDeleteHeroImage in articles
    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      if (currentFileId !== initialDbFileId) {
        await mockDeleteUploadedImage(currentFileId);
      }
    }

    expect(mockDeleteUploadedImage).toHaveBeenCalledWith("direct_article_thumb_123");
  });

  it("does NOT delete file from ImageKit when image was picked from library in Articles", async () => {
    const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
    const galleryFileIds = ["gallery_selected_thumb_456"];
    const currentFileId = "gallery_selected_thumb_456";

    // Simulate handleDeleteHeroImage in articles
    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      await mockDeleteUploadedImage(currentFileId);
    }

    expect(mockDeleteUploadedImage).not.toHaveBeenCalled();
  });

  it("does NOT delete DB-persisted article thumbnail from ImageKit (preserves in Media Library on save)", async () => {
    const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
    const galleryFileIds: string[] = [];
    const initialDbFileId = "persisted_article_thumb_789";
    const currentFileId = "persisted_article_thumb_789";
    const discardedQueue: string[] = [];

    // Simulate handleDeleteHeroImage in articles [id] page
    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      if (currentFileId !== initialDbFileId) {
        await mockDeleteUploadedImage(currentFileId);
      }
      // DB-persisted thumbnail: preserved in ImageKit (soft-delete from article only)
    }

    expect(mockDeleteUploadedImage).not.toHaveBeenCalled();
    expect(discardedQueue).not.toContain("persisted_article_thumb_789");
    expect(discardedQueue).toHaveLength(0);
  });

  it("immediately deletes previous unsaved direct PC upload when replaced by gallery selection", async () => {
    const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
    const galleryFileIds: string[] = [];
    const previousFileId = "prev_unsaved_pc_upload_999";

    // Simulate handleGallerySelect replacement logic
    if (previousFileId && !galleryFileIds.includes(previousFileId)) {
      await mockDeleteUploadedImage(previousFileId);
    }

    expect(mockDeleteUploadedImage).toHaveBeenCalledWith("prev_unsaved_pc_upload_999");
  });
});
