import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectGallery } from "../ProjectGallery";
import type { ProjectImage } from "@/types/project";

const mockToast = vi.fn();
vi.mock("@/components/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui")>();
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

const mockUploadMutate = vi.fn();
const mockReorderMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockUpdateImageMutate = vi.fn();

vi.mock("@/features/projects/api", () => ({
  useUploadProjectImages: () => ({
    mutate: mockUploadMutate,
    isPending: false,
  }),
  useReorderProjectImages: () => ({
    mutate: mockReorderMutate,
    isPending: false,
  }),
  useDeleteProjectImage: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
  useUpdateProjectImage: () => ({
    mutate: mockUpdateImageMutate,
    isPending: false,
  }),
}));

const mockImages: ProjectImage[] = [
  {
    id: "img-1",
    url: "https://example.com/img1.webp",
    fileId: "fid-1",
    caption: "Bản đồ quy hoạch",
    order: 0,
    size: "small",
  },
  {
    id: "img-2",
    url: "https://example.com/img2.webp",
    fileId: "fid-2",
    caption: "Mặt bằng 3D",
    order: 1,
    size: "large",
  },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("PHASE 14 — ProjectGallery Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when gallery is empty", () => {
    renderWithClient(
      <ProjectGallery
        projectId="proj-1"
        images={[]}
        onUpdateCache={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Chưa có ảnh nào trong thư viện Gallery"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Tải ảnh lên" }),
    ).toBeInTheDocument();
  });

  it("renders image list with captions, drag handle, and size controls", () => {
    renderWithClient(
      <ProjectGallery
        projectId="proj-1"
        images={mockImages}
        onUpdateCache={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Bản đồ quy hoạch")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Mặt bằng 3D")).toBeInTheDocument();

    const smallBtns = screen.getAllByRole("button", { name: "Nhỏ" });
    const largeBtns = screen.getAllByRole("button", { name: "Lớn" });
    expect(smallBtns.length).toBe(2);
    expect(largeBtns.length).toBe(2);
  });

  it("updates caption when user types and blurs", () => {
    const handleUpdateCache = vi.fn();
    renderWithClient(
      <ProjectGallery
        projectId="proj-1"
        images={mockImages}
        onUpdateCache={handleUpdateCache}
      />,
    );

    const input = screen.getByDisplayValue("Bản đồ quy hoạch");
    fireEvent.change(input, {
      target: { value: "Bản đồ quy hoạch phân khu mới" },
    });
    fireEvent.blur(input);

    expect(handleUpdateCache).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "img-1",
          caption: "Bản đồ quy hoạch phân khu mới",
        }),
      ]),
    );

    expect(mockUpdateImageMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: "img-1",
        caption: "Bản đồ quy hoạch phân khu mới",
      }),
      expect.anything(),
    );
  });

  it("toggles size from small to large", () => {
    const handleUpdateCache = vi.fn();
    renderWithClient(
      <ProjectGallery
        projectId="proj-1"
        images={mockImages}
        onUpdateCache={handleUpdateCache}
      />,
    );

    const largeBtns = screen.getAllByRole("button", { name: "Lớn" });
    // Click Large on first image (which was small)
    fireEvent.click(largeBtns[0]);

    expect(handleUpdateCache).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "img-1",
          size: "large",
        }),
      ]),
    );

    expect(mockUpdateImageMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: "img-1",
        size: "large",
      }),
      expect.anything(),
    );
  });

  it("handles image deletion on confirm", () => {
    vi.spyOn(window, "confirm").mockImplementation(() => true);
    renderWithClient(
      <ProjectGallery
        projectId="proj-1"
        images={mockImages}
        onUpdateCache={vi.fn()}
      />,
    );

    const deleteButtons = screen.getAllByTitle("Xoá ảnh này");
    expect(deleteButtons.length).toBe(2);

    fireEvent.click(deleteButtons[0]);
    expect(mockDeleteMutate).toHaveBeenCalledWith("img-1", expect.anything());
  });
});
