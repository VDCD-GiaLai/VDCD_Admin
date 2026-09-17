import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectEditor } from "../ProjectEditor";
import type { Project } from "@/types/project";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({ id: "proj_qa_1" }),
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
      { id: "f1", name: "Đô thị thông minh", slug: "do-thi-thong-minh" },
      { id: "f2", name: "Chuyển đổi số", slug: "chuyen-doi-so" },
    ],
  }),
}));

vi.mock("@/features/provinces/api", () => ({
  useProvinces: () => ({
    data: [
      { id: "p1", name: "Gia Lai", code: "GL" },
      { id: "p2", name: "Đắk Lắk", code: "DL" },
    ],
  }),
}));

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockUpdateImageMutate = vi.fn();
const mockPublishMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock("@/features/projects/api", () => ({
  useProjects: () => ({
    data: { items: [], total: 0 },
  }),
  useCreateProject: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useUpdateProject: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
  usePublishProject: () => ({
    mutate: mockPublishMutate,
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useDeleteProject: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
  useUploadProjectImages: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useReorderProjectImages: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteProjectImage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateProjectImage: () => ({
    mutate: mockUpdateImageMutate,
    isPending: false,
  }),
}));

vi.mock("@/hooks/usePermission", () => ({
  usePermission: () => true,
}));

const comprehensiveProject: Project = {
  id: "proj_qa_1",
  title: "Đô thị thông minh Pleiku",
  slug: "do-thi-thong-minh-pleiku",
  overview: "Tổng quan dự án số hóa không gian đô thị.",
  content: {
    version: 1,
    blocks: [
      { id: "h1", type: "heading", level: 2, text: "01 TỔNG QUAN DỰ ÁN" },
      {
        id: "p1",
        type: "paragraph",
        text: "Nội dung dự án triển khai hệ thống thông tin địa lý.",
      },
      {
        id: "img1",
        type: "image",
        url: "https://ik.imagekit.io/vdcd/projects/test.webp",
        alt: "Bản đồ Pleiku",
        caption: "Bản đồ quy hoạch 3D Pleiku",
        fileId: "file_test_123",
      },
      {
        id: "l1",
        type: "list",
        items: [
          {
            id: "i1",
            content: "Giải pháp",
            children: [
              {
                id: "i1-1",
                content: "GIS",
                children: [
                  { id: "i1-1-1", content: "WebGIS", children: [] },
                  { id: "i1-1-2", content: "3DGIS", children: [] },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "q1",
        type: "quote",
        text: "Chuyển đổi số đô thị là xu thế tất yếu.",
      },
      {
        id: "hl1",
        type: "highlight",
        text: "Điểm nhấn dự án là tích hợp dữ liệu đa nguồn.",
      },
      { id: "cta1", type: "cta", label: "Liên hệ hợp tác", url: "/contact" },
    ],
  },
  thumbnail: "https://example.com/pleiku-thumb.jpg",
  thumbnailFileId: "file_thumb_1",
  field: { id: "f1", name: "Đô thị thông minh", slug: "do-thi-thong-minh" },
  province: { id: "p1", name: "Gia Lai", code: "GL" },
  year: 2026,
  discipline: "Khảo sát & Giám sát số",
  challenge: "Thiếu dữ liệu không gian đồng bộ.",
  challengeImage: "https://example.com/challenge.webp",
  challengeImageFileId: "file_chal_1",
  services: ["Khảo sát 2D & 3D", "Xây dựng WebGIS"],
  transformationBefore: "https://example.com/before.webp",
  transformationBeforeFileId: "file_bef_1",
  transformationAfter: "https://example.com/after.webp",
  transformationAfterFileId: "file_aft_1",
  technicalHighlights: [{ label: "Diện tích", value: "120 ha" }],
  nextProjectSlug: "ha-tang-so-dak-lak",
  metaTitle: "Dự án Đô thị thông minh Pleiku - VDCD",
  metaDescription: "Triển khai giải pháp chuyển đổi số không gian đô thị Pleiku.",
  isPublished: true,
  images: [
    {
      id: "img_gal_1",
      url: "https://example.com/gallery-1.webp",
      fileId: "fid_gal_1",
      caption: "Mô hình sa bàn 3D số hóa",
      order: 0,
      size: "large",
    },
    {
      id: "img_gal_2",
      url: "https://example.com/gallery-2.webp",
      fileId: "fid_gal_2",
      caption: "Trạm quan trắc thực địa",
      order: 1,
      size: "small",
    },
  ],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("PHASE 12, 13 & 14 — ProjectEditor & ProjectReader Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 5 tabs correctly: [Thông tin], [Nội dung], [Trình chỉnh sửa trực quan], [Đọc bài], [Gallery]", () => {
    renderWithClient(
      <ProjectEditor mode="edit" project={comprehensiveProject} />,
    );

    expect(
      screen.getByRole("button", { name: "Thông tin" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nội dung" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Trình chỉnh sửa trực quan" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đọc bài" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gallery" })).toBeInTheDocument();
  });

  it("correctly populates all metadata fields in Tab 1 (Thông tin dự án)", () => {
    renderWithClient(
      <ProjectEditor mode="edit" project={comprehensiveProject} />,
    );

    expect(
      screen.getByDisplayValue("Đô thị thông minh Pleiku"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("do-thi-thong-minh-pleiku"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Khảo sát & Giám sát số"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Khảo sát 2D & 3D")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Xây dựng WebGIS")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Diện tích")).toBeInTheDocument();
    expect(screen.getByDisplayValue("120 ha")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Dự án Đô thị thông minh Pleiku - VDCD"),
    ).toBeInTheDocument();
  });

  it("switches to Tab 2 (Nội dung) and renders BlockEditor with existing blocks", () => {
    renderWithClient(
      <ProjectEditor mode="edit" project={comprehensiveProject} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nội dung" }));

    // Block editor header and add block button
    expect(screen.getByText(/Nội dung bài viết theo khối/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Thêm khối/i }).length,
    ).toBeGreaterThanOrEqual(1);

    // Verify existing blocks are rendered inside BlockEditor
    expect(screen.getByDisplayValue("01 TỔNG QUAN DỰ ÁN")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        "Nội dung dự án triển khai hệ thống thông tin địa lý.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Bản đồ quy hoạch 3D Pleiku"),
    ).toBeInTheDocument();
  });

  it("switches to Tab 3 (Trình chỉnh sửa trực quan) and renders VisualEditorCanvas with project specs, badges, and quick-edit button", () => {
    renderWithClient(
      <ProjectEditor mode="edit" project={comprehensiveProject} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Trình chỉnh sửa trực quan" }),
    );

    // Visual editor canvas viewport buttons
    expect(screen.getByRole("button", { name: "Desktop" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tablet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mobile" })).toBeInTheDocument();

    // Verify simulated URL displays project slug
    expect(
      screen.getByText("https://vdcd.vn/du-an/do-thi-thong-minh-pleiku"),
    ).toBeInTheDocument();

    // Verify Header Badges rendered on the Visual Editor canvas
    expect(screen.getByText("Đô thị thông minh")).toBeInTheDocument();
    expect(screen.getByText("📍 Gia Lai")).toBeInTheDocument();
    expect(screen.getByText("🗓️ 2026")).toBeInTheDocument();

    // Verify "THÔNG SỐ DỰ ÁN & DỊCH VỤ" rendered on the canvas
    expect(screen.getByText("THÔNG SỐ DỰ ÁN & DỊCH VỤ")).toBeInTheDocument();
    expect(screen.getByText("Khảo sát & Giám sát số")).toBeInTheDocument();
    expect(screen.getByText("✓ Khảo sát 2D & 3D")).toBeInTheDocument();
    expect(screen.getByText("✓ Xây dựng WebGIS")).toBeInTheDocument();
    expect(screen.getByText("Diện tích")).toBeInTheDocument();
    expect(screen.getByText("120 ha")).toBeInTheDocument();

    // Verify Quick Edit shortcut button
    const editSpecsBtn = screen.getByRole("button", { name: /Sửa thông số/i });
    expect(editSpecsBtn).toBeInTheDocument();

    // Verify content rendered on the canvas
    expect(screen.getByText("01 TỔNG QUAN DỰ ÁN")).toBeInTheDocument();
    expect(
      screen.getByText("Nội dung dự án triển khai hệ thống thông tin địa lý."),
    ).toBeInTheDocument();

    // Clicking "Sửa thông số" activates direct inline editing mode right in Tab 3
    fireEvent.click(editSpecsBtn);
    expect(screen.getByRole("button", { name: /Hoàn tất/i })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("VD: Trắc địa & Quy hoạch"),
    ).toHaveValue("Khảo sát & Giám sát số");

    // Add a new service directly in Tab 3
    const newServiceInput = screen.getByPlaceholderText("+ Thêm dịch vụ...");
    fireEvent.change(newServiceInput, { target: { value: "Bay chụp Drone RTK" } });
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }));

    // Toggle Hoàn tất to preview
    fireEvent.click(screen.getByRole("button", { name: /Hoàn tất/i }));
    expect(screen.getByText("✓ Bay chụp Drone RTK")).toBeInTheDocument();
  });

  it("switches to Tab 4 (Đọc bài) and renders pure read-only ProjectReader with metadata, Shared Renderer, and Gallery (PHASE 12 & 13)", () => {
    renderWithClient(
      <ProjectEditor mode="edit" project={comprehensiveProject} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));

    // Header and description
    expect(
      screen.getByText("Chế độ đọc dự án hoàn chỉnh (Read-only View)"),
    ).toBeInTheDocument();

    // Project Hero & Metadata
    expect(
      screen.getByRole("heading", { name: "Đô thị thông minh Pleiku", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Đô thị thông minh")).toBeInTheDocument();
    expect(screen.getByText("📍 Gia Lai")).toBeInTheDocument();
    expect(screen.getByText("🗓️ 2026")).toBeInTheDocument();
    expect(screen.getByText("Khảo sát & Giám sát số")).toBeInTheDocument();
    expect(screen.getByText("✓ Khảo sát 2D & 3D")).toBeInTheDocument();
    expect(screen.getByText("✓ Xây dựng WebGIS")).toBeInTheDocument();
    expect(screen.getByText("Diện tích")).toBeInTheDocument();
    expect(screen.getByText("120 ha")).toBeInTheDocument();

    // Challenge & Transformation
    expect(screen.getByText("Thách thức dự án")).toBeInTheDocument();
    expect(
      screen.getByText("Thiếu dữ liệu không gian đồng bộ."),
    ).toBeInTheDocument();

    // Content via Shared Renderer (Section 13)
    expect(screen.getByText("01 TỔNG QUAN DỰ ÁN")).toBeInTheDocument();
    expect(
      screen.getByText("Nội dung dự án triển khai hệ thống thông tin địa lý."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bản đồ quy hoạch 3D Pleiku"),
    ).toBeInTheDocument();

    // Gallery section in Reader (Section 14)
    expect(screen.getByText(/Thư viện ảnh dự án \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText("Mô hình sa bàn 3D số hóa")).toBeInTheDocument();
    expect(screen.getByText("Trạm quan trắc thực địa")).toBeInTheDocument();

    // Pure read-only verification: NO editing buttons or toolbar
    expect(screen.queryByText(/Thêm khối mới/i)).not.toBeInTheDocument();
    expect(screen.queryByText("⋮⋮ Kéo")).not.toBeInTheDocument();
  });

  it("switches to Tab 5 (Gallery) and renders Gallery management with upload, reorder, caption, size, and delete (PHASE 14)", () => {
    renderWithClient(
      <ProjectEditor mode="edit" project={comprehensiveProject} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Gallery" }));

    // Title and Upload CTA
    expect(
      screen.getByText("Thư viện ảnh dự án (Gallery)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Tải ảnh lên" }),
    ).toBeInTheDocument();

    // Existing images rendered
    expect(
      screen.getByDisplayValue("Mô hình sa bàn 3D số hóa"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Trạm quan trắc thực địa"),
    ).toBeInTheDocument();

    // Size controls: Small & Large buttons exist for each image
    const smallButtons = screen.getAllByRole("button", { name: "Nhỏ" });
    const largeButtons = screen.getAllByRole("button", { name: "Lớn" });
    expect(smallButtons.length).toBe(2);
    expect(largeButtons.length).toBe(2);

    // Toggle size
    fireEvent.click(largeButtons[1]); // toggle second image to large
    expect(mockUpdateImageMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: "img_gal_2",
        size: "large",
      }),
      expect.anything(),
    );

    // Edit caption
    const captionInput = screen.getByDisplayValue("Trạm quan trắc thực địa");
    fireEvent.change(captionInput, {
      target: { value: "Trạm quan trắc thực địa (Đã cập nhật)" },
    });
    fireEvent.blur(captionInput);

    expect(mockUpdateImageMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: "img_gal_2",
        caption: "Trạm quan trắc thực địa (Đã cập nhật)",
      }),
      expect.anything(),
    );
  });

  it("preserves unsaved modifications across all tabs and reflects immediately in Reader without API refetch", () => {
    renderWithClient(
      <ProjectEditor mode="edit" project={comprehensiveProject} />,
    );

    // Modify title in Tab 1
    const titleInput = screen.getByDisplayValue("Đô thị thông minh Pleiku");
    fireEvent.change(titleInput, {
      target: { value: "Đô thị thông minh Pleiku V2 Live Update" },
    });

    // Switch to Tab 2 (Nội dung) and modify paragraph text
    fireEvent.click(screen.getByRole("button", { name: "Nội dung" }));
    const paraInput = screen.getByDisplayValue(
      "Nội dung dự án triển khai hệ thống thông tin địa lý.",
    );
    fireEvent.change(paraInput, {
      target: { value: "Nội dung dự án được cập nhật trực tiếp tại Tab 2." },
    });

    // Switch to Tab 4 (Đọc bài) — verify modifications reflect immediately without API fetch
    fireEvent.click(screen.getByRole("button", { name: "Đọc bài" }));
    expect(
      screen.getByRole("heading", {
        name: "Đô thị thông minh Pleiku V2 Live Update",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nội dung dự án được cập nhật trực tiếp tại Tab 2."),
    ).toBeInTheDocument();

    // Switch to Tab 3 (Trình chỉnh sửa trực quan) — verify modifications reflect
    fireEvent.click(
      screen.getByRole("button", { name: "Trình chỉnh sửa trực quan" }),
    );
    expect(
      screen.getByText("Nội dung dự án được cập nhật trực tiếp tại Tab 2."),
    ).toBeInTheDocument();

    // Switch back to Tab 1 — verify modified title is preserved
    fireEvent.click(screen.getByRole("button", { name: "Thông tin" }));
    expect(
      screen.getByDisplayValue("Đô thị thông minh Pleiku V2 Live Update"),
    ).toBeInTheDocument();
  });

  it("submits the form with canonical DocumentContent and tempFolderKey (PHASE 11 requirement: Single source of truth, NO visualContent/previewContent/readerContent)", async () => {
    renderWithClient(<ProjectEditor mode="create" />);

    // Fill required title in Tab 1
    const titleInput = screen.getByPlaceholderText("Nhập tên dự án...");
    fireEvent.change(titleInput, { target: { value: "Dự án mới Pleiku" } });

    // Click "Lưu bản nháp"
    const saveDraftBtns = screen.getAllByRole("button", { name: "Lưu bản nháp" });
    fireEvent.click(saveDraftBtns[0]);

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    });

    const submitPayload = mockCreateMutate.mock.calls[0][0];

    // Verify canonical content
    expect(submitPayload.title).toBe("Dự án mới Pleiku");
    expect(submitPayload.content).toBeDefined();
    expect(submitPayload.content.version).toBe(1);
    expect(Array.isArray(submitPayload.content.blocks)).toBe(true);

    // Verify stable tempFolderKey
    expect(submitPayload.tempFolderKey).toBeDefined();

    // Strictly verify forbidden duplicated content fields are NEVER created
    expect(submitPayload.visualContent).toBeUndefined();
    expect(submitPayload.previewContent).toBeUndefined();
    expect(submitPayload.readerContent).toBeUndefined();
  });

  it("supports optional thumbnail with soft delete mechanism (Hero image pattern)", () => {
    renderWithClient(
      <ProjectEditor mode="edit" project={comprehensiveProject} />,
    );

    // Initial thumbnail exists
    const deleteThumbBtn = screen.getByRole("button", { name: /Xoá ảnh đại diện/i });
    expect(deleteThumbBtn).toBeInTheDocument();

    // Click delete thumbnail
    fireEvent.click(deleteThumbBtn);

    // Thumbnail preview should be removed, dropzone should appear
    expect(screen.queryByAltText("Thumbnail preview")).not.toBeInTheDocument();
    expect(screen.getByText("Tải lên ảnh đại diện")).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Đã gỡ ảnh đại diện",
      }),
    );
  });
});
