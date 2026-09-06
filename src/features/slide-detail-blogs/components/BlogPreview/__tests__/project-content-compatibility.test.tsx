import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlogContentRenderer } from "../BlogContentRenderer";
import { ToastProvider } from "@/components/ui";
import {
  documentContentSchema,
  type DocumentContent,
  type ContentBlock,
} from "@/shared/content-editor";

describe("Acceptance Criteria — Project Content compatibility with Slide Detail Blog Renderer", () => {
  const projectContentSample: DocumentContent = {
    version: 1,
    heroMeta: {
      placement: "above_title",
      position: "center",
      caption: "Toàn cảnh dự án số hóa nông nghiệp công nghệ cao",
    },
    blocks: [
      {
        id: "blk_heading_1",
        type: "heading",
        level: 2,
        text: "1. Bối cảnh & Thách thức dự án",
        spacing: { marginTop: 24, marginBottom: 12 },
      },
      {
        id: "blk_para_1",
        type: "paragraph",
        text: "Khu vực khảo sát có địa hình phức tạp, diện tích hơn 500 hecta cần lập bản đồ địa hình 3D trong 10 ngày.",
        spacing: { marginBottom: 16 },
      },
      {
        id: "blk_img_1",
        type: "image",
        url: "https://ik.imagekit.io/vdcd/projects/survey-drone.webp",
        fileId: "img_project_drone_1",
        alt: "Thiết bị bay UAV khảo sát thực địa",
        caption: "Thiết bị UAV LiDAR quét địa hình tại hiện trường",
        spacing: { marginTop: 16, marginBottom: 24 },
      },
      {
        id: "blk_quote_1",
        type: "quote",
        text: "Ứng dụng chuyển đổi số giúp rút ngắn 65% thời gian đo đạc và giảm thiểu sai số ranh giới.",
        author: "Ban quản lý dự án VDCD",
        citation: "Báo cáo nghiệm thu 2026",
        spacing: { marginTop: 20, marginBottom: 20 },
      },
      {
        id: "blk_highlight_1",
        type: "highlight",
        text: "Độ chính xác mô hình bề mặt đạt mức sai số dưới 3cm trên toàn dải đo.",
        spacing: { marginBottom: 16 },
      },
      {
        id: "blk_list_1",
        type: "list",
        listType: "bullet",
        listStyle: "disc",
        items: [
          {
            id: "li_1",
            content: "Thu thập ảnh viễn thám độ phân giải cao",
            children: [
              {
                id: "li_1_1",
                content: "Thiết lập lưới mốc khống chế mặt đất (GCP)",
                children: [],
              },
            ],
          },
          {
            id: "li_2",
            content: "Xử lý dữ liệu điểm đám mây (Point Cloud)",
            children: [],
          },
        ],
        spacing: { marginBottom: 24 },
      },
      {
        id: "blk_ord_list_1",
        type: "ordered_list",
        items: [
          { id: "oli_1", content: "Bước 1: Lập kế hoạch bay", children: [] },
          { id: "oli_2", content: "Bước 2: Xử lý nội suy", children: [] },
        ],
        spacing: { marginBottom: 24 },
      } as ContentBlock,
      {
        id: "blk_sec_1",
        type: "section",
        number: "01",
        title: "KẾT QUẢ ĐẠT ĐƯỢC",
        children: [
          {
            id: "blk_sec_h_1",
            type: "heading",
            level: 3,
            text: "Hoàn thiện cơ sở dữ liệu GIS",
            spacing: { marginTop: 12, marginBottom: 8 },
          },
          {
            id: "blk_sec_p_1",
            type: "paragraph",
            text: "Bàn giao hồ sơ số đồng bộ cho địa phương phục vụ công tác quy hoạch.",
          },
        ],
        spacing: { marginTop: 32, marginBottom: 24 },
      },
      {
        id: "blk_cta_1",
        type: "cta",
        label: "Tải báo cáo kỹ thuật dự án",
        url: "https://vdcd.vn/projects/so-hoa-dat-dai/report.pdf",
        spacing: { marginTop: 32 },
      },
    ],
  };

  it("successfully validates full project content with shared Zod schema", () => {
    const validated = documentContentSchema.parse(projectContentSample);
    expect(validated.version).toBe(1);
    expect(validated.heroMeta?.caption).toBe(
      "Toàn cảnh dự án số hóa nông nghiệp công nghệ cao",
    );
    expect(validated.blocks).toHaveLength(9);
  });

  it("renders all Project blocks via Slide Detail Blog's BlogContentRenderer", () => {
    render(
      <ToastProvider>
        <BlogContentRenderer blocks={projectContentSample.blocks} />
      </ToastProvider>,
    );

    // 1. Heading
    expect(
      screen.getByText("1. Bối cảnh & Thách thức dự án"),
    ).toBeInTheDocument();

    // 2. Paragraph
    expect(
      screen.getByText(
        "Khu vực khảo sát có địa hình phức tạp, diện tích hơn 500 hecta cần lập bản đồ địa hình 3D trong 10 ngày.",
      ),
    ).toBeInTheDocument();

    // 3. Image & Caption
    const image = screen.getByAltText("Thiết bị bay UAV khảo sát thực địa");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      "src",
      "https://ik.imagekit.io/vdcd/projects/survey-drone.webp",
    );
    expect(
      screen.getByText("Thiết bị UAV LiDAR quét địa hình tại hiện trường"),
    ).toBeInTheDocument();

    // 4. Quote
    expect(
      screen.getByText(
        "Ứng dụng chuyển đổi số giúp rút ngắn 65% thời gian đo đạc và giảm thiểu sai số ranh giới.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("— Ban quản lý dự án VDCD, Báo cáo nghiệm thu 2026"),
    ).toBeInTheDocument();

    // 5. Highlight
    expect(
      screen.getByText(
        "Độ chính xác mô hình bề mặt đạt mức sai số dưới 3cm trên toàn dải đo.",
      ),
    ).toBeInTheDocument();

    // 6. List & Nested Items
    expect(
      screen.getByText("Thu thập ảnh viễn thám độ phân giải cao"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Thiết lập lưới mốc khống chế mặt đất (GCP)"),
    ).toBeInTheDocument();

    // 7. Ordered List
    expect(screen.getByText("Bước 1: Lập kế hoạch bay")).toBeInTheDocument();
    expect(screen.getByText("Bước 2: Xử lý nội suy")).toBeInTheDocument();

    // 8. Section
    expect(screen.getByText("KẾT QUẢ ĐẠT ĐƯỢC")).toBeInTheDocument();
    expect(screen.getByText("Hoàn thiện cơ sở dữ liệu GIS")).toBeInTheDocument();

    // 9. CTA
    const ctaButton = screen.getByText("Tải báo cáo kỹ thuật dự án");
    expect(ctaButton).toBeInTheDocument();
  });
});
