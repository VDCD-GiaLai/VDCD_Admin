import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProgramEditor } from "../ProgramEditor";
import type { Program } from "@/types/program";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock useToast
vi.mock("@/components/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

// Mock operation fields API
vi.mock("@/features/operation-fields/api", () => ({
  useOperationFields: () => ({
    data: [{ id: "f1", name: "Đổi mới sáng tạo", slug: "doi-moi-sang-tao" }],
  }),
}));

// Mock program API
vi.mock("@/features/programs/api", () => ({
  useCreateProgram: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateProgram: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const mockProgram: Program = {
  id: "prg_1",
  title: "Chương trình UAV Gia Lai",
  slug: "chuong-trinh-uav-gia-lai",
  shortDescription: "Tập huấn ứng dụng UAV trong xây dựng dữ liệu.",
  content: JSON.stringify({
    version: 1,
    blocks: [
      { id: "h1", type: "heading", level: 2, text: "Mục tiêu tập huấn" },
      { id: "p1", type: "paragraph", text: "Nâng cao năng lực cán bộ cơ sở." },
      {
        id: "l1",
        type: "list",
        items: [
          { id: "i1", content: "Bước 1: Khảo sát địa hình", children: [] },
          { id: "i2", content: "Bước 2: Xử lý dữ liệu", children: [] },
        ],
      },
    ],
    heroMeta: {
      placement: "above_title",
      position: "center",
      caption: "Đội ngũ UAV",
    },
  }),
  thumbnail: "https://example.com/uav-thumb.jpg",
  thumbnailFileId: "file_uav_1",
  field: { id: "f1", name: "Đổi mới sáng tạo", slug: "doi-moi-sang-tao" },
  metaTitle: "Chương trình UAV",
  metaDescription: "Ứng dụng UAV hiện đại",
  isPublished: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function renderEditor(program?: Program) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProgramEditor mode={program ? "edit" : "create"} program={program} />
    </QueryClientProvider>,
  );
}

describe("ProgramEditor Component (Phases 06, 07, 08)", () => {
  it("renders all 4 tabs correctly", () => {
    renderEditor(mockProgram);

    expect(screen.getByRole("button", { name: "Thông tin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nội dung/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đọc bài" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trình chỉnh sửa trực quan" })).toBeInTheDocument();
  });

  it("renders basic info in Tab 1 (Thông tin)", () => {
    renderEditor(mockProgram);

    expect(screen.getByDisplayValue("Chương trình UAV Gia Lai")).toBeInTheDocument();
    expect(screen.getByDisplayValue("chuong-trinh-uav-gia-lai")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Tập huấn ứng dụng UAV trong xây dựng dữ liệu."),
    ).toBeInTheDocument();
  });

  it("switches to Tab 2 (Nội dung) and displays BlockEditor", () => {
    renderEditor(mockProgram);

    const blocksTab = screen.getByRole("button", { name: /Nội dung/ });
    fireEvent.click(blocksTab);

    // Should display block list and Add block button
    expect(screen.getByText("Nội dung bài viết theo khối (3 khối)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Mục tiêu tập huấn")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Nâng cao năng lực cán bộ cơ sở.")).toBeInTheDocument();
  });

  it("switches to Tab 3 (Đọc bài) and renders pure read-only article view (Phase 08)", () => {
    renderEditor(mockProgram);

    const readerTab = screen.getByRole("button", { name: "Đọc bài" });
    fireEvent.click(readerTab);

    // Viewport selectors
    expect(screen.getByRole("button", { name: /Desktop/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tablet/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mobile/ })).toBeInTheDocument();

    // Rendered content (public program page layout)
    expect(screen.getByText("Chương trình UAV Gia Lai")).toBeInTheDocument();
    expect(screen.getByText("Tập huấn ứng dụng UAV trong xây dựng dữ liệu.")).toBeInTheDocument();
    expect(screen.getByText("Mục tiêu tập huấn")).toBeInTheDocument();
    expect(screen.getByText("Nâng cao năng lực cán bộ cơ sở.")).toBeInTheDocument();
    expect(screen.getByText("Bước 1: Khảo sát địa hình")).toBeInTheDocument();
    expect(screen.getByText("Bước 2: Xử lý dữ liệu")).toBeInTheDocument();

    // STRICT PHASE 08 REQUIREMENT:
    // NO editing controls in Read-only view
    expect(screen.queryByText("+ Thêm khối")).not.toBeInTheDocument();
    expect(screen.queryByText("Chọn loại khối nội dung cần thêm")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Xoá khối")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Nhân bản khối này")).not.toBeInTheDocument();
  });

  it("live unsaved state syncs immediately from Tab 1 to Tab 3 (Đọc bài) without refetching", () => {
    renderEditor(mockProgram);

    // Edit title in Tab 1
    const titleInput = screen.getByDisplayValue("Chương trình UAV Gia Lai");
    fireEvent.change(titleInput, { target: { value: "Chương trình UAV Đã Cập Nhật" } });

    // Switch to Tab 3 (Đọc bài)
    const readerTab = screen.getByRole("button", { name: "Đọc bài" });
    fireEvent.click(readerTab);

    // Reader must display the unsaved new title immediately!
    expect(screen.getByText("Chương trình UAV Đã Cập Nhật")).toBeInTheDocument();
  });
});
