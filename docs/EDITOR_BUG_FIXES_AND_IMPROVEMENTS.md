# EDITOR BUG FIXES & IMPROVEMENTS — Tài liệu đồng bộ

> **Ngày cập nhật:** 2026-09-15  
> **Scope:** `slide-detail-blogs` (features + shared content-editor)  
> **Mục đích:** Tổng hợp các lỗi đã sửa và cải tiến đã thực hiện làm cơ sở để đồng bộ với các trang khác sử dụng trình chỉnh sửa (articles, programs, solutions, projects).

---

## 1. Danh sách thay đổi

### 1.1 Màu chữ excerpt trong Visual Editor (UI Fix)

**Vấn đề:** Khối excerpt hiển thị màu chữ nhạt hơn các khối tiêu đề/subtitle, gây mất đồng nhất về visual.

**File ảnh hưởng:**
- `src/features/slide-detail-blogs/components/VisualEditor/VisualEditorCanvas.tsx`  
  *(features version — chỉ dùng cho slide-detail-blogs)*

**Giải pháp:** Đổi class màu chữ từ `text-text-muted` sang `text-text` cho element chứa excerpt.

**Cần áp dụng cho:** Không — Excerpt là field đặc thù của `slide-detail-blogs`. Các trang khác không có field này.

---

### 1.2 Duplicate block không focus vào block mới (UX Fix)

**Vấn đề:** Sau khi nhấn Duplicate một khối, input trong khối mới được focus nhưng block wrapper không được đánh dấu `selected`, khiến toolbar không hiện.

**File ảnh hưởng:**
- `src/features/slide-detail-blogs/components/VisualEditor/VisualEditorCanvas.tsx`
- `src/shared/content-editor/visual-editor/VisualEditorCanvas.tsx`

**Giải pháp:** Sau khi insert block nhân bản vào mảng, gọi đồng thời `setSelectedBlockId(clone.id)` và `focusBlock(clone.id)` (DOM focus delay ~50ms sau khi render).

**Trạng thái shared:** ✅ Đã áp dụng vào `shared/content-editor` — **tất cả trang dùng shared đã được hưởng lợi** (programs, solutions, projects, articles).

---

### 1.3 Caption ảnh bị xóa khi bôi đen toàn bộ (Bug Fix) ⭐

**Vấn đề:** Trong khối hình ảnh (`ImageBlock`), khi người dùng bôi đen toàn bộ text trong `figcaption` rồi gõ phím bất kỳ → toàn bộ chú thích biến mất và không thể nhập lại.

**Nguyên nhân gốc:** `figcaption` dùng `dangerouslySetInnerHTML={{ __html: block.caption }}`. Khi React re-render (do state block thay đổi từ select/focus), DOM bị ghi đè, xóa nội dung người dùng đang gõ.

**File ảnh hưởng:**
- `src/features/slide-detail-blogs/components/BlogPreview/renderers/ImageBlockRenderer.tsx`
- `src/shared/content-editor/renderer/renderers/ImageBlockRenderer.tsx`

**Giải pháp:** Thay `dangerouslySetInnerHTML` bằng hook `useContentEditableSync`:

```tsx
// TRƯỚC (bị lỗi)
<figcaption
  contentEditable
  dangerouslySetInnerHTML={{ __html: block.caption || "" }}
  onBlur={handleCaptionBlur}
/>

// SAU (đúng)
const { handleInput: handleCaptionInput } = useContentEditableSync(
  captionRef as React.RefObject<HTMLElement | null>,
  { html: block.caption || "", enabled: editable },
);

<figcaption
  ref={captionRef}
  contentEditable
  suppressContentEditableWarning
  onInput={handleCaptionInput}   // ← thêm mới
  onBlur={handleCaptionBlur}
  // ← bỏ dangerouslySetInnerHTML
/>
```

**Hook `useContentEditableSync` hoạt động như thế nào:**
- Lần đầu mount: ghi HTML vào DOM
- Sau đó: chỉ cập nhật DOM khi `html` prop **thực sự thay đổi từ bên ngoài** (undo/redo)
- Không bao giờ ghi đè nội dung người dùng đang gõ giữa chừng

**Trạng thái shared:** ✅ Đã áp dụng vào `shared/content-editor`. Tất cả các trang dùng shared `ImageBlockRenderer` đã được fix.

**Rule tổng quát:** Mọi `contentEditable` nào đang dùng `dangerouslySetInnerHTML` trong editor đều cần chuyển sang pattern `useContentEditableSync` + `onInput`.

---

### 1.4 Thêm khối Quote và Highlight vào BlockPicker (Feature Add) ⭐

**Vấn đề:** Cả tab Block Editor lẫn Visual Editor của slide-detail-blogs không có nút thêm 2 loại khối `quote` (Trích dẫn) và `highlight` (Điểm nhấn), dù logic render đã tồn tại trong `BlockCard.tsx`.

**File ảnh hưởng:**
- `src/features/slide-detail-blogs/components/BlockEditor/BlockPicker.tsx`
- `src/features/slide-detail-blogs/components/VisualEditor/VisualEditorCanvas.tsx`
- `src/features/slide-detail-blogs/components/VisualEditor/VisualEditorBlock.tsx`

**Giải pháp — BlockPicker.tsx:** Thêm vào mảng `BLOCK_OPTIONS[]`:
```tsx
{
  type: "quote",
  title: "Trích dẫn (Quote)",
  description: "Khối trích dẫn nổi bật kèm thông tin tác giả và nguồn",
  icon: <span className="...font-serif text-lg font-bold text-primary">"</span>,
},
{
  type: "highlight",
  title: "Điểm nhấn (Highlight)",
  description: "Hộp thông tin nổi bật với viền và nền màu thương hiệu",
  icon: <span>/* icon bóng đèn SVG */</span>,
},
```

**Giải pháp — createDefaultBlock():** Thêm các case còn thiếu:
```tsx
case "quote":
  return { id, type: "quote", text: "" };
case "highlight":
  return { id, type: "highlight", text: "" };
case "ordered_list":
  return createListBlock({ id, listType: "ordered" });
```

**Trạng thái shared:** Shared `BlockPicker` đã có quote/highlight từ trước. Shared `VisualEditorCanvas.createDefaultBlock()` cũng đã đủ.

---

### 1.5 Highlight và Quote không hiển thị trong Visual Editor (Bug Fix) ⭐

**Vấn đề:** Sau khi thêm khối `highlight` hoặc `quote` qua BlockPicker trong tab Visual Editor, block hiện lỗi đỏ "Không thể hiển thị khối này — Loại: highlight".

**Nguyên nhân:** Features `VisualEditorBlock.tsx` thiếu `case "quote"` và `case "highlight"` trong `renderBlockContent()`.

**File ảnh hưởng:**
- `src/features/slide-detail-blogs/components/VisualEditor/VisualEditorBlock.tsx`

**Giải pháp:** Thêm case render inline (không cần file renderer riêng):

```tsx
// Import thêm types
import { type QuoteBlock, type HighlightBlock } from "@/types/slide-detail-blog";

// Mở rộng handleTextChange
else if (block.type === "quote") {
  onBlockChange(index, { ...block, text } as QuoteBlock);
} else if (block.type === "highlight") {
  onBlockChange(index, { ...block, text } as HighlightBlock);
}

// Thêm cases vào renderBlockContent()
case "quote": {
  const quote = block as QuoteBlock;
  return (
    <blockquote className="blog-preview-quote my-4 border-l-4 border-primary pl-4 italic text-text-muted">
      <div
        contentEditable suppressContentEditableWarning
        onBlur={(e) => handleTextChange(e.currentTarget.innerText)}
        className="ve-editable outline-none focus:ring-1 focus:ring-primary/40 rounded px-1"
      >
        {quote.text || "Nội dung trích dẫn..."}
      </div>
      <footer className="mt-1 flex items-center gap-2 text-xs not-italic text-text-muted/80">
        <span>—</span>
        <input type="text" placeholder="Tác giả"
          value={quote.author || ""}
          onChange={(e) => onBlockChange(index, { ...quote, author: e.target.value })}
          className="bg-transparent border-b border-border/50 focus:border-primary text-xs outline-none py-0.5"
        />
        <input type="text" placeholder="Nguồn / Chức vụ"
          value={quote.citation || ""}
          onChange={(e) => onBlockChange(index, { ...quote, citation: e.target.value })}
          className="bg-transparent border-b border-border/50 focus:border-primary text-xs outline-none py-0.5"
        />
      </footer>
    </blockquote>
  );
}
case "highlight": {
  const hl = block as HighlightBlock;
  return (
    <div className="blog-preview-highlight my-4 rounded-lg border border-primary/20 bg-primary/5 p-4 font-medium text-text">
      <div
        contentEditable suppressContentEditableWarning
        onBlur={(e) => handleTextChange(e.currentTarget.innerText)}
        className="ve-editable outline-none focus:ring-1 focus:ring-primary/40 rounded px-1"
      >
        {hl.text || "Nội dung điểm nhấn..."}
      </div>
    </div>
  );
}
```

**Trạng thái shared:** Shared `VisualEditorBlock.tsx` đã có sẵn render logic. Không cần thay đổi thêm.

---

## 2. Bảng trạng thái đồng bộ theo trang

| Trang / Module | BlockPicker quote/highlight | VE render quote/highlight | Caption bug fix | Duplicate focus fix |
|---|:---:|:---:|:---:|:---:|
| **slide-detail-blogs** (features) | ✅ Fixed | ✅ Fixed | ✅ Fixed | ✅ Fixed |
| **articles** (dùng features VE) | ✅ Fixed (shared BlockPicker) | ✅ Fixed (shared VisualEditorBlock) | ✅ Fixed (shared renderer) | ✅ Fixed (shared canvas) |
| **programs** (dùng shared) | ✅ Đã có sẵn | ✅ Đã có sẵn | ✅ Fixed | ✅ Fixed |
| **solutions** (dùng shared) | ✅ Đã có sẵn | ✅ Đã có sẵn | ✅ Fixed | ✅ Fixed |
| **projects** (dùng shared) | ✅ Đã có sẵn | ✅ Đã có sẵn | ✅ Fixed | ✅ Fixed |

> **Ghi chú kiến trúc:**
> - `slide-detail-blogs` dùng **features-level** VisualEditorBlock + ImageBlockRenderer + BlockPicker
> - `articles` hiện đang import `VisualEditorCanvas` từ features của slide-detail-blogs (xem `app/(dashboard)/articles/[id]/page.tsx`)
> - `programs`, `solutions`, `projects` dùng **shared** stack hoàn toàn

---

## 3. Kiến trúc 2 stack Editor

```
src/
├── features/slide-detail-blogs/components/
│   ├── BlockEditor/
│   │   ├── BlockPicker.tsx          ← features-specific ⭐ đã fix
│   │   ├── BlockCard.tsx            ← features-specific (đã có quote/highlight từ trước)
│   │   └── ...
│   ├── BlogPreview/renderers/
│   │   └── ImageBlockRenderer.tsx   ← ⭐ đã fix caption bug
│   └── VisualEditor/
│       ├── VisualEditorCanvas.tsx   ← ⭐ đã fix createDefaultBlock + duplicate focus
│       └── VisualEditorBlock.tsx    ← ⭐ đã fix quote/highlight render
│
└── shared/content-editor/
    ├── blocks/
    │   └── BlockPicker.tsx          ← shared (đã có quote/highlight từ trước)
    ├── renderer/renderers/
    │   └── ImageBlockRenderer.tsx   ← ⭐ đã fix caption bug
    └── visual-editor/
        ├── VisualEditorCanvas.tsx   ← ⭐ đã fix onImageDiscard + duplicate focus
        └── VisualEditorBlock.tsx    ← đã có quote/highlight từ trước
```

---

## 4. Pattern chuẩn khi thêm block type mới

Khi cần thêm một loại block mới (ví dụ `table`, `video`, `divider`...) cần cập nhật **đủ** các file sau:

### Stack features (slide-detail-blogs + articles):
| # | File | Việc cần làm |
|---|---|---|
| 1 | `features/.../BlockEditor/BlockPicker.tsx` | Thêm entry vào `BLOCK_OPTIONS[]` |
| 2 | `features/.../BlockEditor/BlockCard.tsx` | Thêm case vào `getBlockInfo()`, `getSummary()`, render `<TypeBlockItem />` |
| 3 | `features/.../VisualEditor/VisualEditorCanvas.tsx` | Thêm case vào `createDefaultBlock()` |
| 4 | `features/.../VisualEditor/VisualEditorBlock.tsx` | Thêm case vào `renderBlockContent()` |
| 5 | `src/types/slide-detail-blog.ts` | Thêm interface type mới |

### Stack shared (programs, solutions, projects):
| # | File | Việc cần làm |
|---|---|---|
| 1 | `shared/content-editor/blocks/BlockPicker.tsx` | Thêm entry |
| 2 | `shared/content-editor/blocks/BlockCard.tsx` | Thêm case |
| 3 | `shared/content-editor/visual-editor/VisualEditorCanvas.tsx` | Thêm case vào `createDefaultBlock()` |
| 4 | `shared/content-editor/visual-editor/VisualEditorBlock.tsx` | Thêm case vào `renderBlockContent()` |
| 5 | `shared/content-editor/model/document.types.ts` | Thêm interface type mới |

> ⚠️ Thiếu bất kỳ file nào sẽ dẫn đến lỗi "Không thể hiển thị khối này" hoặc block type không xuất hiện trong picker.

---

## 5. Danh sách file đã chỉnh sửa trong session 2026-09-15

| File | Loại thay đổi | Mô tả |
|---|---|---|
| `features/.../BlogPreview/renderers/ImageBlockRenderer.tsx` | Bug fix | Caption reset khi bôi đen |
| `features/.../VisualEditor/VisualEditorBlock.tsx` | Bug fix + Feature | Quote/highlight render; import types |
| `features/.../VisualEditor/VisualEditorCanvas.tsx` | Bug fix + Feature | `createDefaultBlock` quote/highlight/ordered_list |
| `features/.../BlockEditor/BlockPicker.tsx` | Feature | Thêm quote và highlight vào picker |
| `shared/content-editor/renderer/renderers/ImageBlockRenderer.tsx` | Bug fix + Feature | Caption reset; `onImageDiscard` prop |
| `shared/content-editor/visual-editor/VisualEditorCanvas.tsx` | Feature | `onImageDiscard` prop; duplicate focus fix |
| `shared/content-editor/visual-editor/VisualEditorBlock.tsx` | Feature | `onImageDiscard` prop wire-through |
| `app/(dashboard)/slide-detail-blogs/[id]/page.tsx` | Wiring | `handleImageBlockDiscard` → `onImageDiscard` |
| `app/(dashboard)/slide-detail-blogs/new/page.tsx` | Wiring | `handleImageBlockDiscard` → `onImageDiscard` |
