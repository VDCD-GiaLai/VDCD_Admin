import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProgramEditor } from "../ProgramEditor";
import type { Program } from "@/types/program";
import { renderHook, act } from "@testing-library/react";
import { useEditorHistory } from "@/shared/content-editor";
import type { DocumentContent } from "@/shared/content-editor";

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
      { id: "f1", name: "Đổi mới sáng tạo", slug: "doi-moi-sang-tao" },
      { id: "f2", name: "Chuyển đổi số", slug: "chuyen-doi-so" },
    ],
  }),
}));

const mockUpdateMutate = vi.fn();
vi.mock("@/features/programs/api", () => ({
  useCreateProgram: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateProgram: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
}));

const comprehensiveProgram: Program = {
  id: "prg_qa_1",
  title: "Chương trình Kiểm thử Toàn diện",
  slug: "chuong-trinh-kiem-thu-toan-dien",
  shortDescription: "Mô tả kiểm thử hồi quy cho Program Editor.",
  content: {
    version: 1,
    blocks: [
      { id: "h1", type: "heading", level: 1, text: "Tiêu đề H1 Chính" },
      { id: "h2", type: "heading", level: 2, text: "Tiêu đề H2 Phụ" },
      { id: "h3", type: "heading", level: 3, text: "Tiêu đề H3 Mục" },
      { id: "p1", type: "paragraph", text: "Đoạn văn bản kiểm thử nội dung tiếng Việt có dấu." },
      {
        id: "img1",
        type: "image",
        url: "https://ik.imagekit.io/vdcd/test-qa.jpg",
        alt: "Ảnh minh hoạ kiểm thử",
        caption: "Chú thích ảnh kiểm thử QA",
      },
      { id: "q1", type: "quote", text: "Đổi mới sáng tạo là chìa khoá thành công." },
      { id: "hl1", type: "highlight", text: "Điểm nhấn quan trọng trong chương trình." },
      {
        id: "l1",
        type: "list",
        items: [
          { id: "i1", content: "Mục danh sách không thứ tự 1", children: [] },
          { id: "i2", content: "Mục danh sách không thứ tự 2", children: [] },
        ],
      },
      {
        id: "ol1",
        type: "list",
        listType: "ordered",
        items: [
          { id: "oi1", content: "Bước 1 có thứ tự", children: [] },
          { id: "oi2", content: "Bước 2 có thứ tự", children: [] },
        ],
      },
      { id: "cta1", type: "cta", label: "ĐĂNG KÝ NGAY", url: "/contact" },
    ],
    heroMeta: {
      placement: "above_title",
      position: "center",
      caption: "Ảnh hero kiểm thử",
    },
  },
  thumbnail: "https://example.com/qa-thumb.jpg",
  thumbnailFileId: "file_qa_123",
  field: { id: "f1", name: "Đổi mới sáng tạo", slug: "doi-moi-sang-tao" },
  metaTitle: "Meta Title QA Test",
  metaDescription: "Meta Description QA Test",
  isPublished: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function renderQAEditor(program: Program = comprehensiveProgram) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProgramEditor mode="edit" program={program} />
    </QueryClientProvider>,
  );
}

describe("PHASE 10: Program Content Editor Comprehensive QA", () => {
  // ========================================================================
  // MATRIX 1: METADATA
  // ========================================================================
  describe("1. Metadata Management", () => {
    it("correctly populates all metadata fields in Tab 1", () => {
      renderQAEditor();

      expect(screen.getByDisplayValue("Chương trình Kiểm thử Toàn diện")).toBeInTheDocument();
      expect(screen.getByDisplayValue("chuong-trinh-kiem-thu-toan-dien")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Mô tả kiểm thử hồi quy cho Program Editor.")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Meta Title QA Test")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Meta Description QA Test")).toBeInTheDocument();

      const checkbox = screen.getByLabelText("Xuất bản công khai");
      expect(checkbox).toBeChecked();
    });

    it("allows updating metadata and sends structured document payload on save", async () => {
      renderQAEditor();

      const titleInput = screen.getByDisplayValue("Chương trình Kiểm thử Toàn diện");
      fireEvent.change(titleInput, { target: { value: "Tiêu Đề Mới Đã Cập Nhật" } });

      const saveBtn = screen.getByRole("button", { name: "Lưu thay đổi" });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateMutate).toHaveBeenCalled();
      });

      const payload = mockUpdateMutate.mock.calls[0][0];
      expect(payload.title).toBe("Tiêu Đề Mới Đã Cập Nhật");
      expect(typeof payload.content).toBe("object");
      expect(payload.content.version).toBe(1);
    });
  });

  // ========================================================================
  // MATRIX 2: BLOCKS RENDERING & FIDELITY
  // ========================================================================
  describe("2. Blocks Rendering in Reader Mode", () => {
    it("renders all block types (Headings, Paragraph, Image, Quote, Highlight, List, Ordered List, CTA)", () => {
      renderQAEditor();

      const readerTab = screen.getByRole("button", { name: "Đọc bài" });
      fireEvent.click(readerTab);

      // Verify Headings
      expect(screen.getByText("Tiêu đề H1 Chính")).toBeInTheDocument();
      expect(screen.getByText("Tiêu đề H2 Phụ")).toBeInTheDocument();
      expect(screen.getByText("Tiêu đề H3 Mục")).toBeInTheDocument();

      // Verify Paragraph
      expect(screen.getByText("Đoạn văn bản kiểm thử nội dung tiếng Việt có dấu.")).toBeInTheDocument();

      // Verify Image & Caption
      const img = screen.getByAltText("Ảnh minh hoạ kiểm thử");
      expect(img).toBeInTheDocument();
      expect(screen.getByText("Chú thích ảnh kiểm thử QA")).toBeInTheDocument();

      // Verify Quote & Highlight
      expect(screen.getByText("Đổi mới sáng tạo là chìa khoá thành công.")).toBeInTheDocument();
      expect(screen.getByText("Điểm nhấn quan trọng trong chương trình.")).toBeInTheDocument();

      // Verify Unordered and Ordered Lists
      expect(screen.getByText("Mục danh sách không thứ tự 1")).toBeInTheDocument();
      expect(screen.getByText("Mục danh sách không thứ tự 2")).toBeInTheDocument();
      expect(screen.getByText("Bước 1 có thứ tự")).toBeInTheDocument();
      expect(screen.getByText("Bước 2 có thứ tự")).toBeInTheDocument();

      // Verify CTA
      expect(screen.getByText("ĐĂNG KÝ NGAY")).toBeInTheDocument();
    });
  });

  // ========================================================================
  // MATRIX 4: TYPOGRAPHY & NO RAW CSS INJECTION
  // ========================================================================
  describe("4. Typography & Styling Safety", () => {
    it("applies proper semantic tags without exposing raw CSS", () => {
      renderQAEditor();

      const readerTab = screen.getByRole("button", { name: "Đọc bài" });
      fireEvent.click(readerTab);

      const h1El = screen.getByText("Tiêu đề H1 Chính");
      expect(h1El.tagName.toLowerCase()).toBe("h1");

      const h2El = screen.getByText("Tiêu đề H2 Phụ");
      expect(h2El.tagName.toLowerCase()).toBe("h2");

      const h3El = screen.getByText("Tiêu đề H3 Mục");
      expect(h3El.tagName.toLowerCase()).toBe("h3");

      // Verify no raw <style> or CSS injection tags are leaked
      expect(document.querySelector("style[data-custom]")).toBeNull();
    });
  });

  // ========================================================================
  // MATRIX 5: EDITOR MODES STATE PRESERVATION (3-WAY CYCLES)
  // ========================================================================
  describe("5. Editor Modes Transitions (State Preservation)", () => {
    it("preserves unsaved modifications across Block Editor -> Reader -> Visual Editor", () => {
      renderQAEditor();

      // 1. Modify title in Tab 1
      const titleInput = screen.getByDisplayValue("Chương trình Kiểm thử Toàn diện");
      fireEvent.change(titleInput, { target: { value: "Tiêu Đề Chuyển Mode 1" } });

      // 2. Switch to Block Editor (Tab 2)
      fireEvent.click(screen.getByRole("button", { name: /Nội dung/ }));
      expect(screen.getByDisplayValue("Tiêu đề H1 Chính")).toBeInTheDocument();

      // 3. Switch to Reader (Tab 3)
      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));
      expect(screen.getByText("Tiêu Đề Chuyển Mode 1")).toBeInTheDocument();

      // 4. Switch to Visual Editor (Tab 4)
      fireEvent.click(screen.getByRole("button", { name: "Trình chỉnh sửa trực quan" }));
      expect(screen.getAllByText("Tiêu Đề Chuyển Mode 1").length).toBeGreaterThan(0);
    });

    it("preserves unsaved modifications across Visual Editor -> Reader -> Block Editor", () => {
      renderQAEditor();

      // 1. Modify title in Tab 1
      const titleInput = screen.getByDisplayValue("Chương trình Kiểm thử Toàn diện");
      fireEvent.change(titleInput, { target: { value: "Tiêu Đề Cập Nhật 2" } });

      // 2. Go to Visual Editor
      fireEvent.click(screen.getByRole("button", { name: "Trình chỉnh sửa trực quan" }));
      expect(screen.getAllByText("Tiêu Đề Cập Nhật 2").length).toBeGreaterThan(0);

      // 3. Switch to Reader
      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));
      expect(screen.getByText("Tiêu Đề Cập Nhật 2")).toBeInTheDocument();

      // 4. Switch to Block Editor
      fireEvent.click(screen.getByRole("button", { name: /Nội dung/ }));
      expect(screen.getByText("Nội dung bài viết theo khối (10 khối)")).toBeInTheDocument();

      // 5. Switch back to Info (Tab 1)
      fireEvent.click(screen.getByRole("button", { name: "Thông tin" }));
      expect(screen.getByDisplayValue("Tiêu Đề Cập Nhật 2")).toBeInTheDocument();
    });

    it("preserves unsaved modifications across Reader -> Block Editor -> Visual Editor", () => {
      renderQAEditor();

      // 1. Start in Reader
      fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));
      expect(screen.getByText("Chương trình Kiểm thử Toàn diện")).toBeInTheDocument();

      // 2. Switch to Block Editor
      fireEvent.click(screen.getByRole("button", { name: /Nội dung/ }));
      expect(screen.getByText("Nội dung bài viết theo khối (10 khối)")).toBeInTheDocument();

      // 3. Switch to Visual Editor
      fireEvent.click(screen.getByRole("button", { name: "Trình chỉnh sửa trực quan" }));
      expect(screen.getAllByText("Chương trình Kiểm thử Toàn diện").length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // MATRIX 6: HISTORY (UNDO / REDO)
  // ========================================================================
  describe("6. History (Undo / Redo) Mechanics", () => {
    it("supports undo and redo across multiple document operations", () => {
      const initialDoc: DocumentContent = {
        version: 1,
        blocks: [{ id: "b1", type: "paragraph", text: "Nội dung ban đầu" }],
      };

      const updatedDoc1: DocumentContent = {
        version: 1,
        blocks: [{ id: "b1", type: "paragraph", text: "Nội dung lần 2" }],
      };

      const updatedDoc2: DocumentContent = {
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", text: "Nội dung lần 2" },
          { id: "b2", type: "heading", level: 2, text: "Tiêu đề mới" },
        ],
      };

      const onChange = vi.fn();
      let current = initialDoc;
      const { result, rerender } = renderHook(
        ({ c }) => useEditorHistory(c, onChange),
        { initialProps: { c: current } },
      );

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      // Operation 1: Save state before edit
      act(() => {
        result.current.pushState();
      });
      current = updatedDoc1;
      rerender({ c: current });

      expect(result.current.canUndo).toBe(true);

      // Operation 2: Save state before adding block
      act(() => {
        result.current.pushState();
      });
      current = updatedDoc2;
      rerender({ c: current });

      expect(result.current.canUndo).toBe(true);

      // Undo Operation 2
      act(() => {
        result.current.undo();
      });
      expect(onChange).toHaveBeenCalledWith(updatedDoc1);
      expect(result.current.canRedo).toBe(true);

      // Undo Operation 1
      current = updatedDoc1;
      rerender({ c: current });
      act(() => {
        result.current.undo();
      });
      expect(onChange).toHaveBeenCalledWith(initialDoc);

      // Redo Operation 1
      current = initialDoc;
      rerender({ c: current });
      act(() => {
        result.current.redo();
      });
      expect(onChange).toHaveBeenCalledWith(updatedDoc1);
    });
  });
});
