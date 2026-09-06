import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  documentContentSchema,
  DocumentContentRenderer,
  type BlogDocument,
  type ContentDocument,
  type Block,
} from "@/shared/content-editor";
import { BlogContentRenderer } from "@/features/slide-detail-blogs/components/BlogPreview/BlogContentRenderer";

// Mock useToast from @/components/ui
const mockToast = vi.fn();
vi.mock("@/components/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui")>();
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

describe("Phase 02: Shared Document Model for Project", () => {
  const sampleProjectContent: BlogDocument = {
    version: 1,
    heroMeta: {
      placement: "between_title_desc",
      position: "center",
      caption: "Mô hình số hóa dự án Lotte Mall Võ Chí Công",
    },
    blocks: [
      {
        id: "blk-h1",
        type: "heading",
        level: 2,
        text: "Thách thức & Hiện trạng dự án",
        fontSize: 24,
        spacing: { marginTop: 24, marginBottom: 12 },
      },
      {
        id: "blk-p1",
        type: "paragraph",
        text: "Dự án yêu cầu giám sát thi công 24/7 với công nghệ AutoTimelapse và quét 3D Laser Scanning.",
        fontSize: 16,
        spacing: { marginTop: 8, marginBottom: 16 },
      },
      {
        id: "blk-img1",
        type: "image",
        url: "https://ik.imagekit.io/vdcd/projects/lotte-mall/overview.webp",
        fileId: "fid-lotte-overview",
        alt: "Toàn cảnh công trình Lotte Mall",
        caption: "Hình ảnh góc rộng flycam quét hiện trạng",
        spacing: { marginTop: 16, marginBottom: 20 },
      },
      {
        id: "blk-list1",
        type: "list",
        listType: "bullet",
        listStyle: "disc",
        items: [
          {
            id: "li-1",
            content: "Khảo sát trắc địa địa hình 3D",
            children: [
              {
                id: "li-1-1",
                content: "Độ chính xác tọa độ dưới 2cm",
                children: [],
              },
              {
                id: "li-1-2",
                content: "Tích hợp bản đồ quy hoạch GIS",
                children: [],
              },
            ],
          },
          {
            id: "li-2",
            content: "Giám sát tiến độ trực tuyến theo tuần",
            children: [],
          },
        ],
        spacing: { marginTop: 12, marginBottom: 16 },
      },
      {
        id: "blk-quote1",
        type: "quote",
        text: "Công nghệ số hóa của VDCD giúp rút ngắn 35% thời gian nghiệm thu công trình.",
        author: "Ban Quản lý Dự án",
        citation: "Báo cáo nghiệm thu 2026",
        spacing: { marginTop: 16, marginBottom: 16 },
      },
      {
        id: "blk-hl1",
        type: "highlight",
        text: "Dự án đã áp dụng thành công mô hình Digital Twin kết hợp IoT.",
        spacing: { marginTop: 16, marginBottom: 16 },
      },
      {
        id: "blk-sec1",
        type: "section",
        number: "01",
        title: "KẾT QUẢ CHUYỂN ĐỔI SỐ",
        children: [
          {
            id: "blk-sec-p",
            type: "paragraph",
            text: "Toàn bộ dữ liệu được đồng bộ theo thời gian thực về Dashboard điều hành.",
          },
        ],
        spacing: { marginTop: 24, marginBottom: 16 },
      },
      {
        id: "blk-cta1",
        type: "cta",
        label: "Xem hồ sơ kỹ thuật chi tiết",
        url: "https://vdcd.vn/contact",
        spacing: { marginTop: 20, marginBottom: 24 },
      },
    ],
  };

  it("should validate sample Project content against documentContentSchema", () => {
    const validated = documentContentSchema.parse(sampleProjectContent);
    expect(validated.version).toBe(1);
    expect(validated.blocks.length).toBe(8);
    expect(validated.heroMeta?.placement).toBe("between_title_desc");
  });

  it("should parse and render Project content using DocumentContentRenderer", () => {
    render(<DocumentContentRenderer content={sampleProjectContent} />);

    // Heading
    expect(screen.getByText("Thách thức & Hiện trạng dự án")).toBeInTheDocument();

    // Paragraph
    expect(
      screen.getByText("Dự án yêu cầu giám sát thi công 24/7 với công nghệ AutoTimelapse và quét 3D Laser Scanning.")
    ).toBeInTheDocument();

    // Image & Caption
    expect(screen.getByAltText("Toàn cảnh công trình Lotte Mall")).toBeInTheDocument();
    expect(screen.getByText("Hình ảnh góc rộng flycam quét hiện trạng")).toBeInTheDocument();

    // Nested List items
    expect(screen.getByText("Khảo sát trắc địa địa hình 3D")).toBeInTheDocument();
    expect(screen.getByText("Độ chính xác tọa độ dưới 2cm")).toBeInTheDocument();
    expect(screen.getByText("Tích hợp bản đồ quy hoạch GIS")).toBeInTheDocument();

    // Quote
    expect(screen.getByText(/Công nghệ số hóa của VDCD giúp rút ngắn 35%/)).toBeInTheDocument();
    expect(screen.getByText(/Ban Quản lý Dự án/)).toBeInTheDocument();

    // Highlight
    expect(screen.getByText("Dự án đã áp dụng thành công mô hình Digital Twin kết hợp IoT.")).toBeInTheDocument();

    // Section
    expect(screen.getByText("KẾT QUẢ CHUYỂN ĐỔI SỐ")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();

    // CTA
    expect(screen.getByText("Xem hồ sơ kỹ thuật chi tiết")).toBeInTheDocument();
  });

  it("should parse and render Project content directly by Slide Detail Blog BlogContentRenderer", () => {
    render(<BlogContentRenderer blocks={sampleProjectContent.blocks} />);

    expect(screen.getByText("Thách thức & Hiện trạng dự án")).toBeInTheDocument();
    expect(screen.getByText("Hình ảnh góc rộng flycam quét hiện trạng")).toBeInTheDocument();
    expect(screen.getByText("KẾT QUẢ CHUYỂN ĐỔI SỐ")).toBeInTheDocument();
  });

  it("should guarantee ContentDocument, BlogDocument, and Block types are interchangeable", () => {
    const docAsContent: ContentDocument = sampleProjectContent;
    const docAsBlog: BlogDocument = docAsContent;
    const firstBlock: Block = docAsBlog.blocks[0];

    expect(docAsBlog.version).toBe(1);
    expect(firstBlock.id).toBe("blk-h1");
    expect(firstBlock.type).toBe("heading");
  });
});
