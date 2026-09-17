import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { BlogPreviewContainer } from "../BlogPreviewContainer";
import { VisualEditorCanvas } from "../../VisualEditor/VisualEditorCanvas";
import { ToastProvider } from "@/components/ui";
import { SlideDetailBlogUploadProvider } from "../../../context/SlideDetailBlogUploadContext";

describe("HTML Formatting Rendering in Slide Detail Blog (Visual Editor & Reader Preview)", () => {
  const sampleExcerpt =
    "Mục tiêu rõ ràng: <strong>biến dữ liệu đất đai phân tán</strong> thành thống nhất.";
  const sampleTitle = "SỐ HÓA <em>DỮ LIỆU ĐẤT ĐAI</em>";
  const sampleSubtitle = "TỪ <u>HIỆN TRẠNG NGOÀI THỰC ĐỊA</u> ĐẾN CƠ SỞ";
  const sampleHeroCaption = "Chú thích <strong>ảnh bìa</strong> chi tiết";

  it("BlogPreviewContainer (Đọc bài) renders HTML tags in excerpt, title, subtitle, and caption", () => {
    const { container } = render(
      <BlogPreviewContainer
        title={sampleTitle}
        subtitle={sampleSubtitle}
        excerpt={sampleExcerpt}
        heroImageUrl="https://ik.imagekit.io/vdcd/test.jpg"
        content={{
          version: 1,
          heroMeta: { caption: sampleHeroCaption },
          blocks: [],
        }}
      />,
    );

    // Excerpt should contain <strong> element, not raw '<strong>' text
    const excerptEl = container.querySelector(".blog-preview-excerpt");
    expect(excerptEl).not.toBeNull();
    const strongEl = excerptEl?.querySelector("strong");
    expect(strongEl).not.toBeNull();
    expect(strongEl?.textContent).toBe("biến dữ liệu đất đai phân tán");
    expect(excerptEl?.innerHTML).toContain("<strong>biến dữ liệu đất đai phân tán</strong>");

    // Title should contain <em> element
    const titleEl = container.querySelector(".blog-preview-title");
    expect(titleEl?.querySelector("em")?.textContent).toBe("DỮ LIỆU ĐẤT ĐAI");

    // Subtitle should contain <u> element
    const subtitleEl = container.querySelector(".blog-preview-subtitle");
    expect(subtitleEl?.querySelector("u")?.textContent).toBe("HIỆN TRẠNG NGOÀI THỰC ĐỊA");

    // Hero caption should contain <strong> element
    const captionEl = container.querySelector(".blog-preview-hero-caption");
    expect(captionEl?.querySelector("strong")?.textContent).toBe("ảnh bìa");
  });

  it("VisualEditorCanvas (Trình chỉnh sửa trực quan) renders HTML tags and preserves formatting on blur", () => {
    const onExcerptChange = vi.fn();
    const onTitleChange = vi.fn();
    const onSubtitleChange = vi.fn();
    const onContentChange = vi.fn();

    const { container } = render(
      <ToastProvider>
        <SlideDetailBlogUploadProvider subfolder="test-folder">
          <VisualEditorCanvas
            title={sampleTitle}
            subtitle={sampleSubtitle}
            excerpt={sampleExcerpt}
            heroImageUrl="https://ik.imagekit.io/vdcd/test.jpg"
            content={{
              version: 1,
              heroMeta: { caption: sampleHeroCaption },
              blocks: [],
            }}
            onContentChange={onContentChange}
            onTitleChange={onTitleChange}
            onSubtitleChange={onSubtitleChange}
            onExcerptChange={onExcerptChange}
          />
        </SlideDetailBlogUploadProvider>
      </ToastProvider>,
    );

    // Check that excerpt rendered the <strong> element in Visual Editor
    const excerptEl = container.querySelector(".blog-preview-excerpt");
    expect(excerptEl).not.toBeNull();
    const strongEl = excerptEl?.querySelector("strong");
    expect(strongEl).not.toBeNull();
    expect(strongEl?.textContent).toBe("biến dữ liệu đất đai phân tán");

    // Simulate blur on excerpt - formatting should be preserved in innerHTML
    fireEvent.blur(excerptEl!);
    expect(onExcerptChange).toHaveBeenCalledWith(
      expect.stringContaining("<strong>biến dữ liệu đất đai phân tán</strong>"),
    );

    // Title formatting on blur
    const titleEl = container.querySelector(".blog-preview-title");
    expect(titleEl?.querySelector("em")?.textContent).toBe("DỮ LIỆU ĐẤT ĐAI");
    fireEvent.blur(titleEl!);
    expect(onTitleChange).toHaveBeenCalledWith(
      expect.stringContaining("<em>DỮ LIỆU ĐẤT ĐAI</em>"),
    );

    // Subtitle formatting on blur
    const subtitleEl = container.querySelector(".blog-preview-subtitle");
    expect(subtitleEl?.querySelector("u")?.textContent).toBe("HIỆN TRẠNG NGOÀI THỰC ĐỊA");
    fireEvent.blur(subtitleEl!);
    expect(onSubtitleChange).toHaveBeenCalledWith(
      expect.stringContaining("<u>HIỆN TRẠNG NGOÀI THỰC ĐỊA</u>"),
    );

    // Caption formatting on blur
    const captionEl = container.querySelector(".blog-preview-hero-caption");
    expect(captionEl?.querySelector("strong")?.textContent).toBe("ảnh bìa");
    fireEvent.blur(captionEl!);
    expect(onContentChange).toHaveBeenCalledWith(
      expect.objectContaining({
        heroMeta: expect.objectContaining({
          caption: expect.stringContaining("<strong>ảnh bìa</strong>"),
        }),
      }),
    );
  });

  it("VisualEditorCanvas formats selected text with <mark> when Ctrl+Shift+H is pressed", () => {
    const onTitleChange = vi.fn();
    const onSubtitleChange = vi.fn();
    const onExcerptChange = vi.fn();
    const onContentChange = vi.fn();

    const { container } = render(
      <ToastProvider>
        <SlideDetailBlogUploadProvider subfolder="test-folder">
          <VisualEditorCanvas
            title="VDCD Quy hoạch tương lai"
            subtitle=""
            excerpt=""
            heroImageUrl={null}
            content={{ version: 1, blocks: [] }}
            onContentChange={onContentChange}
            onTitleChange={onTitleChange}
            onSubtitleChange={onSubtitleChange}
            onExcerptChange={onExcerptChange}
          />
        </SlideDetailBlogUploadProvider>
      </ToastProvider>,
    );

    const titleEl = container.querySelector(".blog-preview-title") as HTMLElement;
    expect(titleEl).not.toBeNull();

    // Select text inside titleEl
    const range = document.createRange();
    const textNode = titleEl.firstChild!;
    range.setStart(textNode, 5);
    range.setEnd(textNode, 14);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    // Fire keydown with Ctrl+Shift+H on titleEl
    fireEvent.keyDown(titleEl, {
      key: "H",
      ctrlKey: true,
      shiftKey: true,
    });

    // Check that titleEl now contains <mark>Quy hoạch</mark>
    expect(titleEl.innerHTML).toContain("<mark>Quy hoạch</mark>");

    // Blur titleEl and check onTitleChange was called with the <mark> tag
    fireEvent.blur(titleEl);
    expect(onTitleChange).toHaveBeenCalledWith(
      expect.stringContaining("<mark>Quy hoạch</mark>"),
    );
  });

  it("VisualEditorCanvas preserves heading text when switching heading level (H2 -> H3 -> H4)", () => {
    const onContentChange = vi.fn();

    const headingId = "head_level_test_1";
    const initialContent = {
      version: 1 as const,
      blocks: [
        {
          id: headingId,
          type: "heading" as const,
          level: 2 as const,
          text: "Tiêu đề ban đầu",
        },
      ],
    };

    const { container } = render(
      <ToastProvider>
        <SlideDetailBlogUploadProvider subfolder="test-folder">
          <VisualEditorCanvas
            title="Title"
            content={initialContent}
            onContentChange={onContentChange}
            onTitleChange={vi.fn()}
            onSubtitleChange={vi.fn()}
          />
        </SlideDetailBlogUploadProvider>
      </ToastProvider>,
    );

    // Find the heading block and click it to open PropertyPanel
    const headingBlockContainer = container.querySelector(`[data-block-id="${headingId}"]`);
    expect(headingBlockContainer).not.toBeNull();
    fireEvent.click(headingBlockContainer!);

    // Check heading tag is H2
    expect(headingBlockContainer?.tagName).toBe("H2");

    // Modify heading text via typing simulation (contentEditable input)
    headingBlockContainer!.innerHTML = "Tiêu đề sau khi chỉnh sửa";
    fireEvent.input(headingBlockContainer!);

    // Focus heading element
    (headingBlockContainer as HTMLElement).focus();

    // Click H3 button in PropertyPanel without blurring
    const h3Button = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "H3",
    );
    expect(h3Button).toBeDefined();
    fireEvent.click(h3Button!);

    // onContentChange should have been called with level: 3 and preserved text
    expect(onContentChange).toHaveBeenCalledTimes(1);
    const updatedContent = onContentChange.mock.calls[0][0];
    const updatedHeading = updatedContent.blocks[0];
    expect(updatedHeading.level).toBe(3);
    expect(updatedHeading.text).toBe("Tiêu đề sau khi chỉnh sửa");
  });

  it("BlogPreviewContainer (Đọc bài) hides hero block when heroImageUrl is empty or undefined", () => {
    const { container } = render(
      <BlogPreviewContainer
        title="Tiêu đề bài viết"
        subtitle="Phụ đề bài viết"
        excerpt="Tóm tắt nội dung"
        heroImageUrl={null}
        content={{
          version: 1,
          blocks: [],
        }}
      />,
    );

    // Should NOT contain hero image wrapper or placeholder
    expect(container.querySelector(".blog-preview-hero-image-wrapper")).toBeNull();
    expect(container.querySelector(".blog-preview-hero-image")).toBeNull();
    expect(container.textContent).not.toContain("Chưa có ảnh hero");

    // Title and excerpt should still be rendered cleanly
    expect(container.querySelector(".blog-preview-title")?.textContent).toBe("Tiêu đề bài viết");
    expect(container.querySelector(".blog-preview-excerpt")?.textContent).toBe("Tóm tắt nội dung");
  });

  it("VisualEditorCanvas (Trình chỉnh sửa trực quan) displays hero upload placeholder when heroImageUrl is empty", () => {
    const { container } = render(
      <ToastProvider>
        <SlideDetailBlogUploadProvider subfolder="test-folder">
          <VisualEditorCanvas
            title="Tiêu đề bài viết"
            heroImageUrl={null}
            content={{
              version: 1,
              blocks: [],
            }}
            onContentChange={vi.fn()}
            onTitleChange={vi.fn()}
            onSubtitleChange={vi.fn()}
          />
        </SlideDetailBlogUploadProvider>
      </ToastProvider>,
    );

    // Hero upload placeholder should be visible in Visual Editor
    expect(container.textContent).toContain("Nhấn để tải ảnh bìa Hero từ máy tính");
  });

  it("BlogPreviewContainer (Đọc bài) hides content body and empty message when blocks array is empty", () => {
    const { container } = render(
      <BlogPreviewContainer
        title="Tiêu đề bài viết"
        subtitle="Phụ đề bài viết"
        excerpt="Tóm tắt nội dung"
        content={{
          version: 1,
          blocks: [],
        }}
      />,
    );

    // blog-preview-body should not exist
    expect(container.querySelector(".blog-preview-body")).toBeNull();
    // Placeholder message should not exist
    expect(container.textContent).not.toContain("Bài viết chưa có khối nội dung nào");
    expect(container.textContent).not.toContain("Chuyển sang tab \"Nội dung\" để thêm khối");
  });
});

