import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectReader } from "../ProjectReader";
import type { DocumentContent } from "@/shared/content-editor";
import type { ProjectImage } from "@/types/project";

const mockToast = vi.fn();
vi.mock("@/components/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui")>();
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

const mockContent: DocumentContent = {
  version: 1,
  blocks: [
    { id: "h1", type: "heading", level: 2, text: "Tiêu đề khối nội dung" },
    { id: "p1", type: "paragraph", text: "Đoạn văn bản chi tiết dự án số hóa không gian." },
    {
      id: "img1",
      type: "image",
      url: "https://example.com/project-inner.webp",
      alt: "Ảnh nội dung",
      caption: "Mô tả ảnh nội dung",
    },
    {
      id: "q1",
      type: "quote",
      text: "Trích dẫn công nghệ cốt lõi phục vụ đô thị.",
    },
  ],
};

const mockGalleryImages: ProjectImage[] = [
  {
    id: "gal_1",
    url: "https://example.com/g1.webp",
    fileId: "fid_g1",
    caption: "Bản đồ vệ tinh độ phân giải cao",
    order: 0,
    size: "large",
  },
  {
    id: "gal_2",
    url: "https://example.com/g2.webp",
    fileId: "fid_g2",
    caption: "Thiết bị bay LiDAR quét 3D",
    order: 1,
    size: "small",
  },
];

describe("PHASE 12 & 13 — ProjectReader Component Tests", () => {
  it("renders pure read-only article view without editing controls or toolbars", () => {
    render(
      <ProjectReader
        title="Dự án GIS Thông Minh"
        slug="du-an-gis-thong-minh"
        thumbnail="https://example.com/thumb.webp"
        overview="<p>Tổng quan hệ thống GIS phục vụ giám sát quy hoạch.</p>"
        fieldName="Đô thị thông minh"
        provinceName="Gia Lai"
        year={2026}
        discipline="Địa không gian số"
        services={["Khảo sát 3D", "Lập bản đồ số"]}
        technicalHighlights={[{ label: "Độ chính xác", value: "±2cm" }]}
        challenge="Địa hình đồi núi phức tạp khó tiếp cận."
        content={mockContent}
        galleryImages={mockGalleryImages}
      />,
    );

    // Hero Header & Badges
    expect(
      screen.getByRole("heading", { name: "Dự án GIS Thông Minh", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Đô thị thông minh")).toBeInTheDocument();
    expect(screen.getByText("📍 Gia Lai")).toBeInTheDocument();
    expect(screen.getByText("🗓️ 2026")).toBeInTheDocument();

    // Breadcrumb and Reading Meta Bar
    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    expect(screen.getByText(/phút đọc/)).toBeInTheDocument();

    // Simulated browser URL
    expect(
      screen.getByText("https://vdcd.vn/du-an/du-an-gis-thong-minh"),
    ).toBeInTheDocument();

    // Overview
    expect(
      screen.getByText("Tổng quan hệ thống GIS phục vụ giám sát quy hoạch."),
    ).toBeInTheDocument();

    // Project Metadata Card
    expect(screen.getByText("Địa không gian số")).toBeInTheDocument();
    expect(screen.getByText("✓ Khảo sát 3D")).toBeInTheDocument();
    expect(screen.getByText("✓ Lập bản đồ số")).toBeInTheDocument();
    expect(screen.getByText("Độ chính xác")).toBeInTheDocument();
    expect(screen.getByText("±2cm")).toBeInTheDocument();

    // Challenge
    expect(screen.getByText("Thách thức dự án")).toBeInTheDocument();
    expect(
      screen.getByText("Địa hình đồi núi phức tạp khó tiếp cận."),
    ).toBeInTheDocument();

    // Shared Renderer (DocumentContentRenderer)
    expect(screen.getByText("Tiêu đề khối nội dung")).toBeInTheDocument();
    expect(
      screen.getByText("Đoạn văn bản chi tiết dự án số hóa không gian."),
    ).toBeInTheDocument();
    expect(screen.getByText("Mô tả ảnh nội dung")).toBeInTheDocument();
    expect(
      screen.getByText("Trích dẫn công nghệ cốt lõi phục vụ đô thị."),
    ).toBeInTheDocument();

    // Gallery
    expect(screen.getByText(/Thư viện ảnh dự án \(2\)/i)).toBeInTheDocument();
    expect(
      screen.getByText("Bản đồ vệ tinh độ phân giải cao"),
    ).toBeInTheDocument();
    expect(screen.getByText("Thiết bị bay LiDAR quét 3D")).toBeInTheDocument();

    // Social Sharing Bar & Related Projects & Common CTA
    expect(screen.getByText("Chia sẻ dự án:")).toBeInTheDocument();
    expect(screen.getByText("Xem tất cả dự án")).toBeInTheDocument();
    expect(screen.getByText("Dự án liên quan")).toBeInTheDocument();
    expect(screen.getByText(/Quay lại danh sách dự án/)).toBeInTheDocument();
    expect(screen.getByText("Triển khai thực tế")).toBeInTheDocument();
    expect(
      screen.getByText("BẠN CẦN GIẢI PHÁP TƯƠNG TỰ CHO CÔNG TRÌNH CỦA MÌNH?"),
    ).toBeInTheDocument();

    // Strict Read-Only verification: NO editing buttons or toolbar
    expect(screen.queryByText(/Thêm khối/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Xoá ảnh/i)).not.toBeInTheDocument();
    expect(screen.queryByText("⋮⋮ Kéo")).not.toBeInTheDocument();
  });

  it("switches viewports between Desktop, Tablet, and Mobile smoothly", () => {
    render(
      <ProjectReader
        title="Dự án GIS"
        content={mockContent}
      />,
    );

    const desktopBtn = screen.getByRole("button", { name: /Desktop/i });
    const tabletBtn = screen.getByRole("button", { name: /Tablet/i });
    const mobileBtn = screen.getByRole("button", { name: /Mobile/i });

    expect(desktopBtn).toBeInTheDocument();
    expect(tabletBtn).toBeInTheDocument();
    expect(mobileBtn).toBeInTheDocument();

    // Switch to Mobile
    fireEvent.click(mobileBtn);
    expect(mobileBtn).toHaveClass("bg-surface");

    // Switch to Tablet
    fireEvent.click(tabletBtn);
    expect(tabletBtn).toHaveClass("bg-surface");
  });

  it("handles empty or missing optional fields gracefully without showing placeholder block", () => {
    const emptyContent: DocumentContent = { version: 1, blocks: [] };
    render(
      <ProjectReader
        title=""
        content={emptyContent}
      />,
    );

    expect(screen.getByText("(Chưa có tên dự án)")).toBeInTheDocument();
    expect(
      screen.queryByText("Chưa có khối nội dung nào trong bài viết."),
    ).not.toBeInTheDocument();
  });

  it("renders transformation before & after images when provided", () => {
    const emptyContent: DocumentContent = { version: 1, blocks: [] };
    render(
      <ProjectReader
        title="Dự án Becamex Bình Dương"
        transformationBefore="https://example.com/before.jpg"
        transformationAfter="https://example.com/after.jpg"
        content={emptyContent}
      />,
    );

    expect(screen.getByText("Chuyển đổi số & Giải pháp công nghệ")).toBeInTheDocument();
    expect(screen.getByText("Hiện trạng trước số hóa")).toBeInTheDocument();
    expect(screen.getByText("Giải pháp công nghệ ứng dụng")).toBeInTheDocument();
    expect(screen.getByAltText("Hiện trạng trước số hóa")).toHaveAttribute("src", "https://example.com/before.jpg");
    expect(screen.getByAltText("Giải pháp công nghệ ứng dụng")).toHaveAttribute("src", "https://example.com/after.jpg");
  });
});
