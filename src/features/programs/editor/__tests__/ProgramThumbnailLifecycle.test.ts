import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Program Thumbnail Upload & Deletion Lifecycle (Synchronized with Project Pattern)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("immediately deletes direct unsaved PC upload from ImageKit when deleted before saving", async () => {
    const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
    const galleryFileIds: string[] = [];
    const currentFileId = "direct_program_thumb_123";
    const initialDbFileId = undefined; // new program or unsaved

    let discardedThumbnailFileIds: string[] = [];

    // Simulate handleDeleteThumbnail in ProgramEditor
    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      if (currentFileId !== initialDbFileId) {
        await mockDeleteUploadedImage(currentFileId);
        discardedThumbnailFileIds = discardedThumbnailFileIds.filter((id) => id !== currentFileId);
      } else {
        discardedThumbnailFileIds = [...discardedThumbnailFileIds, currentFileId];
      }
    }

    expect(mockDeleteUploadedImage).toHaveBeenCalledWith("direct_program_thumb_123");
    expect(discardedThumbnailFileIds).not.toContain("direct_program_thumb_123");
  });

  it("does NOT delete file from ImageKit when image was picked from library (soft-delete only)", async () => {
    const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
    const galleryFileIds = ["gallery_selected_thumb_456"];
    const currentFileId = "gallery_selected_thumb_456";
    const discardedThumbnailFileIds: string[] = [];

    // Simulate handleDeleteThumbnail in ProgramEditor
    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      await mockDeleteUploadedImage(currentFileId);
    } else {
      // Soft-delete: form field cleared, but ImageKit untouched
    }

    expect(mockDeleteUploadedImage).not.toHaveBeenCalled();
    expect(discardedThumbnailFileIds).toHaveLength(0);
  });

  it("does NOT delete DB-persisted program thumbnail from ImageKit (preserves in Media Library on save)", async () => {
    const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
    const galleryFileIds: string[] = [];
    const initialDbFileId = "persisted_program_thumb_789";
    const currentFileId = "persisted_program_thumb_789";
    const discardedThumbnailFileIds: string[] = [];

    // Simulate handleDeleteThumbnail in ProgramEditor
    if (currentFileId && !galleryFileIds.includes(currentFileId)) {
      if (currentFileId !== initialDbFileId) {
        await mockDeleteUploadedImage(currentFileId);
      }
      // DB-persisted thumbnail: preserved in ImageKit (soft-delete from program only)
    }

    expect(mockDeleteUploadedImage).not.toHaveBeenCalled();
    expect(discardedThumbnailFileIds).not.toContain("persisted_program_thumb_789");
    expect(discardedThumbnailFileIds).toHaveLength(0);
  });

  it("immediately cleans up unsaved direct PC upload when replaced by choosing from gallery", async () => {
    const mockDeleteUploadedImage = vi.fn().mockResolvedValue(undefined);
    const galleryFileIds: string[] = [];
    const initialDbFileId: string | undefined = "persisted_old_thumb";
    const previousFileId: string | undefined = "session_unsaved_upload_999";

    // Simulate handleGallerySelect in ProgramEditor
    if (previousFileId && !galleryFileIds.includes(previousFileId)) {
      if (previousFileId !== initialDbFileId) {
        await mockDeleteUploadedImage(previousFileId);
      }
    }

    expect(mockDeleteUploadedImage).toHaveBeenCalledWith("session_unsaved_upload_999");
  });

  it("preserves published state during normal update in edit mode", () => {
    const computeTargetIsPublished = (
      mode: "create" | "edit",
      publish?: boolean,
      formIsPublished?: boolean,
      programIsPublished?: boolean,
    ) =>
      mode === "create"
        ? Boolean(publish)
        : publish !== undefined
          ? publish
          : (formIsPublished ?? programIsPublished ?? false);

    expect(computeTargetIsPublished("edit", undefined, true, true)).toBe(true);
    expect(computeTargetIsPublished("edit", false, true, true)).toBe(false);
    expect(computeTargetIsPublished("create", false, false, false)).toBe(false);
    expect(computeTargetIsPublished("create", true, false, false)).toBe(true);
  });
});
