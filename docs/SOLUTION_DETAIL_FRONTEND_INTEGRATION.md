# TÀI LIỆU TÍCH HỢP FRONTEND — BỘ API, Ý TƯỞNG & QUY TẮC ĐỒNG BỘ GIAO DIỆN SOLUTION DETAIL

Tài liệu này hướng dẫn chi tiết cho đội ngũ phát triển **Frontend (`VDCD_gialai_frontend`)** về:
1. **Bối cảnh & Những thay đổi lớn (Major Architectural Shifts)** khi nâng cấp Solution từ nội dung văn bản thuần/HTML thô sang **Block Document Model**.
2. **Ý tưởng thiết kế & Trải nghiệm giao diện (Design Concepts & UI Experience)** thống nhất với kiến trúc Content Editor dùng chung (`src/shared/content-editor`).
3. **Bộ API Endpoints công khai** để truy xuất chi tiết giải pháp và danh sách giải pháp.
4. **Cấu trúc dữ liệu JSON phản hồi (Data Contract)** trả về từ Backend NestJS.
5. **Quy tắc hiển thị chi tiết (UI Sync Specifications)** đảm bảo trang Solution Detail trên Website công khai **đồng bộ 100% (Pixel-Perfect Sync)** với *Trình chỉnh sửa trực quan (Visual Editor)* trên Admin CMS.
6. **Điểm đặc thù của Solution**: Tích hợp liên kết trải nghiệm trực tiếp (`websiteUrl`), lĩnh vực hoạt động (`field`), và danh sách bài viết/case studies liên quan (`relatedArticles`).
7. **Chi tiết thiết kế mới cho khối Nút kêu gọi (CTA Block)**: Hỗ trợ nút hình vuông bo nhẹ, 2 nút trên 1 hàng, tùy chọn bố cục **`Gần nhau (Flex)`** và **`Space Between`**, căn lề và khoảng cách gap tùy biến.
8. **Mã nguồn tích hợp mẫu (TypeScript Types, Service, Component, Next.js Page Route)** trên Next.js App Router.
9. **Checklist kiểm thử nghiệm thu (Sync Validation Checklist)**.

---

## 1. BỐI CẢNH, NHỮNG THAY ĐỔI LỚN & Ý TƯỞNG THIẾT KẾ

### 1.1. Bối Cảnh & Những Thay Đổi Lớn (Major Shifts)

| Tiêu chí | Mô hình Cũ (Legacy HTML/Text) | Mô hình Mới (Block Document Model) |
| :--- | :--- | :--- |
| **Cấu trúc dữ liệu `content`** | Đoạn text ngắn hoặc chuỗi HTML thô (`TEXT`) | Cấu trúc JSON chuẩn hoá (`JSONB`) gồm mảng các Khối (`DocumentContent` / `ContentBlock[]`) |
| **Độ tin cậy hiển thị** | Dễ vỡ layout, inline style lộn xộn, CSS xung đột | Đồng bộ 100% với Admin Preview, typography chuẩn hoá, responsive đa thiết bị |
| **Liên kết Website Trải nghiệm (`websiteUrl`)** | Bị ẩn hoặc chèn thủ công vào giữa bài | Trường dữ liệu chuẩn hóa cấp root, hiển thị nút CTA trải nghiệm giải pháp/sản phẩm công nghệ nổi bật ở phần đầu trang và thanh hành động |
| **Lĩnh vực hoạt động (`field`)** | Không có hoặc liên kết lỏng lẻo | Quan hệ khóa ngoại rõ ràng với bảng `operation_field`, hiển thị badge phân loại chuyên môn |
| **Khả năng tương tác Khối** | Toàn bộ bài viết là một cục văn bản duy nhất | Từng khối độc lập: Heading H1-H6, Paragraph, Image & Caption, List lồng cấp, Quote, Highlight, Section, CTA button |
| **Khối Nút kêu gọi (CTA Block)** | Không hỗ trợ hoặc chỉ là thẻ `<a>` đơn điệu | Nút vuông bo nhẹ tinh tế, hỗ trợ **2 nút trên 1 hàng**, tùy chọn **`Gần nhau (Flex)`** và **`Space Between`** |
| **Kiểm soát lề & Khoảng cách** | Phụ thuộc vào `<br>` hoặc margin mặc định của trình duyệt | Tuỳ biến chính xác từng pixel qua `spacing: { marginTop, marginBottom }` |
| **Bài viết & Case-study liên quan** | Không thể liên kết tự động | Tự động trả về danh sách các bài viết / case-studies (`relatedArticles`) liên kết với giải pháp này |
| **Quản lý Media (ImageKit)** | Lưu tự do hoặc thư mục chung | Tự động phân cấp thư mục theo giải pháp: `/vdcd/solutions/<slug>/` |

### 1.2. Ý Tưởng Thiết Kế & Nguyên Tắc Cốt Lõi (Core Design Concepts)

1. **Một Nguồn Chân Lý Duy Nhất (Single Source of Truth):**
   Cả hệ thống **Slide Detail Blog**, **Article Detail**, **Program Detail** và **Solution Detail** đều dùng chung một chuẩn cấu trúc tài liệu (`DocumentContent` version 1). Admin biên tập trực quan ra sao thì Frontend hiển thị chính xác như vậy.
2. **Tái Sử Dụng Kiến Trúc Khối (Shared Component Architecture):**
   Frontend tái sử dụng trực tiếp bộ component hiển thị khối (`HeadingBlockRenderer`, `ParagraphBlockRenderer`, `ImageBlockRenderer`, `ListBlockRenderer`, `SectionBlockRenderer`, `CtaBlockRenderer`, `QuoteBlockRenderer`, `HighlightBlockRenderer`).
3. **Đặc Trưng Định Vị Của Solution Detail (Giải Pháp & Sản Phẩm Công Nghệ Số):**
   Khác với bài báo tin tức hoặc chương trình vận động, Solution là **Sản phẩm công nghệ, Nền tảng số, và Dịch vụ chuyển đổi số chuyên sâu** của Trung tâm Đổi mới Sáng tạo Gia Lai (VDCD) và các đối tác công nghệ chiến lược (như GIS, BIM, IoT, AI, Auto Timelapse, UAV). Do đó, giao diện Solution Detail cần:
   - **Nút Trải Nghiệm Giải Pháp / Demo Website (`websiteUrl`):** Đặt ở vị trí danh dự tại Hero Header để người dùng có thể nhấp và mở ngay ứng dụng sản phẩm thực tế (ví dụ: `https://bimv.vn`, `https://autotimelapse.com`, `https://geneat.vn`).
   - **Lĩnh vực hoạt động (Operation Field Badge):** Nổi bật lĩnh vực chuyên môn (ví dụ: *Đô thị thông minh*, *Tài nguyên môi trường*, *Nông nghiệp số*, *Bản đồ số & GIS*).
   - **Tóm tắt ngắn (Short Description / Value Proposition):** Tóm lược bài toán thực tiễn và giá trị mang lại cho doanh nghiệp/cơ quan nhà nước.
   - **Case Studies & Bài viết liên quan (`relatedArticles`):** Cung cấp các bài viết minh chứng thực tế, hướng dẫn ứng dụng, bài học triển khai thành công.
   - **CTA Kêu gọi chuyển giao công nghệ:** Nút liên hệ tư vấn chuyên gia và đăng ký demo trực tiếp.

---

## 2. TỔNG QUAN KIẾN TRÚC & DÒNG CHẢY DỮ LIỆU (DATA FLOW)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ADMIN CMS (Repo Admin)                          │
│  - Tab 1: Thông tin (Metadata, Website URL, Field, Thumbnail, SEO)     │
│  - Tab 2: Nội dung (Block Form Editor — thêm/sửa/sắp xếp khối)         │
│  - Tab 3: Đọc bài (Read-Only Article View — mô phỏng trang người đọc) │
│  - Tab 4: Trình chỉnh sửa trực quan (Visual Editor — WYSIWYG canvas)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ POST / PATCH /api/v1/solutions/:id
                                    │ Upload ảnh: POST /api/v1/upload/image/solution
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           BACKEND NESTJS                               │
│  - Bảng DB: `solution`                                                 │
│  - Cột `content` (JSONB) chứa { version: 1, heroMeta, blocks }         │
│  - Lưu trữ media trên ImageKit tại thư mục: /vdcd/solutions/<slug>/    │
│  - Endpoint: GET /solutions/:slug & GET /solutions/admin/:id           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ GET /api/v1/solutions/:slug
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PUBLIC FRONTEND (Repo Frontend)                   │
│  Route: /solutions/[slug] (hoặc /giai-phap/[slug])                    │
│  Component: SolutionDetailRenderer                                     │
│  ├── Breadcrumbs & Operation Field Badge                               │
│  ├── Solution Hero Header (Title + Short Desc + Website URL + Thumb)   │
│  ├── Block Stream Renderer (Heading, Paragraph, List, CTA, Section...) │
│  ├── Related Articles / Case Studies Grid (Bài viết liên quan)         │
│  └── Technology Transfer & Contact Conversion Bar                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. BỘ API ENDPOINTS DÀNH CHO FRONTEND

Backend cung cấp các API công khai (Public API — Không yêu cầu Token đăng nhập) để Website Frontend truy xuất:

### 3.1. 🔓 Lấy Chi Tiết Giải Pháp Theo Slug
Dùng cho Server Component hoặc Page Router trên Frontend tại đường dẫn `/solutions/[slug]`.

* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/solutions/:slug` *(hoặc proxy `/api/solutions/:slug`)*
* **Path Parameter:**
  * `slug` (string): Slug duy nhất của giải pháp (ví dụ: `quan-ly-tai-nguyen-quan-trac-moi-truong` hoặc `trung-tam-phan-mem-vdcd-soft`).
* **Headers:**
  ```http
  Accept: application/json
  ```
* **Mã phản hồi (Status Codes):**
  * `200 OK`: Trả về dữ liệu chi tiết của giải pháp, cấu trúc khối `content` và danh sách 5 bài viết liên quan `relatedArticles`.
  * `404 Not Found`: Không tìm thấy giải pháp hoặc giải pháp chưa xuất bản (`isPublished: false`).

---

### 3.2. 🔓 Danh Sách Giải Pháp Công Khai (Hỗ Trợ Phân Trang & Lọc)
Dùng cho trang danh sách giải pháp `/solutions` hoặc khối "Giải pháp liên quan".

* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/solutions`
* **Query Parameters:**
  * `page` (number, optional, mặc định `1`): Trang hiện tại.
  * `limit` (number, optional, mặc định `10`): Số lượng mục mỗi trang.
  * `fieldId` (UUID, optional): Lọc giải pháp thuộc lĩnh vực hoạt động cụ thể.
  * `search` (string, optional): Từ khóa tìm kiếm tiêu đề giải pháp.
* **Mã phản hồi (Status Codes):**
  * `200 OK`: Danh sách giải pháp công khai kèm metadata phân trang `{ items, meta: { totalItems, itemCount, itemsPerPage, totalPages, currentPage } }`.

---

## 4. CẤU TRÚC DỮ LIỆU JSON RESPONSE (DATA CONTRACT)

### 4.1. Cấu Trúc JSON Phản Hồi Mẫu (`Response 200` từ `/api/v1/solutions/:slug`)

```json
{
  "statusCode": 200,
  "data": {
    "id": "4b124ed2-25ae-4e1d-b408-538f470043ec",
    "title": "TRUNG TÂM PHẦN MỀM VDCD – SOFT",
    "slug": "trung-tam-phan-mem-vdcd-soft",
    "shortDescription": "Cung cấp hệ sinh thái giải pháp phần mềm chuyên sâu, chuyển đổi số toàn diện cho doanh nghiệp và các cơ quan quản trị nhà nước tại khu vực Tây Nguyên.",
    "thumbnail": "https://ik.imagekit.io/eo8dcxsjx8/vdcd/solutions/trung-tam-phan-mem-vdcd-soft/thumbnail_1725500000.webp",
    "thumbnailFileId": "solution-thumb-trung-tam-phan-mem-vdcd-soft",
    "websiteUrl": "https://geneat.vn",
    "field": {
      "id": "5292c9c5-7499-4353-9430-11aa730c63d8",
      "name": "Chuyển Đổi Số Doanh Nghiệp",
      "slug": "chuyen-doi-so-doanh-nghiep"
    },
    "metaTitle": "Trung tâm phần mềm VDCD – Soft | Giải pháp Chuyển đổi số",
    "metaDescription": "Giải pháp phần mềm và chuyển đổi số chất lượng cao từ Trung tâm Đổi mới Sáng tạo Gia Lai VDCD.",
    "isPublished": true,
    "publishedAt": "2026-09-03T08:00:00.000Z",
    "createdAt": "2026-09-01T08:00:00.000Z",
    "updatedAt": "2026-09-05T09:30:00.000Z",
    "content": {
      "version": 1,
      "blocks": [
        {
          "id": "blk_sol_001",
          "type": "heading",
          "level": 2,
          "text": "NĂNG LỰC CÔNG NGHỆ VÀ HỆ SINH THÁI GIẢI PHÁP",
          "spacing": {
            "marginTop": 32,
            "marginBottom": 16
          }
        },
        {
          "id": "blk_sol_002",
          "type": "paragraph",
          "text": "VDCD Soft tập trung vào việc nghiên cứu, làm chủ các công nghệ mới và phát triển các nền tảng ứng dụng thực tiễn cao nhằm tối ưu hóa năng suất vận hành và số hóa quy trình quản lý...",
          "spacing": {
            "marginTop": 0,
            "marginBottom": 24
          }
        },
        {
          "id": "blk_sol_003",
          "type": "image",
          "url": "https://ik.imagekit.io/eo8dcxsjx8/vdcd/solutions/trung-tam-phan-mem-vdcd-soft/1788619012739-515b8aa1e35e.webp",
          "alt": "Kiến trúc hệ thống phần mềm doanh nghiệp VDCD",
          "caption": "Mô hình kiến trúc Cloud & Microservices phục vụ chuyển đổi số doanh nghiệp",
          "spacing": {
            "marginTop": 24,
            "marginBottom": 24
          }
        },
        {
          "id": "blk_sol_004",
          "type": "section",
          "number": "01",
          "title": "CÁC PHÂN HỆ GIẢI PHÁP NỔI BẬT",
          "spacing": {
            "marginTop": 40,
            "marginBottom": 24
          },
          "children": [
            {
              "id": "blk_sol_005",
              "type": "list",
              "listType": "bullet",
              "listStyle": "disc",
              "items": [
                {
                  "id": "item_01",
                  "content": "Hệ thống ERP quản trị nguồn lực doanh nghiệp sản xuất và chế biến nông sản.",
                  "children": [
                    {
                      "id": "item_01_sub1",
                      "content": "Tích hợp quản lý kho thông minh và dự báo dòng tiền bằng AI.",
                      "children": []
                    }
                  ]
                },
                {
                  "id": "item_02",
                  "content": "Nền tảng thương mại điện tử B2B kết nối chuỗi cung ứng nông sản Tây Nguyên.",
                  "children": []
                }
              ]
            }
          ]
        },
        {
          "id": "blk_sol_006",
          "type": "quote",
          "text": "Giải pháp phần mềm tốt nhất là giải pháp giải quyết đúng nỗi đau của người dùng với chi phí vận hành tối ưu nhất.",
          "author": "Giám đốc Công nghệ VDCD Soft",
          "citation": "Kỷ yếu Đổi mới Sáng tạo Gia Lai",
          "spacing": {
            "marginTop": 32,
            "marginBottom": 32
          }
        },
        {
          "id": "blk_sol_007",
          "type": "cta",
          "label": "Trải nghiệm Nền tảng Geneat",
          "url": "https://geneat.vn",
          "secondaryLabel": "Liên hệ Chuyển giao",
          "secondaryUrl": "/contact",
          "items": [
            {
              "id": "btn_1",
              "label": "Trải nghiệm Nền tảng Geneat",
              "url": "https://geneat.vn",
              "variant": "solid"
            },
            {
              "id": "btn_2",
              "label": "Liên hệ Chuyển giao",
              "url": "/contact",
              "variant": "outline"
            }
          ],
          "shape": "square",
          "layout": "flex",
          "align": "center",
          "gap": 8,
          "variant": "solid",
          "spacing": {
            "marginTop": 32,
            "marginBottom": 32
          }
        }
      ]
    },
    "relatedArticles": [
      {
        "id": "art-001-uuid",
        "title": "Ứng dụng phần mềm trong kiểm soát chất lượng cà phê xuất khẩu",
        "slug": "ung-dung-phan-mem-kiem-soat-chat-luong-ca-phe",
        "thumbnail": "https://ik.imagekit.io/eo8dcxsjx8/vdcd/articles/art-001.webp",
        "publishedAt": "2026-08-25T14:30:00.000Z"
      },
      {
        "id": "art-002-uuid",
        "title": "Chuyển đổi số doanh nghiệp vừa và nhỏ tại Gia Lai: Cơ hội và thách thức",
        "slug": "chuyen-doi-so-sme-gia-lai",
        "thumbnail": "https://ik.imagekit.io/eo8dcxsjx8/vdcd/articles/art-002.webp",
        "publishedAt": "2026-08-10T09:15:00.000Z"
      }
    ]
  }
}
```

### 4.2. Bảng Mô Tả Các Trường Dữ Liệu (Field Dictionary)

| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa & Hướng dẫn Frontend |
| :--- | :--- | :---: | :--- |
| `id` | `string` (UUID) | Có | Định danh duy nhất của giải pháp trong CSDL. |
| `title` | `string` | Có | Tiêu đề đầy đủ của giải pháp (dùng làm thẻ `<h1>` chính của trang). |
| `slug` | `string` | Có | Đường dẫn tĩnh phục vụ SEO, dùng làm URL param `/solutions/[slug]`. |
| `shortDescription` | `string` \| `null` | Không | Mô tả ngắn / Đoạn Sa-pô tóm tắt giá trị giải pháp. |
| `websiteUrl` | `string` \| `null` | Không | **Đặc thù Solution**: URL website/demo bên ngoài của sản phẩm (ví dụ `https://geneat.vn`). Nếu có giá trị, hiển thị nút **"Trải nghiệm Giải pháp"** mở tab mới. |
| `thumbnail` | `string` \| `null` | Không | Link CDN ảnh đại diện/banner tỷ lệ 16:9 của giải pháp. |
| `field` | `object` \| `null` | Không | Lĩnh vực hoạt động (gồm `id`, `name`, `slug`). Hiển thị dạng Badge nổi bật ở Hero Header. |
| `metaTitle` | `string` \| `null` | Không | Tiêu đề thẻ `<title>` tối ưu cho SEO Google. |
| `metaDescription`| `string` \| `null` | Không | Thẻ `<meta name="description">` tối ưu cho SEO Google. |
| `publishedAt` | `string` (ISO 8601) | Không | Ngày xuất bản chính thức, hiển thị định dạng Việt Nam (`DD/MM/YYYY`). |
| `content` | `DocumentContent` | Có | Cấu trúc khối tài liệu đồng bộ chuẩn (xem chi tiết mục 5). |
| `relatedArticles` | `ArticleSummary[]` | Không | Danh sách 5 bài viết / case studies liên quan gắn liền với giải pháp này. |

---

## 5. QUY TẮC HIỂN THỊ CHI TIẾT (UI SYNC SPECIFICATIONS)

Giao diện trang Solution Detail trên Frontend được chia thành 4 phân vùng chính theo thứ tự từ trên xuống dưới:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. BREADCRUMB & OPERATION FIELD BADGE                                  │
│    Trang chủ / Giải pháp & Sản phẩm / [Tên Lĩnh Vực]                   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. SOLUTION HERO HEADER                                                │
│    - Title H1 (Chữ lớn, quyền lực, màu #011A42)                        │
│    - Short Description (Lead text, màu #6C7E96)                        │
│    - Action Buttons:                                                   │
│      [Trải nghiệm Giải pháp ↗] (nếu có websiteUrl)  [Liên hệ Tư vấn]   │
│    - Hero Banner Thumbnail (16:9, bo góc 16px, shadow mềm)             │
├────────────────────────────────────────────────────────────────────────┤
│ 3. BLOCK CONTENT STREAM (Thân bài viết khối chuẩn hoá)                 │
│    - Heading H1-H6                                                     │
│    - Paragraph (Text, link, bold, italic)                              │
│    - Image & Caption (ảnh sắc nét, caption chuẩn dưới ảnh)             │
│    - Section phân đoạn (01, 02, 03)                                    │
│    - List & Nested List (bullet, ordered, lồng cấp)                    │
│    - Quote trích dẫn chuyên gia & Highlight ghi chú                    │
│    - CTA Block nâng cao (Nút vuông, 2 nút / hàng, flex / space-between)│
├────────────────────────────────────────────────────────────────────────┤
│ 4. RELATED ARTICLES & CONVERSION BAR                                   │
│    - Lưới bài viết tin tức / Case studies thực tế liên quan            │
│    - Khối kêu gọi chuyển giao công nghệ & Hotline hỗ trợ kỹ thuật      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 5.1. Quy Tắc Hero Header & Action Buttons

1. **Nút Trải Nghiệm Giải Pháp (`websiteUrl`):**
   - Nếu `solution.websiteUrl` có giá trị: Hiển thị nút chính màu đỏ đô thương hiệu VDCD (`bg-[#ca2a30] hover:bg-[#a82227] text-white`).
   - Icon: Biểu tượng mũi tên chéo `ExternalLink` (`↗`).
   - Thuộc tính bắt buộc: `target="_blank" rel="noopener noreferrer"`.
   - Nhãn nút: `"Trải nghiệm Giải pháp"` hoặc `"Truy cập Website Sản phẩm"`.
2. **Nút Phụ Liên Hệ / Tư Vấn:**
   - Dẫn về trang `/contact?solution=${solution.slug}` hoặc mở modal tư vấn chuyển giao công nghệ.
   - Kiểu dáng: Viền thanh lịch (`border border-[#011A42]/20 text-[#011A42] hover:bg-[#011A42]/5`).
3. **Ảnh Banner (Thumbnail):**
   - Tỉ lệ khung hình: `aspect-video` (16:9).
   - Bo góc: `rounded-2xl` (16px), hiệu ứng đổ bóng `shadow-md`.
   - Phải cấu hình thuộc tính `priority` cho Next.js `<Image>` để tối ưu hóa chỉ số LCP (Largest Contentful Paint).

---

### 5.2. Quy Tắc Khối Nút Kêu Gọi (CTA Block) — Chi Tiết Cấu Hình Mới

Khối CTA trên Solution hỗ trợ đầy đủ các tính năng hiện đại nhất được nâng cấp từ Phase 11:

```json
{
  "type": "cta",
  "label": "Đăng ký tư vấn",
  "url": "/contact",
  "items": [
    { "id": "btn_1", "label": "Trải nghiệm Nền tảng", "url": "https://geneat.vn", "variant": "solid" },
    { "id": "btn_2", "label": "Liên hệ Chuyển giao", "url": "/contact", "variant": "outline" }
  ],
  "shape": "square",
  "layout": "flex",
  "align": "center",
  "gap": 8
}
```

| Thuộc tính | Giá trị hỗ trợ | Mô tả hành vi trên giao diện |
| :--- | :--- | :--- |
| **`items`** | Mảng 1 - 3 nút | Nếu có mảng `items`, duyệt hiển thị từng nút. Nếu không, fallback về `label` + `url` và `secondaryLabel` + `secondaryUrl`. |
| **`shape`** | `'square'` \| `'rounded'` | • `'square'`: Nút hình chữ nhật bo góc nhẹ (`rounded-md`, 6px) — **Khuyến nghị sử dụng** vì vẻ đẹp công nghệ sang trọng.<br>• `'rounded'`: Nút dạng viên thuốc (`rounded-full`, 9999px). |
| **`layout`** | `'flex'` \| `'space-between'` | • `'flex'`: Các nút đứng gần nhau theo khoảng cách `gap`.<br>• `'space-between'`: Nút 1 dạt sang lề trái, nút 2 dạt sang lề phải (chỉ áp dụng khi có 2 nút trên desktop, tự động stack dọc trên mobile). |
| **`align`** | `'left'` \| `'center'` \| `'right'` | Căn chỉnh vị trí của cụm nút trong khung nội dung (khi layout là `flex`). |
| **`gap`** | Số nguyên (px), mặc định `8` | Khoảng cách giữa các nút (ví dụ `gap: 8` $\rightarrow$ `gap-2`, `gap: 16` $\rightarrow$ `gap-4`). |
| **`variant`** | `'solid'` \| `'outline'` | • `'solid'`: Nền đỏ thương hiệu (`#ca2a30`), chữ trắng.<br>• `'outline'`: Nền trong suốt, viền đỏ đô (`border-[#ca2a30] text-[#ca2a30]`). |

---

### 5.3. Quy Tắc 8 Loại Khối Khác (Block Renderers)

1. **Heading Block (H1 - H6):**
   - Sử dụng đúng semantic tag (`<h2>`, `<h3>`, `<h4>`...).
   - Hỗ trợ tuỳ chỉnh `fontSize`, `lineHeight`, `color`, `textAlign`.
   - Áp dụng `spacing.marginTop` và `spacing.marginBottom`.
2. **Paragraph Block:**
   - Hỗ trợ định dạng văn bản nội dòng an toàn: `<b>`, `<i>`, `<strong>`, `<em>`, `<a>`.
   - Màu chữ chuẩn: `#334155` (Slate-700), `line-height: 1.75` (dễ đọc).
3. **Image & Caption Block:**
   - **Caption là thuộc tính của Image Block** (`block.caption`), không tồn tại Caption Block độc lập.
   - Caption hiển thị ngay dưới ảnh: chữ nghiêng, màu xám `#64748B`, font size `13px` (`text-xs` hoặc `text-sm`), căn giữa.
4. **List & Nested List Block:**
   - Hỗ trợ cả 2 dạng: Danh sách chấm tròn (`bullet` $\rightarrow$ `<ul>`) và Danh sách đánh số (`ordered` $\rightarrow$ `<ol>`).
   - Hỗ trợ thụt lề đa tầng (`children: ListItem[]`), tối đa 6 cấp (`MAX_LIST_DEPTH = 6`).
5. **Section Block:**
   - Khối phân đoạn bao gồm: Số thứ tự to bản (ví dụ `"01"`, `"02"`), Tiêu đề phân đoạn viết hoa (`uppercase font-bold`), và danh sách khối con bên trong (`children: ContentBlock[]`).
6. **Quote Block:**
   - Viền trái to bản màu đỏ đô (`border-l-4 border-[#ca2a30]`), nền xám nhạt (`bg-[#F8FAFC]`), trích dẫn in nghiêng, ghi rõ tên tác giả (`author`) và nguồn dẫn (`citation`).
7. **Highlight Block:**
   - Khối ghi chú thông tin quan trọng với viền trang nhã và icon bóng đèn/chú ý.

---

## 6. MÃ NGUỒN TÍCH HỢP MẪU TRÊN NEXT.JS APP ROUTER

### 6.1. TypeScript Definitions (`src/types/solution.ts`)

```typescript
// src/types/solution.ts

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'list'
  | 'quote'
  | 'highlight'
  | 'cta'
  | 'section';

export interface BaseBlock {
  id: string;
  type: BlockType;
  spacing?: {
    marginTop?: number;
    marginBottom?: number;
  };
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
  fileId?: string;
}

export interface ListItem {
  id: string;
  content: string;
  children?: ListItem[];
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  listType: 'bullet' | 'ordered';
  listStyle?: string;
  items: ListItem[];
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  author?: string;
  citation?: string;
}

export interface HighlightBlock extends BaseBlock {
  type: 'highlight';
  text: string;
  title?: string;
}

export interface CtaItem {
  id: string;
  label: string;
  url: string;
  variant?: 'solid' | 'outline';
}

export interface CtaBlock extends BaseBlock {
  type: 'cta';
  label?: string;
  url?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  items?: CtaItem[];
  shape?: 'square' | 'rounded';
  layout?: 'flex' | 'space-between';
  align?: 'left' | 'center' | 'right';
  gap?: number;
  variant?: 'solid' | 'outline';
}

export interface SectionBlock extends BaseBlock {
  type: 'section';
  number?: string;
  title: string;
  children?: ContentBlock[];
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

export interface DocumentContent {
  version: number;
  blocks: ContentBlock[];
  heroMeta?: {
    placement?: 'above_title' | 'between_title_desc' | 'below_desc';
    position?: 'left' | 'center' | 'right';
    caption?: string;
  };
}

export interface OperationFieldSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  publishedAt: string | null;
}

export interface SolutionDetail {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnail: string | null;
  thumbnailFileId: string | null;
  websiteUrl: string | null;
  field: OperationFieldSummary | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  content: DocumentContent;
  relatedArticles?: ArticleSummary[];
}
```

---

### 6.2. Service Truy Xuất API (`src/services/solution.service.ts`)

```typescript
// src/services/solution.service.ts
import { SolutionDetail } from '@/types/solution';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.vdcd.vn';

/**
 * Lấy chi tiết Giải pháp theo slug kèm revalidation 60 giây
 */
export async function getSolutionBySlug(slug: string): Promise<SolutionDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/solutions/${encodeURIComponent(slug)}`, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 60, // ISR: Tự động làm mới cache mỗi 60 giây
        tags: [`solution-${slug}`],
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch solution: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || json;
  } catch (error) {
    console.error('Error fetching solution by slug:', error);
    return null;
  }
}
```

---

### 6.3. Component Hero Header (`src/components/solution/SolutionHero.tsx`)

```tsx
// src/components/solution/SolutionHero.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, PhoneCall, ShieldCheck } from 'lucide-react';
import { SolutionDetail } from '@/types/solution';

interface SolutionHeroProps {
  solution: SolutionDetail;
}

export function SolutionHero({ solution }: SolutionHeroProps) {
  return (
    <header className="space-y-6 pt-4 pb-8 border-b border-slate-100">
      {/* 1. Breadcrumbs & Field Badge */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-[#ca2a30] transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/solutions" className="hover:text-[#ca2a30] transition-colors">
          Giải pháp & Sản phẩm
        </Link>
        {solution.field && (
          <>
            <span>/</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-[#ca2a30] border border-rose-100">
              {solution.field.name}
            </span>
          </>
        )}
      </div>

      {/* 2. Tiêu đề H1 chính */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#011A42] leading-tight uppercase tracking-tight">
        {solution.title}
      </h1>

      {/* 3. Mô tả ngắn (Short Description) */}
      {solution.shortDescription && (
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-4xl">
          {solution.shortDescription}
        </p>
      )}

      {/* 4. Action Buttons: Nút trải nghiệm Website URL & Nút tư vấn */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {solution.websiteUrl && (
          <a
            href={solution.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm bg-[#ca2a30] text-white hover:bg-[#a82227] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <span>Trải nghiệm Giải pháp</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <Link
          href={`/contact?solution=${encodeURIComponent(solution.slug)}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm bg-white text-[#011A42] border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]"
        >
          <PhoneCall className="w-4 h-4 text-[#ca2a30]" />
          <span>Đăng ký Tư vấn Chuyển giao</span>
        </Link>
      </div>

      {/* 5. Banner Thumbnail */}
      {solution.thumbnail && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md border border-slate-100 mt-6 bg-slate-100">
          <Image
            src={solution.thumbnail}
            alt={solution.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
      )}
    </header>
  );
}
```

---

### 6.4. Component Render Khối Nút Kêu Gọi (`CtaBlockRenderer.tsx`)

```tsx
// src/components/solution/blocks/CtaBlockRenderer.tsx
import { CtaBlock, CtaItem } from '@/types/solution';

export function CtaBlockRenderer({ block }: { block: CtaBlock }) {
  // Chuẩn hóa danh sách các nút (ưu tiên mảng items[])
  const buttons: CtaItem[] = block.items && block.items.length > 0
    ? block.items
    : [
        ...(block.label && block.url ? [{ id: 'b1', label: block.label, url: block.url, variant: block.variant || 'solid' }] : []),
        ...(block.secondaryLabel && block.secondaryUrl ? [{ id: 'b2', label: block.secondaryLabel, url: block.secondaryUrl, variant: 'outline' as const }] : []),
      ];

  if (buttons.length === 0) return null;

  const isSpaceBetween = block.layout === 'space-between' && buttons.length === 2;
  const isSquare = block.shape !== 'rounded';
  const shapeCls = isSquare ? 'rounded-md' : 'rounded-full';

  // Lớp căn lề Flex
  const alignCls =
    block.align === 'center'
      ? 'justify-center'
      : block.align === 'right'
        ? 'justify-end'
        : 'justify-start';

  const containerCls = isSpaceBetween
    ? 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full'
    : `flex flex-wrap items-center ${alignCls}`;

  return (
    <div
      className="my-6 w-full"
      style={{
        marginTop: block.spacing?.marginTop ? `${block.spacing.marginTop}px` : undefined,
        marginBottom: block.spacing?.marginBottom ? `${block.spacing.marginBottom}px` : undefined,
      }}
    >
      <div className={containerCls} style={{ gap: !isSpaceBetween ? `${block.gap ?? 8}px` : undefined }}>
        {buttons.map((btn) => {
          const isOutline = btn.variant === 'outline';
          const isExternal = btn.url.startsWith('http://') || btn.url.startsWith('https://');

          const btnCls = isOutline
            ? `inline-flex items-center justify-center px-6 py-2.5 font-bold text-sm border-2 border-[#ca2a30] text-[#ca2a30] hover:bg-[#ca2a30] hover:text-white transition-all ${shapeCls}`
            : `inline-flex items-center justify-center px-6 py-2.5 font-bold text-sm bg-[#ca2a30] text-white hover:bg-[#a82227] shadow-sm hover:shadow transition-all ${shapeCls}`;

          return (
            <a
              key={btn.id}
              href={btn.url}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className={btnCls}
            >
              {btn.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 6.5. Component Render Danh Sách Khối (`SolutionContentRenderer.tsx`)

```tsx
// src/components/solution/SolutionContentRenderer.tsx
import Image from 'next/image';
import { DocumentContent, ContentBlock, ListItem } from '@/types/solution';
import { CtaBlockRenderer } from './blocks/CtaBlockRenderer';

interface SolutionContentRendererProps {
  content: DocumentContent;
}

export function SolutionContentRenderer({ content }: SolutionContentRendererProps) {
  if (!content || !Array.isArray(content.blocks)) return null;

  return (
    <article className="prose prose-slate max-w-none py-6">
      {content.blocks.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </article>
  );
}

function BlockItem({ block }: { block: ContentBlock }) {
  const spacingStyle = {
    marginTop: block.spacing?.marginTop ? `${block.spacing.marginTop}px` : undefined,
    marginBottom: block.spacing?.marginBottom ? `${block.spacing.marginBottom}px` : undefined,
  };

  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
      return (
        <Tag
          id={block.id}
          className="font-bold text-[#011A42] tracking-tight scroll-mt-20"
          style={{
            ...spacingStyle,
            textAlign: block.textAlign || 'left',
            fontSize: block.fontSize || undefined,
          }}
        >
          {block.text}
        </Tag>
      );
    }

    case 'paragraph': {
      return (
        <p
          className="text-base sm:text-lg text-slate-700 leading-relaxed"
          style={spacingStyle}
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      );
    }

    case 'image': {
      return (
        <figure className="my-6 space-y-2 text-center" style={spacingStyle}>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
            <Image
              src={block.url}
              alt={block.alt || 'Hình ảnh minh họa giải pháp'}
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-contain"
            />
          </div>
          {block.caption && (
            <figcaption className="text-xs sm:text-sm text-slate-500 italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'list': {
      const isOrdered = block.listType === 'ordered';
      const ListTag = isOrdered ? 'ol' : 'ul';
      return (
        <ListTag
          className={`space-y-2 text-slate-700 leading-relaxed ${
            isOrdered ? 'list-decimal pl-6' : 'list-disc pl-6'
          }`}
          style={spacingStyle}
        >
          {block.items?.map((item) => (
            <RenderListItem key={item.id} item={item} isOrdered={isOrdered} />
          ))}
        </ListTag>
      );
    }

    case 'quote': {
      return (
        <blockquote
          className="border-l-4 border-[#ca2a30] bg-slate-50/80 p-5 rounded-r-xl my-6 not-italic"
          style={spacingStyle}
        >
          <p className="text-base sm:text-lg text-slate-800 italic font-medium">
            “{block.text}”
          </p>
          {(block.author || block.citation) && (
            <footer className="mt-2 text-xs sm:text-sm text-slate-500 font-semibold">
              — {block.author} {block.citation && <cite className="text-slate-400">({block.citation})</cite>}
            </footer>
          )}
        </blockquote>
      );
    }

    case 'highlight': {
      return (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 my-6 text-amber-900"
          style={spacingStyle}
        >
          {block.title && <h4 className="font-bold text-sm mb-1">{block.title}</h4>}
          <p className="text-sm leading-relaxed">{block.text}</p>
        </div>
      );
    }

    case 'cta': {
      return <CtaBlockRenderer block={block} />;
    }

    case 'section': {
      return (
        <section className="my-8 pt-4 border-t border-slate-100" style={spacingStyle}>
          <div className="flex items-center gap-3 mb-4">
            {block.number && (
              <span className="text-2xl sm:text-3xl font-black text-[#ca2a30]/80">
                {block.number}
              </span>
            )}
            <h3 className="text-xl font-bold text-[#011A42] uppercase tracking-wide">
              {block.title}
            </h3>
          </div>
          {block.children?.map((child) => (
            <BlockItem key={child.id} block={child} />
          ))}
        </section>
      );
    }

    default:
      return null;
  }
}

function RenderListItem({ item, isOrdered }: { item: ListItem; isOrdered: boolean }) {
  return (
    <li>
      <span dangerouslySetInnerHTML={{ __html: item.content }} />
      {item.children && item.children.length > 0 && (
        <ul className={`mt-2 space-y-1.5 ${isOrdered ? 'list-decimal pl-5' : 'list-circle pl-5'}`}>
          {item.children.map((sub) => (
            <RenderListItem key={sub.id} item={sub} isOrdered={isOrdered} />
          ))}
        </ul>
      )}
    </li>
  );
}
```

---

### 6.6. Component Bài Viết Liên Quan (`RelatedArticles.tsx`)

```tsx
// src/components/solution/RelatedArticles.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ArticleSummary } from '@/types/solution';

export function RelatedArticles({ articles }: { articles?: ArticleSummary[] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-slate-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#011A42] uppercase tracking-wide">
          Bài viết & Nghiên cứu ứng dụng liên quan
        </h3>
        <p className="text-sm text-slate-500">
          Các tin tức, case studies và kết quả triển khai thực tiễn liên kết với giải pháp này.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((art) => (
          <Link
            key={art.id}
            href={`/articles/${art.slug}`}
            className="group flex flex-col bg-white rounded-xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
              {art.thumbnail ? (
                <Image
                  src={art.thumbnail}
                  alt={art.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  VDCD News
                </div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <h4 className="text-sm font-semibold text-[#011A42] group-hover:text-[#ca2a30] transition-colors line-clamp-2">
                {art.title}
              </h4>
              {art.publishedAt && (
                <time className="text-xs text-slate-400 mt-2 block">
                  {new Date(art.publishedAt).toLocaleDateString('vi-VN')}
                </time>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

---

### 6.7. Next.js Route Page Hoàn Chỉnh (`app/(main)/solutions/[slug]/page.tsx`)

```tsx
// app/(main)/solutions/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSolutionBySlug } from '@/services/solution.service';
import { SolutionHero } from '@/components/solution/SolutionHero';
import { SolutionContentRenderer } from '@/components/solution/SolutionContentRenderer';
import { RelatedArticles } from '@/components/solution/RelatedArticles';

interface SolutionPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Tự động tạo Metadata & thẻ SEO OpenGraph
 */
export async function generateMetadata({ params }: SolutionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);

  if (!solution) {
    return {
      title: 'Không tìm thấy giải pháp | VDCD',
      description: 'Giải pháp không tồn tại hoặc đã bị gỡ bỏ.',
    };
  }

  const title = solution.metaTitle || `${solution.title} | Giải pháp số VDCD Gia Lai`;
  const description = solution.metaDescription || solution.shortDescription || 'Giải pháp chuyển đổi số từ VDCD.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://vdcd.vn/solutions/${solution.slug}`,
      images: solution.thumbnail ? [{ url: solution.thumbnail, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function SolutionDetailPage({ params }: SolutionPageProps) {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);

  if (!solution || !solution.isPublished) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Phần đầu trang (Hero Header + Website URL + Thumbnail) */}
        <SolutionHero solution={solution} />

        {/* 2. Thân bài viết với các khối nội dung chuẩn hoá */}
        <SolutionContentRenderer content={solution.content} />

        {/* 3. Bài viết tin tức / Case studies liên quan */}
        <RelatedArticles articles={solution.relatedArticles} />
      </div>
    </main>
  );
}
```

---

## 7. CHECKLIST KIỂM THỬ NGHIỆM THU (SYNC VALIDATION CHECKLIST)

Đội ngũ Frontend sử dụng checklist dưới đây để nghiệm thu giao diện Solution Detail:

- [ ] **SEO & Metadata:** Thẻ `<title>`, `<meta name="description">` và OpenGraph Image hiển thị chính xác theo `metaTitle`, `metaDescription` hoặc fallback thông minh.
- [ ] **Operation Field Badge:** Hiển thị đúng tên lĩnh vực chuyên môn (màu đỏ đô thương hiệu VDCD).
- [ ] **Nút Trải Nghiệm Giải Pháp (`websiteUrl`):**
  - [ ] Hiển thị nổi bật ở Hero Header nếu `websiteUrl` tồn tại.
  - [ ] Tự động ẩn nếu `websiteUrl` là `null` hoặc chuỗi rỗng.
  - [ ] Mở tab mới (`target="_blank" rel="noopener noreferrer"`).
- [ ] **Đồng bộ khối (Block Sync):**
  - [ ] Heading H1-H6 hiển thị đúng cấp độ ngữ nghĩa và căn lề.
  - [ ] Paragraph hiển thị văn bản mượt mà, hỗ trợ link/bold/italic.
  - [ ] Image hiển thị đúng tỉ lệ, có caption căn giữa bên dưới.
  - [ ] Danh sách (List) hiển thị đúng kiểu (bullet/ordered), thụt lề chuẩn khi có `children` đa tầng.
  - [ ] Quote có viền đỏ bên trái và thông tin tác giả/nguồn.
  - [ ] Highlight có nền màu nhẹ và viền nổi bật.
  - [ ] Section hiển thị số thứ tự (01, 02) và tiêu đề in hoa.
  - [ ] CTA Block: Nút vuông bo nhẹ (`square`), hỗ trợ 2 nút trên 1 hàng, bố cục `flex` hoặc `space-between` đáp ứng responsive tốt trên mobile.
- [ ] **Khoảng cách (Spacing Sync):** Các thuộc tính `spacing.marginTop` và `spacing.marginBottom` của từng khối được áp dụng chính xác.
- [ ] **Bài viết liên quan (`relatedArticles`):** Hiển thị lưới card bài viết kèm ảnh thumbnail, tiêu đề và ngày đăng.
- [ ] **Responsive:** Giao diện tối ưu trên cả 3 kích thước: Desktop ($\ge$ 1024px), Tablet (768px - 1023px), Mobile (< 768px).
