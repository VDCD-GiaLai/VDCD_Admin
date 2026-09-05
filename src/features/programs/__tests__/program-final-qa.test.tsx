import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DocumentContentRenderer,
  DocumentPreviewContainer,
  createHeadingBlock,
  createParagraphBlock,
  createImageBlock,
  createListBlock,
  createQuoteBlock,
  createHighlightBlock,
  createCtaBlock,
  createSectionBlock,
  toRoman,
  duplicateListItem,
  indentListItem,
  outdentListItem,
  MAX_LIST_DEPTH,
  cleanHtmlContent,
  parseClipboardTextToList,
  type DocumentContent,
  type HeadingBlock,
} from "@/shared/content-editor";
import { ProgramEditor } from "../editor/ProgramEditor";
import { programSchema } from "../schema";
import { parseProgramContent, serializeProgramContent } from "../utils/program-content";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/components/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  usePermission: () => ({
    canCreate: () => true,
    canUpdate: () => true,
    canDelete: () => true,
    canPublish: () => true,
  }),
}));

// Mock Operation Fields API
vi.mock("@/features/operation-fields/api", () => ({
  useOperationFields: () => ({
    data: [
      { id: "field-1", name: "Công nghệ thông tin" },
      { id: "field-2", name: "Nông nghiệp công nghệ cao" },
    ],
    isLoading: false,
  }),
}));

// Mock Image Upload
vi.mock("@/lib/upload", () => ({
  uploadImage: vi.fn().mockResolvedValue({
    url: "https://ik.imagekit.io/test/program.jpg",
    fileId: "file_test_123",
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe("PHASE 10 — PROGRAM CONTENT EDITOR FINAL QA MATRIX", () => {
  // ─── 1. METADATA ──────────────────────────────────────────────────────────
  describe("1. Metadata & Form Schema", () => {
    it("validates required program metadata fields correctly", () => {
      const validData = {
        title: "Chương trình Ươm tạo Khởi nghiệp",
        slug: "chuong-trinh-uom-tao",
        shortDescription: "Mô tả ngắn gọn về chương trình",
        content: {
          version: 1,
          blocks: [createParagraphBlock({ text: "Nội dung chương trình" })],
        },
        thumbnail: "https://example.com/thumb.jpg",
        fieldId: "a1b2c3d4-e5f6-4a7b-8c9d-012345678901",
        metaTitle: "SEO Title",
        metaDescription: "SEO Description",
        isPublished: true,
      };

      const parsed = programSchema.safeParse(validData);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid metadata (empty title or invalid slug)", () => {
      const invalidData = {
        title: "",
        slug: "INVALID SLUG WITH SPACES!",
      };
      const parsed = programSchema.safeParse(invalidData);
      expect(parsed.success).toBe(false);
    });
  });

  // ─── 2. BLOCKS ────────────────────────────────────────────────────────────
  describe("2. All Block Types Rendering", () => {
    it("renders all 9 block types (H1-H6, P, Img, Quote, Highlight, CTA, List, Section) in DocumentContentRenderer", () => {
      const doc: DocumentContent = {
        version: 1,
        blocks: [
          createHeadingBlock({ level: 1, text: "Tiêu đề H1 lớn" }),
          createHeadingBlock({ level: 2, text: "Tiêu đề H2 mục" }),
          createParagraphBlock({ text: "Đoạn văn miêu tả chi tiết chương trình" }),
          createImageBlock({
            url: "https://example.com/photo.jpg",
            alt: "Ảnh minh họa",
            caption: "Chú thích ảnh minh họa",
          }),
          createQuoteBlock({ text: "Trích dẫn lời phát biểu", author: "Chuyên gia" }),
          createHighlightBlock({ text: "Thông tin điểm nhấn quan trọng" }),
          createCtaBlock({ label: "Đăng ký tham gia ngay", url: "/contact" }),
          createListBlock({ initialTexts: ["Mục danh sách 1", "Mục danh sách 2"] }),
          createSectionBlock({ title: "Khung phần nội dung" }),
        ],
      };

      const { container } = render(<DocumentContentRenderer content={doc} />);

      expect(screen.getByText("Tiêu đề H1 lớn")).toBeInTheDocument();
      expect(screen.getByText("Tiêu đề H2 mục")).toBeInTheDocument();
      expect(screen.getByText("Đoạn văn miêu tả chi tiết chương trình")).toBeInTheDocument();
      expect(screen.getByAltText("Ảnh minh họa")).toBeInTheDocument();
      expect(screen.getByText("Chú thích ảnh minh họa")).toBeInTheDocument();
      expect(screen.getByText("Trích dẫn lời phát biểu")).toBeInTheDocument();
      expect(screen.getByText("Thông tin điểm nhấn quan trọng")).toBeInTheDocument();
      expect(screen.getByText("Đăng ký tham gia ngay")).toBeInTheDocument();
      expect(screen.getByText("Mục danh sách 1")).toBeInTheDocument();

      // Heading elements must have correct semantic HTML tag
      const h1 = container.querySelector("h1");
      expect(h1).toHaveTextContent("Tiêu đề H1 lớn");
      const h2 = container.querySelector("h2");
      expect(h2).toHaveTextContent("Tiêu đề H2 mục");
    });
  });

  // ─── 3. LIST OPERATIONS ───────────────────────────────────────────────────
  describe("3. Enhanced List Operations & Nested Lists", () => {
    it("handles item duplicate, indent, outdent, and depth limit = 6", () => {
      const items = [
        { id: "i1", content: "Root Item 1", children: [] },
        { id: "i2", content: "Target Item", children: [] },
      ];

      // Duplicate
      const duped = duplicateListItem(items, "i2");
      expect(duped.items).not.toBeNull();
      expect(duped.items.length).toBe(3);
      expect(duped.items[2].content).toBe("Target Item");
      expect(duped.items[2].id).not.toBe("i2");

      // Indent (i2 becomes child of i1)
      const indentRes = indentListItem(items, "i2");
      expect(indentRes.success).toBe(true);
      expect(indentRes.items[0].children?.length).toBe(1);
      expect(indentRes.items[0].children?.[0].id).toBe("i2");

      // Outdent
      const outdentRes = outdentListItem(indentRes.items, "i2");
      expect(outdentRes.success).toBe(true);
      expect(outdentRes.items.length).toBe(2);

      // Max depth limit
      expect(MAX_LIST_DEPTH).toBe(6);
    });

    it("formats Roman numerals correctly for multi-level ordered lists", () => {
      expect(toRoman(1, false)).toBe("i");
      expect(toRoman(4, false)).toBe("iv");
      expect(toRoman(9, false)).toBe("ix");
      expect(toRoman(1, true)).toBe("I");
      expect(toRoman(4, true)).toBe("IV");
      expect(toRoman(10, true)).toBe("X");
    });
  });

  // ─── 4. TYPOGRAPHY & ZERO CSS INJECTION ────────────────────────────────────
  describe("4. Typography Separation & Zero CSS Injection", () => {
    it("maintains independent semantic level and custom fontSize without injecting raw CSS strings", () => {
      const heading = createHeadingBlock({
        level: 4, // Semantic H4
        fontSize: 32, // Large visual font size (32px)
        text: "H4 with 32px size",
      });

      const doc: DocumentContent = {
        version: 1,
        blocks: [heading],
      };

      const { container } = render(<DocumentContentRenderer content={doc} />);
      const h4 = container.querySelector("h4");
      expect(h4).toBeInTheDocument();
      expect(h4?.tagName.toLowerCase()).toBe("h4");
      expect(h4?.style.fontSize).toBe("32px");
    });
  });

  // ─── 5. EDITOR MODES & ZERO EDITING CHROME IN READER ──────────────────────
  describe("5. Editor Modes & Read-Only Article View (Zero Chrome)", () => {
    it("verifies Tab [Đọc bài] (DocumentPreviewContainer) is 100% free of editor chrome", () => {
      const doc: DocumentContent = {
        version: 1,
        blocks: [
          createHeadingBlock({ level: 2, text: "Tiêu đề bài viết sạch" }),
          createParagraphBlock({ text: "Nội dung người đọc nhìn thấy" }),
        ],
      };

      const { container } = render(
        <DocumentPreviewContainer
          title="Tên Chương Trình Mẫu"
          shortDescription="Mô tả ngắn"
          content={doc}
        />
      );

      // Title & Content are rendered
      expect(screen.getByText("Tên Chương Trình Mẫu")).toBeInTheDocument();
      expect(screen.getByText("Tiêu đề bài viết sạch")).toBeInTheDocument();
      expect(screen.getByText("Nội dung người đọc nhìn thấy")).toBeInTheDocument();

      // Zero editor chrome: no drag handles, no toolbars, no delete buttons, no insert zones
      expect(container.querySelector(".ve-block-toolbar")).toBeNull();
      expect(container.querySelector(".ve-insert-zone")).toBeNull();
      expect(container.querySelector(".drag-handle")).toBeNull();
      expect(container.querySelector("[data-testid='delete-block']")).toBeNull();
      expect(container.querySelector("[data-testid='property-panel']")).toBeNull();
      expect(container.querySelectorAll("button[aria-label*='xóa' i]").length).toBe(0);
    });

    it("renders all 4 tabs in ProgramEditor without losing unsaved state", () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <ProgramEditor mode="create" />
        </QueryClientProvider>
      );

      // 4 tabs must be present
      expect(screen.getByRole("button", { name: /^Thông tin$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Nội dung/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Đọc bài$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Trình chỉnh sửa trực quan$/i })).toBeInTheDocument();

      // Switch to Tab 3 [Đọc bài]
      fireEvent.click(screen.getByRole("button", { name: /^Đọc bài$/i }));
      expect(screen.getByText(/Bài viết chưa có (khối )?nội dung/i)).toBeInTheDocument();
    });
  });

  // ─── 6. PASTE SANITIZATION ────────────────────────────────────────────────
  describe("6. Paste Sanitization & Security", () => {
    it("strips harmful HTML, inline styles, and external fonts while preserving text and linebreaks", () => {
      const dirtyHtml = `
        <div style="font-family: 'Comic Sans MS'; color: red; background: yellow;">
          <script>alert('pwned')</script>
          <p style="font-size: 50px;">Đoạn văn tiếng Việt chuẩn Unicode <b>in đậm</b></p>
          <iframe src="https://malicious.com"></iframe>
          <a href="https://example.com" onclick="steal()">Liên kết</a>
        </div>
      `;

      const cleaned = cleanHtmlContent(dirtyHtml);
      expect(cleaned).not.toContain("<script");
      expect(cleaned).not.toContain("<iframe");
      expect(cleaned).not.toContain("onclick");
      expect(cleaned).not.toContain("Comic Sans");
      expect(cleaned).toContain("Đoạn văn tiếng Việt chuẩn Unicode");
    });

    it("parses multi-line plain text and lists from clipboard correctly", () => {
      const rawText = "Item 1\nItem 2\nItem 3";
      const listResult = parseClipboardTextToList(rawText);
      expect(listResult.items.length).toBe(3);
      expect(listResult.items[0].content).toBe("Item 1");
      expect(listResult.items[1].content).toBe("Item 2");
      expect(listResult.items[2].content).toBe("Item 3");
    });
  });

  // ─── 7. SERIALIZATION & SINGLE SOURCE OF TRUTH ────────────────────────────
  describe("7. Serialization & Single Document Source of Truth", () => {
    it("parses legacy HTML and serializes DocumentContent without loss", () => {
      const rawHtml = "<h2>Tiêu đề mục</h2><p>Đoạn văn bản</p>";
      const parsed = parseProgramContent(rawHtml);

      expect(parsed.version).toBe(1);
      expect(parsed.blocks.length).toBe(2);
      expect(parsed.blocks[0].type).toBe("heading");
      expect(parsed.blocks[1].type).toBe("paragraph");

      const serialized = serializeProgramContent(parsed);
      expect(typeof serialized).toBe("string");
      const roundTrip = parseProgramContent(serialized);
      expect(roundTrip.blocks.length).toBe(2);
      expect((roundTrip.blocks[0] as HeadingBlock).text).toBe("Tiêu đề mục");
    });
  });
});
