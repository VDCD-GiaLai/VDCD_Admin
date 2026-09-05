# TÀI LIỆU TÍCH HỢP FRONTEND — BỘ API, Ý TƯỞNG & QUY TẮC ĐỒNG BỘ GIAO DIỆN ARTICLE DETAIL

Tài liệu này hướng dẫn chi tiết cho đội ngũ phát triển **Frontend (`VDCD_gialai_frontend`)** về:
1. **Bối cảnh & Những thay đổi lớn (Major Architectural Shifts)** khi nâng cấp Article từ chuỗi HTML thô sang **Block Document Model**.
2. **Ý tưởng thiết kế & Trải nghiệm giao diện (Design Concepts & UI Experience)** nhằm thống nhất cấu trúc với Slide Detail Blog.
3. **Bộ API Endpoints công khai** để truy xuất bài viết chi tiết và dữ liệu liên quan.
4. **Cấu trúc dữ liệu JSON phản hồi (Data Contract)** trả về từ Backend.
5. **Quy tắc hiển thị chi tiết (UI Sync Specifications)** đảm bảo trang Article Detail trên Website công khai **đồng bộ 100% (Pixel-Perfect Sync)** với *Trình chỉnh sửa trực quan (Visual Editor)* trên Admin CMS.
6. **Mã nguồn tích hợp mẫu (Service, Component, Route Page)** trên Next.js App Router.
7. **Checklist kiểm thử nghiệm thu (Sync Validation Checklist)**.

---

## 1. BỐI CẢNH, NHỮNG THAY ĐỔI LỚN & Ý TƯỞNG THIẾT KẾ

### 1.1. Bối Cảnh & Những Thay Đổi Lớn (Major Shifts)

| Tiêu chí | Mô hình Cũ (Legacy HTML) | Mô hình Mới (Block Document Model) |
| :--- | :--- | :--- |
| **Cấu trúc dữ liệu `content`** | Chuỗi HTML thô (`TEXT`) sinh ra từ WYSIWYG editor | Cấu trúc JSON chuẩn hoá (`JSONB`) gồm mảng các Khối (`SlideDetailBlogBlock[]`) |
| **Độ tin cậy hiển thị** | Dễ vỡ layout, inline style lộn xộn, khó kiểm soát CSS xung đột | Đồng bộ 100% với Admin Preview, typography chuẩn hoá, responsive tuyệt đối |
| **Hero Image & Bố cục** | Ảnh đại diện cố định ở đầu bài viết, không tuỳ biến được | Hỗ trợ 3 chế độ sắp xếp (`above_title`, `between_title_desc`, `below_desc`), có Chú thích (`caption`) và Tiêu điểm ảnh (`objectPosition`) |
| **Khả năng tương tác Khối** | Toàn bộ bài viết là một cục HTML duy nhất | Từng khối độc lập: Heading, Paragraph, Image, List đa cấp, Quote, Highlight, Section phân đoạn, CTA button |
| **Kiểm soát lề & Khoảng cách** | Phụ thuộc vào `<br>` hoặc margin mặc định của trình duyệt | Tuỳ biến chính xác từng pixel qua `spacing: { marginTop, marginBottom }` |
| **Liên kết thực thể** | Phải tự chèn link thủ công trong bài | Hỗ trợ liên kết trực tiếp với **Project**, **Program**, **Solution** qua Foreign Keys |

### 1.2. Ý Tưởng Thiết Kế & Nguyên Tắc Cốt Lõi (Core Design Concepts)

1. **Một Nguồn Chân Lý Duy Nhất (Single Source of Truth):**
   Cả hệ thống **Slide Detail Blog** và **Article Detail** đều sử dụng chung một chuẩn cấu trúc tài liệu (`SlideDetailBlogContent` / `BlogDocument`). Admin biên tập như thế nào thì Frontend render ra chính xác như vậy.
2. **Tái Sử Dụng Kiến Trúc Component (Component Reusability):**
   Frontend không cần viết lại từ đầu bộ renderer cho Article. Toàn bộ logic hiển thị khối (`Heading`, `Paragraph`, `Image`, `List`, `Section`, `CTA`) có thể tái sử dụng trực tiếp từ bộ component của Slide Detail Blog (`BlogContentRenderer` hoặc `BlogDetailRenderer`), chỉ cần bọc thêm phần Header/Footer đặc thù của Article.
3. **Đặc Trưng Báo Chí / Tin Tức Của Article Detail:**
   Khác với Slide Detail Blog (vốn gắn chặt 1-1 với Slide trang chủ), Article Detail là bài viết chuyên sâu mang tính báo chí, tri thức và tin tức. Do đó, giao diện Article Detail được bổ sung các thành phần tiêu chuẩn:
   - **Breadcrumbs Navigation:** Điều hướng phân cấp (Trang chủ $\rightarrow$ Bài viết $\rightarrow$ Chuyên mục $\rightarrow$ Tiêu đề).
   - **Article Meta Bar:** Chuyên mục (Category Badge), Ngày đăng định dạng tiếng Việt (`publishedAt`), Thời gian đọc ước tính (Reading Time).
   - **Tags Cloud:** Danh sách từ khoá gắn liền với bài viết.
   - **Khối Liên Kết Thực Thể (Related Entity Cards):** Hiển thị card Dự án (`Project`), Chương trình (`Program`), Giải pháp (`Solution`) liên quan ở cuối bài.
   - **Thanh Chia Sẻ & Tương Tác (Social Sharing):** Chia sẻ Facebook, LinkedIn, Zalo, Sao chép liên kết.

---

## 2. TỔNG QUAN KIẾN TRÚC & DÒNG CHẢY DỮ LIỆU (DATA FLOW)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ADMIN CMS (Repo Admin)                          │
│  - Tab 1: Nội dung (Block Form Editor)                                 │
│  - Tab 2: Đọc bài (Read-Only Article View)                             │
│  - Tab 3: Trình chỉnh sửa trực quan (Visual Editor)                    │
│  - Quản lý Metadata: Subtitle, Excerpt, Thumbnail, Category, Tags...  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ POST / PATCH /api/v1/articles/:id
                                    │ Upload ảnh: POST /api/v1/upload/image/article
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           BACKEND NESTJS                               │
│  - Bảng DB: `article`                                                  │
│  - Cột `content` (JSONB) chứa { version: 1, heroMeta, blocks }         │
│  - Lưu trữ media trên ImageKit tại thư mục: /vdcd/articles/<slug>/     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ GET /api/v1/articles/:slug
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PUBLIC FRONTEND (Repo Frontend)                   │
│  Route: /articles/[slug] (hoặc /bai-viet/[slug])                       │
│  Component: ArticleDetailRenderer                                      │
│  ├── Breadcrumbs & Article Meta Header                                 │
│  ├── Hero Section (Ảnh bìa Thumbnail + Title + Subtitle + Excerpt)     │
│  ├── Block Stream Renderer (Đồng bộ 1:1 với Slide Detail Blog)         │
│  ├── Related Entities (Project / Program / Solution Cards)             │
│  └── Tags Cloud & Social Share Bar                                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. BỘ API ENDPOINTS DÀNH CHO FRONTEND

Backend cung cấp các API công khai (Public API — Không yêu cầu Token đăng nhập) để Website Frontend truy xuất:

### 3.1. 🔓 Lấy Chi Tiết Bài Viết Theo Slug
Dùng cho Server Component hoặc Page Router trên Frontend tại đường dẫn `/articles/[slug]` hoặc `/bai-viet/[slug]`.

* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/articles/:slug`
* **Path Parameter:**
  * `slug` (string): Slug duy nhất của bài viết (ví dụ: `chuyen-doi-so-nong-nghiep-gia-lai`).
* **Headers:**
  ```http
  Accept: application/json
  ```
* **Mã phản hồi (Status Codes):**
  * `200 OK`: Trả về toàn bộ dữ liệu chi tiết của bài viết.
  * `404 Not Found`: Không tìm thấy bài viết hoặc bài viết chưa được xuất bản (`isPublished: false`).

---

### 3.2. 🔓 Danh Sách Bài Viết Công Khai (Hỗ Trợ Phân Trang & Lọc)
Dùng cho trang danh sách tin tức `/articles` hoặc khối "Bài viết liên quan".

* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/articles`
* **Query Parameters:**
  * `page` (number, optional, mặc định `1`): Trang hiện tại.
  * `limit` (number, optional, mặc định `10`): Số lượng bài viết mỗi trang.
  * `category` (string, optional): Lọc theo chuyên mục.
  * `tag` (string, optional): Lọc theo thẻ tag.
  * `projectId` (UUID, optional): Lọc bài viết thuộc dự án cụ thể.
  * `programId` (UUID, optional): Lọc bài viết thuộc chương trình cụ thể.
  * `solutionId` (UUID, optional): Lọc bài viết thuộc giải pháp cụ thể.
* **Mã phản hồi (Status Codes):**
  * `200 OK`: Danh sách bài viết kèm metadata phân trang `{ items, meta: { totalItems, itemCount, itemsPerPage, totalPages, currentPage } }`.

---

## 4. CẤU TRÚC DỮ LIỆU JSON RESPONSE (DATA CONTRACT)

### 4.1. Cấu Trúc JSON Phản Hồi Mẫu (`Response 200` từ `/api/v1/articles/:slug`)

```json
{
  "statusCode": 200,
  "data": {
    "id": "e3a89c12-78d1-4bc9-9214-3a5b6c7d8e90",
    "title": "TRUNG TÂM ĐỔI MỚI SÁNG TẠO GIA LAI KÝ KẾT HỢP TÁC CHIẾN LƯỢC VỚI ĐẠI HỌC FPT",
    "subtitle": "Thúc đẩy đổi mới sáng tạo, chuyển đổi số và phát triển nguồn nhân lực chất lượng cao",
    "slug": "trung-tam-doi-moi-sang-tao-gia-lai-ky-ket-mou-fpt",
    "excerpt": "Lễ ký kết biên bản ghi nhớ hợp tác (MOU) mở ra nhiều cơ hội đào tạo nhân lực công nghệ thông tin, nghiên cứu khoa học và ứng dụng các giải pháp số thực tiễn tại tỉnh Gia Lai.",
    "thumbnail": "https://ik.imagekit.io/vdcd/articles/trung-tam-doi-moi-sang-tao-gia-lai-ky-ket-mou-fpt/le-ky-ket-mou_1725460000.webp",
    "thumbnailFileId": "file_mou_12345",
    "category": "Tin tức & Sự kiện",
    "tags": "chuyen-doi-so,fpt,hop-tac,doi-moi-sang-tao",
    "project": {
      "id": "11111111-aaaa-4111-a111-111111111101",
      "title": "Dự án Nông nghiệp Thông minh Gia Lai"
    },
    "program": {
      "id": "22222222-bbbb-4222-b222-222222222202",
      "title": "Chương trình Phát triển Nhân lực Số Tây Nguyên"
    },
    "solution": null,
    "metaTitle": "Trung tâm Đổi mới Sáng tạo Gia Lai ký kết MOU với ĐH FPT | VDCD",
    "metaDescription": "Lễ ký kết hợp tác giữa Trung tâm Đổi mới Sáng tạo Gia Lai và Đại học FPT nhằm đào tạo và chuyển giao giải pháp chuyển đổi số.",
    "isPublished": true,
    "publishedAt": "2026-09-04T08:30:00.000Z",
    "createdAt": "2026-09-04T07:00:00.000Z",
    "updatedAt": "2026-09-04T08:30:00.000Z",
    "content": {
      "version": 1,
      "heroMeta": {
        "placement": "below_desc",
        "position": "center",
        "caption": "Đại diện hai bên thực hiện nghi thức ký kết biên bản ghi nhớ hợp tác"
      },
      "blocks": [
        {
          "id": "blk_art_001",
          "type": "heading",
          "level": 2,
          "text": "MỞ RỘNG MẠNG LƯỚI ĐÀO TẠO VÀ CHUYỂN GIAO CÔNG NGHỆ",
          "spacing": {
            "marginTop": 32,
            "marginBottom": 16
          }
        },
        {
          "id": "blk_art_002",
          "type": "paragraph",
          "text": "Sáng ngày 04/09/2026, tại thành phố Pleiku, Trung tâm Đổi mới Sáng tạo Gia Lai (VDCD Innovation Center) đã chính thức ký kết Biên bản ghi nhớ hợp tác toàn diện với Trường Đại học FPT...",
          "spacing": {
            "marginTop": 0,
            "marginBottom": 24
          }
        },
        {
          "id": "blk_art_003",
          "type": "image",
          "url": "https://ik.imagekit.io/vdcd/articles/trung-tam-doi-moi-sang-tao-gia-lai-ky-ket-mou-fpt/toan-canh-hoi-nghi_1725460010.webp",
          "alt": "Toàn cảnh lễ ký kết MOU",
          "caption": "Toàn cảnh buổi làm việc và ký kết giữa lãnh đạo hai đơn vị",
          "spacing": {
            "marginTop": 24,
            "marginBottom": 24
          }
        },
        {
          "id": "blk_art_004",
          "type": "section",
          "number": "01",
          "title": "CÁC TRỌNG TÂM HỢP TÁC CHIẾN LƯỢC",
          "spacing": {
            "marginTop": 48,
            "marginBottom": 32
          },
          "children": [
            {
              "id": "blk_art_005",
              "type": "list",
              "items": [
                "Đào tạo thực chiến kỹ năng phân tích dữ liệu và AI cho sinh viên Gia Lai.",
                "Thí điểm đưa các mô hình GIS & UAV vào các đề tài nghiên cứu cấp tỉnh.",
                "Tạo điều kiện để doanh nghiệp địa phương tiếp cận hệ sinh thái chuyên gia công nghệ."
              ]
            }
          ]
        },
        {
          "id": "blk_art_006",
          "type": "cta",
          "label": "Đăng ký nhận thông tin chương trình đào tạo",
          "url": "https://vdcd.vn/contact",
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

### 4.2. Bảng Đối Chiếu Trường Dữ Liệu: Slide Detail Blog vs Article Detail

| Trường trong API | Slide Detail Blog | Article Detail | Chức năng trên Giao diện |
| :--- | :--- | :--- | :--- |
| **Ảnh đại diện** | `heroImageUrl` | `thumbnail` | Render ảnh bìa bài viết / Hero image |
| **File ID ảnh** | `heroImageFileId` | `thumbnailFileId` | Quản lý vòng đời file trên ImageKit |
| **Tiêu đề** | `title` | `title` | Thẻ `<h1>` chính của bài viết |
| **Phụ đề** | `subtitle` | `subtitle` | Thẻ phụ đề in hoa màu thương hiệu `#ca2a30` |
| **Tóm tắt ngắn** | `excerpt` | `excerpt` | Đoạn lead dẫn nhập chữ to xám đậm `#6C7E96` |
| **Thực thể liên kết** | Gắn với `slideId` | `project`, `program`, `solution` | Render thẻ bài viết liên quan (Related Cards) |
| **Phân loại** | Không có | `category`, `tags` | Chuyên mục, mảng thẻ từ khoá lọc bài viết |
| **Thời gian xuất bản** | `createdAt` | `publishedAt` | Ngày công bố chính thức định dạng tiếng Việt |
| **Cấu trúc nội dung** | `content` (JSON) | `content` (JSON) | **Hoàn toàn đồng nhất (100% Identical schema)** |

---

## 5. QUY TẮC ĐỒNG BỘ GIAO DIỆN 1:1 VỚI ADMIN VISUAL EDITOR

Để đảm bảo trang chi tiết bài viết trên Website hiển thị **tuyệt đối đồng bộ với bản xem trước (Tab Đọc bài & Tab Visual Editor)** trên Admin CMS, Frontend phải tuân thủ nghiêm ngặt các quy tắc sau:

### 5.1. Quy Tắc Bố Cục Hero Article (`content.heroMeta.placement`)

Khối Hero Article bao gồm:
1. **Article Meta Header:** Chuyên mục (Category Badge), Ngày đăng (`publishedAt`), Thời gian đọc ước tính.
2. **Tiêu đề & Phụ đề (`renderHeroHeader`):** `subtitle` + `title`.
3. **Đoạn mô tả dẫn nhập (`renderHeroExcerpt`):** `excerpt`.
4. **Ảnh đại diện Hero (`renderHeroMedia`):** `thumbnail` + `content.heroMeta.caption`.

Tuỳ vào cấu hình `content.heroMeta.placement`, các thành phần được sắp xếp tuần tự:

```
Chế độ 1: "above_title" (Mặc định)
┌──────────────────────────────────────┐
│ 1. [Ảnh bìa Thumbnail]              │
│    [Chú thích ảnh bìa]               │
├──────────────────────────────────────┤
│ 2. Category Badge • Ngày đăng        │
│    SUBTITLE                          │
│    TIÊU ĐỀ BÀI VIẾT                  │
├──────────────────────────────────────┤
│ 3. Đoạn mô tả dẫn nhập (Excerpt)     │
└──────────────────────────────────────┘

Chế độ 2: "between_title_desc"
┌──────────────────────────────────────┐
│ 1. Category Badge • Ngày đăng        │
│    SUBTITLE                          │
│    TIÊU ĐỀ BÀI VIẾT                  │
├──────────────────────────────────────┤
│ 2. [Ảnh bìa Thumbnail]              │
│    [Chú thích ảnh bìa]               │
├──────────────────────────────────────┤
│ 3. Đoạn mô tả dẫn nhập (Excerpt)     │
└──────────────────────────────────────┘

Chế độ 3: "below_desc" (Phong cách Tạp chí hiện đại)
┌──────────────────────────────────────┐
│ 1. Category Badge • Ngày đăng        │
│    SUBTITLE                          │
│    TIÊU ĐỀ BÀI VIẾT                  │
├──────────────────────────────────────┤
│ 2. Đoạn mô tả dẫn nhập (Excerpt)     │
├──────────────────────────────────────┤
│ 3. [Ảnh bìa Thumbnail]              │
│    [Chú thích ảnh bìa]               │
└──────────────────────────────────────┘
```

#### Quy tắc hiển thị Chú thích Ảnh bìa:
* **Chỉ render khi có ảnh:** Nếu `!thumbnail` thì không render thẻ `<img>` và không render chú thích.
* **Vị trí Chú thích:** Luôn nằm ngay dưới ảnh bìa, render bằng `<figcaption className="text-center text-xs sm:text-sm italic text-[#6C7E96] mt-2.5">`.
* **Tiêu điểm ảnh (`objectPosition`):** Gán style `style={{ objectPosition: heroMeta?.position ?? "center" }}`.

---

### 5.2. Quy Tắc Khoảng Cách Lề Khối Nội Dung (`BlockSpacing`)

Khi biên tập viên tinh chỉnh khoảng cách trong Admin Visual Editor:
* Giá trị `marginTop` / `marginBottom` được lưu dưới dạng số nguyên (pixel): `0, 8, 16, 24, 32, 48, 64, 80, 96`.
* **Cách code chuẩn:**
  ```tsx
  const spacingStyle: React.CSSProperties = {
    marginTop: typeof block.spacing?.marginTop === "number" 
      ? `${block.spacing.marginTop}px` 
      : undefined,
    marginBottom: typeof block.spacing?.marginBottom === "number" 
      ? `${block.spacing.marginBottom}px` 
      : undefined,
  };
  ```
* ⚠️ **Lưu ý đặc biệt:** Giá trị `0` biểu thị khoảng cách dính sát 0px (`marginTop: 0px`). Bắt buộc dùng `typeof ... === "number"` thay vì kiểm tra truthy `if (block.spacing?.marginTop)` (vì `0` trong JS là falsy!).

---

### 5.3. Quy Tắc Hiển Thị Các Khối Nội Dung Cụ Thể

1. **Khối Tiêu đề (`HeadingBlock`):**
   - Hỗ trợ cấp độ từ H1 đến H6 (`level: 1..6`).
   - Cấp 2 (H2): Chữ hoa/chữ đậm, viền dưới nhẹ `border-b border-[#E2E8EE] pb-2 text-[#011A42]`.
   - Cấp 3 (H3): Phụ đề phân đoạn nhỏ, màu `#011A42`.
2. **Khối Đoạn văn (`ParagraphBlock`):**
   - Font chữ dễ đọc, màu `#2D3748`, `line-height: 1.75` (leading-relaxed).
   - Render HTML an toàn qua `dangerouslySetInnerHTML` để bảo lưu các thẻ in đậm (`<strong>`), in nghiêng (`<em>`), liên kết (`<a>`).
3. **Khối Hình ảnh (`ImageBlock`):**
   - Khung thẻ `<figure>` với ảnh bo góc `rounded-xl`.
   - Chú thích `<figcaption>` căn giữa, in nghiêng, màu `#6C7E96` (chỉ hiển thị khi `caption` có dữ liệu).
4. **Khối Danh sách (`ListBlock`):**
   - Hỗ trợ 3 dạng: `bullet` (chấm tròn), `ordered` (số thứ tự), `checklist` (danh sách có checkbox).
   - Hỗ trợ cây đệ quy đa cấp (`children: ListItem[]`) kèm khoảng cách thụt lề chuẩn.
5. **Khối Trích dẫn (`QuoteBlock`):**
   - Viền đỏ thương hiệu bên trái `border-l-4 border-[#ca2a30]`, nền xám ấm nhạt `bg-[#F9F7FC]`, chữ in nghiêng màu `#011A42`.
6. **Khối Điểm nhấn (`HighlightBlock`):**
   - Hộp thông báo bo góc `rounded-xl bg-[#FFF5F5] border border-[#FED7D7] p-5`.
7. **Khối Phân đoạn (`SectionBlock`):**
   - Huy hiệu số phân đoạn (`number` ví dụ `01`, `02`) nền đỏ `#ca2a30`, chữ trắng.
   - Tiêu đề chữ hoa `#011A42`.
   - Khung viền nhẹ `border border-[#E2E8EE] bg-[#F9F7FC]/60 rounded-xl p-6`.
   - Render đệ quy các khối con (`children`) bên trong.
8. **Khối Nút kêu gọi hành động (`CtaBlock`):**
   - Nút đỏ thương hiệu `bg-[#ca2a30]` hover `bg-[#b02227]`, chữ trắng, bo góc `rounded-lg`, mở liên kết tab mới.

---

### 5.4. Quy Tắc Hiển Thị Các Thành Phần Đặc Thù Của Article

1. **Breadcrumbs:**
   ```tsx
   Trang chủ > Tin tức > [Tên Chuyên Mục] > [Tiêu đề bài viết thu gọn]
   ```
2. **Metadata Bar:**
   - Huy hiệu chuyên mục: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ca2a30]/10 text-[#ca2a30]`.
   - Ngày công bố: Định dạng tiếng Việt thân thiện qua `date-fns` hoặc `Intl.DateTimeFormat` (ví dụ: `04 Tháng 9, 2026`).
   - Thời gian đọc: Tính toán tự động theo công thức: $\text{Số phút} = \max(1, \lceil\text{tổng số từ} / 200\rceil)$.
3. **Thực thể liên quan (Related Entities):**
   - Nếu bài viết có liên kết `project`, `program`, hoặc `solution`, hiển thị dạng Card ở cuối bài với biểu tượng và liên kết điều hướng trực tiếp sang trang chi tiết tương ứng.
4. **Tags Cloud:**
   - Tách chuỗi `tags` (ngăn cách bởi dấu phẩy) thành các pill: `#chuyen-doi-so`, `#fpt`, `#nong-nghiep`.

---

## 6. MÃ NGUỒN TÍCH HỢP MẪU CHO REPO FRONTEND

### 6.1. File Service: `src/services/article.service.ts`

```typescript
import { apiClient } from "@/lib/api-client";
import type { Article } from "@/types/article";

/**
 * Lấy chi tiết bài viết công khai theo Slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const res = await apiClient.get<{ statusCode: number; data: Article }>(
      `/api/v1/articles/${slug}`,
      {
        next: { tags: [`article-${slug}`], revalidate: 60 }, // ISR Cache 60s
      }
    );
    return res.data?.data ?? null;
  } catch (error) {
    console.error(`[ArticleService] Lỗi khi tải bài viết slug "${slug}":`, error);
    return null;
  }
}

/**
 * Lấy danh sách bài viết theo chuyên mục hoặc liên kết
 */
export async function getArticles(params?: {
  page?: number;
  limit?: number;
  category?: string;
  projectId?: string;
  programId?: string;
  solutionId?: string;
}) {
  try {
    const res = await apiClient.get("/api/v1/articles", { params });
    return res.data?.data ?? { items: [], meta: null };
  } catch (error) {
    console.error("[ArticleService] Lỗi khi tải danh sách bài viết:", error);
    return { items: [], meta: null };
  }
}
```

---

### 6.2. File Renderer: `src/components/article/ArticleDetailRenderer.tsx`

```tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Article } from "@/types/article";
import type { SlideDetailBlogBlock } from "@/types/slide-detail-blog";

interface ArticleDetailRendererProps {
  article: Article;
}

export function ArticleDetailRenderer({ article }: ArticleDetailRendererProps) {
  const {
    title,
    subtitle,
    excerpt,
    thumbnail,
    category,
    tags,
    project,
    program,
    solution,
    publishedAt,
    content,
  } = article;

  // Chuẩn hoá content sang object nếu Backend trả về string JSON
  const parsedContent = useMemo(() => {
    if (!content) return { version: 1, heroMeta: null, blocks: [] };
    if (typeof content === "string") {
      try {
        return JSON.parse(content);
      } catch {
        return { version: 1, heroMeta: null, blocks: [] };
      }
    }
    return content;
  }, [content]);

  const heroMeta = parsedContent?.heroMeta;
  const heroPlacement = heroMeta?.placement ?? "above_title";
  const heroPosition = heroMeta?.position ?? "center";
  const heroCaption = heroMeta?.caption ?? "";
  const blocks: SlideDetailBlogBlock[] = parsedContent?.blocks ?? [];

  // ── Tính toán ngày đăng & Thời gian đọc ──
  const formattedDate = useMemo(() => {
    if (!publishedAt) return null;
    try {
      return format(new Date(publishedAt), "dd 'Tháng' MM, yyyy", { locale: vi });
    } catch {
      return null;
    }
  }, [publishedAt]);

  const readingTime = useMemo(() => {
    const allText = blocks.map((b) => ("text" in b ? b.text : "")).join(" ");
    const words = (allText + " " + title + " " + (excerpt || "")).trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [blocks, title, excerpt]);

  const tagList = useMemo(() => {
    if (!tags) return [];
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tags]);

  // ── 1. Hero Subcomponents ──
  const renderMetaHeader = () => (
    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#6C7E96] mb-3">
      {category && (
        <span className="inline-flex items-center rounded-full bg-[#ca2a30]/10 px-3 py-1 font-semibold text-[#ca2a30]">
          {category}
        </span>
      )}
      {formattedDate && <span>{formattedDate}</span>}
      <span>•</span>
      <span>{readingTime} phút đọc</span>
    </div>
  );

  const renderHeroHeader = () => (
    <div className="space-y-2 mb-4">
      {subtitle && (
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ca2a30]">
          {subtitle}
        </p>
      )}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight text-[#011A42]">
        {title}
      </h1>
    </div>
  );

  const renderHeroExcerpt = () => (
    excerpt ? (
      <p className="text-base sm:text-lg leading-relaxed text-[#4A5568] font-normal my-4 border-l-2 border-[#E2E8EE] pl-4 italic">
        {excerpt}
      </p>
    ) : null
  );

  const renderHeroMedia = () => (
    thumbnail ? (
      <figure className="my-6 overflow-hidden rounded-2xl shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={title || "Ảnh bài viết"}
          className="w-full max-h-[480px] object-cover transition-all"
          style={{ objectPosition: heroPosition }}
          loading="eager"
        />
        {heroCaption && (
          <figcaption className="mt-3 text-center text-xs sm:text-sm italic text-[#6C7E96]">
            {heroCaption}
          </figcaption>
        )}
      </figure>
    ) : null
  );

  // ── 2. Block Dispatcher (Tái sử dụng chuẩn Slide Detail Blog) ──
  const renderBlock = (block: SlideDetailBlogBlock) => {
    const spacingStyle: React.CSSProperties = {
      marginTop:
        typeof block.spacing?.marginTop === "number"
          ? `${block.spacing.marginTop}px`
          : undefined,
      marginBottom:
        typeof block.spacing?.marginBottom === "number"
          ? `${block.spacing.marginBottom}px`
          : undefined,
    };

    return (
      <div key={block.id} style={spacingStyle} className="w-full">
        {(() => {
          switch (block.type) {
            case "heading":
              return block.level === 2 ? (
                <h2 className="text-xl sm:text-2xl font-bold text-[#011A42] pb-2 border-b border-[#E2E8EE] mt-8 mb-4">
                  {block.text}
                </h2>
              ) : (
                <h3 className="text-lg sm:text-xl font-semibold text-[#011A42] mt-6 mb-3">
                  {block.text}
                </h3>
              );

            case "paragraph":
              return (
                <p
                  className="text-base leading-relaxed text-[#2D3748] font-normal mb-4 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: block.text }}
                />
              );

            case "image":
              return block.url ? (
                <figure className="my-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={block.url}
                    alt={block.alt || "Hình ảnh minh hoạ"}
                    className="w-full rounded-xl object-cover shadow-xs"
                    loading="lazy"
                  />
                  {block.caption && (
                    <figcaption className="mt-2.5 text-center text-xs sm:text-sm italic text-[#6C7E96]">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              ) : null;

            case "list":
              return (
                <ul className="list-disc list-inside space-y-2 my-4 pl-2 text-base leading-relaxed text-[#2D3748]">
                  {block.items.map((item, idx) => (
                    <li key={typeof item === "object" ? item.id : idx}>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: typeof item === "object" ? item.content : item,
                        }}
                      />
                    </li>
                  ))}
                </ul>
              );

            case "section":
              return (
                <section className="my-8 rounded-xl border border-[#E2E8EE] bg-[#F9F7FC]/60 p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ca2a30] text-xs font-bold text-white shadow-xs">
                      {block.number}
                    </span>
                    <h3 className="text-lg font-bold text-[#011A42]">{block.title}</h3>
                  </div>
                  <div className="space-y-4">
                    {block.children.map((child) => renderBlock(child))}
                  </div>
                </section>
              );

            case "cta":
              return (
                <div className="my-8 text-center">
                  <a
                    href={block.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-[#ca2a30] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#b02227] hover:shadow-md"
                  >
                    {block.label}
                  </a>
                </div>
              );

            default:
              return null;
          }
        })()}
      </div>
    );
  };

  // ── 3. Page Assembly ──
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs Điều Hướng */}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs sm:text-sm text-[#6C7E96]">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-[#011A42] transition-colors">
              Trang chủ
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/articles" className="hover:text-[#011A42] transition-colors">
              Tin tức
            </Link>
          </li>
          {category && (
            <>
              <li>/</li>
              <li className="text-[#011A42] font-medium">{category}</li>
            </>
          )}
        </ol>
      </nav>

      {/* Hero Layout Phối Hợp */}
      {heroPlacement === "above_title" && (
        <>
          {renderHeroMedia()}
          {renderMetaHeader()}
          {renderHeroHeader()}
          {renderHeroExcerpt()}
        </>
      )}

      {heroPlacement === "between_title_desc" && (
        <>
          {renderMetaHeader()}
          {renderHeroHeader()}
          {renderHeroMedia()}
          {renderHeroExcerpt()}
        </>
      )}

      {heroPlacement === "below_desc" && (
        <>
          {renderMetaHeader()}
          {renderHeroHeader()}
          {renderHeroExcerpt()}
          {renderHeroMedia()}
        </>
      )}

      {/* Dòng Chảy Khối Nội Dung (Block Stream) */}
      <div className="mt-8 space-y-6">
        {blocks.map((block) => renderBlock(block))}
      </div>

      {/* Khối Thực Thể Liên Quan (Related Project / Program / Solution) */}
      {(project || program || solution) && (
        <section className="mt-12 pt-8 border-t border-[#E2E8EE]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C7E96] mb-4">
            Nội dung liên quan
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project && (
              <Link
                href={`/projects/${project.id}`}
                className="group p-4 rounded-xl border border-[#E2E8EE] hover:border-[#ca2a30] transition-all bg-white hover:shadow-sm"
              >
                <span className="text-[11px] font-semibold text-[#ca2a30] uppercase">Dự án</span>
                <p className="mt-1 text-sm font-bold text-[#011A42] group-hover:text-[#ca2a30] transition-colors line-clamp-2">
                  {project.title}
                </p>
              </Link>
            )}
            {program && (
              <Link
                href={`/programs/${program.id}`}
                className="group p-4 rounded-xl border border-[#E2E8EE] hover:border-[#ca2a30] transition-all bg-white hover:shadow-sm"
              >
                <span className="text-[11px] font-semibold text-[#ca2a30] uppercase">Chương trình</span>
                <p className="mt-1 text-sm font-bold text-[#011A42] group-hover:text-[#ca2a30] transition-colors line-clamp-2">
                  {program.title}
                </p>
              </Link>
            )}
            {solution && (
              <Link
                href={`/solutions/${solution.id}`}
                className="group p-4 rounded-xl border border-[#E2E8EE] hover:border-[#ca2a30] transition-all bg-white hover:shadow-sm"
              >
                <span className="text-[11px] font-semibold text-[#ca2a30] uppercase">Giải pháp</span>
                <p className="mt-1 text-sm font-bold text-[#011A42] group-hover:text-[#ca2a30] transition-colors line-clamp-2">
                  {solution.title}
                </p>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Thẻ Tag (Tags Cloud) */}
      {tagList.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[#E2E8EE] flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#6C7E96]">Thẻ:</span>
          {tagList.map((tag) => (
            <Link
              key={tag}
              href={`/articles?tag=${encodeURIComponent(tag)}`}
              className="inline-flex items-center px-3 py-1 rounded-lg text-xs bg-[#F1F4F9] text-[#4A5568] hover:bg-[#E2E8EE] hover:text-[#011A42] transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
```

---

### 6.3. File Page Route: `src/app/articles/[slug]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug } from "@/services/article.service";
import { ArticleDetailRenderer } from "@/components/article/ArticleDetailRenderer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ─── Tự Động Sinh SEO Metadata Chuẩn Schema ────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || !article.isPublished) {
    return { title: "Không tìm thấy bài viết | VDCD Group" };
  }

  const pageTitle = article.metaTitle || `${article.title} | VDCD Group`;
  const pageDescription = article.metaDescription || article.excerpt || undefined;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      type: "article",
      publishedTime: article.publishedAt || undefined,
      images: article.thumbnail ? [article.thumbnail] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: article.thumbnail ? [article.thumbnail] : [],
    },
  };
}

// ─── Server Component Render Trang Bài Viết ─────────────────
export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  // Nếu bài viết không tồn tại hoặc chưa xuất bản -> trả về trang 404
  if (!article || !article.isPublished) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <ArticleDetailRenderer article={article} />
    </main>
  );
}
```

---

## 7. CHECKLIST KIỂM THỬ ĐỒNG BỘ (SYNC VALIDATION CHECKLIST)

Khi triển khai trên Website Frontend, kiểm tra các tiêu chí sau đối chiếu với Tab Visual Editor / Đọc bài trên Admin CMS:

| STT | Tiêu chí kiểm tra | Kết quả mong đợi |
| :---: | :--- | :--- |
| **1** | **Bố cục Hero `"above_title"`** | Thumbnail $\rightarrow$ Category/Date $\rightarrow$ Subtitle/Title $\rightarrow$ Excerpt |
| **2** | **Bố cục Hero `"between_title_desc"`** | Category/Date $\rightarrow$ Subtitle/Title $\rightarrow$ Thumbnail $\rightarrow$ Excerpt |
| **3** | **Bố cục Hero `"below_desc"`** | Category/Date $\rightarrow$ Subtitle/Title $\rightarrow$ Excerpt $\rightarrow$ Thumbnail |
| **4** | **Chú thích ảnh Thumbnail (`caption`)** | Nằm ngay dưới ảnh bìa, in nghiêng, căn giữa, chỉ hiện khi có dữ liệu |
| **5** | **Tiêu điểm ảnh Thumbnail (`position`)** | Áp dụng đúng `object-position: top / center / bottom` theo cấu hình Admin |
| **6** | **Khoảng cách lề `0px`** | Khối dính sát vào khối kề cạnh đúng 0px, không bị hở khoảng cách mặc định |
| **7** | **Khối Section (`01`, `02`)** | Hiển thị huy hiệu số nền đỏ `#ca2a30`, viền khung nhạt, hiển thị đầy đủ các khối con |
| **8** | **Khối Danh sách đa cấp (`list`)** | Hiển thị chuẩn ký hiệu thụt lề, render đúng nội dung HTML con |
| **9** | **Thực thể liên quan (Related Cards)** | Hiển thị card Dự án, Chương trình, Giải pháp nếu có liên kết trong DB |
| **10** | **Chuyên mục & Thẻ Tags** | Hiển thị badge Chuyên mục, mảng Tags tách dấu phẩy có link lọc bài viết |
| **11** | **SEO Metadata tự động** | Thẻ meta `og:title`, `og:description`, `og:image` tự sinh chính xác |
| **12** | **Trạng thái xuất bản (`isPublished`)** | Bài viết ở trạng thái nháp (`isPublished: false`) phải trả về trang 404 Not Found |
