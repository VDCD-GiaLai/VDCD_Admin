# TÀI LIỆU TÍCH HỢP FRONTEND — BỘ API, Ý TƯỞNG & QUY TẮC ĐỒNG BỘ GIAO DIỆN PROGRAM DETAIL

Tài liệu này hướng dẫn chi tiết cho đội ngũ phát triển **Frontend (`VDCD_gialai_frontend`)** về:
1. **Bối cảnh & Những thay đổi lớn (Major Architectural Shifts)** khi nâng cấp Program từ nội dung HTML thô sang **Block Document Model**.
2. **Ý tưởng thiết kế & Trải nghiệm giao diện (Design Concepts & UI Experience)** thống nhất với kiến trúc Content Editor dùng chung (`src/shared/content-editor`).
3. **Bộ API Endpoints công khai** để truy xuất chi tiết chương trình và danh sách chương trình.
4. **Cấu trúc dữ liệu JSON phản hồi (Data Contract)** trả về từ Backend NestJS.
5. **Quy tắc hiển thị chi tiết (UI Sync Specifications)** đảm bảo trang Program Detail trên Website công khai **đồng bộ 100% (Pixel-Perfect Sync)** với *Trình chỉnh sửa trực quan (Visual Editor)* trên Admin CMS.
6. **Chi tiết thiết kế mới cho khối Nút kêu gọi (CTA Block)**: Hỗ trợ nút hình vuông bo nhẹ, 2 nút trên 1 hàng, tùy chọn bố cục **`Gần nhau (Flex)`** và **`Space Between`**, căn lề và khoảng cách gap tùy biến.
7. **Mã nguồn tích hợp mẫu (TypeScript Types, Service, Component, Next.js Page Route)** trên Next.js App Router.
8. **Checklist kiểm thử nghiệm thu (Sync Validation Checklist)**.

---

## 1. BỐI CẢNH, NHỮNG THAY ĐỔI LỚN & Ý TƯỞNG THIẾT KẾ

### 1.1. Bối Cảnh & Những Thay Đổi Lớn (Major Shifts)

| Tiêu chí | Mô hình Cũ (Legacy HTML) | Mô hình Mới (Block Document Model) |
| :--- | :--- | :--- |
| **Cấu trúc dữ liệu `content`** | Chuỗi HTML thô (`TEXT`) sinh ra từ WYSIWYG editor | Cấu trúc JSON chuẩn hoá (`JSONB`) gồm mảng các Khối (`SlideDetailBlogBlock[]` / `ContentBlock[]`) |
| **Độ tin cậy hiển thị** | Dễ vỡ layout, inline style lộn xộn, CSS xung đột | Đồng bộ 100% với Admin Preview, typography chuẩn hoá, responsive đa thiết bị |
| **Lĩnh vực hoạt động (`field`)** | Không có hoặc liên kết lỏng lẻo | Quan hệ khóa ngoại rõ ràng với bảng `operation_field`, hiển thị badge chuyên môn |
| **Khả năng tương tác Khối** | Toàn bộ bài viết là một cục HTML duy nhất | Từng khối độc lập: Heading H1-H6, Paragraph, Image, List lồng cấp, Quote, Highlight, Section, CTA button |
| **Khối Nút kêu gọi (CTA Block)** | Nút đơn viên thuốc đỏ thô, text URL thô bên dưới | Nút vuông bo nhẹ tinh tế, hỗ trợ **2 nút trên 1 hàng**, tùy chọn **`Gần nhau (Flex)`** và **`Space Between`** |
| **Kiểm soát lề & Khoảng cách** | Phụ thuộc vào `<br>` hoặc margin mặc định của trình duyệt | Tuỳ biến chính xác từng pixel qua `spacing: { marginTop, marginBottom }` |
| **Quản lý Media (ImageKit)** | Lưu tự do hoặc thư mục chung | Tự động phân cấp thư mục theo chương trình: `/vdcd/programs/<slug-hoặc-id>/` |

### 1.2. Ý Tưởng Thiết Kế & Nguyên Tắc Cốt Lõi (Core Design Concepts)

1. **Một Nguồn Chân Lý Duy Nhất (Single Source of Truth):**
   Cả hệ thống **Slide Detail Blog**, **Article Detail** và **Program Detail** đều dùng chung một chuẩn cấu trúc tài liệu (`DocumentContent` / `BlogDocument`). Admin biên tập trực quan ra sao thì Frontend hiển thị chính xác như vậy.
2. **Tái Sử Dụng Kiến Trúc Khối (Shared Component Architecture):**
   Frontend tái sử dụng trực tiếp bộ component hiển thị khối (`HeadingBlockRenderer`, `ParagraphBlockRenderer`, `ImageBlockRenderer`, `ListBlockRenderer`, `SectionBlockRenderer`, `CtaBlockRenderer`, `QuoteBlockRenderer`, `HighlightBlockRenderer`).
3. **Đặc Trưng Định Vị Của Program Detail:**
   Khác với tin tức báo chí thông thường, Program là **Chương trình hoạt động, chuyển đổi số và phát triển chiến lược** của Trung tâm Đổi mới Sáng tạo Gia Lai (VDCD). Do đó, giao diện Program Detail cần:
   - **Lĩnh vực hoạt động (Operation Field Badge):** Nổi bật lĩnh vực chuyên môn (ví dụ: *Nông nghiệp số*, *Đô thị thông minh*, *Đào tạo nhân lực số*).
   - **Tóm tắt ngắn (Short Description / Lead):** Tóm lược giá trị và mục tiêu của chương trình.
   - **Ảnh đại diện / Banner chương trình (Thumbnail):** Hình ảnh thực tế, sắc nét, tỉ lệ 16:9 chuẩn.
   - **CTA hành động mạnh mẽ:** Kêu gọi các bên liên quan đăng ký hợp tác, tham gia đào tạo hoặc kết nối trực tiếp với trung tâm.

---

## 2. TỔNG QUAN KIẾN TRÚC & DÒNG CHẢY DỮ LIỆU (DATA FLOW)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ADMIN CMS (Repo Admin)                          │
│  - Tab 1: Thông tin (Metadata, Field, Thumbnail, SEO)                  │
│  - Tab 2: Nội dung (Block Form Editor — thêm/sửa/sắp xếp khối)         │
│  - Tab 3: Đọc bài (Read-Only Article View — mô phỏng trang người đọc) │
│  - Tab 4: Trình chỉnh sửa trực quan (Visual Editor — WYSIWYG canvas)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ POST / PATCH /api/v1/programs/:id
                                    │ Upload ảnh: POST /api/v1/upload/image/program
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           BACKEND NESTJS                               │
│  - Bảng DB: `program`                                                  │
│  - Cột `content` (JSONB) chứa { version: 1, heroMeta, blocks }         │
│  - Lưu trữ media trên ImageKit tại thư mục: /vdcd/programs/<slug>/     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ GET /api/v1/programs/:slug
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PUBLIC FRONTEND (Repo Frontend)                   │
│  Route: /programs/[slug] (hoặc /chuong-trinh/[slug])                   │
│  Component: ProgramDetailRenderer                                      │
│  ├── Breadcrumbs & Operation Field Badge                               │
│  ├── Program Hero Header (Title + Short Description + Thumbnail)       │
│  ├── Block Stream Renderer (Heading, Paragraph, List, CTA, Section...) │
│  └── Related Programs & Contact Action Bar                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. BỘ API ENDPOINTS DÀNH CHO FRONTEND

Backend cung cấp các API công khai (Public API — Không yêu cầu Token đăng nhập) để Website Frontend truy xuất:

### 3.1. 🔓 Lấy Chi Tiết Chương Trình Theo Slug
Dùng cho Server Component hoặc Page Router trên Frontend tại đường dẫn `/programs/[slug]`.

* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/programs/:slug` *(hoặc proxy `/api/programs/:slug`)*
* **Path Parameter:**
  * `slug` (string): Slug duy nhất của chương trình (ví dụ: `chuong-trinh-phat-trien-nong-nghiep-cong-nghe-cao-gia-lai`).
* **Headers:**
  ```http
  Accept: application/json
  ```
* **Mã phản hồi (Status Codes):**
  * `200 OK`: Trả về dữ liệu chi tiết của chương trình.
  * `404 Not Found`: Không tìm thấy chương trình hoặc chương trình chưa xuất bản (`isPublished: false`).

---

### 3.2. 🔓 Danh Sách Chương Trình Công Khai (Hỗ Trợ Phân Trang & Lọc)
Dùng cho trang danh sách chương trình `/programs` hoặc khối "Chương trình liên quan".

* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/programs`
* **Query Parameters:**
  * `page` (number, optional, mặc định `1`): Trang hiện tại.
  * `limit` (number, optional, mặc định `10`): Số lượng mục mỗi trang.
  * `fieldId` (UUID, optional): Lọc chương trình thuộc lĩnh vực hoạt động cụ thể.
  * `search` (string, optional): Từ khóa tìm kiếm tiêu đề chương trình.
* **Mã phản hồi (Status Codes):**
  * `200 OK`: Danh sách chương trình kèm metadata phân trang `{ items, meta: { totalItems, itemCount, itemsPerPage, totalPages, currentPage } }`.

---

## 4. CẤU TRÚC DỮ LIỆU JSON RESPONSE (DATA CONTRACT)

### 4.1. Cấu Trúc JSON Phản Hồi Mẫu (`Response 200` từ `/api/v1/programs/:slug`)

```json
{
  "statusCode": 200,
  "data": {
    "id": "7a8b9c0d-1234-5678-9abc-def012345678",
    "title": "CHƯƠNG TRÌNH PHÁT TRIỂN NÔNG NGHIỆP CÔNG NGHỆ CAO GIA LAI 2026 - 2030",
    "slug": "chuong-trinh-phat-trien-nong-nghiep-cong-nghe-cao-gia-lai",
    "shortDescription": "Hỗ trợ hợp tác xã và doanh nghiệp nông nghiệp ứng dụng cảm biến IoT, thiết bị bay không người lái (UAV) và nền tảng dữ liệu số trong quản lý chuỗi giá trị nông sản chủ lực.",
    "thumbnail": "https://ik.imagekit.io/vdcd/programs/chuong-trinh-phat-trien-nong-nghiep-cong-nghe-cao-gia-lai/thumbnail_1725500000.webp",
    "thumbnailFileId": "file_prog_thumb_01",
    "field": {
      "id": "f1a2b3c4-d5e6-7890-1234-56789abcdef0",
      "name": "Nông nghiệp Số & IoT",
      "slug": "nong-nghiep-so-iot"
    },
    "metaTitle": "Chương trình Nông nghiệp Công nghệ cao Gia Lai | VDCD",
    "metaDescription": "Chương trình thúc đẩy ứng dụng công nghệ số và nông nghiệp chính xác tại tỉnh Gia Lai giai đoạn 2026 - 2030.",
    "isPublished": true,
    "createdAt": "2026-09-03T08:00:00.000Z",
    "updatedAt": "2026-09-05T09:30:00.000Z",
    "content": {
      "version": 1,
      "blocks": [
        {
          "id": "blk_prog_001",
          "type": "heading",
          "level": 2,
          "text": "MỤC TIÊU VÀ ĐỊNH HƯỚNG CHIẾN LƯỢC",
          "spacing": {
            "marginTop": 32,
            "marginBottom": 16
          }
        },
        {
          "id": "blk_prog_002",
          "type": "paragraph",
          "text": "Chương trình được triển khai nhằm giải quyết trực tiếp bài toán nâng cao năng suất, truy xuất nguồn gốc và gia tăng giá trị xuất khẩu cho các sản phẩm nông sản chủ lực của tỉnh Gia Lai như cà phê, hồ tiêu, sầu riêng và bơ...",
          "spacing": {
            "marginTop": 0,
            "marginBottom": 24
          }
        },
        {
          "id": "blk_prog_003",
          "type": "image",
          "url": "https://ik.imagekit.io/vdcd/programs/chuong-trinh-phat-trien-nong-nghiep-cong-nghe-cao-gia-lai/mo-hinh-iot_1725500010.webp",
          "alt": "Hệ thống quan trắc đất và khí tượng thông minh",
          "caption": "Mô hình trạm quan trắc nông nghiệp thông minh được lắp đặt tại huyện Chư Sê",
          "spacing": {
            "marginTop": 24,
            "marginBottom": 24
          }
        },
        {
          "id": "blk_prog_004",
          "type": "section",
          "number": "01",
          "title": "CÁC GÓI HỖ TRỢ DÀNH CHO DOANH NGHIỆP & HỢP TÁC XÃ",
          "spacing": {
            "marginTop": 40,
            "marginBottom": 24
          },
          "children": [
            {
              "id": "blk_prog_005",
              "type": "list",
              "listType": "bullet",
              "listStyle": "disc",
              "items": [
                {
                  "id": "item_01",
                  "content": "Tài trợ 50% chi phí lắp đặt thiết bị cảm biến và phần mềm nhật ký điện tử.",
                  "children": [
                    {
                      "id": "item_01_sub1",
                      "content": "Ưu tiên hợp tác xã có diện tích canh tác từ 10 ha trở lên.",
                      "children": []
                    }
                  ]
                },
                {
                  "id": "item_02",
                  "content": "Tập huấn thực chiến kỹ năng vận hành thiết bị bay không người lái (UAV) phun thuốc và khảo sát cây trồng.",
                  "children": []
                }
              ]
            }
          ]
        },
        {
          "id": "blk_prog_006",
          "type": "quote",
          "text": "Đổi mới sáng tạo trong nông nghiệp không chỉ là mua máy móc, mà là thay đổi tư duy làm chủ dữ liệu của người nông dân Tây Nguyên.",
          "author": "Đại diện Ban Giám đốc Trung tâm VDCD",
          "citation": "Hội nghị Nông nghiệp Số 2026",
          "spacing": {
            "marginTop": 32,
            "marginBottom": 32
          }
        },
        {
          "id": "blk_prog_007",
          "type": "cta",
          "label": "Đăng ký nhu cầu đào tạo",
          "url": "/contact",
          "secondaryLabel": "Trao đổi với trung tâm",
          "secondaryUrl": "/solutions",
          "items": [
            {
              "id": "btn_1",
              "label": "Đăng ký nhu cầu đào tạo",
              "url": "/contact",
              "variant": "solid"
            },
            {
              "id": "btn_2",
              "label": "Trao đổi với trung tâm",
              "url": "/solutions",
              "variant": "outline"
            },
            {
              "id": "btn_3",
              "label": "Tư vấn trực tiếp qua Hotline",
              "url": "tel:02693888999",
              "variant": "outline"
            }
          ],
          "shape": "square",
          "layout": "flex",
          "align": "center",
          "gap": 8,
          "variant": "outline",
          "spacing": {
            "marginTop": 32,
            "marginBottom": 32
          }
        }
      ]
    }
  }
}
```

---

## 5. QUY TẮC ĐỒNG BỘ GIAO DIỆN 1:1 VỚI ADMIN VISUAL EDITOR

### 5.1. Thiết Kế Header & Hero Của Chương Trình

1. **Breadcrumbs:**
   `Trang chủ / Chương trình / [Tên Lĩnh Vực] / [Tên Chương Trình]`
2. **Operation Field Badge:**
   Hiển thị huy hiệu lĩnh vực (nền xám nhạt bo tròn, chữ đỏ đậm `#ca2a30`, font-weight 600).
3. **Tiêu đề chính (`<h1>`):**
   Font **Space Grotesk** in hoa, kích thước `text-3xl` đến `text-4xl`, tracking `tracking-tight`, màu `#011A42`.
4. **Đoạn dẫn tóm tắt (`shortDescription`):**
   Font **Be Vietnam Pro**, kích thước `text-lg`, màu xám đậm `#6C7E96`, line-height `leading-relaxed`.
5. **Ảnh đại diện (`thumbnail`):**
   Khung viền bo tròn `rounded-2xl`, tỉ lệ 16:9, bóng đổ tinh tế `shadow-md`, hỗ trợ Lightbox/Zoom khi click.

---

### 5.2. QUY TẮC HIỂN THỊ CHI TIẾT KHỐI NÚT KÊU GỌI (CTA BLOCK) MỚI — ĐA NÚT & TỰ ĐỘNG XUỐNG HÀNG (FLEX-WRAP)

Khối CTA hỗ trợ tạo **nhiều nút (1, 2, 3... N nút)** trong 1 khối duy nhất, đồng thời tương thích ngược 100% với các bài viết / chương trình cũ:

```ts
export type CtaAlign = "center" | "between" | "start" | "end";
export type CtaShape = "square" | "pill";
export type CtaVariant = "solid" | "outline";
export type CtaLayout = "flex" | "between";

export interface CtaButtonItem {
  id: string;
  label: string;
  url: string;
  variant?: CtaVariant; // 'solid' = Nền gradient đỏ | 'outline' = Viền đỏ
}

export interface CtaBlock {
  id: string;
  type: "cta";
  label?: string;            // Nhãn nút chính (tương thích ngược)
  url?: string;              // Đường dẫn nút chính (tương thích ngược)
  secondaryLabel?: string;   // Nhãn nút phụ (tương thích ngược)
  secondaryUrl?: string;     // Đường dẫn nút phụ (tương thích ngược)
  items?: CtaButtonItem[];   // Danh sách đa nút (1..N nút)
  shape?: CtaShape;          // 'square' = Nút vuông bo nhẹ (mặc định) | 'pill' = Viên thuốc
  layout?: CtaLayout;        // 'flex' = Các nút gần nhau | 'between' = Space Between
  align?: CtaAlign;          // Căn lề: 'center' | 'start' | 'end' | 'between'
  gap?: number;              // Khoảng cách giữa các nút (4, 8, 12, 16, 24px)
  variant?: CtaVariant;      // Kiểu mặc định khi chưa chỉ định
  fontSize?: number;
  spacing?: { marginTop?: number; marginBottom?: number };
}

/** Helper chuẩn hóa dữ liệu nút — hỗ trợ cả đa nút mới và cấu trúc cũ */
export function getCtaButtons(block: CtaBlock): CtaButtonItem[] {
  if (block.items && Array.isArray(block.items) && block.items.length > 0) {
    return block.items;
  }
  const buttons: CtaButtonItem[] = [];
  if (block.label || block.url) {
    buttons.push({
      id: "btn_1",
      label: block.label || "Tìm hiểu thêm",
      url: block.url || "#",
      variant: "solid",
    });
  }
  if (block.secondaryLabel) {
    buttons.push({
      id: "btn_2",
      label: block.secondaryLabel,
      url: block.secondaryUrl || "#",
      variant: block.variant || "outline",
    });
  }
  return buttons.length > 0
    ? buttons
    : [{ id: "btn_1", label: "Tìm hiểu thêm", url: "#", variant: "solid" }];
}
```

#### Quy Tắc Render CTA Trên Frontend:

1. **Chuẩn Hóa Danh Sách Nút:**
   - Luôn sử dụng hàm `getCtaButtons(block)` để lấy danh sách `buttons: CtaButtonItem[]`.
   - Frontend sẽ render toàn bộ các nút trong danh sách theo thứ tự.

2. **Cơ Chế Xuống Hàng Tự Động (`flex-wrap`):**
   - Container bắt buộc phải có: `display: flex; flex-wrap: wrap; max-width: 100%;` (Tailwind: `flex flex-wrap max-w-full`).
   - Khi tổng chiều rộng của các nút vượt quá độ rộng của khối chứa (ví dụ trên thiết bị di động hoặc khi có từ 3 nút trở lên), các nút thừa sẽ **tự động xuống dòng tiếp theo (`xuống hàng`)** một cách mượt mà và tự nhiên, không bị tràn viền (overflow) hay cắt cụt.
   - Thuộc tính `gap: ${block.gap ?? 8}px;` áp dụng đồng đều cho cả khoảng cách ngang (giữa các nút trên cùng 1 hàng) và khoảng cách dọc (giữa các hàng đã xuống dòng).

3. **Hình Dáng Nút (`shape`):**
   - `"square"` *(Mặc định)*: Nút hình chữ nhật bo nhẹ góc (`rounded-lg` / `border-radius: 0.5rem`). Phong cách hiện đại, tinh gọn, phù hợp hài hòa với layout bài viết.
   - `"pill"`: Nút bo tròn hoàn toàn dạng viên thuốc (`rounded-full` / `border-radius: 9999px`).

4. **Bố Cục & Căn Lề:**
   - **Chế độ `Space Between` (`layout === "between"` hoặc `align === "between"`):**
     - Container: `justify-between w-full`.
     - Phù hợp khi có 2 nút cần dạt sang hai bên mép khung nội dung.
   - **Chế độ căn lề tiêu chuẩn (`layout === "flex"`):**
     - `align === "center"`: `justify-center` (mặc định)
     - `align === "start"`: `justify-start`
     - `align === "end"`: `justify-end`

5. **Kiểu Dáng & Phối Màu Từng Nút (`variant`):**
   - **Solid (`variant === "solid"`):**
     - Gradient đỏ thương hiệu: `bg-gradient-to-r from-[#d32f2f] via-[#ca2a30] to-[#b82228]`.
     - Chữ trắng, bóng đổ nhẹ: `shadow-md shadow-[#ca2a30]/20 hover:shadow-lg hover:shadow-[#ca2a30]/30 hover:-translate-y-0.5`.
     - Icon mũi tên lồng trong badge tròn mờ `bg-white/20`.
   - **Outline (`variant === "outline"`):**
     - Viền 2px đỏ thương hiệu `border-2 border-[#ca2a30]`, nền trắng hoặc trong suốt, chữ đỏ `#ca2a30`.
     - Hover đổi nền đỏ chữ trắng: `hover:bg-[#ca2a30] hover:text-white`.
     - Icon mũi tên lồng trong badge tròn `bg-[#ca2a30]/10 text-[#ca2a30] group-hover:bg-white/20 group-hover:text-white`.

6. **Tuyệt đối không render text URL thô:**
   - Trong giao diện công khai và đọc bài, chỉ render thẻ liên kết `<a>` / `<Link>` sạch, **không hiển thị bất kỳ dòng chữ thô nào dạng `→ /contact`**.

---

### 5.3. Quy Tắc Các Khối Khác

| Khối | Thẻ HTML | Quy cách hiển thị |
| :--- | :--- | :--- |
| **Heading** | `<h2>` - `<h6>` | Cấp độ ngữ nghĩa theo `level` (2-6). Visual `fontSize` độc lập nếu có cấu hình. Font Space Grotesk in hoa, đậm. |
| **Paragraph** | `<p>` | Font Be Vietnam Pro, `text-base` (16px) hoặc `text-lg` (18px), màu `#011A42`, line-height 1.75. |
| **Image** | `<figure>` + `<img>` | Bo góc `rounded-xl`, caption căn giữa in nghiêng màu `#6C7E96`. Hỗ trợ preview phóng to. |
| **List** | `<ul>` hoặc `<ol>` | Hỗ trợ đa cấp (`children[]`). Bullet tròn nhỏ màu đỏ, khoảng cách item theo `itemSpacing`. |
| **Quote** | `<blockquote>` | Viền trái dày 4px màu đỏ `#ca2a30`, nền hồng nhạt `#ca2a30/5`, chữ nghiêng, hiển thị Author và Citation rõ ràng. |
| **Highlight** | `<div>` | Hộp thẻ thông tin nền nhạt, viền bo tròn `rounded-xl`, viền trái nhấn màu, icon thông tin. |
| **Section** | `<section>` | Khối phân đoạn có số thứ tự (ví dụ: `01`, `02`) in đậm to, tiêu đề nhóm in hoa, bọc danh sách các khối con `children`. |

---

## 6. MÃ NGUỒN TÍCH HỢP MẪU TRÊN NEXT.JS APP ROUTER (FRONTEND REPO)

Dưới đây là mã nguồn hoàn chỉnh có thể sao chép trực tiếp vào dự án **`VDCD_gialai_frontend`**:

### 6.1. TypeScript Interface (`types/program.ts`)

```typescript
// types/program.ts

export type CtaAlign = "center" | "between" | "start" | "end";
export type CtaShape = "square" | "pill";
export type CtaVariant = "solid" | "outline";
export type CtaLayout = "flex" | "between";

export interface BlockSpacing {
  marginTop?: number;
  marginBottom?: number;
}

export interface HeadingBlock {
  id: string;
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  fontSize?: number;
  spacing?: BlockSpacing;
}

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
  fontSize?: number;
  spacing?: BlockSpacing;
}

export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  alt?: string;
  caption?: string | null;
  spacing?: BlockSpacing;
}

export interface ListItem {
  id: string;
  content: string;
  children?: ListItem[];
}

export interface ListBlock {
  id: string;
  type: "list";
  items: ListItem[];
  listType?: "bullet" | "ordered" | "checklist";
  fontSize?: number;
  spacing?: BlockSpacing;
}

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
  shape?: CtaShape;
  layout?: CtaLayout;
  align?: CtaAlign;
  gap?: number;
  variant?: CtaVariant;
  fontSize?: number;
  spacing?: BlockSpacing;
}

export function getCtaButtons(block: CtaBlock): CtaButtonItem[] {
  if (block.items && Array.isArray(block.items) && block.items.length > 0) {
    return block.items;
  }
  const buttons: CtaButtonItem[] = [];
  if (block.label || block.url) {
    buttons.push({
      id: "btn_1",
      label: block.label || "Tìm hiểu thêm",
      url: block.url || "#",
      variant: "solid",
    });
  }
  if (block.secondaryLabel) {
    buttons.push({
      id: "btn_2",
      label: block.secondaryLabel,
      url: block.secondaryUrl || "#",
      variant: block.variant || "outline",
    });
  }
  return buttons.length > 0
    ? buttons
    : [{ id: "btn_1", label: "Tìm hiểu thêm", url: "#", variant: "solid" }];
}

export interface SectionBlock {
  id: string;
  type: "section";
  number: string;
  title: string;
  children: (HeadingBlock | ParagraphBlock | ImageBlock | ListBlock)[];
  spacing?: BlockSpacing;
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ListBlock
  | QuoteBlock
  | HighlightBlock
  | CtaBlock
  | SectionBlock;

export interface ProgramDocumentContent {
  version: number;
  blocks: ContentBlock[];
}

export interface OperationField {
  id: string;
  name: string;
  slug: string;
}

export interface ProgramDetail {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  content: ProgramDocumentContent | string | null;
  thumbnail: string | null;
  thumbnailFileId: string | null;
  field: OperationField | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

### 6.2. Service Truy Xuất Dữ Liệu (`services/program.service.ts`)

```typescript
// services/program.service.ts
import type { ProgramDetail, ProgramDocumentContent } from "@/types/program";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.vdcd.vn";

export async function getProgramBySlug(slug: string): Promise<ProgramDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/programs/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 }, // ISR: Cache 60s
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch program: ${res.statusText}`);
    }

    const json = await res.json();
    const data: ProgramDetail = json.data;

    // Chuẩn hóa content: Nếu là chuỗi JSON string thì parse ra object
    if (typeof data.content === "string") {
      try {
        data.content = JSON.parse(data.content) as ProgramDocumentContent;
      } catch {
        data.content = {
          version: 1,
          blocks: [{ id: "raw_fallback", type: "paragraph", text: data.content }],
        };
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching program detail:", error);
    return null;
  }
}
```

---

### 6.3. Component Render Khối CTA (`components/content-blocks/CtaBlockRenderer.tsx`)

```tsx
// components/content-blocks/CtaBlockRenderer.tsx
import React from "react";
import Link from "next/link";
import { getCtaButtons, type CtaBlock, type CtaShape, type CtaAlign } from "@/types/program";

export function CtaBlockRenderer({ block }: { block: CtaBlock }) {
  const currentShape: CtaShape = block.shape ?? "square";
  const currentAlign: CtaAlign = block.align ?? "center";
  const currentGap = block.gap ?? (block.layout === "flex" ? 8 : 16);
  const currentLayout = block.layout ?? (block.align === "between" ? "between" : "flex");
  const isSpaceBetween = currentLayout === "between" || currentAlign === "between";

  const buttons = getCtaButtons(block);
  const shapeClass = currentShape === "pill" ? "rounded-full" : "rounded-lg";

  const alignClass = (() => {
    switch (currentAlign) {
      case "start":
        return "justify-start";
      case "end":
        return "justify-end";
      case "center":
      default:
        return "justify-center";
    }
  })();

  const spacingStyle = {
    marginTop: block.spacing?.marginTop ? `${block.spacing.marginTop}px` : "2rem",
    marginBottom: block.spacing?.marginBottom ? `${block.spacing.marginBottom}px` : "2rem",
  };

  return (
    <div className="w-full my-6" style={spacingStyle}>
      <div
        className={`flex items-center flex-wrap max-w-full py-1 ${
          isSpaceBetween ? "justify-between w-full" : alignClass
        }`}
        style={{ gap: `${currentGap}px` }}
      >
        {buttons.map((btn, index) => {
          const isOutline = btn.variant === "outline";

          return (
            <Link
              key={btn.id || `btn_${index}`}
              href={btn.url || "#"}
              className={`group inline-flex flex-shrink-0 whitespace-nowrap items-center justify-center gap-2.5 px-6 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${shapeClass} ${
                isOutline
                  ? "border-2 border-[#ca2a30] bg-white text-[#ca2a30] shadow-xs hover:bg-[#ca2a30] hover:text-white"
                  : "bg-gradient-to-r from-[#d32f2f] via-[#ca2a30] to-[#b82228] text-white shadow-md shadow-[#ca2a30]/20 hover:shadow-lg hover:shadow-[#ca2a30]/30"
              }`}
            >
              <span>{btn.label || `Nút ${index + 1}`}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${
                  isOutline
                    ? "bg-[#ca2a30]/10 text-[#ca2a30] group-hover:bg-white/20 group-hover:text-white"
                    : "bg-white/20 text-white"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 6.4. Component Render Khối Nội Dung Tổng Hợp (`components/program/ProgramDetailRenderer.tsx`)

```tsx
// components/program/ProgramDetailRenderer.tsx
import React from "react";
import Image from "next/image";
import type { ProgramDetail, ContentBlock } from "@/types/program";
import { CtaBlockRenderer } from "@/components/content-blocks/CtaBlockRenderer";

export function ProgramDetailRenderer({ program }: { program: ProgramDetail }) {
  const content = typeof program.content === "object" ? program.content : null;
  const blocks: ContentBlock[] = content?.blocks || [];

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header Chương Trình ── */}
      <header className="mb-8 space-y-4">
        {program.field && (
          <div className="inline-flex items-center rounded-full bg-[#ca2a30]/10 px-3.5 py-1 text-xs font-semibold text-[#ca2a30]">
            {program.field.name}
          </div>
        )}

        <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-[#011A42] sm:text-4xl lg:text-5xl uppercase">
          {program.title}
        </h1>

        {program.shortDescription && (
          <p className="text-lg leading-relaxed text-[#6C7E96] font-['Be_Vietnam_Pro']">
            {program.shortDescription}
          </p>
        )}

        {/* Thumbnail Hero */}
        {program.thumbnail && (
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-2xl shadow-md">
            <Image
              src={program.thumbnail}
              alt={program.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
      </header>

      {/* ── Block Content Stream ── */}
      <div className="space-y-6 font-['Be_Vietnam_Pro'] text-[#011A42]">
        {blocks.map((block) => {
          const spacingStyle = {
            marginTop: block.spacing?.marginTop ? `${block.spacing.marginTop}px` : undefined,
            marginBottom: block.spacing?.marginBottom ? `${block.spacing.marginBottom}px` : undefined,
          };

          switch (block.type) {
            case "heading": {
              const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
              return (
                <Tag
                  key={block.id}
                  style={spacingStyle}
                  className="font-['Space_Grotesk'] font-bold tracking-tight text-[#011A42] text-xl sm:text-2xl mt-8 mb-4 uppercase"
                >
                  {block.text}
                </Tag>
              );
            }

            case "paragraph":
              return (
                <p
                  key={block.id}
                  style={spacingStyle}
                  className="text-base leading-relaxed text-[#011A42] my-4"
                  dangerouslySetInnerHTML={{ __html: block.text }}
                />
              );

            case "image":
              return (
                <figure key={block.id} style={spacingStyle} className="my-6">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
                    <Image src={block.url} alt={block.alt || ""} fill className="object-cover" />
                  </div>
                  {block.caption && (
                    <figcaption className="mt-2 text-center text-xs italic text-[#6C7E96]">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );

            case "list":
              return (
                <ul key={block.id} style={spacingStyle} className="my-4 list-disc space-y-2 pl-6 text-base">
                  {block.items.map((item) => (
                    <li key={item.id} dangerouslySetInnerHTML={{ __html: item.content }} />
                  ))}
                </ul>
              );

            case "quote":
              return (
                <blockquote
                  key={block.id}
                  style={spacingStyle}
                  className="my-6 rounded-r-xl border-l-4 border-[#ca2a30] bg-[#ca2a30]/5 p-4 italic text-[#011A42]"
                >
                  <p className="text-base font-medium">“{block.text}”</p>
                  {(block.author || block.citation) && (
                    <footer className="mt-2 text-xs not-italic text-[#6C7E96]">
                      — {block.author} {block.citation && `(${block.citation})`}
                    </footer>
                  )}
                </blockquote>
              );

            case "highlight":
              return (
                <div
                  key={block.id}
                  style={spacingStyle}
                  className="my-6 rounded-xl border border-[#ca2a30]/30 bg-[#ca2a30]/5 p-4 text-[#011A42]"
                >
                  <p className="text-sm font-semibold">{block.text}</p>
                </div>
              );

            case "section":
              return (
                <section key={block.id} style={spacingStyle} className="my-8 space-y-4">
                  <div className="flex items-baseline gap-3 border-b border-slate-200 pb-2">
                    <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#ca2a30]">
                      {block.number}
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-lg font-bold uppercase text-[#011A42]">
                      {block.title}
                    </h3>
                  </div>
                </section>
              );

            case "cta":
              return <CtaBlockRenderer key={block.id} block={block} />;

            default:
              return null;
          }
        })}
      </div>
    </article>
  );
}
```

---

### 6.5. Route Page Next.js App Router (`app/(main)/programs/[slug]/page.tsx`)

```tsx
// app/(main)/programs/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProgramBySlug } from "@/services/program.service";
import { ProgramDetailRenderer } from "@/components/program/ProgramDetailRenderer";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const program = await getProgramBySlug(params.slug);
  if (!program) return { title: "Không tìm thấy chương trình | VDCD" };

  return {
    title: program.metaTitle || `${program.title} | VDCD Gia Lai`,
    description: program.metaDescription || program.shortDescription || undefined,
    openGraph: {
      title: program.metaTitle || program.title,
      description: program.metaDescription || program.shortDescription || undefined,
      images: program.thumbnail ? [{ url: program.thumbnail }] : [],
    },
  };
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const program = await getProgramBySlug(params.slug);

  if (!program || !program.isPublished) {
    notFound();
  }

  return <ProgramDetailRenderer program={program} />;
}
```

---

## 7. CHECKLIST KIỂM THỬ NGHIỆM THU ĐỒNG BỘ (SYNC VALIDATION CHECKLIST)

Trước khi nghiệm thu tích hợp trên Frontend (`VDCD_gialai_frontend`), kiểm tra qua các tiêu chí sau:

- [ ] **Khối CTA vuông bo nhẹ (`shape === "square"`):** Hiển thị đúng góc bo nhẹ `rounded-lg`, không bị biến dạng thành pill khi admin chọn vuông.
- [ ] **Khối CTA 2 nút trên 1 hàng (`layout === "flex"`):**
  - [ ] 2 nút nằm thẳng hàng ngang kề nhau theo khoảng cách `gap` đã chọn (`4px`, `8px`, `12px`, `16px`, `24px`).
  - [ ] Không bị rớt nút phụ xuống dòng 2 (`flex-nowrap`, `white-space: nowrap`).
  - [ ] Căn lề chính xác: Giữa (`justify-center`), Trái (`justify-start`), Phải (`justify-end`).
- [ ] **Khối CTA Space Between (`layout === "between"`):** 2 nút dàn đều 2 bên mép cột nội dung (`justify-between w-full`).
- [ ] **Loại bỏ text URL thô:** Hoàn toàn không còn đoạn chữ debug thô `→ /contact` trong giao diện đọc bài.
- [ ] **Typography & Màu sắc:** Tiêu đề font Space Grotesk in hoa đậm, nội dung font Be Vietnam Pro, màu chủ đạo `#ca2a30`.
- [ ] **Khối Danh sách lồng cấp (Nested List):** Các mục con thụt lề chuẩn, marker rõ ràng.
- [ ] **Ảnh & Chú thích:** Tải mượt từ ImageKit (`/vdcd/programs/...`), caption in nghiêng căn giữa dưới ảnh.
- [ ] **SEO & Metadata:** Thẻ meta title, meta description và OpenGraph image lấy đúng dữ liệu từ Program.
