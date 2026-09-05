import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  createListBlock,
  parseClipboardTextToList,
  indentListItem,
  outdentListItem,
  useSanitizedPaste,
} from "@/shared/content-editor";
import { validateImageFile, slugifyVietnamese } from "@/lib/upload";
import type { ListItem } from "@/shared/content-editor";

// Mock document.execCommand for JSDOM
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

describe("PHASE 10: List, Paste Sanitization & Media QA", () => {
  beforeEach(() => {
    execCommandMock.mockClear();
  });

  // ========================================================================
  // MATRIX 3: LIST OPERATIONS
  // ========================================================================
  describe("3. List Operations", () => {
    it("creates list block with initial items and type", () => {
      const listBlock = createListBlock({
        listType: "ordered",
        initialTexts: ["Khảo sát thực tế", "Lập kế hoạch chuyển đổi số"],
      });

      expect(listBlock.type).toBe("list");
      expect(listBlock.listType).toBe("ordered");
      expect(listBlock.items.length).toBe(2);
      expect(listBlock.items[0].content).toBe("Khảo sát thực tế");
      expect(listBlock.items[1].content).toBe("Lập kế hoạch chuyển đổi số");
    });

    it("parses multiline plain text clipboard into structured list items", () => {
      const multiline = `
        Giai đoạn 1: Chuẩn bị nhân sự
        Giai đoạn 2: Đào tạo công nghệ
        Giai đoạn 3: Triển khai thử nghiệm
      `;

      const result = parseClipboardTextToList(multiline);
      expect(result.items.length).toBe(3);
      expect(result.items[0].content).toContain("Giai đoạn 1: Chuẩn bị nhân sự");
      expect(result.items[1].content).toContain("Giai đoạn 2: Đào tạo công nghệ");
      expect(result.items[2].content).toContain("Giai đoạn 3: Triển khai thử nghiệm");
    });

    it("supports indent (nesting) and outdent operations on list items", () => {
      const items: ListItem[] = [
        { id: "1", content: "Mục cha 1", children: [] },
        { id: "2", content: "Mục con 1.1", children: [] },
        { id: "3", content: "Mục cha 2", children: [] },
      ];

      // Indent item "2" into item "1"
      const indentRes = indentListItem(items, "2");
      expect(indentRes.success).toBe(true);
      expect(indentRes.items.length).toBe(2);
      expect(indentRes.items[0].children?.length).toBe(1);
      expect(indentRes.items[0].children?.[0].id).toBe("2");

      // Outdent item "2" back to top level
      const outdentRes = outdentListItem(indentRes.items, "2");
      expect(outdentRes.success).toBe(true);
      expect(outdentRes.items.length).toBe(3);
      expect(outdentRes.items[0].children?.length).toBe(0);
      expect(outdentRes.items[1].id).toBe("2");
    });
  });

  // ========================================================================
  // MATRIX 7: PASTE SANITIZATION
  // ========================================================================
  describe("7. Paste Sanitization (Word, Google Docs, Browser, XSS)", () => {
    it("sanitizes paste from Microsoft Word (strips mso-*, inline fonts, and colors)", () => {
      const plainText = "Nội dung văn bản Word tiếng Việt có dấu: Đổi mới sáng tạo Gia Lai";
      const wordHtml = `
        <!--[if gte mso 9]><xml><w:WordDocument></w:WordDocument></xml><![endif]-->
        <p class="MsoNormal" style="mso-margin-top-alt:auto;font-family:'Times New Roman',serif;font-size:14pt;color:#FF0000">
          <span style="font-family:'Calibri',sans-serif;color:blue">${plainText}</span>
        </p>
      `;

      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent(plainText, wordHtml);

      result.current.handlePaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(execCommandMock).toHaveBeenCalledWith("insertHTML", false, plainText);
      const inserted = execCommandMock.mock.calls[0][2];
      expect(inserted).not.toContain("Times New Roman");
      expect(inserted).not.toContain("color");
      expect(inserted).toContain("Đổi mới sáng tạo Gia Lai");
    });

    it("sanitizes paste from Google Docs (strips docs-internal-guid and font wrappers)", () => {
      const plainText = "Kế hoạch hành động chuyển đổi số cấp tỉnh năm 2026";
      const gdocsHtml = `
        <meta charset="utf-8">
        <b style="font-weight:normal;" id="docs-internal-guid-12345678-abcd">
          <span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;">${plainText}</span>
        </b>
      `;

      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent(plainText, gdocsHtml);

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith("insertHTML", false, plainText);
      const inserted = execCommandMock.mock.calls[0][2];
      expect(inserted).not.toContain("docs-internal-guid");
      expect(inserted).not.toContain("font-family");
      expect(inserted).toBe(plainText);
    });

    it("sanitizes dangerous HTML/XSS (scripts, event handlers, javascript: protocols)", () => {
      const plainText = "Văn bản an toàn <script>alert('XSS')</script>";
      const maliciousHtml = "<p>Văn bản an toàn <script>alert('XSS')</script></p>";

      const { result } = renderHook(() => useSanitizedPaste());
      const event = createPasteEvent(plainText, maliciousHtml);

      result.current.handlePaste(event);

      const inserted = execCommandMock.mock.calls[0][2];
      // Scripts must be escaped as HTML entities (&lt;script&gt;) preventing execution
      expect(inserted).not.toContain("<script>");
      expect(inserted).toContain("&lt;script&gt;");
    });

    it("preserves multiline line breaks when pasting formatted plain text", () => {
      const multilineText = "Dòng 1\nDòng 2\nDòng 3";

      const { result } = renderHook(() => useSanitizedPaste({ preserveLineBreaks: true }));
      const event = createPasteEvent(multilineText);

      result.current.handlePaste(event);

      expect(execCommandMock).toHaveBeenCalledWith("insertHTML", false, "Dòng 1<br>Dòng 2<br>Dòng 3");
    });
  });

  // ========================================================================
  // MATRIX 8: MEDIA VALIDATION
  // ========================================================================
  describe("8. Media Validation & Constraints", () => {
    it("accepts valid image files within size limits (JPEG, PNG, WebP)", () => {
      const validJpg = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
      const validPng = new File(["dummy content"], "graphic.png", { type: "image/png" });
      const validWebp = new File(["dummy content"], "banner.webp", { type: "image/webp" });

      expect(validateImageFile(validJpg)).toBeNull();
      expect(validateImageFile(validPng)).toBeNull();
      expect(validateImageFile(validWebp)).toBeNull();
    });

    it("rejects non-image files or unsupported extensions (PDF, EXE, SVG)", () => {
      const pdfFile = new File(["dummy"], "document.pdf", { type: "application/pdf" });
      const exeFile = new File(["dummy"], "malware.exe", { type: "application/x-msdownload" });

      expect(validateImageFile(pdfFile)).toMatch(/chỉ chấp nhận/i);
      expect(validateImageFile(exeFile)).toMatch(/chỉ chấp nhận/i);
    });

    it("rejects oversized images exceeding the max size limit", () => {
      // 15MB file (exceeds 10MB limit)
      const bigBuffer = new Uint8Array(15 * 1024 * 1024);
      const oversizedFile = new File([bigBuffer], "huge.jpg", { type: "image/jpeg" });

      const error = validateImageFile(oversizedFile);
      expect(error).toMatch(/vượt quá/i);
    });

    it("generates URL-safe folder slug for program titles in ImageKit (vdcd/programs/<slug>)", () => {
      expect(slugifyVietnamese("Chương trình Ươm tạo Khởi nghiệp")).toBe(
        "chuong-trinh-uom-tao-khoi-nghiep"
      );
      expect(slugifyVietnamese("Số hoá Dữ liệu & Địa chính 2026!")).toBe(
        "so-hoa-du-lieu-dia-chinh-2026"
      );
      expect(slugifyVietnamese("Đổi mới Sáng tạo Gia Lai")).toBe(
        "doi-moi-sang-tao-gia-lai"
      );
    });

    it("generates a random fallback subfolder for new programs when title or slug is not yet set", () => {
      const generateFallback = () => `prog-${Math.random().toString(36).substring(2, 10)}`;
      const randomSubfolder1 = generateFallback();
      const randomSubfolder2 = generateFallback();

      expect(randomSubfolder1).toMatch(/^prog-[a-z0-9]+$/);
      expect(randomSubfolder2).toMatch(/^prog-[a-z0-9]+$/);
      expect(randomSubfolder1).not.toBe(randomSubfolder2);
    });
  });
});
