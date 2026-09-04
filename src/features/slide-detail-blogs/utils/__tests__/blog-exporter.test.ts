import { describe, it, expect } from "vitest";
import {
  exportListBlockToHTML,
  exportBlogToHTML,
  exportBlogToJSON,
} from "../blog-exporter";
import type {
  ListBlock,
  SlideDetailBlogContent,
} from "@/types/slide-detail-blog";

describe("blog-exporter (Phase 4 — Đồng bộ Preview / Renderer / Export)", () => {
  const sampleListBlock: ListBlock = {
    id: "ls_exporter_1",
    type: "list",
    listType: "bullet",
    listStyle: "disc",
    fontSize: 16,
    lineHeight: 1.75,
    itemSpacing: 8,
    style: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: 16,
      fontWeight: "medium",
      color: "#011A42",
      backgroundColor: "#F8F9FD",
      borderWidth: 1,
      borderColor: "#E2E8F0",
      borderRadius: 8,
      padding: 16,
      indentation: 28,
      levelStyles: {
        2: {
          marker: "circle",
          fontSize: 14,
          fontWeight: "normal",
          color: "#6C7E96",
        },
      },
    },
    items: [
      {
        id: "item_1",
        content: "Dữ liệu đo đạc địa chính",
        children: [
          {
            id: "item_1_1",
            content: "Bản đồ hiện trạng tỷ lệ 1/500",
            children: [],
          },
          {
            id: "item_1_2",
            content: "Trích lục tọa độ thửa đất",
            children: [],
          },
        ],
      },
      {
        id: "item_2",
        content: "Mô hình số 3D",
        children: [],
      },
    ],
  };

  const sampleBlogContent: SlideDetailBlogContent = {
    version: 1,
    blocks: [
      {
        id: "h_1",
        type: "heading",
        level: 2,
        text: "1. Giới thiệu dự án khảo sát",
      },
      {
        id: "p_1",
        type: "paragraph",
        text: "Dự án ứng dụng công nghệ bay chụp UAV LiDAR độ chính xác cao.",
      },
      sampleListBlock,
      {
        id: "cta_1",
        type: "cta",
        label: "Liên hệ tư vấn kỹ thuật",
        url: "https://vdcd.vn/contact",
      },
    ],
  };

  it("exports ListBlock into semantic HTML with inline styling and nested hierarchy", () => {
    const html = exportListBlockToHTML(sampleListBlock);

    // Root ul with container styling
    expect(html).toContain('class="blog-list blog-list-bullet"');
    expect(html).toContain("background-color: #F8F9FD");
    expect(html).toContain("border-width: 1px");
    expect(html).toContain("border-radius: 8px");
    expect(html).toContain("padding: 16px");
    expect(html).toContain("font-family: \"Space Grotesk\", sans-serif");

    // Level 1 item styling
    expect(html).toContain("Dữ liệu đo đạc địa chính");
    expect(html).toContain("color: #011A42");

    // Level 2 nested ul with indentation and circle marker
    expect(html).toContain("padding-left: 28px");
    expect(html).toContain("list-style-type: circle");
    expect(html).toContain("Bản đồ hiện trạng tỷ lệ 1/500");
    expect(html).toContain("Trích lục tọa độ thửa đất");
    expect(html).toContain("color: #6C7E96");
    expect(html).toContain("font-size: 14px");
  });

  it("exports ordered list with semantic <ol> and sequential markers", () => {
    const orderedBlock: ListBlock = {
      id: "ls_ordered",
      type: "list",
      listType: "ordered",
      listStyle: "decimal",
      items: [
        {
          id: "step_1",
          content: "Bước 1: Chuẩn bị thiết bị",
          children: [
            { id: "step_1_a", content: "Kiểm tra pin và cảm biến", children: [] },
          ],
        },
        { id: "step_2", content: "Bước 2: Tiến hành bay chụp", children: [] },
      ],
    };

    const html = exportListBlockToHTML(orderedBlock);
    expect(html).toContain('class="blog-list blog-list-ordered"');
    expect(html).toContain("Bước 1: Chuẩn bị thiết bị");
    expect(html).toContain("<ol"); // nested ol
    expect(html).toContain("Kiểm tra pin và cảm biến");
    expect(html).toContain("Bước 2: Tiến hành bay chụp");
  });

  it("exports checklist with interactive disabled checkboxes and checked states", () => {
    const checklistBlock: ListBlock = {
      id: "ls_check",
      type: "list",
      listType: "checklist",
      items: [
        { id: "chk_1", content: "Đã thu thập dữ liệu ranh giới", checked: true, children: [] },
        { id: "chk_2", content: "Đang xử lý bình đồ ảnh", checked: false, children: [] },
      ],
    };

    const html = exportListBlockToHTML(checklistBlock);
    expect(html).toContain('class="blog-checklist-item"');
    expect(html).toContain('<input type="checkbox" checked disabled');
    expect(html).toContain('<input type="checkbox" disabled');
    expect(html).toContain("Đã thu thập dữ liệu ranh giới");
    expect(html).toContain("Đang xử lý bình đồ ảnh");
  });

  it("escapes special HTML characters to prevent XSS injection in exported HTML", () => {
    const xssBlock: ListBlock = {
      id: "ls_xss",
      type: "list",
      items: [
        {
          id: "xss_1",
          content: "<script>alert('xss')</script> & <b>bold</b>",
          children: [],
        },
      ],
    };

    const html = exportListBlockToHTML(xssBlock);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });

  it("exports complete blog into a standalone HTML5 page", () => {
    const fullHtml = exportBlogToHTML(sampleBlogContent, {
      title: "Ứng dụng Khảo sát Trắc địa VDCD",
      subtitle: "Báo cáo tiến độ dự án đo đạc số 2026",
      heroImageUrl: "https://ik.imagekit.io/vdcd/hero-sample.jpg",
    });

    expect(fullHtml).toContain("<!DOCTYPE html>");
    expect(fullHtml).toContain('<html lang="vi">');
    expect(fullHtml).toContain("<title>Ứng dụng Khảo sát Trắc địa VDCD</title>");
    expect(fullHtml).toContain("Ứng dụng Khảo sát Trắc địa VDCD</h1>");
    expect(fullHtml).toContain("Báo cáo tiến độ dự án đo đạc số 2026");
    expect(fullHtml).toContain('src="https://ik.imagekit.io/vdcd/hero-sample.jpg"');
    expect(fullHtml).toContain("1. Giới thiệu dự án khảo sát");
    expect(fullHtml).toContain("Liên hệ tư vấn kỹ thuật");
    expect(fullHtml).toContain("Dữ liệu đo đạc địa chính");
  });

  it("exports clean JSON backup preserving 100% data hierarchy and styles", () => {
    const jsonStr = exportBlogToJSON(sampleBlogContent, {
      title: "Backup Blog 2026",
    });

    const parsed = JSON.parse(jsonStr);
    expect(parsed.title).toBe("Backup Blog 2026");
    expect(parsed.version).toBe(1);
    expect(parsed.blocks).toHaveLength(4);

    const listBlock = parsed.blocks.find((b: { type: string }) => b.type === "list");
    expect(listBlock).toBeDefined();
    expect(listBlock.items).toHaveLength(2);
    expect(listBlock.items[0].children).toHaveLength(2);
    expect(listBlock.style.fontFamily).toBe('"Space Grotesk", sans-serif');
    expect(listBlock.style.levelStyles["2"].color).toBe("#6C7E96");
  });
});
