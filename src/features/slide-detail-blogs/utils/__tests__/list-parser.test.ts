import { describe, it, expect } from "vitest";
import { parseClipboardTextToList } from "../list-parser";
import { insertPastedItemsInTree, cloneTree } from "../list-helpers";
import type { ListItem, ListBlock } from "@/types/slide-detail-blog";

describe("Phase 4 — Bulk Paste & List Parser Unit Tests", () => {
  // 1. Multi-line paste
  it("1. Multi-line paste: parses plain multi-line text into distinct items", () => {
    const raw = `Bình đồ ảnh trực giao khu vực khảo sát.
Bản đồ địa chính số và bản đồ hiện trạng.
Mô hình số địa hình hoặc mô hình 3D.
Dữ liệu không gian của từng thửa đất.
Thông tin thuộc tính được chuẩn hóa.`;

    const result = parseClipboardTextToList(raw);
    expect(result.items).toHaveLength(5);
    expect(result.items[0].content).toBe("Bình đồ ảnh trực giao khu vực khảo sát.");
    expect(result.items[4].content).toBe("Thông tin thuộc tính được chuẩn hóa.");
    expect(result.detectedType).toBe("plain");
  });

  // 2. Bullet paste
  it("2. Bullet paste: detects and strips •, ◦, ▪, ▫ bullet markers", () => {
    const raw = `• Sản phẩm địa chính
◦ Bản đồ số
▪ Bản đồ đo đạc
▫ Dữ liệu thuộc tính`;

    const result = parseClipboardTextToList(raw);
    expect(result.detectedType).toBe("bullet");
    expect(result.items).toHaveLength(4);
    expect(result.items[0].content).toBe("Sản phẩm địa chính");
    expect(result.items[1].content).toBe("Bản đồ số");
    expect(result.items[2].content).toBe("Bản đồ đo đạc");
    expect(result.items[3].content).toBe("Dữ liệu thuộc tính");
    // Ensure marker characters are NOT stored in content
    expect(result.items[0].content).not.toContain("•");
    expect(result.items[1].content).not.toContain("◦");
  });

  // 3. Dash bullet
  it("3. Dash bullet: detects and strips -, *, + markers", () => {
    const raw = `- Mục thứ nhất
* Mục thứ hai
+ Mục thứ ba`;

    const result = parseClipboardTextToList(raw);
    expect(result.detectedType).toBe("bullet");
    expect(result.items).toHaveLength(3);
    expect(result.items[0].content).toBe("Mục thứ nhất");
    expect(result.items[1].content).toBe("Mục thứ hai");
    expect(result.items[2].content).toBe("Mục thứ ba");
  });

  // 4. Numbered list
  it("4. Numbered list: detects sequential numbers (1., 2., 1), 2)) and flags ordered list", () => {
    const rawDot = `1. Phân tích hiện trạng
2. Khảo sát địa hình
3. Nghiệm thu số liệu`;

    const resultDot = parseClipboardTextToList(rawDot);
    expect(resultDot.isOrdered).toBe(true);
    expect(resultDot.detectedType).toBe("ordered");
    expect(resultDot.suggestedListType).toBe("ordered");
    expect(resultDot.suggestedListStyle).toBe("decimal");
    expect(resultDot.items).toHaveLength(3);
    expect(resultDot.items[0].content).toBe("Phân tích hiện trạng");
    expect(resultDot.items[1].content).toBe("Khảo sát địa hình");
    expect(resultDot.items[2].content).toBe("Nghiệm thu số liệu");

    const rawParen = `1) Đo đạc vệ tinh
2) Xử lý ảnh UAV`;
    const resultParen = parseClipboardTextToList(rawParen);
    expect(resultParen.isOrdered).toBe(true);
    expect(resultParen.items[0].content).toBe("Đo đạc vệ tinh");
    expect(resultParen.items[1].content).toBe("Xử lý ảnh UAV");
  });

  // 5. Nested list
  it("5. Nested list: parses tab and space indentation into recursive children", () => {
    const rawIndented = `Sản phẩm
    Bản đồ địa chính
        Tỷ lệ 1:500
    Dữ liệu không gian`;

    const result = parseClipboardTextToList(rawIndented);
    expect(result.items).toHaveLength(1);
    const root = result.items[0];
    expect(root.content).toBe("Sản phẩm");
    expect(root.children).toHaveLength(2);
    expect(root.children[0].content).toBe("Bản đồ địa chính");
    expect(root.children[0].children).toHaveLength(1);
    expect(root.children[0].children[0].content).toBe("Tỷ lệ 1:500");
    expect(root.children[1].content).toBe("Dữ liệu không gian");
  });

  // 6. Word paste
  it("6. Word paste: sanitizes Word clipboard plain text format", () => {
    // Word plain text representation often contains tabs and bullet characters
    const wordText = `\t•\tKhảo sát thực địa bằng thiết bị GNSS RTK
\t•\tBay chụp ảnh hàng không bằng UAV độ phân giải cao
\t•\tXây dựng mô hình 3D địa hình`;

    const result = parseClipboardTextToList(wordText);
    expect(result.detectedType).toBe("bullet");
    expect(result.items).toHaveLength(3);
    expect(result.items[0].content).toBe("Khảo sát thực địa bằng thiết bị GNSS RTK");
    expect(result.items[1].content).toBe("Bay chụp ảnh hàng không bằng UAV độ phân giải cao");
  });

  // 7. Google Docs paste
  it("7. Google Docs paste: parses Google Docs plain text export cleanly", () => {
    const docsText = `1.\tQuy hoạch sử dụng đất cấp tỉnh
2.\tKế hoạch sử dụng đất hàng năm cấp huyện
3.\tThống kê kiểm kê đất đai định kỳ`;

    const result = parseClipboardTextToList(docsText);
    expect(result.isOrdered).toBe(true);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].content).toBe("Quy hoạch sử dụng đất cấp tỉnh");
    expect(result.items[1].content).toBe("Kế hoạch sử dụng đất hàng năm cấp huyện");
  });

  // 8. Website paste
  it("8. Website paste: strips HTML tags and normalizes content from browser copy", () => {
    const webTextWithTags = `<p>• <strong>Bình đồ</strong> ảnh số</p>
<p>• <em>Mô hình</em> độ cao số DEM</p>`;

    const result = parseClipboardTextToList(webTextWithTags);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].content).toBe("Bình đồ ảnh số");
    expect(result.items[1].content).toBe("Mô hình độ cao số DEM");
    expect(result.items[0].content).not.toContain("<p>");
    expect(result.items[0].content).not.toContain("<strong>");
  });

  // 9. Plain text
  it("9. Plain text: handles plain paragraphs without markers", () => {
    const raw = `Đo đạc địa chính chính quy
Cập nhật cơ sở dữ liệu GIS
Bàn giao sản phẩm số`;

    const result = parseClipboardTextToList(raw);
    expect(result.detectedType).toBe("plain");
    expect(result.items).toHaveLength(3);
    expect(result.items[0].content).toBe("Đo đạc địa chính chính quy");
  });

  // 10. Vietnamese Unicode
  it("10. Vietnamese Unicode: fully preserves all Vietnamese tone marks and special characters", () => {
    const raw = `• Đất trồng lúa nước còn lại (LUK)
• Đất rừng sản xuất là rừng tự nhiên (RSN)
• Đất nuôi trồng thủy sản nước lợ (TSL)
• Đất thương mại, dịch vụ tại đô thị (TMD)`;

    const result = parseClipboardTextToList(raw);
    expect(result.items).toHaveLength(4);
    expect(result.items[0].content).toBe("Đất trồng lúa nước còn lại (LUK)");
    expect(result.items[1].content).toBe("Đất rừng sản xuất là rừng tự nhiên (RSN)");
  });

  // 11. Empty clipboard
  it("11. Empty clipboard: returns empty items array safely", () => {
    expect(parseClipboardTextToList("").items).toEqual([]);
    expect(parseClipboardTextToList("   \n\t   \n  ").items).toEqual([]);
  });

  // 12. Paste giữa list
  it("12. Paste giữa list: splices pasted items into target item position without duplication", () => {
    const existingList: ListItem[] = [
      { id: "A", content: "Mục A", children: [] },
      { id: "B", content: "Mục B", children: [] },
      { id: "C", content: "Mục C", children: [] },
    ];

    const pastedText = `Mục X
Mục Y
Mục Z`;
    const { items: parsed } = parseClipboardTextToList(pastedText);

    // Paste at end of B
    const { items: updatedTree, targetFocusId } = insertPastedItemsInTree(
      existingList,
      "B",
      parsed,
      5, // end of "Mục B"
    );

    expect(updatedTree).toHaveLength(5);
    expect(updatedTree[0].content).toBe("Mục A");
    expect(updatedTree[1].content).toBe("Mục BMục X");
    expect(updatedTree[2].content).toBe("Mục Y");
    expect(updatedTree[3].content).toBe("Mục Z");
    expect(updatedTree[4].content).toBe("Mục C");
    expect(targetFocusId).toBe(updatedTree[3].id);

    // Paste into an empty item replaces the empty item cleanly
    const listWithEmpty: ListItem[] = [
      { id: "1", content: "Line 1", children: [] },
      { id: "empty", content: "", children: [] },
      { id: "3", content: "Line 3", children: [] },
    ];

    const { items: afterEmptyPaste } = insertPastedItemsInTree(
      listWithEmpty,
      "empty",
      parsed,
      0,
    );

    expect(afterEmptyPaste).toHaveLength(5);
    expect(afterEmptyPaste.map((i) => i.content)).toEqual([
      "Line 1",
      "Mục X",
      "Mục Y",
      "Mục Z",
      "Line 3",
    ]);
  });

  // 13. Undo bulk paste
  it("13. Undo bulk paste: single logical operation reverts entire paste", () => {
    let tree: ListItem[] = [
      { id: "1", content: "Line 1", children: [] },
    ];

    const history: ListItem[][] = [];
    const pushState = (next: ListItem[]) => {
      history.push(cloneTree(tree));
      tree = next;
    };

    // Bulk paste 20 items
    const twentyLines = Array.from({ length: 20 }, (_, i) => `Dòng thứ ${i + 1}`).join("\n");
    const { items: parsed20 } = parseClipboardTextToList(twentyLines);

    const { items: treeAfterPaste } = insertPastedItemsInTree(tree, "1", parsed20);
    pushState(treeAfterPaste);

    expect(tree).toHaveLength(20);

    // Undo: 1 single step restores original tree
    tree = history.pop()!;
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("1");
    expect(tree[0].content).toBe("Line 1");
  });

  // 14. 100 items performance
  it("14. Performance benchmark: parses 100 items in < 10ms", () => {
    const lines100 = Array.from({ length: 100 }, (_, i) => `• Hạng mục khảo sát số liệu kỹ thuật ${i + 1}`).join("\n");

    const t0 = performance.now();
    const result = parseClipboardTextToList(lines100);
    const elapsed = performance.now() - t0;

    expect(result.items).toHaveLength(100);
    expect(elapsed).toBeLessThan(50); // fast execution
  });

  // 15. 500 items performance
  it("15. Performance benchmark: parses 500 items in < 50ms", () => {
    const lines500 = Array.from({ length: 500 }, (_, i) => `${i + 1}. Thửa đất số ${i + 100}, tờ bản đồ số 15`).join("\n");

    const t0 = performance.now();
    const result = parseClipboardTextToList(lines500);
    const elapsed = performance.now() - t0;

    expect(result.items).toHaveLength(500);
    expect(result.isOrdered).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });
});

describe("Phase 5 — List Style & Typography Schema & Data Model Tests", () => {
  it("validates ListBlock with listType, listStyle, and typography configs", async () => {
    const { listBlockSchema } = await import("../../schema");

    const bulletBlock: ListBlock = {
      id: "ls_bullet",
      type: "list",
      listType: "bullet",
      listStyle: "circle",
      fontSize: 16,
      lineHeight: 1.8,
      itemSpacing: 8,
      items: [{ id: "1", content: "Mục tròn", children: [] }],
    };

    const bulletRes = listBlockSchema.safeParse(bulletBlock);
    expect(bulletRes.success).toBe(true);

    const orderedBlock: ListBlock = {
      id: "ls_ordered",
      type: "list",
      listType: "ordered",
      listStyle: "lower-alpha",
      items: [{ id: "2", content: "Mục a", children: [] }],
    };

    const orderedRes = listBlockSchema.safeParse(orderedBlock);
    expect(orderedRes.success).toBe(true);

    const checklistBlock: ListBlock = {
      id: "ls_check",
      type: "list",
      listType: "checklist",
      listStyle: "checklist",
      items: [
        { id: "c1", content: "Việc 1", checked: true, children: [] },
        { id: "c2", content: "Việc 2", checked: false, children: [] },
      ],
    };
    const checkRes = listBlockSchema.safeParse(checklistBlock);
    expect(checkRes.success).toBe(true);
  });

  it("parses markdown checklists (- [ ] and - [x]) into checklist items", () => {
    const rawChecklist = `- [x] Hoàn thành đo đạc ngoại nghiệp
- [ ] Xử lý ảnh UAV và bình đồ
- [ ] Biên tập bản đồ địa chính`;

    const result = parseClipboardTextToList(rawChecklist);
    expect(result.detectedType).toBe("checklist");
    expect(result.suggestedListType).toBe("checklist");
    expect(result.suggestedListStyle).toBe("checklist");
    expect(result.items).toHaveLength(3);
    expect(result.items[0].checked).toBe(true);
    expect(result.items[0].content).toBe("Hoàn thành đo đạc ngoại nghiệp");
    expect(result.items[1].checked).toBe(false);
    expect(result.items[1].content).toBe("Xử lý ảnh UAV và bình đồ");
    expect(result.items[2].checked).toBe(false);
  });
});
