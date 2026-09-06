# BÁO CÁO AUDIT TOÀN DIỆN KIẾN TRÚC PROJECT & SLIDE DETAIL BLOG
## Phase 01: Audit Toàn Bộ Implementation Hiện Tại (Backend + Admin)

> **Mục tiêu**: Phân tích chi tiết hiện trạng kỹ thuật, đối chiếu kiến trúc giữa **Slide Detail Blog** và **Project**, làm rõ khả năng tái sử dụng khối soạn thảo (Shared Editor), lập bản đồ luồng tải ảnh/ImageKit và nhận diện các rủi ro di chuyển dữ liệu (Migration Risks).  
> **Nguyên tắc thực hiện**: Tuyệt đối **không thay đổi mã nguồn** trong Phase này.

---

## 1. TỔNG QUAN HIỆN TRẠNG KIẾN TRÚC (HIGH-LEVEL OVERVIEW)

| Tiêu chí | Slide Detail Blog | Project (Dự án) | Solution / Program (Twin Reference) |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | NestJS + TypeORM + PostgreSQL | NestJS + TypeORM + PostgreSQL | NestJS + TypeORM + PostgreSQL |
| **Mô hình nội dung** | **Block Document Model (`JSONB`)** v1 | **Text / HTML thô (Tiptap format)** | **Block Document Model (`JSONB`)** v1 |
| **Cột lưu nội dung** | `content` (`jsonb`) | `overview` (`text`), `challenge` (`text`) | `content` (`jsonb`) + `content_html_backup` (`text`) |
| **Quản lý xuất bản** | `is_published` (`bool`), `published_at` (`timestamp`) | `is_published` (`bool`) — **Thiếu `published_at`** | `is_published` (`bool`), `published_at` (`timestamp`) |
| **Admin Trình soạn thảo** | 3 Tab: Form + Block Editor, Reader, Visual Editor | 1 Form đơn điệu + Tiptap `RichTextEditor` | 4 Tab: Thông tin, Khối nội dung, Đọc bài, Trực quan |
| **Nguồn Component FE** | `src/features/slide-detail-blogs/components/` | `src/components/shared/RichTextEditor` | `@/shared/content-editor` (Shared Package) |
| **API Admin xem theo ID** | Có: `GET /admin/:id` | **Không có** (FE dùng tạm `limit: 100` tìm trong bộ nhớ) | Có: `GET /admin/:id` |
| **Cơ chế tải ảnh ImageKit** | Subfolder `/slides/<subfolder>` | Thư mục phẳng `/projects` | Subfolder `/solutions/<key>`, `/programs/<slug>` |
| **Dọn dẹp ảnh mồ côi (Orphan)**| Toàn diện (Hero + Toàn bộ block ảnh) | **Không hoàn chỉnh** (Chỉ xóa thumb + gallery) | Toàn diện (Thumb + Toàn bộ block ảnh) |

---

## 2. CHI TIẾT KIẾN TRÚC PROJECT HIỆN TẠI (CURRENT PROJECT ARCHITECTURE)

### 2.1. Backend Implementation (`Backend/src/modules/project/`)
* **ORM & Database**: Sử dụng **TypeORM** với cơ sở dữ liệu PostgreSQL (Lưu ý: Không dùng Prisma).
* **Entity `Project`** (`src/modules/project/entities/project.entity.ts`):
  * **Thông tin cơ bản**:
    * `id` (`UUID`, Primary Key)
    * `title` (`varchar(255)`)
    * `slug` (`varchar(255)`, Unique)
    * `overview` (`text`, nullable) — Chứa mã HTML thô từ trình soạn thảo Tiptap
    * `thumbnail` (`varchar`, nullable), `thumbnailFileId` (`varchar`, nullable)
    * `field` (ManyToOne liên kết `OperationField`, onDelete: SET NULL)
    * `province` (ManyToOne liên kết `Province`, onDelete: SET NULL)
    * `year` (`int`, nullable)
  * **Các trường chi tiết bổ sung** (thêm qua migration `1785671319054-add-project-detail-fields.ts`):
    * `challenge` (`text`, nullable) — Mô tả thách thức dự án (chứa mã HTML thô)
    * `challengeImage` (`varchar`), `challengeImageFileId` (`varchar`)
    * `services` (`simple-array`, nullable) — Mảng chuỗi phân tách bằng dấu phẩy
    * `discipline` (`varchar`, nullable) — Lĩnh vực chuyên môn
    * `transformationBefore` (`varchar`), `transformationBeforeFileId` (`varchar`) — Ảnh hiện trạng trước chuyển đổi số
    * `transformationAfter` (`varchar`), `transformationAfterFileId` (`varchar`) — Ảnh kết quả sau chuyển đổi số
    * `technicalHighlights` (`jsonb`, nullable) — Mảng thông số kỹ thuật dạng key-value `[{ label, value }]`
    * `nextProjectSlug` (`varchar`, nullable) — Điều hướng bài viết kế tiếp
  * **SEO & Xuất bản**:
    * `metaTitle` (`varchar(255)`), `metaDescription` (`varchar(255)`)
    * `isPublished` (`boolean`, default `false`)
    * `createdAt`, `updatedAt`
    * ⚠️ **Khuyết thiếu**: Không có cột `published_at` (`timestamp`) trong Entity và Database.
  * **Quan hệ Gallery**:
    * `images`: OneToMany đến entity `ProjectImage` (cascade: true, onDelete: CASCADE).
* **Entity `ProjectImage`** (`src/modules/project/entities/project-image.entity.ts`):
  * `id` (`UUID`, PK), `project_id` (FK to `Project`), `url` (`string`), `caption` (`string`, nullable), `order` (`int`, default 0), `size` (`varchar`, default `'small'`), `fileId` (`varchar`, nullable).
* **Controller & Routing** (`src/modules/project/project.controller.ts`):
  * `GET /projects`: `@Public()`, trả về danh sách dự án đã xuất bản (`isPublished = true`).
  * `GET /projects/all`: `@Roles('superadmin', 'editor')`, danh sách toàn bộ dự án có phân trang & lọc.
  * `GET /projects/:slug`: `@Public()`, lấy chi tiết dự án theo slug kèm 5 bài viết liên quan và 3 dự án liên quan.
  * `POST /projects`: Tạo mới dự án.
  * `PATCH /projects/:id`: Cập nhật thông tin.
  * `PATCH /projects/:id/publish`: Bật/tắt trạng thái xuất bản (`isPublished`).
  * `DELETE /projects/:id`: `@Roles('superadmin')`, xóa dự án.
  * `POST /projects/:id/images`: Upload hàng loạt tối đa 20 file ảnh vào thư viện gallery.
  * `PATCH /projects/:id/images/reorder`: Đổi vị trí hiển thị ảnh gallery.
  * `DELETE /projects/:id/images/:imageId`: Xóa 1 ảnh gallery.
* **Service** (`src/modules/project/project.service.ts`):
  * **Tạo slug tự động**: Dùng `slugify(title, { lower: true, locale: 'vi' })` + fallback `-${Date.now()}` nếu trùng lặp.
  * **Xác nhận Upload (`confirmUpload`)**: Khi tạo dự án, service gọi `uploadService.confirmUpload` cho `thumbnailFileId`, `challengeImageFileId`, `transformationBeforeFileId`, `transformationAfterFileId`.
  * **Lỗ hổng dọn dẹp ảnh ImageKit**:
    * Khi cập nhật (`update`), chỉ kiểm tra và xóa `thumbnailFileId` cũ nếu thumbnail thay đổi; bỏ quên việc xóa `challengeImageFileId`, `transformationBeforeFileId`, `transformationAfterFileId` cũ khi người dùng thay đổi ảnh.
    * Khi xóa (`remove`), chỉ xóa `thumbnailFileId` và các `fileId` trong `images` (gallery); **bỏ quên** `challengeImageFileId`, `transformationBeforeFileId`, `transformationAfterFileId`.

### 2.2. Admin Implementation (`vdcd-admin/src/app/(dashboard)/projects/` & `src/features/projects/`)
* **Cấu trúc trang**:
  * `src/app/(dashboard)/projects/page.tsx`: Bảng quản lý danh sách dự án kèm bộ lọc (Lĩnh vực, Tỉnh thành, Năm, Trạng thái).
  * `src/app/(dashboard)/projects/new/page.tsx`: Giao diện tạo mới.
  * `src/app/(dashboard)/projects/[id]/page.tsx` (563 dòng code): Giao diện chỉnh sửa chi tiết.
* **Thành phần form & State**:
  * Dùng `react-hook-form` kết hợp `zodResolver(projectSchema)`.
  * Sử dụng component Tiptap `RichTextEditor` (`src/components/shared/RichTextEditor.tsx`) để nhập nội dung cho 2 trường riêng biệt: `overview` (Tổng quan) và `challenge` (Thách thức).
  * Sử dụng `useFieldArray` cho danh sách `services` và `technicalHighlights`.
  * Sử dụng component `ProjectGallery` (`src/features/projects/components/ProjectGallery.tsx`) tích hợp `@dnd-kit/core` và `@dnd-kit/sortable` để kéo thả sắp xếp ảnh thư viện.
* **Điểm yếu kiến trúc nổi cộm trên Admin**:
  * ⚠️ **Workaround nguy hiểm tại `useProject(id)`** (`src/features/projects/api.ts` lines 47-56):
    ```typescript
    export function useProject(id: string) {
      const { data: projectsData, ...rest } = useProjects({ limit: 100 });
      const project = projectsData?.items?.find((p) => p.id === id);
      return { data: project, ...rest };
    }
    ```
    Do Backend không có endpoint `GET /projects/admin/:id`, Admin phải load trước danh sách 100 dự án để `find` theo ID trong client memory. Nếu hệ thống có hơn 100 dự án hoặc truy cập trực tiếp bằng URL khi chưa load cache, trang edit sẽ bị rỗng/lỗi.
  * Tiptap lưu trữ HTML tự do, gây sai lệch hoàn toàn với cấu trúc Block Document có kiểm định chặt chẽ (heading levels, image alt/caption, nested lists) của các module còn lại.
  * Thiếu hoàn toàn tính năng xem trước (Reader Preview) và giao diện trực quan (Visual Canvas).

---

## 3. CHI TIẾT KIẾN TRÚC SLIDE DETAIL BLOG (CURRENT SLIDE DETAIL BLOG ARCHITECTURE)

### 3.1. Backend Implementation (`Backend/src/modules/slide-detail-blog/`)
* **Mối quan hệ**: Quan hệ 1-1 chặt chẽ với bảng `slide` (`slide_id` UNIQUE FK, `onDelete: 'CASCADE'`).
* **Entity `SlideDetailBlog`** (`src/modules/slide-detail-blog/entities/slide-detail-blog.entity.ts`):
  * `id` (`UUID`, PK), `slideId` (`UUID`, Unique Index)
  * `title` (`varchar(255)`), `subtitle` (`text`, nullable), `slug` (`varchar(255)`, unique)
  * `excerpt` (`text`, nullable)
  * `heroImageUrl` (`varchar(500)`), `heroImageFileId` (`varchar`)
  * `seoTitle` (`varchar(255)`), `metaDescription` (`varchar(500)`)
  * `content` (`jsonb`, default `'{"version":1,"blocks":[]}'`) — Chuẩn hóa Document Model v1
  * `isPublished` (`boolean`, index), `publishedAt` (`timestamp`, index)
  * `createdAt`, `updatedAt`
* **Validation & Document Contract**:
  * Được kiểm soát nghiêm ngặt bởi `validateBlogContent` re-export từ `src/common/validators/document-content.validator.ts`.
  * Hỗ trợ các khối: `heading` (giới hạn Level 2, 3), `paragraph`, `image` (chỉ có caption trên Image, không chứa metadata bài viết), `list` / `ordered_list` (hỗ trợ phân cấp đệ quy đa tầng), `quote`, `highlight`, `section`, `cta`.
  * Ngăn chặn hoàn toàn XSS (`assertSafeText` cấm `<script>`, `javascript:`, `onerror=`).
* **Xử lý Xuất bản (`togglePublish`)**:
  * Bắt buộc bài viết phải có tiêu đề và `content.blocks.length > 0` mới được xuất bản.
  * Tự động gán `publishedAt = new Date()` trong lần xuất bản đầu tiên.
* **Vòng đời tài sản ImageKit (ImageKit Lifecycle Management)**:
  * Khi tạo/cập nhật: Quét toàn bộ khối ảnh qua `extractImageFileIds` và gọi `uploadService.confirmUpload` để chuyển trạng thái từ tạm sang chính thức trong bảng `upload_temp`.
  * Khi sửa nội dung: So sánh `oldImageIds` và `newImageIds`, tự động gọi `cleanupImages` để xóa các ảnh bị gỡ khỏi bài viết trên ImageKit ngay lập tức.
  * Khi xóa bài viết: Xóa sạch `heroImageFileId` cùng toàn bộ ảnh trong các khối nội dung trên ImageKit.

### 3.2. Admin Implementation (`vdcd-admin/src/app/(dashboard)/slide-detail-blogs/`)
* **Giao diện 3 Tab đồng bộ**:
  * `Tab 1: editor` — Nhập thông tin meta + `BlockEditor` (quản lý danh sách các thẻ khối: kéo thả, thêm mới, sửa tham số từng khối).
  * `Tab 2: reader` — Giao diện đọc tĩnh (`BlogPreviewContainer` / `BlogContentRenderer`), mô phỏng 100% giao diện công khai trên `VDCD_gialai_frontend`.
  * `Tab 3: visual` — Trình chỉnh sửa trực quan (`VisualEditorCanvas`), hiển thị bài viết thời gian thực, cho phép click vào từng khối để chỉnh sửa kiểu dáng (spacing, font size, marker style...) thông qua thanh `PropertyPanel`.
* **Cấu trúc mã nguồn**:
  * Các trang route `new/page.tsx` (783 dòng) và `[id]/page.tsx` (927 dòng) hiện đang chứa toàn bộ logic điều phối form, upload ảnh hero, xem trước và tabs.

---

## 4. PHÂN TÍCH KHẢ NĂNG TÁI SỬ DỤNG (REUSABLE COMPONENTS)

Hệ thống đã có sẵn thư viện dùng chung được chuẩn hóa tại:  
👉 `d:\Workspace\VDCD\VDCD_Website\vdcd-admin\src\shared\content-editor\`

Thư viện này đã được module hóa cực kỳ bài bản và đang được sử dụng trực tiếp bởi **Program** (`ProgramEditor.tsx`) và **Solution** (`SolutionEditor.tsx`):

```
src/shared/content-editor/
├── model/                  # Canonical Types, Zod Document Schema, Block Factory
├── blocks/                 # BlockCard, BlockPicker, Heading/Paragraph/Image/List/Section/Cta Block Items
├── editor/                 # BlockEditor (danh sách khối kéo thả, thêm khối)
├── visual-editor/          # VisualEditorCanvas, VisualEditorBlock, PropertyPanel, InsertZone, VisualEditorToolbar
├── reader/                 # DocumentReader
├── renderer/               # DocumentContentRenderer, DocumentPreviewContainer & 6 Block Renderers
├── media/                  # DocumentUploadProvider, useDocumentUpload (Dynamic folder/subfolder upload)
├── history/                # useEditorHistory (Undo/Redo stack cho Visual Editor)
├── lists/                  # List Parser & Helpers (Nested indentation, bullet/ordered/checklist)
├── typography/             # Design Tokens (Font size, Spacing, Line height)
└── paste/                  # useSanitizedPaste, useHtmlShortcuts
```

### Các thành phần có thể tái sử dụng ngay cho Project:
1. **`BlockEditor` & Block Items**: Có thể đưa vào tab "Nội dung" của Project mà không cần viết lại bất kỳ component block nào.
2. **`VisualEditorCanvas` & `PropertyPanel`**: Tái sử dụng nguyên vẹn để người dùng chỉnh sửa bài giới thiệu dự án trực quan theo thời gian thực.
3. **`DocumentPreviewContainer` / `DocumentReader`**: Cung cấp ngay tab "Đọc bài" cho dự án.
4. **`DocumentUploadProvider`**: Cho phép inject `folder="project"` và `subfolder={projectSlug}` để toàn bộ ảnh tải lên từ editor tự động chuyển về folder của dự án trên ImageKit.
5. **`ProjectGallery`**: Tiếp tục tái sử dụng làm component quản lý gallery độc lập, giữ vai trò hiển thị bộ sưu tập ảnh thực tế của công trình.

---

## 5. THÀNH PHẦN TRÙNG LẶP CẦN TỐI ƯU (DUPLICATED COMPONENTS)

Quá trình audit phát hiện sự trùng lặp mã nguồn nghiêm trọng giữa module gốc và thư viện dùng chung:

### 5.1. Trùng lặp giữa `features/slide-detail-blogs` và `shared/content-editor`
* **Block Components**: `BlockCard`, `BlockPicker`, `HeadingBlockItem`, `ParagraphBlockItem`, `ImageBlockItem`, `ListBlockItem`, `SectionBlockItem`, `CtaBlockItem` tồn tại đồng thời ở cả `src/features/slide-detail-blogs/components/BlockEditor/` và `src/shared/content-editor/blocks/`.
* **Visual Editor**: `VisualEditorCanvas`, `VisualEditorBlock`, `PropertyPanel`, `InsertZone`, `VisualEditorToolbar`, `useEditorHistory` tồn tại song song ở cả `slide-detail-blogs/components/VisualEditor/` và `shared/content-editor/visual-editor/`.
* **Renderers**: `BlogContentRenderer`, `BlogPreviewContainer` và 6 file block renderer tồn tại song song ở cả `slide-detail-blogs/components/BlogPreview/` và `shared/content-editor/renderer/`.
* **Upload Context**: `SlideDetailBlogUploadContext` giống hệt 100% về mặt cấu trúc với `DocumentUploadContext`.
* **Utilities**: `list-parser.ts`, `list-helpers.ts`, `useSanitizedPaste.ts`, `useHtmlShortcuts.ts` bị sao chép ở cả hai nơi.

### 5.2. Trùng lặp trang (Orchestration Pages)
* **`articles`** (`src/app/(dashboard)/articles/{new, [id]}/page.tsx`): Vẫn đang import trực tiếp từ `src/features/slide-detail-blogs/components/`, chứa 700+ dòng code lặp lại việc dựng các tab.
* **`slide-detail-blogs`** (`src/app/(dashboard)/slide-detail-blogs/{new, [id]}/page.tsx`): Chứa 800-900 dòng code lặp lại.
* Trong khi đó, **`programs`** và **`solutions`** đã đạt trạng thái chuẩn mực: file route chỉ có 12 dòng, ủy quyền toàn bộ cho component chuyên biệt (`ProgramEditor.tsx`, `SolutionEditor.tsx`).

---

## 6. SO SÁNH CHI TIẾT BỘ API BACKEND & ADMIN (BACKEND & ADMIN APIS)

### 6.1. Chi tiết API Backend

| Endpoint | Method | Phân quyền | Slide Detail Blog | Project (Hiện tại) | Nhận xét & Đánh giá |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/:module` | GET | `@Public()` | N/A (Truy vấn theo slideId) | ✅ Có (Danh sách xuất bản) | Slide Blog đi kèm Slide, Project là danh mục độc lập |
| `/:module/all` | GET | `superadmin`, `editor` | ✅ `findAllAdmin` (Ẩn content) | ✅ `findAllAdmin` | Cả hai đều có phân trang & lọc admin |
| `/:module/admin/:id` | GET | `superadmin`, `editor` | ✅ `findById` (Full content) | ❌ **CHƯA CÓ** | **Lỗ hổng lớn của Project Backend** |
| `/:module/:slug` | GET | `@Public()` | ✅ `findBySlug` | ✅ `findOneBySlug` | Public chi tiết theo slug |
| `/:module` | POST | `superadmin`, `editor` | ✅ Có (Xác thực Block JSON) | ✅ Có (Nhận HTML thô) | Project nhận HTML overview & challenge |
| `/:module/:id` | PATCH | `superadmin`, `editor` | ✅ Có (Dọn rác ảnh ImageKit) | ✅ Có (Không dọn rác ảnh) | Project thiếu dọn rác ảnh chi tiết |
| `/:module/:id/publish`| PATCH | `superadmin`, `editor`| ✅ Có (Validate content & title) | ⚠️ Có (Chỉ toggle bool) | Project thiếu kiểm tra nội dung và cột `published_at` |
| `/:module/:id` | DELETE| `superadmin` | ✅ Có (Xóa sạch ảnh ImageKit) | ⚠️ Có (Xóa thiếu file) | Project bỏ sót ảnh challenge, before, after |
| `/:module/:id/images` | POST | `superadmin`, `editor` | N/A | ✅ Upload Gallery | Dành riêng cho Gallery dự án |

### 6.2. Chi tiết API Admin (BFF Proxy & Query Hooks)
* **BFF Proxy Catch-All**: `src/app/api/[...path]/route.ts` tự động forward các request từ `/api/**` sang Backend NestJS `http://.../api/v1/**`, bảo toàn cookie HttpOnly và Bearer Token.
* **TanStack Query Hooks**:
  * Slide Detail Blog: `useSlideDetailBlogs`, `useSlideDetailBlog` (gọi `GET /api/slide-detail-blogs/admin/:id`), `useCreateSlideDetailBlog`, `useUpdateSlideDetailBlog`, `usePublishSlideDetailBlog`, `useDeleteSlideDetailBlog`.
  * Project: `useProjects`, `useProject` (**đang chạy workaround tìm kiếm trong bộ nhớ client**), `useCreateProject`, `useUpdateProject`, `usePublishProject`, `useDeleteProject`, `useUploadProjectImages`, `useReorderProjectImages`, `useDeleteProjectImage`.

---

## 7. LUỒNG TẢI LÊN & TÍCH HỢP IMAGEKIT (UPLOAD & IMAGEKIT FLOW)

### 7.1. Kiến trúc luồng tải lên từ Client (`vdcd-admin/src/lib/upload.ts`)

```
               [Người dùng chọn File ảnh]
                          │
                          ▼
            [Kiểm tra dung lượng file]
             /                      \
      < 4 MB                          ≥ 4 MB
      /                                \
[Gửi qua Next.js BFF Proxy]       [Lấy Bearer Token qua /api/upload/token]
[/api/upload/image/...]                       │
          │                       [Gọi thẳng Backend API để vượt Vercel Limit]
          │                       [${API_BASE_URL}/upload/image/...]
          └───────────────┬───────────────────┘
                          │
                          ▼
        [NestJS Multer Memory Storage (RAM)]
                          │
                          ▼
        [UploadService: Gửi sang ImageKit SDK]
                          │
                          ▼
      [Tạo bản ghi vào bảng `upload_temp` (confirmed=false)]
                          │
                          ▼
        [Trả về UploadResult: url, fileId, filePath]
```

### 7.2. Cấu trúc thư mục ImageKit giữa các module

* **Slide Banner**: `/vdcd/slides/` hoặc `/vdcd/slides/<subfolder>/`
* **Slide Detail Blog**: `/vdcd/slides/<subfolder>/` (mặc định: `/vdcd/slides/detail-blogs/`)
* **Article**: `/vdcd/articles/<slug>/`
* **Program**: `/vdcd/programs/<slug>/`
* **Solution**: `/vdcd/solutions/<key-or-slug>/`
* **Project (Hiện tại)**: Thư mục phẳng `/vdcd/projects/` — **Chưa hỗ trợ chia subfolder theo project slug**.

### 7.3. Vòng đời xác nhận và dọn rác ảnh ImageKit (`upload_temp`)

```
                 [Ảnh được upload lên ImageKit]
                               │
            Bản ghi sinh ra trong bảng `upload_temp`
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
      [Form ĐƯỢC LƯU]                      [Form BỊ HỦY / BỎ RƠI]
            │                                     │
   Entity Service gọi:                     Sau 24 giờ không lưu:
`confirmUpload(fileId)`              Cron `cleanOrphanFiles()` chạy
            │                                     │
Xóa khỏi bảng `upload_temp`           Xóa file trên ImageKit qua SDK
(Đánh dấu file thuộc về bài viết)       Xóa bản ghi khỏi `upload_temp`
```

* **Xử lý khối ảnh trong Document Model**:
  Khi lưu `SlideDetailBlog`, `Program`, `Solution`, hàm tiện ích `extractImageFileIds(content)` đệ quy bóc tách toàn bộ `fileId` trong các khối `image`, `section` và `list` để xác nhận đồng loạt, đồng thời xóa các ảnh cũ không còn xuất hiện trong tài liệu.
* **Tồn đọng ở Project**:
  Project hiện tại chưa có Document Model nên không có cơ chế quét block ảnh. Đồng thời, việc cập nhật/xóa các trường ảnh độc lập (`challengeImageFileId`, `transformationBeforeFileId`, `transformationAfterFileId`) chưa được gọi lệnh xóa trên ImageKit.

---

## 8. ĐÁNH GIÁ KHẢ NĂNG TRÍCH XUẤT EDITOR DÙNG CHUNG (EXTRACTION FEASIBILITY)

### Kết luận xác định:
> **CÓ THỂ VÀ ĐÃ ĐƯỢC TRÍCH XUẤT THÀNH CÔNG.**  
> Thư viện `src/shared/content-editor` chính là bản trích xuất hoàn chỉnh, chuẩn hóa từ `Slide Detail Blog`.

### Kế hoạch quy hoạch kiến trúc khả thi:
1. **Áp dụng cho Project**:
   * Project hoàn toàn có thể áp dụng mô hình Editor 4 Tab tương tự `SolutionEditor` và `ProgramEditor`:
     * **Tab 1 — Thông tin**: Tiêu đề, Slug, Tỉnh thành, Năm, Lĩnh vực, Dịch vụ, Before/After, Gallery, SEO.
     * **Tab 2 — Nội dung (Block Editor)**: Biên tập nội dung bài viết chi tiết của dự án bằng các khối block (`heading`, `paragraph`, `image`, `list`, `section`, `cta`).
     * **Tab 3 — Đọc bài (Reader)**: Xem trước trải nghiệm đọc tĩnh.
     * **Tab 4 — Trực quan (Visual Editor)**: Tinh chỉnh giao diện WYSIWYG trực quan.
2. **Quy hoạch dọn dẹp mã nguồn (Cleanup)**:
   * Chuyển `Slide Detail Blog` và `Article` sang sử dụng `@/shared/content-editor`.
   * Loại bỏ toàn bộ thư mục trùng lặp `src/features/slide-detail-blogs/components/{BlockEditor, VisualEditor, BlogPreview}` để tiết kiệm hơn 3,000 dòng mã trùng lặp.

---

## 9. CÁC RỦI RO DI CHUYỂN DỮ LIỆU & GIẢI PHÁP (MIGRATION RISKS & MITIGATION)

| # | Rủi ro phát hiện | Mức độ | Hậu quả tiềm ẩn | Giải pháp khắc phục đề xuất |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Xung đột cấu trúc dữ liệu `overview` / `challenge`** | **CAO** | Hiện tại Project lưu HTML thô trong 2 cột tách biệt (`overview` và `challenge`). Nếu chuyển sang Document JSONB, cần quyết định chuyển đổi dữ liệu cũ thế nào. | **Giải pháp 2 cột an toàn**: Thêm cột `content` (`jsonb`) mới cho bài viết chi tiết dự án. Giữ nguyên `overview` (dạng text ngắn gọn làm tóm tắt) và tạo migration chuyển đổi nội dung `challenge` + `overview` cũ thành các block trong `content`. Tạo thêm `content_html_backup` để bảo tồn dữ liệu 100%. |
| **2** | **Phá vỡ giao diện Public Frontend (`VDCD_gialai_frontend`)** | **CAO** | Website công khai có thể đang gọi API đọc `overview` và `challenge` để render HTML trực tiếp bằng `dangerouslySetInnerHTML`. Thay đổi đột ngột sẽ làm sập trang dự án public. | Giữ song song các trường cũ trong giai đoạn chuyển tiếp hoặc cung cấp `DocumentRenderer` cho Frontend tương tự như cách đã triển khai cho Slide Detail Blog / Solution. |
| **3** | **Khuyết thiếu API `GET /projects/admin/:id`** | **TRUNG BÌNH** | Admin đang dùng workaround `useProjects({ limit: 100 })` để tìm dự án theo ID. Rất dễ gây lỗi trắng trang edit nếu danh sách dự án tăng lên. | Bổ sung ngay endpoint `GET /projects/admin/:id` trong `ProjectController` Backend trước khi tích hợp editor mới. |
| **4** | **Thiếu trường `published_at` trong Database** | **TRUNG BÌNH** | Project chỉ có `is_published` (`boolean`), không có mốc thời gian xuất bản như Article, Program, Solution, Slide Blog. Gây bất đồng bộ khi hiển thị ngày tháng trên CMS và Public FE. | Thêm cột `published_at` (`timestamp`) trong migration cho bảng `project`. Tự động set `published_at = created_at` cho các dự án đã xuất bản sẵn. |
| **5** | **Rò rỉ tài nguyên ảnh trên ImageKit** | **THẤP** | Project đang để ảnh thư mục phẳng `/projects/` và không dọn dẹp các trường ảnh phụ khi cập nhật/xóa. | Nâng cấp `UploadController` hỗ trợ `POST /upload/image/project` có query `subfolder` hoặc `slug`. Cập nhật `ProjectService.update` và `remove` gọi `uploadService.deleteFile` cho các fileId phụ. |
| **6** | **Xung đột giữa Gallery ảnh và Block Ảnh trong bài** | **THẤP** | Người dùng có thể nhầm lẫn giữa Gallery ảnh của dự án (`project_image`) và các khối ảnh minh họa trong bài viết. | Phân định rõ ràng trên UI: Gallery nằm ở Tab "Thông tin" (phục vụ slider / so sánh trước sau của dự án), còn Block Image nằm trong Tab "Nội dung" (minh họa theo từng phân đoạn bài viết). |

---

## 10. KẾT LUẬN & ĐỀ XUẤT CHO PHASE TIẾP THEO

1. **Về mặt Editor**: Nền tảng `@/shared/content-editor` đã hoàn toàn sẵn sàng, chạy ổn định trên Solution và Program. Không cần tạo thêm editor mới cho Project.
2. **Về mặt Backend**: Cần thực hiện 1 migration chuẩn hóa bảng `project`:
   * Thêm cột `published_at` (`timestamp`).
   * Thêm cột `content_html_backup` (`text`).
   * Thêm cột `content` (`jsonb`, default `'{"version":1,"blocks":[]}'`).
   * Bổ sung script chuyển đổi `html-to-blocks` cho các dự án đã tồn tại.
   * Thêm endpoint `GET /projects/admin/:id` và cập nhật logic dọn dẹp ảnh ImageKit trong `ProjectService`.
3. **Về mặt Admin**:
   * Chuẩn hóa form Project theo mô hình `ProjectEditor.tsx` (4 Tab), kết nối với `src/shared/content-editor`.
   * Sửa `src/features/projects/api.ts` để gọi trực tiếp endpoint `GET /projects/admin/:id`.
   * Lên kế hoạch dọn dẹp mã nguồn trùng lặp ở `Slide Detail Blog` và `Article` trong các phase sau.
