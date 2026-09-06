import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  generateProjectSessionKey,
  ProjectUploadProvider,
  useProjectUploadSession,
  projectSchema,
} from "@/features/projects";
import * as uploadLib from "@/lib/upload";

// Mock uploadImage
vi.mock("@/lib/upload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/upload")>();
  return {
    ...actual,
    uploadImage: vi.fn(),
  };
});

describe("Phase 06 — Project ImageKit Architecture & Upload Session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateProjectSessionKey", () => {
    it("should generate a stable format prefixed with 'project-'", () => {
      const key1 = generateProjectSessionKey();
      const key2 = generateProjectSessionKey();

      expect(key1).toMatch(/^project-[a-z0-9]+$/);
      expect(key2).toMatch(/^project-[a-z0-9]+$/);
      expect(key1).not.toBe(key2);
    });
  });

  describe("ProjectUploadSession Provider & Hook", () => {
    it("should maintain a single stable sessionFolderKey across multiple renders for new project", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectUploadProvider>{children}</ProjectUploadProvider>
      );

      const { result, rerender } = renderHook(() => useProjectUploadSession(), {
        wrapper,
      });

      const initialKey = result.current.sessionFolderKey;
      expect(initialKey).toMatch(/^project-[a-z0-9]+$/);

      // Re-render multiple times
      rerender();
      rerender();

      expect(result.current.sessionFolderKey).toBe(initialKey);
    });

    it("should use initialSlug as sessionFolderKey when editing existing project", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectUploadProvider initialSlug="smart-city-gia-lai">
          {children}
        </ProjectUploadProvider>
      );

      const { result } = renderHook(() => useProjectUploadSession(), {
        wrapper,
      });

      expect(result.current.sessionFolderKey).toBe("smart-city-gia-lai");
    });

    it("should route uploadProjectImage into the exact session folder", async () => {
      const mockResult = {
        url: "https://ik.imagekit.io/vdcd/vdcd/projects/project-test123/site.webp",
        fileId: "fid-test",
        name: "site.webp",
        size: 1024,
        filePath: "/vdcd/projects/project-test123/site.webp",
      };

      vi.mocked(uploadLib.uploadImage).mockResolvedValue(mockResult);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectUploadProvider initialSlug="project-test123">
          {children}
        </ProjectUploadProvider>
      );

      const { result } = renderHook(() => useProjectUploadSession(), {
        wrapper,
      });

      const fakeFile = new File(["dummy content"], "site.webp", {
        type: "image/webp",
      });

      let res: uploadLib.UploadResult | undefined;
      await act(async () => {
        res = await result.current.uploadProjectImage(fakeFile);
      });

      expect(res).toEqual(mockResult);
      expect(uploadLib.uploadImage).toHaveBeenCalledWith(
        fakeFile,
        "project",
        expect.objectContaining({
          subfolder: "project-test123",
          slug: "project-test123",
          tempFolderKey: "project-test123",
        }),
      );
    });
  });

  describe("projectSchema tempFolderKey & DocumentContent validation", () => {
    it("should validate a complete project payload with tempFolderKey and DocumentContent", () => {
      const validPayload = {
        title: "Dự án Nông nghiệp Thông minh Gia Lai",
        slug: "nong-nghiep-thong-minh-gia-lai",
        tempFolderKey: "project-8f92ab",
        year: 2026,
        content: {
          version: 1,
          heroMeta: {
            placement: "above_title",
            position: "center",
            caption: "Toàn cảnh dự án",
          },
          blocks: [
            {
              id: "blk-h1",
              type: "heading",
              level: 2,
              text: "Giới thiệu giải pháp",
            },
            {
              id: "blk-img1",
              type: "image",
              url: "https://ik.imagekit.io/vdcd/vdcd/projects/project-8f92ab/overview.webp",
              fileId: "fid-ovw-1",
            },
          ],
        },
      };

      const parsed = projectSchema.parse(validPayload);
      expect(parsed.title).toBe("Dự án Nông nghiệp Thông minh Gia Lai");
      expect(parsed.tempFolderKey).toBe("project-8f92ab");
      expect(parsed.content?.blocks).toHaveLength(2);
    });
  });
});
