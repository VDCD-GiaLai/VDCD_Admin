import { describe, it, expect, vi } from "vitest";
import {
  formatHtmlText,
  formatContentEditable,
  detectActiveFormatsInText,
  useHtmlShortcuts,
} from "../useHtmlShortcuts";
import { renderHook, act } from "@testing-library/react";

describe("useHtmlShortcuts - formatHtmlText core formatting & smart toggle", () => {
  it("wraps selected text with bold tag <strong>", () => {
    const text = "Xin chào VDCD Gia Lai";
    const start = 9; // "V"
    const end = 13; // after "D"
    const result = formatHtmlText(text, start, end, "bold");
    expect(result).not.toBeNull();
    expect(result?.newValue).toBe("Xin chào <strong>VDCD</strong> Gia Lai");
    expect(result?.cursorStart).toBe(9 + "<strong>".length);
    expect(result?.cursorEnd).toBe(9 + "<strong>".length + 4);
  });

  it("toggles OFF bold when the selection is completely self-wrapped", () => {
    const text = "Xin chào <strong>VDCD</strong> Gia Lai";
    const start = 9;
    const end = 9 + "<strong>VDCD</strong>".length; // 9 + 21 = 30
    const result = formatHtmlText(text, start, end, "bold");
    expect(result).not.toBeNull();
    expect(result?.newValue).toBe("Xin chào VDCD Gia Lai");
    expect(result?.cursorStart).toBe(9);
    expect(result?.cursorEnd).toBe(13);
  });

  it("toggles OFF bold when inner text is selected and immediately enclosed by <strong>", () => {
    const text = "Xin chào <strong>VDCD</strong> Gia Lai";
    const start = 9 + "<strong>".length; // 17
    const end = start + 4; // 21
    const result = formatHtmlText(text, start, end, "bold");
    expect(result).not.toBeNull();
    expect(result?.newValue).toBe("Xin chào VDCD Gia Lai");
    expect(result?.cursorStart).toBe(9);
    expect(result?.cursorEnd).toBe(13);
  });

  it("toggles OFF bold for alias <b> tags as well", () => {
    const text = "Xin chào <b>VDCD</b> Gia Lai";
    const start = 9 + "<b>".length;
    const end = start + 4;
    const result = formatHtmlText(text, start, end, "bold");
    expect(result).not.toBeNull();
    expect(result?.newValue).toBe("Xin chào VDCD Gia Lai");
    expect(result?.cursorStart).toBe(9);
    expect(result?.cursorEnd).toBe(13);
  });

  it("wraps and toggles italic <em> tags", () => {
    const text = "Đoạn văn bản";
    const res1 = formatHtmlText(text, 5, 8, "italic"); // "văn"
    expect(res1?.newValue).toBe("Đoạn <em>văn</em> bản");

    // Toggle off
    const res2 = formatHtmlText(res1!.newValue, 5 + 4, 5 + 4 + 3, "italic");
    expect(res2?.newValue).toBe("Đoạn văn bản");
  });

  it("wraps and toggles underline <u> tags", () => {
    const text = "Chữ gạch chân";
    const res = formatHtmlText(text, 4, 13, "underline");
    expect(res?.newValue).toBe("Chữ <u>gạch chân</u>");
  });

  it("wraps and toggles strikethrough <del> tags", () => {
    const text = "Giá gốc: 500k";
    const res = formatHtmlText(text, 9, 13, "strikethrough");
    expect(res?.newValue).toBe("Giá gốc: <del>500k</del>");
  });

  it("wraps inline code <code> tags", () => {
    const text = "Chạy lệnh pnpm dev";
    const res = formatHtmlText(text, 10, 18, "code");
    expect(res?.newValue).toBe("Chạy lệnh <code>pnpm dev</code>");
  });

  it("wraps highlight <mark> tags", () => {
    const text = "Nội dung quan trọng";
    const res = formatHtmlText(text, 9, 19, "highlight");
    expect(res?.newValue).toBe("Nội dung <mark>quan trọng</mark>");
  });

  it("clears all formatting tags inside selection with 'clear' action", () => {
    const text = "Một <strong>đoạn</strong> <em>văn</em> có <u>nhiều</u> định dạng";
    const start = 4;
    const end = text.indexOf("định dạng");
    const res = formatHtmlText(text, start, end, "clear");
    expect(res?.newValue).toBe("Một đoạn văn có nhiều định dạng");
  });

  it("creates links <a href='...'> with options.linkUrl", () => {
    const text = "Xem trang chủ tại đây";
    const start = 18;
    const end = 21; // "đây"
    const res = formatHtmlText(text, start, end, "link", { linkUrl: "https://vdcd.vn" });
    expect(res?.newValue).toBe(
      'Xem trang chủ tại <a href="https://vdcd.vn" target="_blank" rel="noopener noreferrer">đây</a>',
    );
  });

  it("toggles OFF (removes) existing link when action is link and no linkUrl is provided", () => {
    const text = 'Xem trang chủ tại <a href="https://vdcd.vn" target="_blank" rel="noopener noreferrer">đây</a> nhé';
    const start = text.indexOf("đây");
    const end = start + "đây".length;
    const res = formatHtmlText(text, start, end, "link");
    expect(res).not.toBeNull();
    expect(res?.newValue).toBe("Xem trang chủ tại đây nhé");
  });

  it("toggles OFF existing link when cursor is inside the link without prompt", () => {
    const text = 'Xem <a href="https://vdcd.vn">đây</a> nhé';
    const cursor = text.indexOf("đây") + 1;
    const res = formatHtmlText(text, cursor, cursor, "link");
    expect(res).not.toBeNull();
    expect(res?.newValue).toBe("Xem đây nhé");
  });

  it("detects active link in text via detectActiveFormatsInText", () => {
    const text = 'Xem <a href="https://vdcd.vn">đây</a> nhé <strong>đậm</strong>';
    const linkIdx = text.indexOf("đây") + 1;
    const activeAtLink = detectActiveFormatsInText(text, linkIdx, linkIdx);
    expect(activeAtLink).toContain("link");
    expect(activeAtLink).not.toContain("bold");

    const boldIdx = text.indexOf("đậm") + 1;
    const activeAtBold = detectActiveFormatsInText(text, boldIdx, boldIdx);
    expect(activeAtBold).toContain("bold");
    expect(activeAtBold).not.toContain("link");
  });

  it("unwraps existing link in contentEditable without prompt", () => {
    const div = document.createElement("div");
    div.contentEditable = "true";
    div.innerHTML = 'Xin chào <a href="https://vdcd.vn">liên kết</a> nhé';
    document.body.appendChild(div);

    const aNode = div.querySelector("a");
    expect(aNode).not.toBeNull();

    const range = document.createRange();
    range.selectNodeContents(aNode!);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    const success = formatContentEditable(div, "link");
    expect(success).toBe(true);
    expect(div.querySelector("a")).toBeNull();
    expect(div.textContent).toBe("Xin chào liên kết nhé");

    document.body.removeChild(div);
  });

  it("inserts empty tag pair when no text is selected", () => {
    const text = "Hello ";
    const res = formatHtmlText(text, 6, 6, "bold");
    expect(res?.newValue).toBe("Hello <strong></strong>");
    expect(res?.cursorStart).toBe(6 + "<strong>".length);
    expect(res?.cursorEnd).toBe(6 + "<strong>".length);
  });

  it("toggles OFF empty tag pair if cursor is between empty tags", () => {
    const text = "Hello <strong></strong> world";
    const cursor = 6 + "<strong>".length; // 14
    const res = formatHtmlText(text, cursor, cursor, "bold");
    expect(res?.newValue).toBe("Hello  world");
  });
});

describe("useHtmlShortcuts hook keyboard events", () => {
  it("triggers onChange with bold when Ctrl+B is pressed", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useHtmlShortcuts(onChange));

    const textarea = document.createElement("textarea");
    textarea.value = "Xin chào";
    textarea.selectionStart = 4;
    textarea.selectionEnd = 8;
    document.body.appendChild(textarea);

    const event = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      key: "b",
      currentTarget: textarea,
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith("Xin <strong>chào</strong>");

    document.body.removeChild(textarea);
  });

  it("triggers strikethrough with Ctrl+Shift+X", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useHtmlShortcuts(onChange));

    const input = document.createElement("input");
    input.value = "1000k 800k";
    input.selectionStart = 0;
    input.selectionEnd = 5;
    document.body.appendChild(input);

    const event = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      key: "x",
      currentTarget: input,
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLInputElement>;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith("<del>1000k</del> 800k");

    document.body.removeChild(input);
  });
});
