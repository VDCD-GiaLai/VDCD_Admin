import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Bạn là trợ lý chuyên chuyển đổi nội dung văn bản thành cấu trúc khối (blocks) cho hệ thống quản lý nội dung.

QUAN TRỌNG: Trả về JSON array, KHÔNG kèm markdown code fence, KHÔNG có text ngoài JSON.

Mỗi block phải có cấu trúc sau:

1. Heading block:
{"id": "blk_xxx", "type": "heading", "level": 1-6, "text": "...", "spacing": {"marginTop": 0, "marginBottom": 8}}

2. Paragraph block:
{"id": "blk_xxx", "type": "paragraph", "text": "...", "spacing": {"marginTop": 0, "marginBottom": 8}}

3. Image block (khi phát hiện link ảnh):
{"id": "blk_xxx", "type": "image", "url": "...", "alt": "...", "caption": null, "spacing": {"marginTop": 8, "marginBottom": 8}}

4. List block (cho danh sách gạch đầu dòng hoặc đánh số):
{"id": "blk_xxx", "type": "list", "listType": "bullet|ordered", "items": [{"id": "li_xxx", "content": "...", "text": "...", "children": []}], "spacing": {"marginTop": 0, "marginBottom": 8}}

Quy tắc:
- Phân tích nội dung để tự động xác định heading levels phù hợp (H1 cho tiêu đề chính, H2 cho mục lớn, H3 cho mục con)
- Giữ nguyên định dạng HTML inline (bold <strong>, italic <em>, link <a>)
- Tự động phát hiện danh sách (có dấu -, •, *, 1., 2.)
- Gộp các dòng liên tiếp thành 1 paragraph nếu chúng thuộc cùng ý
- Tạo id duy nhất cho mỗi block (blk_xxxx) và list item (li_xxxx)
- Nếu nội dung là HTML từ Word/Google Docs, parse và chuyển đổi thông minh
- Loại bỏ styling inline thừa từ Word (font-family, mso-*, class)
- Giữ lại nội dung có ý nghĩa, bỏ các tag rỗng
`;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY chưa được cấu hình. Thêm vào .env.local" },
      { status: 500 },
    );
  }

  try {
    const { content, mode } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Nội dung không được để trống" },
        { status: 400 },
      );
    }

    const userPrompt =
      mode === "html"
        ? `Chuyển đổi nội dung HTML sau thành JSON array các blocks. Đây là nội dung paste từ Word/Google Docs:\n\n${content}`
        : `Chuyển đổi nội dung văn bản sau thành JSON array các blocks. Phân tích cấu trúc tự động:\n\n${content}`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini API Error]", response.status, errorText);
      return NextResponse.json(
        { error: `Gemini API lỗi: ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      return NextResponse.json(
        { error: "Gemini không trả về kết quả" },
        { status: 502 },
      );
    }

    // Parse JSON — Gemini might wrap in code fence
    let blocks: unknown[];
    try {
      const cleaned = text
        .replace(/^```json?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      blocks = JSON.parse(cleaned);
    } catch {
      console.error("[Gemini Parse Error]", text.substring(0, 500));
      return NextResponse.json(
        { error: "Không thể parse kết quả từ AI. Thử lại." },
        { status: 502 },
      );
    }

    if (!Array.isArray(blocks)) {
      blocks = [blocks];
    }

    return NextResponse.json({ blocks });
  } catch (err) {
    console.error("[Smart Import Error]", err);
    return NextResponse.json(
      { error: "Lỗi xử lý. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
