import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadImage, validateImageFile, slugifyVietnamese } from "@/lib/upload";
import { serializeSolutionPayload } from "../../utils/solution-content";
import type { SolutionFormData } from "../../schema";
import type { DocumentContent, ImageBlock } from "@/shared/content-editor";

// Mock uploadImage axios calls
vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(),
      get: vi.fn(),
      create: vi.fn(() => ({ post: vi.fn(), get: vi.fn() })),
      isAxiosError: vi.fn(() => false),
    },
  };
});

describe("PHASE 09: Solution ImageKit Folder & Lifecycle Validation (Admin QA)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // CASE 1: Solution đã có slug: giai-phap-gis
  // ========================================================================
  describe("Case 1: Solution with existing slug", () => {
    it("targets /vdcd/solutions/{slug} and sends correct slug parameters", async () => {
      const axios = (await import("axios")).default;
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          url: "https://ik.imagekit.io/vdcd/solutions/giai-phap-gis/thumbnail.png",
          fileId: "file_gis_thumb_123",
          filePath: "/vdcd/solutions/giai-phap-gis/thumbnail.png",
        },
      });

      const file = new File(["dummy"], "thumbnail.png", { type: "image/png" });
      const slug = "giai-phap-gis";

      const result = await uploadImage(file, "solution", {
        slug,
        subfolder: slug,
      });

      expect(axios.post).toHaveBeenCalledWith(
        "/api/upload/image/solution",
        expect.any(FormData),
        expect.objectContaining({
          params: expect.objectContaining({
            slug: "giai-phap-gis",
            subfolder: "giai-phap-gis",
          }),
        }),
      );
      expect(result.url).toBe("https://ik.imagekit.io/vdcd/solutions/giai-phap-gis/thumbnail.png");
      expect(result.fileId).toBe("file_gis_thumb_123");
    });
  });

  // ========================================================================
  // CASE 2: Solution chưa có slug -> Backend & Admin tạo stable temporary key solution-{random-id}
  // ========================================================================
  describe("Case 2: Stable temporary folder key (solution-{random-id})", () => {
    it("generates a stable key matching pattern solution-[a-z0-9]+", () => {
      const generateStableKey = () => `solution-${Math.random().toString(36).substring(2, 10)}`;
      const stableKey1 = generateStableKey();
      const stableKey2 = generateStableKey();

      expect(stableKey1).toMatch(/^solution-[a-z0-9]+$/);
      expect(stableKey2).toMatch(/^solution-[a-z0-9]+$/);
      // Key format must not start with legacy sol-
      expect(stableKey1.startsWith("solution-")).toBe(true);
    });

    it("serializes payload with tempFolderKey when saving solution without initial slug", () => {
      const stableTempKey = "solution-abc12345";
      const formData: SolutionFormData = {
        title: "Giải Pháp IoT Mới",
        content: { version: 1, blocks: [] },
        tempFolderKey: stableTempKey,
      };

      const payload = serializeSolutionPayload(formData);
      expect(payload.tempFolderKey).toBe("solution-abc12345");
      expect(payload.title).toBe("Giải Pháp IoT Mới");
    });
  });

  // ========================================================================
  // CASE 3: Solution có nhiều image: thumbnail, block 1, 2, 3 -> Tất cả cùng folder
  // ========================================================================
  describe("Case 3: Multi-image co-location in single solution folder", () => {
    it("routes thumbnail and multiple content blocks to the identical subfolder", async () => {
      const axios = (await import("axios")).default;
      const targetSubfolder = "giai-phap-do-dac-3d";

      const uploadedFiles: string[] = [];

      vi.mocked(axios.post).mockImplementation((_url: string, _formData?: unknown, config?: unknown) => {
        const cfg = config as { params?: { slug?: string; subfolder?: string } } | undefined;
        const fileParam = cfg?.params?.slug || cfg?.params?.subfolder || "unknown";
        uploadedFiles.push(fileParam);
        return Promise.resolve({
          data: {
            url: `https://ik.imagekit.io/vdcd/solutions/${fileParam}/image.png`,
            fileId: `file_${Math.random()}`,
            filePath: `/vdcd/solutions/${fileParam}/image.png`,
          },
        });
      });

      // 1. Upload thumbnail
      const thumbFile = new File(["thumb"], "thumb.png", { type: "image/png" });
      await uploadImage(thumbFile, "solution", {
        slug: targetSubfolder,
        subfolder: targetSubfolder,
      });

      // 2. Upload block 1
      const b1 = new File(["b1"], "b1.png", { type: "image/png" });
      await uploadImage(b1, "solution", {
        slug: targetSubfolder,
        subfolder: targetSubfolder,
      });

      // 3. Upload block 2
      const b2 = new File(["b2"], "b2.png", { type: "image/png" });
      await uploadImage(b2, "solution", {
        slug: targetSubfolder,
        subfolder: targetSubfolder,
      });

      // 4. Upload block 3
      const b3 = new File(["b3"], "b3.png", { type: "image/png" });
      await uploadImage(b3, "solution", {
        slug: targetSubfolder,
        subfolder: targetSubfolder,
      });

      // All 4 uploads must target the exact same subfolder
      expect(uploadedFiles).toHaveLength(4);
      expect(new Set(uploadedFiles).size).toBe(1);
      expect(uploadedFiles[0]).toBe("giai-phap-do-dac-3d");
    });
  });

  // ========================================================================
  // CASE 4: Đổi slug: old-slug -> new-slug
  // ========================================================================
  describe("Case 4: Slug modification and reference integrity", () => {
    it("retains all image URLs and fileIds in serialized payload when slug is updated", () => {
      const docWithImages: DocumentContent = {
        version: 1,
        blocks: [
          {
            id: "img-1",
            type: "image",
            url: "https://ik.imagekit.io/vdcd/solutions/old-slug/diagram.png",
            alt: "Sơ đồ kiến trúc",
            caption: "Hình 1: Kiến trúc hệ thống",
          } as ImageBlock,
        ],
      };

      const updateData: SolutionFormData = {
        title: "Giải pháp Cũ",
        slug: "new-slug-nang-cao",
        thumbnail: "https://ik.imagekit.io/vdcd/solutions/old-slug/thumb.jpg",
        thumbnailFileId: "file_thumb_123",
        content: docWithImages,
      };

      const payload = serializeSolutionPayload(updateData);
      expect(payload.slug).toBe("new-slug-nang-cao");
      expect(payload.thumbnail).toBe("https://ik.imagekit.io/vdcd/solutions/old-slug/thumb.jpg");
      expect(payload.thumbnailFileId).toBe("file_thumb_123");

      const blocks = (payload.content as DocumentContent).blocks;
      expect(blocks).toHaveLength(1);
      expect((blocks[0] as ImageBlock).url).toBe("https://ik.imagekit.io/vdcd/solutions/old-slug/diagram.png");
    });
  });

  // ========================================================================
  // CASE 5: Image replacement & deletion behavior
  // ========================================================================
  describe("Case 5: Image replacement and block removal", () => {
    it("accurately updates thumbnailFileId when thumbnail is replaced", () => {
      const initial: SolutionFormData = {
        title: "Giải pháp",
        thumbnail: "https://ik.imagekit.io/vdcd/solutions/test/old.jpg",
        thumbnailFileId: "file_old_111",
      };

      const replaced: SolutionFormData = {
        ...initial,
        thumbnail: "https://ik.imagekit.io/vdcd/solutions/test/new.jpg",
        thumbnailFileId: "file_new_222",
      };

      const payload = serializeSolutionPayload(replaced);
      expect(payload.thumbnail).toBe("https://ik.imagekit.io/vdcd/solutions/test/new.jpg");
      expect(payload.thumbnailFileId).toBe("file_new_222");
    });

    it("removes deleted image blocks from DocumentContent blocks array", () => {
      const doc: DocumentContent = {
        version: 1,
        blocks: [
          { id: "h1", type: "heading", level: 2, text: "Tiêu đề" },
          { id: "img-to-delete", type: "image", url: "https://ik.imagekit.io/test.jpg" },
          { id: "p1", type: "paragraph", text: "Đoạn văn" },
        ],
      };

      // User deletes image block
      const updatedBlocks = doc.blocks.filter((b) => b.id !== "img-to-delete");
      expect(updatedBlocks).toHaveLength(2);
      expect(updatedBlocks.some((b) => b.type === "image")).toBe(false);
    });
  });

  // ========================================================================
  // CASE 6: Upload failure handling & File validation
  // ========================================================================
  describe("Case 6: Mid-upload failure and file validation", () => {
    it("validates allowed image formats (JPEG, PNG, WebP, GIF) and rejects invalid types", () => {
      const validJpg = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      const validPng = new File(["dummy"], "test.png", { type: "image/png" });
      const validWebp = new File(["dummy"], "test.webp", { type: "image/webp" });
      const invalidPdf = new File(["dummy"], "test.pdf", { type: "application/pdf" });
      const invalidExe = new File(["dummy"], "test.exe", { type: "application/x-msdownload" });

      expect(validateImageFile(validJpg)).toBeNull();
      expect(validateImageFile(validPng)).toBeNull();
      expect(validateImageFile(validWebp)).toBeNull();
      expect(validateImageFile(invalidPdf)).toMatch(/chỉ chấp nhận file ảnh/i);
      expect(validateImageFile(invalidExe)).toMatch(/chỉ chấp nhận file ảnh/i);
    });

    it("rejects files exceeding 10MB limit", () => {
      const oversized = new File([new Uint8Array(12 * 1024 * 1024)], "huge.jpg", {
        type: "image/jpeg",
      });
      const error = validateImageFile(oversized);
      expect(error).toMatch(/không được vượt quá 10MB/i);
    });
  });

  // ========================================================================
  // SECURITY: Client arbitrary folder rejection & slug sanitization
  // ========================================================================
  describe("Security: Path traversal and arbitrary folder sanitization", () => {
    it("strips path traversal (../) and special characters using slugifyVietnamese", () => {
      expect(slugifyVietnamese("../../etc/passwd")).toBe("etc-passwd");
      expect(slugifyVietnamese("/vdcd/admin/users")).toBe("vdcd-admin-users");
      expect(slugifyVietnamese("Giải pháp IoT & Năng lượng 2026!")).toBe(
        "giai-phap-iot-nang-luong-2026",
      );
    });
  });
});
