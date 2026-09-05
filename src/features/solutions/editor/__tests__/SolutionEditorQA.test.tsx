import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SolutionEditor } from "../SolutionEditor";
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

vi.mock("@/features/operation-fields/api", () => ({
  useOperationFields: () => ({
    data: [
      { id: "f1", name: "Chuyển đổi số doanh nghiệp", slug: "chuyen-doi-so-doanh-nghiep" },
      { id: "f2", name: "Thành phố thông minh", slug: "thanh-pho-thong-minh" },
    ],
  }),
}));

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
vi.mock("@/features/solutions/api", () => ({
  useCreateSolution: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useUpdateSolution: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
}));

const comprehensiveSolution: Solution = {
  id: "sol_qa_001",
  title: "Hệ thống Quản trị Năng lượng Thông minh",
  slug: "he-thong-quan-tri-nang-luong-thong-minh",
  shortDescription: "Giải pháp giám sát và tối ưu hoá tiêu thụ điện năng cho nhà máy thông minh.",
  websiteUrl: "https://smartenergy.vdcd.vn",
  content: {
    version: 1,
    blocks: [
      { id: "h1", type: "heading", level: 1, text: "Tổng quan Giải pháp Năng lượng" },
      { id: "h2", type: "heading", level: 2, text: "Lợi ích then chốt" },
      { id: "h3", type: "heading", level: 3, text: "Kiến trúc Kỹ thuật" },
      { id: "p1", type: "paragraph", text: "Hệ thống kết nối IoT cảm biến thời gian thực, phân tích điện năng tiêu thụ với độ trễ dưới 1 giây." },
      {
        id: "img1",
        type: "image",
        url: "https://ik.imagekit.io/vdcd/solutions/smart-energy-diagram.png",
        alt: "Sơ đồ kiến trúc giải pháp IoT Năng lượng",
        caption: "Hình 1: Mô hình thu thập dữ liệu cảm biến đa tầng qua giao thức MQTT",
      },
      { id: "q1", type: "quote", text: "Tiết kiệm đến 25% chi phí năng lượng ngay trong năm đầu vận hành." },
      { id: "hl1", type: "highlight", text: "Tương thích 100% chuẩn công nghiệp IEC 61850 và Modbus TCP." },
      {
        id: "l1",
        type: "list",
        items: [
          { id: "i1", content: "Giám sát tức thời công suất đỉnh", children: [] },
          { id: "i2", content: "Cảnh báo vượt ngưỡng tự động qua SMS/Email", children: [] },
        ],
      },
      {
        id: "ol1",
        type: "list",
        listType: "ordered",
        items: [
          { id: "oi1", content: "Khảo sát hạ tầng đo lường hiện hữu", children: [] },
          { id: "oi2", content: "Lắp đặt gateway IoT & cảm biến dòng", children: [] },
          { id: "oi3", content: "Hiệu chỉnh và kích hoạt hệ thống báo cáo", children: [] },
        ],
      },
      { id: "cta1", type: "cta", label: "YÊU CẦU DEMO GIẢI PHÁP", url: "/lien-he-giai-phap" },
    ],
  },
  thumbnail: "https://ik.imagekit.io/vdcd/solutions/smart-energy-thumb.jpg",
  thumbnailFileId: "file_sol_12345",
  field: { id: "f1", name: "Chuyển đổi số doanh nghiệp", slug: "chuyen-doi-so-doanh-nghiep" },
  metaTitle: "Giải pháp Quản trị Năng lượng Thông minh | VDCD",
  metaDescription: "Giảm thiểu chi phí điện năng và tối ưu hóa vận hành nhà máy với nền tảng IoT của VDCD.",
  isPublished: true,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-02T10:30:00.000Z",
};

function renderSolutionQAEditor(props: { mode: "create" | "edit"; solution?: Solution } = { mode: "edit", solution: comprehensiveSolution }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SolutionEditor mode={props.mode} solution={props.solution} />
    </QueryClientProvider>,
  );
}

describe("PHASE 06, 07, 08: Solution Content Editor Unified QA", () => {
  // ========================================================================
  // 1. TABS NAVIGATION & 4-TAB STRUCTURE
  // ========================================================================
  describe("1. 4-Tab Navigation Structure", () => {
    it("renders all 4 tabs: Thông tin, Nội dung, Đọc bài, Chỉnh sửa trực quan", () => {
      renderSolutionQAEditor();

      expect(screen.getByRole("button", { name: "Thông tin" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Nội dung" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Đọc bài" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Chỉnh sửa trực quan" })).toBeInTheDocument();
    });

    it("defaults to Tab 1 (Thông tin) on initial load", () => {
      renderSolutionQAEditor();

      expect(screen.getByLabelText(/Tiêu đề giải pháp/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Đường dẫn Website liên kết/i)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 2. TAB 1: METADATA & WEBSITE URL
  // ========================================================================
  describe("2. Tab 1: Solution Metadata Management", () => {
    it("populates all metadata fields correctly in edit mode including websiteUrl", () => {
      renderSolutionQAEditor();

      expect(screen.getByDisplayValue("Hệ thống Quản trị Năng lượng Thông minh")).toBeInTheDocument();
      expect(screen.getByDisplayValue("he-thong-quan-tri-nang-luong-thong-minh")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Giải pháp giám sát và tối ưu hoá tiêu thụ điện năng cho nhà máy thông minh.")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://smartenergy.vdcd.vn")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Giải pháp Quản trị Năng lượng Thông minh | VDCD")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Giảm thiểu chi phí điện năng và tối ưu hóa vận hành nhà máy với nền tảng IoT của VDCD.")).toBeInTheDocument();

      const checkbox = screen.getByLabelText("Xuất bản ngay");
      expect(checkbox).toBeChecked();
    });

    it("allows updating metadata and sends structured document payload with websiteUrl on save", async () => {
      renderSolutionQAEditor();

      const titleInput = screen.getByDisplayValue("Hệ thống Quản trị Năng lượng Thông minh");
      fireEvent.change(titleInput, { target: { value: "Hệ thống Quản trị Năng lượng v2" } });

      const websiteUrlInput = screen.getByDisplayValue("https://smartenergy.vdcd.vn");
      fireEvent.change(websiteUrlInput, { target: { value: "https://v2.smartenergy.vdcd.vn" } });

      const saveBtn = screen.getByRole("button", { name: "Lưu thay đổi" });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateMutate).toHaveBeenCalled();
      });

      const payload = mockUpdateMutate.mock.calls[0][0];
      expect(payload.title).toBe("Hệ thống Quản trị Năng lượng v2");
      expect(payload.websiteUrl).toBe("https://v2.smartenergy.vdcd.vn");
      expect(typeof payload.content).toBe("object");
      expect(payload.content.version).toBe(1);
      expect(payload.content.blocks.length).toBe(10);
    });

    it("triggers useCreateSolution when mode is create", async () => {
      renderSolutionQAEditor({ mode: "create" });

      const titleInput = screen.getByLabelText(/Tiêu đề giải pháp/i);
      fireEvent.change(titleInput, { target: { value: "Giải pháp Mới 2026" } });

      const saveBtn = screen.getByRole("button", { name: "Tạo giải pháp" });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockCreateMutate).toHaveBeenCalled();
      });

      const payload = mockCreateMutate.mock.calls[0][0];
      expect(payload.title).toBe("Giải pháp Mới 2026");
      expect(payload.content.version).toBe(1);
    });
  });

  // ========================================================================
  // 3. TAB 2: BLOCK EDITOR (PHASE 06)
  // ========================================================================
  describe("3. Tab 2: Block Editor", () => {
    it("switches to Tab 2 and renders block list with existing blocks", () => {
      renderSolutionQAEditor();

      fireEvent.click(screen.getByRole("button", { name: "Nội dung" }));

      // Block editor should render the heading inputs
      expect(screen.getByDisplayValue("Tổng quan Giải pháp Năng lượng")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Lợi ích then chốt")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Kiến trúc Kỹ thuật")).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 4. TAB 3: READ-ONLY READER (PHASE 08)
  // ========================================================================
  describe("4. Tab 3: Read-Only Reader", () => {
    it("renders complete article content cleanly without editor controls or borders", () => {
      renderSolutionQAEditor();

      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));

      // Informational banner
      expect(
        screen.getByText("Chế độ đọc bài viết hoàn chỉnh (Read-only View)"),
      ).toBeInTheDocument();

      // Headings rendered
      expect(screen.getByText("Tổng quan Giải pháp Năng lượng")).toBeInTheDocument();
      expect(screen.getByText("Lợi ích then chốt")).toBeInTheDocument();
      expect(screen.getByText("Kiến trúc Kỹ thuật")).toBeInTheDocument();

      // Semantic HTML check: H1, H2, H3
      const h1El = screen.getByText("Tổng quan Giải pháp Năng lượng");
      expect(h1El.tagName.toLowerCase()).toBe("h1");
      const h2El = screen.getByText("Lợi ích then chốt");
      expect(h2El.tagName.toLowerCase()).toBe("h2");
      const h3El = screen.getByText("Kiến trúc Kỹ thuật");
      expect(h3El.tagName.toLowerCase()).toBe("h3");

      // Paragraph
      expect(
        screen.getByText("Hệ thống kết nối IoT cảm biến thời gian thực, phân tích điện năng tiêu thụ với độ trễ dưới 1 giây."),
      ).toBeInTheDocument();

      // Image & Caption
      const img = screen.getByAltText("Sơ đồ kiến trúc giải pháp IoT Năng lượng");
      expect(img).toBeInTheDocument();
      expect(
        screen.getByText("Hình 1: Mô hình thu thập dữ liệu cảm biến đa tầng qua giao thức MQTT"),
      ).toBeInTheDocument();

      // Quote & Highlight
      expect(
        screen.getByText("Tiết kiệm đến 25% chi phí năng lượng ngay trong năm đầu vận hành."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Tương thích 100% chuẩn công nghiệp IEC 61850 và Modbus TCP."),
      ).toBeInTheDocument();

      // List & Ordered List items
      expect(screen.getByText("Giám sát tức thời công suất đỉnh")).toBeInTheDocument();
      expect(screen.getByText("Cảnh báo vượt ngưỡng tự động qua SMS/Email")).toBeInTheDocument();
      expect(screen.getByText("Khảo sát hạ tầng đo lường hiện hữu")).toBeInTheDocument();
      expect(screen.getByText("Lắp đặt gateway IoT & cảm biến dòng")).toBeInTheDocument();
      expect(screen.getByText("Hiệu chỉnh và kích hoạt hệ thống báo cáo")).toBeInTheDocument();

      // CTA button
      expect(screen.getByText("YÊU CẦU DEMO GIẢI PHÁP")).toBeInTheDocument();

      // No editor controls or drag handles should exist in reader tab
      expect(screen.queryByTitle("Kéo thả")).toBeNull();
      expect(screen.queryByTitle("Thêm khối")).toBeNull();
    });

    it("provides responsive viewport switching (Desktop, Tablet, Mobile)", () => {
      renderSolutionQAEditor();

      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));

      // Check responsive buttons
      const desktopBtn = screen.getByRole("button", { name: /desktop/i });
      const tabletBtn = screen.getByRole("button", { name: /tablet/i });
      const mobileBtn = screen.getByRole("button", { name: /mobile/i });

      expect(desktopBtn).toBeInTheDocument();
      expect(tabletBtn).toBeInTheDocument();
      expect(mobileBtn).toBeInTheDocument();

      // Click mobile
      fireEvent.click(mobileBtn);
      // Article remains visible
      expect(screen.getByText("Tổng quan Giải pháp Năng lượng")).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 5. TAB 4: VISUAL EDITOR (PHASE 07)
  // ========================================================================
  describe("5. Tab 4: Visual Editor Canvas", () => {
    it("renders Visual Editor Canvas with document blocks and inline editing", () => {
      renderSolutionQAEditor();

      fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa trực quan" }));

      // Visual canvas renders title and blocks
      expect(screen.getByText("Tổng quan Giải pháp Năng lượng")).toBeInTheDocument();
      expect(screen.getByText("Lợi ích then chốt")).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 6. 3-WAY STATE PRESERVATION ACROSS TABS (NO STATE LOSS)
  // ========================================================================
  describe("6. State Synchronization Across Tabs (No Data Loss / No Reset)", () => {
    it("preserves unsaved modifications across Tab 1 -> Tab 2 -> Tab 3 -> Tab 4 without refetching", () => {
      renderSolutionQAEditor();

      // 1. In Tab 1: change title
      const titleInput = screen.getByDisplayValue("Hệ thống Quản trị Năng lượng Thông minh");
      fireEvent.change(titleInput, { target: { value: "Tiêu đề đồng bộ tức thì" } });

      // 2. Switch to Tab 2 (Block Editor)
      fireEvent.click(screen.getByRole("button", { name: "Nội dung" }));
      expect(screen.getByDisplayValue("Tổng quan Giải pháp Năng lượng")).toBeInTheDocument();

      // 3. Switch to Tab 3 (Reader) - title updated live in reader header!
      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));
      expect(screen.getByText("Tiêu đề đồng bộ tức thì")).toBeInTheDocument();

      // 4. Switch to Tab 4 (Visual Editor) - title updated live in visual canvas!
      fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa trực quan" }));
      expect(screen.getAllByText("Tiêu đề đồng bộ tức thì").length).toBeGreaterThan(0);

      // 5. Switch back to Tab 1 (Thông tin) - input value preserved!
      fireEvent.click(screen.getByRole("button", { name: "Thông tin" }));
      expect(screen.getByDisplayValue("Tiêu đề đồng bộ tức thì")).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 7. LEGACY PLAIN TEXT DATA HANDLING (19 DB RECORDS)
  // ========================================================================
  describe("7. Legacy Plain Text Backward Compatibility", () => {
    it("safely handles legacy solution plain text content without error", () => {
      const legacySolution: Solution = {
        id: "sol_legacy_19",
        title: "Tư vấn và chuyển giao công nghệ vật liệu mới",
        slug: "tu-van-chuyen-giao-cong-nghe-vat-lieu-moi",
        shortDescription: "Tư vấn và chuyển giao công nghệ vật liệu mới tiên tiến.",
        websiteUrl: null,
        content: "Cung cấp giải pháp toàn diện về tư vấn, đào tạo và chuyển giao công nghệ vật liệu mới cho các doanh nghiệp sản xuất.",
        thumbnail: null,
        thumbnailFileId: null,
        field: null,
        metaTitle: null,
        metaDescription: null,
        isPublished: true,
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
      };

      renderSolutionQAEditor({ mode: "edit", solution: legacySolution });

      // Tab 3: Reader should render paragraph converted from legacy string
      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));
      expect(
        screen.getByText(
          "Cung cấp giải pháp toàn diện về tư vấn, đào tạo và chuyển giao công nghệ vật liệu mới cho các doanh nghiệp sản xuất.",
        ),
      ).toBeInTheDocument();
    });
  });
});
