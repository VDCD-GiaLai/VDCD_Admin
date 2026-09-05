# BẢN ĐẶC TẢ HỢP ĐỒNG MÔ HÌNH NỘI DUNG DÙNG CHUNG (SHARED CONTENT DOCUMENT CONTRACT)
## Áp dụng thống nhất cho: Solution, Slide Detail Blog, Program, Article

> **Trạng thái**: CHUẨN HÓA KIẾN TRÚC (PHASE 02)  
> **Nguyên tắc cốt lõi**:
> - Sử dụng duy nhất một chuẩn Document Model chung (`DocumentContent` / `BlogDocument`).
> - **KHÔNG** tạo document model riêng cho Solution.
> - **KHÔNG** lưu mã HTML/CSS thô trong Document Model.
> - **KHÔNG** thay đổi DB hoặc API trong Phase này.

---

## 1. TYPESCRIPT TYPES (CANONICAL CONTRACT)

### 1.1. Khối Tiêu đề (Heading Block)
* **Semantic Level**: `1 | 2 | 3 | 4 | 5 | 6` (tương ứng thẻ HTML `<h1>` đến `<h6>`).
* **Visual Size (`fontSize`)**: Thuộc tính **độc lập hoàn toàn** với semantic level. Cho phép phân tách giữa vai trò ngữ nghĩa (SEO / Accessibility) và kích thước thị giác (Visual hierarchy).

```typescript
export interface BlockSpacing {
  marginTop?: number;    // pixel, min 0
  marginBottom?: number; // pixel, min 0
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingBlock {
  id: string;
  type: "heading";
  level: HeadingLevel;
  text: string;
  /** Kích thước font độc lập với semantic level (number: 10-96px hoặc token: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl') */
  fontSize?: number;
  spacing?: BlockSpacing;
}
```

---

### 1.2. Khối Đoạn văn (Paragraph Block)

```typescript
export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
  fontSize?: number;
  spacing?: BlockSpacing;
}
```

---

### 1.3. Khối Hình ảnh (Image Block)
* **Quy tắc caption**: Caption **CHỈ THUỘC VỀ KHỐI HÌNH ẢNH**. Các khối khác (Paragraph, Heading, Quote...) tuyệt đối không có trường `caption`.
* **Quy tắc Image**: Khối Image **KHÔNG ĐƯỢC PHÉP** chứa các trường metadata của bài viết như `title`, `subtitle`, `excerpt`.
* **Hỗ trợ cấu trúc lồng `data` và cấu trúc phẳng**: Tương thích cả format `data: { mediaId, caption, alt }` lẫn các thuộc tính phẳng.

```typescript
export interface ImageDataPayload {
  mediaId: string;       // File ID trên ImageKit
  caption?: string | null;
  alt?: string;
  url?: string;
}

export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  fileId?: string | null;
  mediaId?: string | null;  // Alias tương đương fileId
  alt?: string;
  caption?: string | null;  // Chỉ thuộc Image Block
  data?: ImageDataPayload;  // Hỗ trợ lồng container payload
  spacing?: BlockSpacing;
}
```

---

### 1.4. Khối Danh sách & Danh sách lồng cấp (List & Nested List Block)
* **Cấu trúc cây đệ quy (`ListItem`)**:
  - `id`: Định danh ổn định (stable ID, ví dụ `li_a1b2c3d4`).
  - `content`: Nội dung của mục danh sách.
  - `children`: Mảng các mục con lồng cấp (`ListItem[]`).
* **Hỗ trợ thao tác biên tập**: Thụt lề (indent), giảm lề (outdent), sắp xếp (reorder), dán nhiều dòng (multi-line paste), đánh số thứ tự hoặc dấu đầu dòng.

```typescript
export type ListType = "bullet" | "ordered" | "checklist";

export type ListStyle =
  | "disc"
  | "circle"
  | "square"
  | "decimal"
  | "lower-alpha"
  | "upper-alpha"
  | "lower-roman"
  | "upper-roman"
  | "checklist";

export type ListFontWeight = "normal" | "medium" | "semibold" | "bold";

export interface ListLevelStyle {
  marker?: ListStyle;
  fontSize?: number;
  fontWeight?: ListFontWeight;
  color?: string;
  itemSpacing?: number;
}

export interface ListStyleConfig {
  marker?: ListStyle;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: ListFontWeight;
  color?: string;
  lineHeight?: number;
  itemSpacing?: number;
  indentation?: number;      // Mặc định: 24px
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  levelStyles?: Record<number, ListLevelStyle>;
}

export interface ListItem {
  id: string;
  content: string;
  children: ListItem[];
  checked?: boolean;
}

export interface ListBlock {
  id: string;
  type: "list";
  items: ListItem[];
  listType?: ListType;
  listStyle?: ListStyle;
  fontSize?: number;
  lineHeight?: number;
  itemSpacing?: number;
  style?: ListStyleConfig;
  spacing?: BlockSpacing;
}

export interface OrderedListBlock extends Omit<ListBlock, "type"> {
  type: "ordered_list";
}
```

---

### 1.5. Khối Trích dẫn (Quote Block) & Khối Điểm nhấn (Highlight Block)

```typescript
export interface QuoteBlock {
  id: string;
  type: "quote";
  text: string;
  author?: string | null;
  citation?: string | null;
  fontSize?: number;
  spacing?: BlockSpacing;
}

export interface HighlightBlock {
  id: string;
  type: "highlight";
  text: string;
  style?: string;
  fontSize?: number;
  spacing?: BlockSpacing;
}
```

---

### 1.6. Khối Nhóm Phần (Section Block) & Khối Kêu gọi Hành động (CTA Block)

```typescript
export type SectionChildBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ListBlock
  | OrderedListBlock
  | QuoteBlock
  | HighlightBlock;

export interface SectionBlock {
  id: string;
  type: "section";
  number: string;
  title: string;
  children: SectionChildBlock[];
  spacing?: BlockSpacing;
}

export type CtaAlign = "center" | "between" | "start" | "end";
export type CtaShape = "square" | "pill";
export type CtaVariant = "solid" | "outline";
export type CtaLayout = "flex" | "between";

export interface CtaButtonItem {
  id: string;
  label: string;
  url: string;
  variant?: CtaVariant;
}

export interface CtaBlock {
  id: string;
  type: "cta";
  label?: string;
  url?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  items?: CtaButtonItem[];
  layout?: CtaLayout;
  align?: CtaAlign;
  gap?: number;
  shape?: CtaShape;
  variant?: CtaVariant;
  fontSize?: number;
  spacing?: BlockSpacing;
}
```

---

### 1.7. Hợp nhất Khối & Gốc Tài Liệu (Document Root & Solution Metadata)

```typescript
/** Hợp nhất phân biệt (Discriminated Union) của tất cả các khối */
export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ListBlock
  | OrderedListBlock
  | SectionBlock
  | CtaBlock
  | QuoteBlock
  | HighlightBlock;

export type HeroPlacement = "above_title" | "between_title_desc" | "below_desc";

export interface HeroMeta {
  placement?: HeroPlacement;
  position?: "top" | "center" | "bottom";
  caption?: string;
}

/** Cấu trúc chuẩn của một Document (BlogDocument / DocumentContent) */
export interface DocumentContent {
  version: 1;
  blocks: ContentBlock[];
  heroMeta?: HeroMeta;
}

export type BlogDocument = DocumentContent;

/** Metadata của Solution nằm hoàn toàn bên ngoài Content */
export interface SolutionEntityContract {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnail: string | null;
  thumbnailFileId: string | null;
  websiteUrl: string | null;
  fieldId: string | null;
  field?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Document Model nhúng vào cột JSONB content */
  content: DocumentContent;
}
```

---

## 2. JSON SCHEMA CONTRACT (SPECIFICATION)

Dưới đây là chuẩn **JSON Schema (Draft-07 / Draft 2020-12)** cho Document Model:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://vdcd.vn/schemas/document-content.json",
  "title": "DocumentContent",
  "description": "Chuẩn dữ liệu Block Document dùng chung cho toàn bộ hệ sinh thái VDCD",
  "type": "object",
  "required": ["version", "blocks"],
  "additionalProperties": false,
  "properties": {
    "version": {
      "type": "integer",
      "const": 1,
      "description": "Phiên bản tài liệu, hiện tại cố định là 1"
    },
    "heroMeta": {
      "type": "object",
      "properties": {
        "placement": { "type": "string", "enum": ["above_title", "between_title_desc", "below_desc"] },
        "position": { "type": "string", "enum": ["top", "center", "bottom"] },
        "caption": { "type": "string" }
      },
      "additionalProperties": false
    },
    "blocks": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/contentBlock"
      }
    }
  },
  "$defs": {
    "spacing": {
      "type": "object",
      "properties": {
        "marginTop": { "type": "number", "minimum": 0 },
        "marginBottom": { "type": "number", "minimum": 0 }
      },
      "additionalProperties": false
    },
    "headingBlock": {
      "type": "object",
      "required": ["id", "type", "level", "text"],
      "properties": {
        "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
        "type": { "const": "heading" },
        "level": { "type": "integer", "enum": [1, 2, 3, 4, 5, 6] },
        "text": { "type": "string", "minLength": 1 },
        "fontSize": { "type": "number", "minimum": 10, "maximum": 96 },
        "spacing": { "$ref": "#/$defs/spacing" }
      },
      "additionalProperties": false
    },
    "paragraphBlock": {
      "type": "object",
      "required": ["id", "type", "text"],
      "properties": {
        "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
        "type": { "const": "paragraph" },
        "text": { "type": "string", "minLength": 1 },
        "fontSize": { "type": "number", "minimum": 10, "maximum": 96 },
        "spacing": { "$ref": "#/$defs/spacing" }
      },
      "additionalProperties": false
    },
    "imageBlock": {
      "type": "object",
      "required": ["id", "type", "url"],
      "properties": {
        "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
        "type": { "const": "image" },
        "url": { "type": "string", "format": "uri" },
        "fileId": { "type": ["string", "null"] },
        "mediaId": { "type": ["string", "null"] },
        "alt": { "type": "string" },
        "caption": { "type": ["string", "null"] },
        "data": {
          "type": "object",
          "required": ["mediaId"],
          "properties": {
            "mediaId": { "type": "string" },
            "caption": { "type": ["string", "null"] },
            "alt": { "type": "string" },
            "url": { "type": "string" }
          },
          "additionalProperties": false
        },
        "spacing": { "$ref": "#/$defs/spacing" }
      },
      "not": {
        "anyOf": [
          { "required": ["title"] },
          { "required": ["subtitle"] },
          { "required": ["excerpt"] }
        ]
      },
      "additionalProperties": false
    },
    "listItem": {
      "type": "object",
      "required": ["id", "content", "children"],
      "properties": {
        "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
        "content": { "type": "string", "minLength": 1 },
        "checked": { "type": "boolean" },
        "children": {
          "type": "array",
          "items": { "$ref": "#/$defs/listItem" }
        }
      },
      "additionalProperties": false
    },
    "listBlock": {
      "type": "object",
      "required": ["id", "type", "items"],
      "properties": {
        "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
        "type": { "type": "string", "enum": ["list", "ordered_list"] },
        "items": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/$defs/listItem" }
        },
        "listType": { "type": "string", "enum": ["bullet", "ordered", "checklist"] },
        "listStyle": {
          "type": "string",
          "enum": ["disc", "circle", "square", "decimal", "lower-alpha", "upper-alpha", "lower-roman", "upper-roman", "checklist"]
        },
        "fontSize": { "type": "number", "minimum": 10, "maximum": 96 },
        "lineHeight": { "type": "number", "minimum": 1.0, "maximum": 3.0 },
        "itemSpacing": { "type": "number", "minimum": 0, "maximum": 48 },
        "style": { "type": "object" },
        "spacing": { "$ref": "#/$defs/spacing" }
      },
      "additionalProperties": false
    },
    "quoteBlock": {
      "type": "object",
      "required": ["id", "type", "text"],
      "properties": {
        "id": { "type": "string" },
        "type": { "const": "quote" },
        "text": { "type": "string", "minLength": 1 },
        "author": { "type": ["string", "null"] },
        "citation": { "type": ["string", "null"] },
        "fontSize": { "type": "number" },
        "spacing": { "$ref": "#/$defs/spacing" }
      },
      "additionalProperties": false
    },
    "highlightBlock": {
      "type": "object",
      "required": ["id", "type", "text"],
      "properties": {
        "id": { "type": "string" },
        "type": { "const": "highlight" },
        "text": { "type": "string", "minLength": 1 },
        "style": { "type": "string" },
        "fontSize": { "type": "number" },
        "spacing": { "$ref": "#/$defs/spacing" }
      },
      "additionalProperties": false
    },
    "ctaBlock": {
      "type": "object",
      "required": ["id", "type"],
      "properties": {
        "id": { "type": "string" },
        "type": { "const": "cta" },
        "label": { "type": "string" },
        "url": { "type": "string" },
        "secondaryLabel": { "type": "string" },
        "secondaryUrl": { "type": "string" },
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "label", "url"],
            "properties": {
              "id": { "type": "string" },
              "label": { "type": "string", "minLength": 1 },
              "url": { "type": "string", "minLength": 1 },
              "variant": { "type": "string", "enum": ["solid", "outline"] }
            },
            "additionalProperties": false
          }
        },
        "layout": { "type": "string", "enum": ["flex", "between"] },
        "align": { "type": "string", "enum": ["center", "between", "start", "end"] },
        "gap": { "type": "number", "minimum": 0, "maximum": 64 },
        "shape": { "type": "string", "enum": ["square", "pill"] },
        "variant": { "type": "string", "enum": ["solid", "outline"] },
        "fontSize": { "type": "number" },
        "spacing": { "$ref": "#/$defs/spacing" }
      },
      "additionalProperties": false
    },
    "sectionBlock": {
      "type": "object",
      "required": ["id", "type", "number", "title", "children"],
      "properties": {
        "id": { "type": "string" },
        "type": { "const": "section" },
        "number": { "type": "string", "minLength": 1 },
        "title": { "type": "string", "minLength": 1 },
        "children": {
          "type": "array",
          "items": {
            "anyOf": [
              { "$ref": "#/$defs/headingBlock" },
              { "$ref": "#/$defs/paragraphBlock" },
              { "$ref": "#/$defs/imageBlock" },
              { "$ref": "#/$defs/listBlock" },
              { "$ref": "#/$defs/quoteBlock" },
              { "$ref": "#/$defs/highlightBlock" }
            ]
          }
        },
        "spacing": { "$ref": "#/$defs/spacing" }
      },
      "additionalProperties": false
    },
    "contentBlock": {
      "anyOf": [
        { "$ref": "#/$defs/headingBlock" },
        { "$ref": "#/$defs/paragraphBlock" },
        { "$ref": "#/$defs/imageBlock" },
        { "$ref": "#/$defs/listBlock" },
        { "$ref": "#/$defs/sectionBlock" },
        { "$ref": "#/$defs/ctaBlock" },
        { "$ref": "#/$defs/quoteBlock" },
        { "$ref": "#/$defs/highlightBlock" }
      ]
    }
  }
}
```

---

## 3. VALIDATION CONTRACT (QUY TẮC KIỂM TRA HỢP LỆ)

| Đối tượng | Quy tắc kiểm tra (Validation Rules) | Hành vi khi vi phạm |
| :--- | :--- | :--- |
| **Bảo mật (XSS Prevention)** | Mọi chuỗi văn bản (`text`, `alt`, `caption`, `content`, `label`, `url`) được quét kiểm tra chống pattern độc hại (`<script>`, `javascript:`, `vbscript:`, `onload=`, `<iframe`, `<object`, `<embed`). | Ném lỗi `BadRequestException`: *"Chứa nội dung không an toàn hoặc mã thực thi nguy hiểm"*. |
| **Định danh khối (`id`)** | Chuỗi không rỗng, duy nhất trên toàn bộ cây Document (`Set<string>` seenIds check), định dạng kebab/snake/id an toàn. | Ném lỗi nếu rỗng hoặc trùng lặp `id`. |
| **Heading Level** | Bắt buộc là số nguyên thuộc tập `{1, 2, 3, 4, 5, 6}`. | Ném lỗi: *"Cấp độ tiêu đề phải là H1–H6"*. |
| **Heading fontSize** | Là thuộc tính hiển thị độc lập (chữ số từ 10-96 hoặc string token). | Không ảnh hưởng đến tag HTML sinh ra. |
| **Image Caption** | **Chỉ cho phép có mặt trên Khối Hình ảnh (`ImageBlock`)**. Bất kỳ khối nào khác có `caption` sẽ bị Schema từ chối. | Rejection nếu khối khác chứa `caption`. |
| **Image Restrictions** | `ImageBlock` **tuyệt đối không chứa** `title`, `subtitle`, `excerpt` (vốn là các trường của entity). | Ném lỗi: *"ImageBlock không được chứa thuộc tính title/subtitle/excerpt"*. |
| **List Item Tree** | - `items` không được rỗng.<br>- Mỗi `ListItem` phải có `id` duy nhất, `content` không rỗng.<br>- Giới hạn độ sâu lồng cấp tối đa: `MAX_LIST_DEPTH = 6` (chống đệ quy tràn ngăn xếp). | Ném lỗi nếu rỗng hoặc vượt quá độ sâu 6 cấp. |
| **Section Block** | - Không lồng `section` bên trong `section` (Section chỉ chứa các con cấp lá).<br>- Không chứa `cta` bên trong `section`. | Ném lỗi nếu cấu trúc Section vi phạm. |
| **Không lưu Raw HTML/CSS** | Cấm lưu các thẻ HTML thô (`<p style="...">`, `<div class="...">`) trong chuỗi nội dung. Toàn bộ định dạng dùng thuộc tính định kiểu chuẩn hóa (`fontSize`, `spacing`, `style`). | Đảm bảo tính nhất quán giữa Backend, Admin và Website công khai. |

---

## 4. RENDERER CONTRACT (QUY TẮC HIỂN THỊ PHÍA CLIENT & WEBSITE)

### 4.1. Khối Tiêu đề (Heading)
- **HTML Tag**: Dựa 100% vào thuộc tính `level`:
  - `level: 1` ➔ `<h1>`
  - `level: 2` ➔ `<h2>`
  - `level: 3` ➔ `<h3>`
  - `level: 4` ➔ `<h4>`
  - `level: 5` ➔ `<h5>`
  - `level: 6` ➔ `<h6>`
- **Kích thước Font (Typography)**:
  - Nếu có `fontSize`: Sử dụng `style={{ fontSize: `${block.fontSize}px` }}` (hoặc CSS class tương ứng).
  - Nếu không có `fontSize`: Áp dụng Typography chuẩn mặc định:
    - `H1`: `text-3xl lg:text-4xl font-bold`
    - `H2`: `text-2xl lg:text-3xl font-bold`
    - `H3`: `text-xl lg:text-2xl font-semibold`
    - `H4`: `text-lg font-semibold`
    - `H5`: `text-base font-semibold`
    - `H6`: `text-sm font-semibold`

### 4.2. Khối Hình ảnh (Image)
- Render dạng ngữ nghĩa `<figure className="blog-preview-image my-6">`:
  ```html
  <figure class="blog-preview-image my-6">
    <div class="overflow-hidden rounded-xl border border-border">
      <img src="{url}" alt="{alt}" loading="lazy" class="w-full object-cover" />
    </div>
    <!-- CHỈ RENDER NẾU CÓ CAPTION -->
    <figcaption class="mt-2 text-center text-xs italic text-text-muted">
      {caption}
    </figcaption>
  </figure>
  ```

### 4.3. Khối Danh sách & Lồng cấp (List)
- **Cấu trúc Renderer đệ quy**:
  ```tsx
  function renderListTree(items: ListItem[], depth = 0, config?: ListStyleConfig) {
    const Tag = listType === "ordered" ? "ol" : "ul";
    return (
      <Tag className={getListClass(listType, depth)}>
        {items.map((item, idx) => (
          <li key={item.id} className="my-1.5">
            <span>{item.content}</span>
            {item.children?.length > 0 && (
              <div style={{ paddingLeft: `${config?.indentation ?? 24}px` }}>
                {renderListTree(item.children, depth + 1, config)}
              </div>
            )}
          </li>
        ))}
      </Tag>
    );
  }
  ```
- **Marker Format**:
  - `bullet`: `disc` (Level 0), `circle` (Level 1), `square` (Level 2+).
  - `ordered`: `1, 2, 3` (Level 0), `a, b, c` (Level 1), `i, ii, iii` (Level 2).

### 4.4. Khối CTA (Call To Action)
- Hỗ trợ tối đa 2 nút trên 1 hàng (`items[0]`, `items[1]`).
- Bố cục:
  - `layout === "flex"`: Hiển thị các nút sát nhau theo khoảng cách `gap` (mặc định 16px).
  - `layout === "between"`: Phân tách 2 nút sang hai bên (`justify-between`).
- Hình khối:
  - `shape === "square"`: Nút vuông bo góc hiện đại (`rounded-lg`).
  - `shape === "pill"`: Nút viên thuốc bo tròn hoàn toàn (`rounded-full`).

---

## 5. EDITOR CONTRACT (QUY TẮC BỘ SOẠN THẢO ADMIN)

### 5.1. Quản lý Trạng thái & Tính Bất Biến (Immutability)
1. **Single Source of Truth**: Toàn bộ trạng thái soạn thảo (Tab Thông tin, Tab Khối, Tab Trực quan, Tab Đọc thử) đồng bộ thông qua một đối tượng `DocumentContent` gốc trong React Hook Form.
2. **Stable ID Generation**: Mọi khối và mục danh sách khi tạo mới đều nhận ID ổn định dạng:
   - `blk-h-xxxxx` (Heading)
   - `blk-p-xxxxx` (Paragraph)
   - `blk-img-xxxxx` (Image)
   - `blk-lst-xxxxx` (List)
   - `li_xxxx_yyyy` (ListItem)
   ID không bị sinh lại khi người dùng sửa nội dung, thụt lề hay thay đổi thứ tự.

### 5.2. Thao tác Danh sách nâng cao (Advanced List Operations)
1. **Indent (Thụt lề con)**: Lấy item hiện tại chuyển thành con cuối cùng (`children`) của item anh em liền kề phía trước (`previousSibling`). Bị khoá khi ở vị trí đầu tiên hoặc đạt `depth = 6`.
2. **Outdent (Giảm lề)**: Nhấc item hiện tại ra ngoài một cấp bậc để trở thành anh em liền sau của item cha (`parent`). Bị khoá khi item đã ở cấp gốc (depth = 0).
3. **Reorder (Đổi thứ tự)**: Di chuyển vị trí item lên/xuống giữa các anh em cùng cấp.
4. **Paste Multiple Lines**:
   - Khi dán một đoạn văn bản có nhiều dòng từ Word, Notion hay Google Docs:
   - Hệ thống tự động phân tích khoảng trắng / tab đầu dòng (`indentation`) hoặc các ký hiệu gạch đầu dòng (`- `, `* `, `1. `) để tự động xây dựng cây `ListItem[]` phân cấp nhiều tầng mà không làm phẳng nội dung.

### 5.3. Undo / Redo State Machine
- Bộ nhớ lưu lịch sử 50 bước (`MAX_HISTORY_SIZE = 50`).
- Tự động debounce 500ms khi gõ text liên tục.
- Lưu snapshot ngay lập tức khi thực hiện các thao tác cấu trúc: thêm khối, xoá khối, di chuyển khối, indent/outdent danh sách.

---

## 6. MIGRATION STRATEGY (CHIẾN LƯỢC CHUYỂN ĐỔI NỘI DUNG SOLUTION)

> **Cam kết**: Trong Phase 02, **KHÔNG CHẠY BẤT KỲ LỆNH THAY ĐỔI DB NÀO**. Phần này định nghĩa thuật toán chuyển đổi chuẩn xác để chuẩn bị cho Phase tiếp theo.

### 6.1. Phân loại 19 bản ghi Solution hiện tại
Toàn bộ 19 bản ghi Solution trong DB hiện nay có `content` là các đoạn text ngắn (từ 89 đến 146 ký tự).
Không có bản ghi nào chứa HTML phức tạp.

### 6.2. Thuật toán Chuyển đổi Hai Chiều (Bidirectional Migration Logic)

```typescript
/**
 * Chuyển đổi nội dung Solution bất kỳ sang DocumentContent chuẩn.
 * Tương thích 100% với:
 * - Chuỗi rỗng / NULL
 * - Chuỗi văn bản thuần (19 bản ghi hiện tại)
 * - Chuỗi HTML legacy (nếu có sau này)
 * - JSON DocumentContent đã chuẩn hóa
 */
export function convertSolutionContentToDocument(rawContent: unknown): DocumentContent {
  // 1. Nếu rỗng -> Trả về tài liệu trắng chuẩn
  if (!rawContent) {
    return { version: 1, blocks: [] };
  }

  // 2. Nếu đã là DocumentContent object hợp lệ
  if (
    typeof rawContent === "object" &&
    rawContent !== null &&
    "version" in rawContent &&
    "blocks" in rawContent &&
    Array.isArray((rawContent as DocumentContent).blocks)
  ) {
    return rawContent as DocumentContent;
  }

  // 3. Nếu là chuỗi JSON được stringify
  if (typeof rawContent === "string") {
    const trimmed = rawContent.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.version && Array.isArray(parsed.blocks)) {
          return parsed as DocumentContent;
        }
      } catch {
        // Fallthrough nếu parse JSON lỗi
      }
    }

    // 4. Nếu là đoạn văn bản thuần (Trường hợp 19 Solution hiện tại trong DB)
    if (!trimmed.includes("<") || !trimmed.includes(">")) {
      return {
        version: 1,
        blocks: [
          {
            id: `par_migration_${Date.now()}`,
            type: "paragraph",
            text: trimmed,
          },
        ],
      };
    }

    // 5. Nếu là chuỗi HTML legacy -> Chuyển đổi qua bộ parser html-to-blocks
    return convertHtmlToBlocks(trimmed);
  }

  return { version: 1, blocks: [] };
}
```

### 6.3. Kế hoạch an toàn dữ liệu 100% (Safety Net)
Khi bước sang Phase chạy Migration DB:
1. Thêm cột `content_html_backup text` vào bảng `solution`.
2. Sao chép 100% nội dung `content` hiện tại vào `content_html_backup`.
3. Bổ sung hàm `down()` hoàn chỉnh để khôi phục lại cột text từ `content_html_backup` nếu xảy ra sự cố.
