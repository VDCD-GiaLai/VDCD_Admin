import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSanitizedPaste } from "./useSanitizedPaste";

// Mock document.execCommand since jsdom doesn't implement it
const execCommandMock = vi.fn();
Object.defineProperty(document, "execCommand", {
  value: execCommandMock,
  writable: true,
});

function createPasteEvent(plainText: string, htmlText?: string) {
  const clipboardData = {
    getData: vi.fn((type: string) => {
      if (type === "text/plain") return plainText;
      if (type === "text/html") return htmlText ?? "";
      return "";
    }),
  };

  return {
    preventDefault: vi.fn(),
    clipboardData,
  } as unknown as React.ClipboardEvent<HTMLElement>;
}

describe("useSanitizedPaste", () => {
  beforeEach(() => {
    execCommandMock.mockClear();
  });

  describe("with preserveLineBreaks: true (default)", () => {
    it("should paste plain text using insertHTML with escaped content", () => {
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("Hello World");

      result.current.handlePaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.clipboardData.getData).toHaveBeenCalledWith("text/plain");
      expect(execCommandMock).toHaveBeenCalledWith("insertHTML", false, "Hello World");
    });

    it("should strip HTML from Word-like formatted paste (uses plain text only)", () => {
      const htmlContent = '<span style="font-size:24px;color:red;font-family:Arial">Nội dung bài viết</span>';
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("Nội dung bài viết", htmlContent);

      result.current.handlePaste(event);

      // Should use plain text, not HTML
      expect(event.clipboardData.getData).toHaveBeenCalledWith("text/plain");
      expect(execCommandMock).toHaveBeenCalledWith("insertHTML", false, "Nội dung bài viết");
    });

    it("should strip HTML from Google Docs formatted paste", () => {
      const htmlContent = '<span id="docs-internal-guid-abc" style="font-weight:700;font-style:italic;color:#ff0000">Google Doc text</span>';
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("Google Doc text", htmlContent);

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith("insertHTML", false, "Google Doc text");
    });

    it("should preserve line breaks by converting newlines to <br>", () => {
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("Đoạn thứ nhất.\n\nĐoạn thứ hai.\n\nĐoạn thứ ba.");

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith(
        "insertHTML",
        false,
        "Đoạn thứ nhất.<br><br>Đoạn thứ hai.<br><br>Đoạn thứ ba.",
      );
    });

    it("should preserve Vietnamese Unicode characters", () => {
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("Trung tâm Đổi mới Sáng tạo Gia Lai");

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith(
        "insertHTML",
        false,
        "Trung tâm Đổi mới Sáng tạo Gia Lai",
      );
    });

    it("should escape HTML entities to prevent injection", () => {
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent('<script>alert("xss")</script>');

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith(
        "insertHTML",
        false,
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
      );
    });

    it("should escape ampersands and angle brackets", () => {
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("A & B < C > D");

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith(
        "insertHTML",
        false,
        "A &amp; B &lt; C &gt; D",
      );
    });

    it("should not crash on empty clipboard", () => {
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("");

      result.current.handlePaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(execCommandMock).not.toHaveBeenCalled();
    });

    it("should strip Word-specific markup from HTML and use plain text", () => {
      const wordHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
          <body>
            <p class="MsoNormal"><b><span style="font-family:'Times New Roman'">Bold heading</span></b></p>
            <p class="MsoNormal"><span style="color:red;font-size:14pt">Red large text</span></p>
          </body>
        </html>
      `;
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("Bold heading\nRed large text", wordHtml);

      result.current.handlePaste(event);

      // Should only use plain text
      expect(execCommandMock).toHaveBeenCalledWith(
        "insertHTML",
        false,
        "Bold heading<br>Red large text",
      );
    });

    it("should strip website HTML with various elements", () => {
      const websiteHtml = '<h1>Title</h1><p>Paragraph</p><span style="color:blue">Styled text</span>';
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("Title\nParagraph\nStyled text", websiteHtml);

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith(
        "insertHTML",
        false,
        "Title<br>Paragraph<br>Styled text",
      );
    });
  });

  describe("with preserveLineBreaks: false", () => {
    it("should strip newlines and insert as plain text for single-line elements", () => {
      const { result } = renderHook(() =>
        useSanitizedPaste({ preserveLineBreaks: false }),
      );
      const event = createPasteEvent("Line one\nLine two\nLine three");

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith(
        "insertText",
        false,
        "Line one Line two Line three",
      );
    });

    it("should trim the result when collapsing to single line", () => {
      const { result } = renderHook(() =>
        useSanitizedPaste({ preserveLineBreaks: false }),
      );
      const event = createPasteEvent("  \n  content  \n  ");

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith(
        "insertText",
        false,
        "content",
      );
    });

    it("should preserve Vietnamese Unicode in single-line mode", () => {
      const { result } = renderHook(() =>
        useSanitizedPaste({ preserveLineBreaks: false }),
      );
      const event = createPasteEvent("Phát triển Công nghệ");

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith(
        "insertText",
        false,
        "Phát triển Công nghệ",
      );
    });

    it("should not crash on empty clipboard in single-line mode", () => {
      const { result } = renderHook(() =>
        useSanitizedPaste({ preserveLineBreaks: false }),
      );
      const event = createPasteEvent("");

      result.current.handlePaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(execCommandMock).not.toHaveBeenCalled();
    });
  });

  describe("security", () => {
    it("should never use text/html from clipboard", () => {
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent("safe text", "<img onerror='alert(1)' src='x'>");

      result.current.handlePaste(event);

      // Ensure text/html was never accessed for insertion
      expect(execCommandMock).toHaveBeenCalledWith(
        "insertHTML",
        false,
        "safe text",
      );
      // The inserted HTML is the escaped plain text, not the raw HTML
      const insertedHtml = execCommandMock.mock.calls[0][2];
      expect(insertedHtml).not.toContain("<img");
      expect(insertedHtml).not.toContain("onerror");
    });

    it("should escape all HTML tags in pasted plain text", () => {
      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent(
        "<div><p>Malicious</p><script>alert(1)</script></div>",
      );

      result.current.handlePaste(event);

      const insertedHtml = execCommandMock.mock.calls[0][2];
      expect(insertedHtml).not.toContain("<div>");
      expect(insertedHtml).not.toContain("<p>");
      expect(insertedHtml).not.toContain("<script>");
      expect(insertedHtml).toContain("&lt;div&gt;");
      expect(insertedHtml).toContain("&lt;script&gt;");
    });
  });

  describe("does not affect other clipboard behavior", () => {
    it("should only intercept when getData returns text", () => {
      const { result } = renderHook(() => useSanitizedPaste());
      // Image clipboard — no plain text content
      const event = createPasteEvent("");

      result.current.handlePaste(event);

      // Should still preventDefault but not crash
      expect(event.preventDefault).toHaveBeenCalled();
      expect(execCommandMock).not.toHaveBeenCalled();
    });
  });
});
