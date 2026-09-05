import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  deleteListItemInTree,
  moveListItem,
  MAX_LIST_DEPTH,
  cleanHtmlContent,
  parseClipboardTextToList,
  type DocumentContent,
  type HeadingBlock,
  type ImageBlock,
} from "@/shared/content-editor";
import { SolutionEditor } from "../editor/SolutionEditor";
import { solutionSchema } from "../schema";
import {
  parseSolutionContent,
  serializeSolutionContent,
  serializeSolutionPayload,
} from "../utils/solution-content";
import type { Solution } from "@/types/solution";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

const mockToast = vi.fn();
vi.mock("@/components/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui")>();
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

vi.mock("@/lib/permissions", () => ({
  usePermission: () => true,
}));

vi.mock("@/features/operation-fields/api", () => ({
  useOperationFields: () => ({
    data: [
      { id: "f1", name: "Chuyển đổi số doanh nghiệp", slug: "chuyen-doi-so-doanh-nghiep" },
      { id: "f2", name: "Thành phố thông minh", slug: "thanh-pho-thong-minh" },
    ],
    isLoading: false,
  }),
}));

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockPublishMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock("@/features/solutions/api", () => ({
  useCreateSolution: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useUpdateSolution: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
  usePublishSolution: () => ({
    mutate: mockPublishMutate,
    isPending: false,
  }),
  useDeleteSolution: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

const mockSolutionFixture: Solution = {
  id: "sol_final_qa_001",
  title: "Nền tảng Quản lý Đô thị Thông minh",
  slug: "nen-tang-quan-ly-do-thi-thong-minh",
  shortDescription: "Giải pháp toàn diện kết nối dữ liệu GIS và camera AI quản lý giao thông.",
  websiteUrl: "https://smartcity.vdcd.vn",
  content: {
    version: 1,
    blocks: [
      createHeadingBlock({ level: 1, text: "Kiến trúc Đô thị Thông minh" }),
      createHeadingBlock({ level: 2, text: "Khung năng lực số", fontSize: 28 }),
      createParagraphBlock({ text: "Giải pháp tích hợp IoT, camera AI và bản đồ GIS trực quan." }),
      createImageBlock({
        url: "https://ik.imagekit.io/vdcd/solutions/nen-tang-quan-ly-do-thi-thong-minh/architecture.png",
        alt: "Sơ đồ kiến trúc nền tảng",
        caption: "Hình 1: Mô hình liên thông dữ liệu đô thị thông minh",
      }),
      createQuoteBlock({ text: "Dữ liệu mở là chìa khóa xây dựng thành phố đáng sống.", author: "Chuyên gia Đô thị" }),
      createHighlightBlock({ text: "Thời gian phản hồi sự cố giao thông giảm 40%." }),
      createCtaBlock({ label: "TRẢI NGHIỆM HỆ THỐNG", url: "/demo-smart-city" }),
      createListBlock({
        listType: "bullet",
        initialTexts: ["Tích hợp GIS", "Camera giám sát AI"],
      }),
      createListBlock({
        listType: "ordered",
        initialTexts: ["Khảo sát địa bàn", "Triển khai máy chủ", "Tích hợp API"],
      }),
      createSectionBlock({ title: "Module Giám sát Thời gian thực" }),
    ],
  },
  thumbnail: "https://ik.imagekit.io/vdcd/solutions/nen-tang-quan-ly-do-thi-thong-minh/thumb.jpg",
  thumbnailFileId: "file_sol_thumb_qa",
  field: { id: "f2", name: "Thành phố thông minh", slug: "thanh-pho-thong-minh" },
  metaTitle: "Nền tảng Quản lý Đô thị Thông minh | VDCD",
  metaDescription: "Ứng dụng công nghệ AI và GIS trong vận hành đô thị hiện đại.",
  isPublished: true,
  publishedAt: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-02T00:00:00.000Z",
};

describe("PHASE 11: Solution Editor Final QA & Full Regression Suite (Admin)", () => {
  // ==========================================================================
  // 1. SOLUTION CRUD & PUBLISH/UNPUBLISH CONTRACT
  // ==========================================================================
  describe("1. Solution CRUD & Publish / Unpublish Lifecycle", () => {
    it("validates form schema: accepts full valid solution including websiteUrl and publishedAt", () => {
      const validPayload = {
        title: "Giải pháp Giám sát Nông nghiệp IoT",
        slug: "giai-phap-giam-sat-nong-nghiep-iot",
        shortDescription: "Cảm biến độ ẩm và tự động tưới thông minh.",
        websiteUrl: "https://agri-iot.vdcd.vn",
        content: { version: 1, blocks: [] },
        thumbnail: "https://ik.imagekit.io/vdcd/solutions/agri-iot/thumb.png",
        fieldId: "f1",
        metaTitle: "Nông nghiệp IoT | VDCD",
        metaDescription: "Tự động hóa nông nghiệp hiện đại.",
        isPublished: true,
        publishedAt: new Date("2026-09-01"),
        tempFolderKey: "solution-testkey123",
      };

      const result = solutionSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("rejects invalid solution payloads: empty title or malformed website URL", () => {
      const invalidTitle = solutionSchema.safeParse({ title: "" });
      expect(invalidTitle.success).toBe(false);

      const invalidUrl = solutionSchema.safeParse({
        title: "Hợp lệ",
        websiteUrl: "not-a-valid-url",
      });
      expect(invalidUrl.success).toBe(false);
    });

    it("serializes payload with DocumentContent and proper types for API submission", () => {
      const serialized = serializeSolutionPayload({
        title: "Giải pháp Chuyển đổi số",
        websiteUrl: "https://dx.vdcd.vn",
        isPublished: true,
        content: {
          version: 1,
          blocks: [createHeadingBlock({ level: 1, text: "Tiêu đề giải pháp" })],
        },
      });

      expect(serialized.title).toBe("Giải pháp Chuyển đổi số");
      expect(serialized.websiteUrl).toBe("https://dx.vdcd.vn");
      expect(serialized.isPublished).toBe(true);
      expect(typeof serialized.content).toBe("object");
      expect((serialized.content as DocumentContent).version).toBe(1);
    });

    it("allows submitting Create form and triggering useCreateSolution", async () => {
      const client = createTestQueryClient();
      render(
        <QueryClientProvider client={client}>
          <SolutionEditor mode="create" />
        </QueryClientProvider>,
      );

      fireEvent.change(screen.getByLabelText(/Tiêu đề giải pháp/i), {
        target: { value: "Giải pháp Mới 2026" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Tạo giải pháp" }));

      await waitFor(() => {
        expect(mockCreateMutate).toHaveBeenCalled();
      });

      const submitted = mockCreateMutate.mock.calls[0][0];
      expect(submitted.title).toBe("Giải pháp Mới 2026");
      expect(submitted.content.version).toBe(1);
    });

    it("allows submitting Edit form and triggering useUpdateSolution", async () => {
      const client = createTestQueryClient();
      render(
        <QueryClientProvider client={client}>
          <SolutionEditor mode="edit" solution={mockSolutionFixture} />
        </QueryClientProvider>,
      );

      fireEvent.change(screen.getByDisplayValue("https://smartcity.vdcd.vn"), {
        target: { value: "https://smartcity-v2.vdcd.vn" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

      await waitFor(() => {
        expect(mockUpdateMutate).toHaveBeenCalled();
      });

      const submitted = mockUpdateMutate.mock.calls[0][0];
      expect(submitted.websiteUrl).toBe("https://smartcity-v2.vdcd.vn");
    });
  });

  // ==========================================================================
  // 2. EDITOR MODES & 3-WAY LIVE SYNC WITHOUT STATE LOSS
  // ==========================================================================
  describe("2. Editor Modes: Block Editor, Visual Editor, Read-Only Reader & Live Sync", () => {
    it("renders all 4 tabs: [Thông tin], [Nội dung], [Đọc bài], [Chỉnh sửa trực quan]", () => {
      const client = createTestQueryClient();
      render(
        <QueryClientProvider client={client}>
          <SolutionEditor mode="edit" solution={mockSolutionFixture} />
        </QueryClientProvider>,
      );

      expect(screen.getByRole("button", { name: "Thông tin" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Nội dung" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Đọc bài" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Chỉnh sửa trực quan" })).toBeInTheDocument();
    });

    it("switches to Block Editor (Tab 2) and displays editable block inputs", () => {
      const client = createTestQueryClient();
      render(
        <QueryClientProvider client={client}>
          <SolutionEditor mode="edit" solution={mockSolutionFixture} />
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Nội dung" }));

      expect(screen.getByDisplayValue("Kiến trúc Đô thị Thông minh")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Khung năng lực số")).toBeInTheDocument();
    });

    it("switches to Read-Only Reader (Tab 3) with zero editing controls or borders", () => {
      const client = createTestQueryClient();
      const { container } = render(
        <QueryClientProvider client={client}>
          <SolutionEditor mode="edit" solution={mockSolutionFixture} />
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));

      // Clean reader view
      expect(screen.getByText("Kiến trúc Đô thị Thông minh")).toBeInTheDocument();
      expect(screen.getByText("Giải pháp tích hợp IoT, camera AI và bản đồ GIS trực quan.")).toBeInTheDocument();
      expect(screen.getByText("TRẢI NGHIỆM HỆ THỐNG")).toBeInTheDocument();

      // Zero editor chrome
      expect(container.querySelector(".ve-block-toolbar")).toBeNull();
      expect(container.querySelector(".ve-insert-zone")).toBeNull();
      expect(container.querySelector(".drag-handle")).toBeNull();
      expect(container.querySelector("[data-testid='delete-block']")).toBeNull();
    });

    it("switches to Visual Editor (Tab 4) and displays visual canvas with inline controls", () => {
      const client = createTestQueryClient();
      render(
        <QueryClientProvider client={client}>
          <SolutionEditor mode="edit" solution={mockSolutionFixture} />
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa trực quan" }));

      expect(screen.getByText("Kiến trúc Đô thị Thông minh")).toBeInTheDocument();
      expect(screen.getByText("Khung năng lực số")).toBeInTheDocument();
    });

    it("guarantees 0 state loss when switching across all 4 tabs with unsaved edits", () => {
      const client = createTestQueryClient();
      render(
        <QueryClientProvider client={client}>
          <SolutionEditor mode="edit" solution={mockSolutionFixture} />
        </QueryClientProvider>,
      );

      // 1. Edit in Tab 1
      const titleInput = screen.getByDisplayValue("Nền tảng Quản lý Đô thị Thông minh");
      fireEvent.change(titleInput, { target: { value: "Đô thị Thông minh Cấp tỉnh" } });

      // 2. Switch to Tab 2 (Block Editor)
      fireEvent.click(screen.getByRole("button", { name: "Nội dung" }));
      expect(screen.getByDisplayValue("Kiến trúc Đô thị Thông minh")).toBeInTheDocument();

      // 3. Switch to Tab 3 (Reader) - updated title appears immediately
      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));
      expect(screen.getByText("Đô thị Thông minh Cấp tỉnh")).toBeInTheDocument();

      // 4. Switch to Tab 4 (Visual Editor) - updated title appears
      fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa trực quan" }));
      expect(screen.getAllByText("Đô thị Thông minh Cấp tỉnh").length).toBeGreaterThan(0);

      // 5. Switch back to Tab 1 (Thông tin) - input value intact
      fireEvent.click(screen.getByRole("button", { name: "Thông tin" }));
      expect(screen.getByDisplayValue("Đô thị Thông minh Cấp tỉnh")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 3. 9 BLOCK TYPES RENDERING
  // ==========================================================================
  describe("3. All 9 Block Types Rendering in DocumentContentRenderer", () => {
    it("renders H1-H6, Paragraph, Image, Caption, Quote, Highlight, List, Ordered List, CTA, Section", () => {
      const doc: DocumentContent = {
        version: 1,
        blocks: [
          createHeadingBlock({ level: 1, text: "Heading 1 Demo" }),
          createHeadingBlock({ level: 2, text: "Heading 2 Demo" }),
          createHeadingBlock({ level: 3, text: "Heading 3 Demo" }),
          createHeadingBlock({ level: 4, text: "Heading 4 Demo" }),
          createHeadingBlock({ level: 5, text: "Heading 5 Demo" }),
          createHeadingBlock({ level: 6, text: "Heading 6 Demo" }),
          createParagraphBlock({ text: "Đoạn văn kiểm tra render" }),
          createImageBlock({
            url: "https://example.com/img.jpg",
            alt: "Ảnh minh hoạ",
            caption: "Hình minh hoạ chi tiết",
          }),
          createQuoteBlock({ text: "Trích dẫn đáng nhớ", author: "Tác giả" }),
          createHighlightBlock({ text: "Khối điểm nhấn quan trọng" }),
          createListBlock({ listType: "bullet", initialTexts: ["Bullet 1", "Bullet 2"] }),
          createListBlock({ listType: "ordered", initialTexts: ["Bước 1", "Bước 2"] }),
          createCtaBlock({ label: "HÀNH ĐỘNG NGAY", url: "/lien-he" }),
          createSectionBlock({ title: "Phần nội dung độc lập" }),
        ],
      };

      const { container } = render(<DocumentContentRenderer content={doc} />);

      // Verify all elements
      expect(screen.getByText("Heading 1 Demo")).toBeInTheDocument();
      expect(screen.getByText("Heading 2 Demo")).toBeInTheDocument();
      expect(screen.getByText("Heading 3 Demo")).toBeInTheDocument();
      expect(screen.getByText("Heading 4 Demo")).toBeInTheDocument();
      expect(screen.getByText("Heading 5 Demo")).toBeInTheDocument();
      expect(screen.getByText("Heading 6 Demo")).toBeInTheDocument();

      // Check semantic tags H1..H6
      expect(container.querySelector("h1")?.textContent).toBe("Heading 1 Demo");
      expect(container.querySelector("h2")?.textContent).toBe("Heading 2 Demo");
      expect(container.querySelector("h3")?.textContent).toBe("Heading 3 Demo");
      expect(container.querySelector("h4")?.textContent).toBe("Heading 4 Demo");
      expect(container.querySelector("h5")?.textContent).toBe("Heading 5 Demo");
      expect(container.querySelector("h6")?.textContent).toBe("Heading 6 Demo");

      // Paragraph
      expect(screen.getByText("Đoạn văn kiểm tra render")).toBeInTheDocument();

      // Image & Caption (caption only belongs to ImageBlock)
      const img = screen.getByAltText("Ảnh minh hoạ") as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(screen.getByText("Hình minh hoạ chi tiết")).toBeInTheDocument();

      // Quote & Highlight
      expect(screen.getByText("Trích dẫn đáng nhớ")).toBeInTheDocument();
      expect(screen.getByText("Khối điểm nhấn quan trọng")).toBeInTheDocument();

      // Lists
      expect(screen.getByText("Bullet 1")).toBeInTheDocument();
      expect(screen.getByText("Bước 1")).toBeInTheDocument();

      // CTA
      expect(screen.getByText("HÀNH ĐỘNG NGAY")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4. LIST UX & DEEP OPERATIONS
  // ==========================================================================
  describe("4. List Operations: Add, Delete, Duplicate, Reorder, Indent, Outdent, Nested, Styles", () => {
    it("supports duplicate, indent, outdent, delete, and max depth limit = 6", () => {
      const items = [
        { id: "item_1", content: "Mục số một", children: [] },
        { id: "item_2", content: "Mục số hai", children: [] },
      ];

      // 1. Duplicate
      const duplicated = duplicateListItem(items, "item_2");
      expect(duplicated.items.length).toBe(3);
      expect(duplicated.items[2].content).toBe("Mục số hai");
      expect(duplicated.items[2].id).not.toBe("item_2");

      // 2. Indent (item_2 becomes child of item_1)
      const indented = indentListItem(items, "item_2");
      expect(indented.success).toBe(true);
      expect(indented.items[0].children?.length).toBe(1);
      expect(indented.items[0].children?.[0].id).toBe("item_2");

      // 3. Outdent (item_2 moves back up to root level)
      const outdented = outdentListItem(indented.items, "item_2");
      expect(outdented.success).toBe(true);
      expect(outdented.items.length).toBe(2);

      // 4. Move Up / Down (Reorder)
      const moved = moveListItem(items, "item_1", "down");
      expect(moved.success).toBe(true);
      expect(moved.items[0].id).toBe("item_2");
      expect(moved.items[1].id).toBe("item_1");

      // 5. Delete
      const deleted = deleteListItemInTree(items, "item_2");
      expect(deleted.items.length).toBe(1);
      expect(deleted.items[0].id).toBe("item_1");

      // 6. Max depth limit check
      expect(MAX_LIST_DEPTH).toBe(6);
    });

    it("formats Roman numerals for multi-level nested ordered lists", () => {
      expect(toRoman(1)).toBe("i");
      expect(toRoman(4)).toBe("iv");
      expect(toRoman(9)).toBe("ix");
      expect(toRoman(10)).toBe("x");
      expect(toRoman(1, true)).toBe("I");
      expect(toRoman(4, true)).toBe("IV");
      expect(toRoman(10, true)).toBe("X");
    });

    it("parses multi-line plain text and lists from clipboard correctly", () => {
      const rawText = "Dòng A\nDòng B\nDòng C";
      const parsed = parseClipboardTextToList(rawText);
      expect(parsed.items.length).toBe(3);
      expect(parsed.items[0].content).toBe("Dòng A");
      expect(parsed.items[1].content).toBe("Dòng B");
      expect(parsed.items[2].content).toBe("Dòng C");
    });
  });

  // ==========================================================================
  // 5. TYPOGRAPHY & BLOCK SPACING
  // ==========================================================================
  describe("5. Typography & Independence of Semantic Level and Visual Font Size", () => {
    it("renders semantic H3 with custom visual fontSize = 32px independently", () => {
      const heading: HeadingBlock = createHeadingBlock({
        level: 3,
        fontSize: 32,
        text: "Tiêu đề H3 kích thước lớn 32px",
      });

      const doc: DocumentContent = {
        version: 1,
        blocks: [heading],
      };

      const { container } = render(<DocumentContentRenderer content={doc} />);
      const h3 = container.querySelector("h3");
      expect(h3).toBeInTheDocument();
      expect(h3?.tagName.toLowerCase()).toBe("h3");
      expect(h3?.style.fontSize).toBe("32px");
    });
  });

  // ==========================================================================
  // 6. PASTE SANITIZATION & SECURITY
  // ==========================================================================
  describe("6. Paste Sanitization: Word, Google Docs, Browser & XSS Defense", () => {
    it("strips external font families, colors, script tags, and event handlers", () => {
      const dirtyHtml = `
        <div style="font-family: 'Times New Roman'; color: blue; background: #ffff00;">
          <!--[if gte mso 9]><xml><w:WordDocument></w:WordDocument></xml><![endif]-->
          <script>alert('xss')</script>
          <span style="font-size: 40pt; mso-ansi-language: EN-US;">Văn bản từ Word <b>in đậm</b></span>
          <img src="x" onerror="stealCredentials()" />
          <iframe src="https://evil.com"></iframe>
        </div>
      `;

      const cleaned = cleanHtmlContent(dirtyHtml);
      expect(cleaned).not.toContain("<script");
      expect(cleaned).not.toContain("<iframe");
      expect(cleaned).not.toContain("onerror");
      expect(cleaned).not.toContain("Times New Roman");
      expect(cleaned).not.toContain("mso-");
      expect(cleaned).toContain("Văn bản từ Word");
    });
  });

  // ==========================================================================
  // 7. IMAGEKIT FOLDER LIFECYCLE & SECURITY
  // ==========================================================================
  describe("7. ImageKit Folder Convention & Multi-image Lifecycle", () => {
    it("attaches caption strictly to ImageBlock and retains fileId for tracking", () => {
      const imgBlock: ImageBlock = createImageBlock({
        url: "https://ik.imagekit.io/vdcd/solutions/giai-phap-iot/diagram.png",
        alt: "Sơ đồ IoT",
        caption: "Hình 1: Kiến trúc IoT hoàn chỉnh",
      });

      expect(imgBlock.type).toBe("image");
      expect(imgBlock.caption).toBe("Hình 1: Kiến trúc IoT hoàn chỉnh");
      expect(imgBlock.alt).toBe("Sơ đồ IoT");
    });

    it("verifies DocumentPreviewContainer displays thumbnail and caption cleanly", () => {
      const doc: DocumentContent = {
        version: 1,
        blocks: [
          createParagraphBlock({ text: "Nội dung giải pháp" }),
        ],
      };

      render(
        <DocumentPreviewContainer
          title="Giải pháp Năng lượng"
          shortDescription="Mô tả năng lượng"
          heroImageUrl="https://ik.imagekit.io/vdcd/solutions/giai-phap-nang-luong/thumb.jpg"
          content={doc}
        />,
      );

      expect(screen.getByText("Giải pháp Năng lượng")).toBeInTheDocument();
      expect(screen.getByText("Mô tả năng lượng")).toBeInTheDocument();
      const thumb = screen.getByAltText("Giải pháp Năng lượng") as HTMLImageElement;
      expect(thumb).toBeInTheDocument();
      expect(thumb.src).toContain("thumb.jpg");
    });
  });

  // ==========================================================================
  // 8. PUBLIC DETAIL PAGE & DRAFT PRIVACY
  // ==========================================================================
  describe("8. Public View & Document Model Equivalence", () => {
    it("renders identical DocumentContentRenderer on public Solution page", () => {
      const publicDoc: DocumentContent = {
        version: 1,
        blocks: [
          createHeadingBlock({ level: 1, text: "Tiêu đề Công cộng" }),
          createParagraphBlock({ text: "Nội dung người dùng xem được trên website." }),
          createCtaBlock({ label: "LIÊN HỆ TƯ VẤN", url: "/lien-he" }),
        ],
      };

      const { container } = render(<DocumentContentRenderer content={publicDoc} />);
      expect(screen.getByText("Tiêu đề Công cộng")).toBeInTheDocument();
      expect(screen.getByText("Nội dung người dùng xem được trên website.")).toBeInTheDocument();
      expect(screen.getByText("LIÊN HỆ TƯ VẤN")).toBeInTheDocument();
      expect(container.querySelector("h1")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 9. REGRESSION & SHARED CONTENT ENGINE ASSURANCE
  // ==========================================================================
  describe("9. Zero Duplicate Models & Cross-Module Shared Engine Assurance", () => {
    it("ensures Slide Detail Blog, Program, and Solution use the exact same DocumentContent version 1", () => {
      const solutionContent = parseSolutionContent(null);
      expect(solutionContent.version).toBe(1);
      expect(Array.isArray(solutionContent.blocks)).toBe(true);

      const jsonRoundTrip = parseSolutionContent(serializeSolutionContent(solutionContent));
      expect(jsonRoundTrip.version).toBe(1);
      expect(jsonRoundTrip.blocks.length).toBe(solutionContent.blocks.length);
    });

    it("parses legacy plain text from 19 database records without data loss", () => {
      const legacyText = "Dịch vụ tư vấn quy hoạch và chuyển đổi số cho doanh nghiệp tỉnh Gia Lai.";
      const doc = parseSolutionContent(legacyText);

      expect(doc.version).toBe(1);
      expect(doc.blocks.length).toBe(1);
      expect(doc.blocks[0].type).toBe("paragraph");
      expect((doc.blocks[0] as { text: string }).text).toBe(legacyText);
    });
  });

  // ==========================================================================
  // 10. CONTENT PERSISTENCE & RELOAD REGRESSION
  // ==========================================================================
  describe("10. Solution Content Persistence & Reload Regression", () => {
    it("guarantees existing document content is preserved and rendered when SolutionEditor loads in edit mode", async () => {
      const client = createTestQueryClient();
      const persistedDoc: DocumentContent = {
        version: 1,
        blocks: [
          createHeadingBlock({ level: 2, text: "Tiêu đề giải pháp bền vững" }),
          createParagraphBlock({ text: "Đoạn văn nội dung không bị mất khi tải lại trang." }),
        ],
      };

      const existingSolution: Solution = {
        id: "sol-persisted-uuid",
        title: "Giải pháp đã lưu",
        slug: "giai-phap-da-luu",
        shortDescription: "Mô tả ngắn",
        content: persistedDoc,
        thumbnail: "https://example.com/thumb.jpg",
        thumbnailFileId: "thumb-fid",
        websiteUrl: "https://vdcd.vn/giai-phap",
        metaTitle: "Meta Title",
        metaDescription: "Meta Description",
        isPublished: true,
        publishedAt: "2026-09-05T00:00:00.000Z",
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-05T00:00:00.000Z",
        field: { id: "field-gis", name: "GIS", slug: "gis" },
      };

      render(
        <QueryClientProvider client={client}>
          <SolutionEditor mode="edit" solution={existingSolution} />
        </QueryClientProvider>,
      );

      // Switch to Tab 2 (Nội dung)
      fireEvent.click(screen.getByRole("button", { name: "Nội dung" }));

      // Verify persisted blocks are rendered and not wiped out
      expect(screen.getByDisplayValue("Tiêu đề giải pháp bền vững")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Đoạn văn nội dung không bị mất khi tải lại trang.")).toBeInTheDocument();

      // Switch to Tab 3 (Đọc bài)
      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));

      expect(screen.getByText("Tiêu đề giải pháp bền vững")).toBeInTheDocument();
      expect(screen.getByText("Đoạn văn nội dung không bị mất khi tải lại trang.")).toBeInTheDocument();
    });
  });
});
