# TÀI LIỆU TÍCH HỢP FRONTEND — BỘ API & QUY TẮC ĐỒNG BỘ GIAO DIỆN DETAIL BLOG

Tài liệu này hướng dẫn chi tiết cho đội ngũ phát triển **Frontend (`VDCD_gialai_frontend`)** về:
1. **Bộ API Endpoints** cần gọi để lấy dữ liệu bài viết chi tiết.
2. **Cấu trúc dữ liệu JSON (Data Contract)** trả về từ Backend.
3. **Mã nguồn Service & React Component mẫu** trên Frontend.
4. **Quy tắc hiển thị chi tiết** nhằm đảm bảo giao diện công khai trên Frontend **đồng bộ 100% (Pixel-Perfect Sync)** với *Trình chỉnh sửa trực quan (Visual Editor)* trên Admin.

---

## 1. TỔNG QUAN KIẾN TRÚC & DÒNG CHẢY DỮ LIỆU (DATA FLOW)

```
┌────────────────────────────────────────────────────────┐
│                   ADMIN CMS (Repo Admin)               │
│  - Tab 1: Nội dung (Block Form Editor)                │
│  - Tab 2: Đọc bài (Read-Only Article View)            │
│  - Tab 3: Trình chỉnh sửa trực quan (Visual Editor)   │
└───────────────────────────┬────────────────────────────┘
                            │ PATCH /slide-detail-blogs/:id
                            ▼
┌────────────────────────────────────────────────────────┐
│                   BACKEND NESTJS                       │
│  - Lưu trữ cột JSON `content` (Single Source of Truth) │
│  - Upload media lên ImageKit (thư mục /slide/)         │
└───────────────────────────┬────────────────────────────┘
                            │ GET /api/v1/slide-detail-blogs/slug/:slug
                            ▼
┌────────────────────────────────────────────────────────┐
│               PUBLIC FRONTEND (Repo Frontend)          │
│  Route: /slides/[slug]                                 │
│  Component: BlogDetailRenderer (Render 1:1 với Admin)  │
└────────────────────────────────────────────────────────┘
```

---

## 2. BỘ API ENDPOINTS DÀNH CHO FRONTEND

Backend cung cấp các API công khai (Public API — Không yêu cầu Access Token) để Frontend truy xuất dữ liệu:

### 2.1. 🔓 Lấy bài viết chi tiết theo Slug
Dùng cho Server Component hoặc Page Router trên Frontend tại đường dẫn `/slides/[slug]`.

* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/slide-detail-blogs/slug/:slug` (hoặc `/api/v1/slide-detail-blogs/by-slide-slug/:slug`)
* **Path Parameter:**
  * `slug` (string): Slug của bài viết/slide (ví dụ: `do-thi-thong-minh-gia-lai`).
* **Headers:**
  ```http
  Accept: application/json
  ```
* **Mã phản hồi (Status Codes):**
  * `200 OK`: Trả về dữ liệu bài viết chi tiết.
  * `404 Not Found`: Không tìm thấy bài viết hoặc bài viết chưa được xuất bản (`isPublished: false`).

---

### 2.2. 🔓 Lấy bài viết chi tiết theo Slide ID
Dùng trong trường hợp Frontend truy vấn bài viết kèm theo ID của Slide liên kết.

* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/slide-detail-blogs/by-slide/:slideId`
* **Path Parameter:**
  * `slideId` (UUID): ID của slide.
* **Mã phản hồi (Status Codes):**
  * `200 OK`: Trả về dữ liệu bài viết.
  * `404 Not Found`: Slide chưa có bài viết chi tiết.

---

## 3. CẤU TRÚC DỮ LIỆU RESPONSE (DATA CONTRACT)

### 3.1. Cấu Trúc JSON Phản Hồi Mẫu (`Response 200`)

```json
{
  "statusCode": 200,
  "data": {
    "id": "c7f95cd7-b298-49df-e94f-13b1a70c50fc",
    "slideId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "SỐ HÓA DỮ LIỆU ĐẤT ĐAI",
    "subtitle": "Từ hiện trạng ngoài thực địa đến cơ sở dữ liệu đồng bộ",
    "slug": "so-hoa-du-lieu-dat-dai",
    "excerpt": "Trung tâm Đổi mới Sáng tạo Gia Lai kết nối công nghệ UAV, GNSS, AI và GIS để hỗ trợ thu thập hiện trạng, lập bản đồ địa chính, chuẩn hóa hồ sơ và xây dựng cơ sở dữ liệu đất đai có khả năng tra cứu, cập nhật và khai thác lâu dài.",
    "heroImageUrl": "https://ik.imagekit.io/vdcd/slide/farmland-drone_xyz123.webp",
    "heroImageFileId": "file_xyz123",
    "seoTitle": "Số hóa dữ liệu đất đai Gia Lai | VDCD Group",
    "metaDescription": "Giải pháp ứng dụng UAV và AI để số hóa dữ liệu đất đai tại Gia Lai.",
    "isPublished": true,
    "createdAt": "2026-09-01T08:00:00.000Z",
    "updatedAt": "2026-09-02T04:30:00.000Z",
    "content": {
      "version": 1,
      "heroMeta": {
        "placement": "below_desc",
        "position": "center",
        "caption": "Ứng dụng UAV và AI để số hóa dữ liệu đất đai"
      },
      "blocks": [
        {
          "id": "blk_1725250001_abc1",
          "type": "heading",
          "level": 2,
          "text": "KHI DỮ LIỆU CHƯA THEO KỊP HIỆN TRẠNG",
          "spacing": {
            "marginTop": 32,
            "marginBottom": 16
          }
        },
        {
          "id": "blk_1725250002_abc2",
          "type": "paragraph",
          "text": "Dữ liệu đất đai được hình thành qua nhiều thời kỳ, tồn tại dưới nhiều dạng như bản đồ giấy, sổ mục kê, giấy chứng nhận quyền sử dụng đất...",
          "spacing": {
            "marginTop": 0,
            "marginBottom": 24
          }
        },
        {
          "id": "blk_1725250003_abc3",
          "type": "image",
          "url": "https://ik.imagekit.io/vdcd/slide/uav-mapping-field_abc.webp",
          "alt": "Khảo sát thực địa bằng UAV",
          "caption": "Thiết bị bay không người lái (UAV) quét dữ liệu địa hình",
          "spacing": {
            "marginTop": 24,
            "marginBottom": 24
          }
        },
        {
          "id": "blk_1725250004_abc4",
          "type": "list",
          "items": [
            "Đo đạc và lập mô hình 3D địa hình với độ chính xác cao.",
            "Tự động phát hiện biến động ranh giới thửa đất.",
            "Tích hợp dữ liệu vào hệ thống GIS địa phương."
          ],
          "spacing": {
            "marginTop": 16,
            "marginBottom": 24
          }
        },
        {
          "id": "blk_1725250005_abc5",
          "type": "section",
          "number": "01",
          "title": "QUY TRÌNH TRIỂN KHAI THỰC ĐỊA",
          "spacing": {
            "marginTop": 48,
            "marginBottom": 32
          },
          "children": [
            {
              "id": "blk_1725250006_sub1",
              "type": "paragraph",
              "text": "Bước 1: Thu thập hồ sơ hiện trạng và lập phương án bay chụp..."
            }
          ]
        },
        {
          "id": "blk_1725250007_abc6",
          "type": "cta",
          "label": "Liên hệ tư vấn giải pháp",
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

---

## 4. QUY TẮC ĐỒNG BỘ GIAO DIỆN 1:1 VỚI ADMIN VISUAL EDITOR

Để trang chi tiết bài viết trên Frontend hiển thị **hoàn toàn giống với bản xem trước trực quan (Visual Editor)** trên Admin, Frontend cần tuân thủ các quy tắc sau:

### 4.1. Quy Tắc Bố Cục Khối Hero (`content.heroMeta.placement`)

Khối Hero gồm 3 phần:
1. **Tiêu đề & Phụ đề (`renderHeroHeader`):** `subtitle` + `title`.
2. **Đoạn mô tả ngắn (`renderHeroExcerpt`):** `excerpt`.
3. **Ảnh bìa & Chú thích (`renderHeroMedia`):** `heroImageUrl` + `content.heroMeta.caption`.

Dựa vào giá trị `content.heroMeta.placement`, sắp xếp thứ tự như sau:

```
Chế độ 1: "above_title" (Mặc định)
┌─────────────────────────────────┐
│ 1. [Ảnh bìa Hero]               │
│    [Chú thích ảnh bìa]          │
├─────────────────────────────────┤
│ 2. SUBTITLE                     │
│    TIÊU ĐỀ BÀI VIẾT             │
├─────────────────────────────────┤
│ 3. Đoạn mô tả dẫn nhập (Excerpt)│
└─────────────────────────────────┘

Chế độ 2: "between_title_desc"
┌─────────────────────────────────┐
│ 1. SUBTITLE                     │
│    TIÊU ĐỀ BÀI VIẾT             │
├─────────────────────────────────┤
│ 2. [Ảnh bìa Hero]               │
│    [Chú thích ảnh bìa]          │
├─────────────────────────────────┤
│ 3. Đoạn mô tả dẫn nhập (Excerpt)│
└─────────────────────────────────┘

Chế độ 3: "below_desc"
┌─────────────────────────────────┐
│ 1. SUBTITLE                     │
│    TIÊU ĐỀ BÀI VIẾT             │
├─────────────────────────────────┤
│ 2. Đoạn mô tả dẫn nhập (Excerpt)│
├─────────────────────────────────┤
│ 3. [Ảnh bìa Hero]               │
│    [Chú thích ảnh bìa]          │
└─────────────────────────────────┘
```

#### Quy tắc hiển thị Chú thích Ảnh bìa:
* **Chỉ hiển thị khi có ảnh:** Nếu `!heroImageUrl` thì **không render thẻ ảnh và không render chú thích**.
* **Vị trí:** Chú thích **luôn nằm ngay dưới ảnh bìa**, render bằng thẻ ngữ nghĩa `<figcaption className="text-center text-xs sm:text-sm italic text-[#6C7E96] mt-2.5">`.
* **Tiêu điểm ảnh:** Gán style `style={{ objectPosition: heroMeta?.position ?? "center" }}`.

---

### 4.2. Quy Tắc Khoảng Cách Lề Khối Nội Dung (`BlockSpacing`)

Khi biên tập viên chỉnh sửa khoảng cách trong Admin Visual Editor:
* Giá trị `marginTop` / `marginBottom` được lưu dưới dạng số nguyên (pixel): `0, 8, 16, 24, 32, 48, 64, 80, 96`.
* **Quy tắc code chuẩn:**
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
* **Lưu ý quan trọng:** Giá trị `0` là khoảng cách dính sát 0px (`marginTop: 0px`). Phải kiểm tra bằng `typeof ... === "number"` thay vì kiểm tra truthy `if (block.spacing?.marginTop)`, vì `0` trong JavaScript là falsy!
* Nếu `undefined`: để CSS áp dụng khoảng cách typography mặc định (`margin-top: 1.75rem` / `28px`).

---

### 4.3. Quy Tắc Hiển Thị Chú Thích Khối Ảnh (`ImageBlock.caption`)
* Khối ảnh nội dung (`type: "image"`):
  * Render thẻ `<figure>` bọc thẻ `<img>`.
  * Nếu `block.caption` có chuỗi ký tự $\rightarrow$ render `<figcaption>` căn giữa, in nghiêng, màu text-muted bên dưới ảnh.
  * Nếu `block.caption` rỗng hoặc null $\rightarrow$ **không render thẻ `<figcaption>`**.

---

### 4.4. Quy Tắc Hiển Thị Khối Phân Đoạn (`SectionBlock`)
* Khối Section (`type: "section"`):
  * Chứa huy hiệu số thứ tự phân đoạn (`number` - ví dụ `01`, `02`) nền đỏ `#ca2a30`, chữ trắng đậm.
  * Tiêu đề phân đoạn (`title`) chữ hoa đậm.
  * Khung bao viền nhẹ: `border border-[#E2E8EE] bg-[#F9F7FC]/60 rounded-xl p-6`.
  * Render đệ quy mảng `children` theo cùng logic renderer.

---

### 4.5. Quy Tắc Hiển Thị Khối Danh Sách & Style Đa Cấp (`ListBlock` & `style: ListStyleConfig`)
* Khối List (`type: "list"`):
  * Cấu trúc dữ liệu cây đệ quy: `ListItem { id, content, children: ListItem[], checked?: boolean }`.
  * Kiểu danh sách (`listType`):
    * `"bullet"`: Thẻ `<ul>` với ký hiệu đầu mục (`disc`, `circle`, `square`).
    * `"ordered"`: Thẻ `<ol>` với số thứ tự (`decimal`, `lower-alpha`, `upper-alpha`).
    * `"checklist"`: Danh sách việc cần làm với checkbox tương tác (`checked: boolean`).
  * Khung viền và nền (`block.style`):
    * Hỗ trợ `backgroundColor`, `borderColor`, `borderWidth`, `borderRadius`, `padding`.
  * Style phân tầng (Level Cascading):
    * Mỗi cấp độ phân cấp (`depth`) hỗ trợ ghi đè độc lập: `style.levelStyles[depth + 1]`.
    * Độ thụt lề: `depth * (style.indentation ?? 24)px`.
    * Khoảng cách mục: `itemSpacing` (pixel).

---

## 5. MÃ NGUỒN TÍCH HỢP MẪU CHO REPO FRONTEND

### 5.1. File Service: `src/services/slide-detail-blog.service.ts`

```typescript
import { apiClient } from "@/lib/api-client";
import type { SlideDetailBlog } from "@/types/slide-detail-blog";

/**
 * Lấy chi tiết bài viết blog theo Slug
 */
export async function getSlideDetailBlogBySlug(slug: string): Promise<SlideDetailBlog | null> {
  try {
    const res = await apiClient.get<{ statusCode: number; data: SlideDetailBlog }>(
      `/api/v1/slide-detail-blogs/slug/${slug}`,
      {
        next: { tags: [`slide-blog-${slug}`], revalidate: 60 }, // ISR 60s
      }
    );
    return res.data?.data ?? null;
  } catch (error) {
    console.error(`[BlogService] Lỗi khi tải bài viết với slug ${slug}:`, error);
    return null;
  }
}
```

---

### 5.2. File Renderer: `src/components/blog/BlogDetailRenderer.tsx`

```tsx
"use client";

import React from "react";
import type { SlideDetailBlog, SlideDetailBlogBlock } from "@/types/slide-detail-blog";

interface BlogDetailRendererProps {
  blog: SlideDetailBlog;
}

export function BlogDetailRenderer({ blog }: BlogDetailRendererProps) {
  const { title, subtitle, excerpt, heroImageUrl, content } = blog;
  const heroMeta = content?.heroMeta;
  const heroPlacement = heroMeta?.placement ?? "above_title";
  const heroPosition = heroMeta?.position ?? "center";
  const heroCaption = heroMeta?.caption ?? "";
  const blocks = content?.blocks ?? [];

  // ── 1. Hero Subcomponents ──
  const renderHeroHeader = () => (
    <div className="space-y-2 mb-4">
      {subtitle && (
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ca2a30]">
          {subtitle}
        </p>
      )}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-[#011A42]">
        {title}
      </h1>
    </div>
  );

  const renderHeroExcerpt = () => (
    excerpt ? (
      <p className="text-base sm:text-lg leading-relaxed text-[#6C7E96] font-normal my-4">
        {excerpt}
      </p>
    ) : null
  );

  const renderHeroMedia = () => (
    heroImageUrl ? (
      <figure className="my-6 overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImageUrl}
          alt={title || "Ảnh bài viết"}
          className="w-full max-h-[460px] object-cover rounded-xl transition-all"
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

  // ── 2. Block Dispatcher ──
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
                    className="w-full rounded-lg object-cover"
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
                <section className="my-8 rounded-xl border border-[#E2E8EE] bg-[#F9F7FC]/60 p-6">
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
                    className="inline-flex items-center justify-center rounded-lg bg-[#ca2a30] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#b02227] hover:shadow-md"
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
      {/* Hero Layout */}
      {heroPlacement === "above_title" && (
        <>
          {renderHeroMedia()}
          {renderHeroHeader()}
          {renderHeroExcerpt()}
        </>
      )}

      {heroPlacement === "between_title_desc" && (
        <>
          {renderHeroHeader()}
          {renderHeroMedia()}
          {renderHeroExcerpt()}
        </>
      )}

      {heroPlacement === "below_desc" && (
        <>
          {renderHeroHeader()}
          {renderHeroExcerpt()}
          {renderHeroMedia()}
        </>
      )}

      {/* Content Blocks Flow */}
      <div className="mt-8 space-y-6">
        {blocks.map((block) => renderBlock(block))}
      </div>
    </article>
  );
}
```

---

### 5.3. File Page Route: `src/app/slides/[slug]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSlideDetailBlogBySlug } from "@/services/slide-detail-blog.service";
import { BlogDetailRenderer } from "@/components/blog/BlogDetailRenderer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ─── Tự động tạo SEO Metadata từ Admin ──────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getSlideDetailBlogBySlug(slug);

  if (!blog || !blog.isPublished) {
    return { title: "Không tìm thấy bài viết | VDCD Group" };
  }

  return {
    title: blog.seoTitle || `${blog.title} | VDCD Group`,
    description: blog.metaDescription || blog.excerpt || undefined,
    openGraph: {
      title: blog.seoTitle || blog.title,
      description: blog.metaDescription || blog.excerpt || undefined,
      images: blog.heroImageUrl ? [blog.heroImageUrl] : [],
    },
  };
}

// ─── Server Component Render Trang Bài Viết ─────────────────
export default async function SlideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getSlideDetailBlogBySlug(slug);

  // Nếu bài viết không tồn tại hoặc chưa xuất bản -> trả về 404
  if (!blog || !blog.isPublished) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <BlogDetailRenderer blog={blog} />
    </main>
  );
}
```

---

## 6. CHECKLIST KIỂM THỬ ĐỒNG BỘ (SYNC VALIDATION CHECKLIST)

Khi triển khai trên Frontend, kiểm tra các tiêu chí sau đối chiếu với Tab Visual Editor trên Admin:

| Tiêu chí kiểm tra | Kết quả mong đợi |
| :--- | :--- |
| **Bố cục Hero `"above_title"`** | Ảnh bìa $\rightarrow$ Phụ đề & Tiêu đề $\rightarrow$ Mô tả ngắn |
| **Bố cục Hero `"between_title_desc"`** | Phụ đề & Tiêu đề $\rightarrow$ Ảnh bìa $\rightarrow$ Mô tả ngắn |
| **Bố cục Hero `"below_desc"`** | Phụ đề & Tiêu đề $\rightarrow$ Mô tả ngắn $\rightarrow$ Ảnh bìa |
| **Chú thích ảnh bìa Hero** | Nằm ngay dưới ảnh bìa, in nghiêng, căn giữa |
| **Tiêu điểm ảnh bìa (`position`)** | Áp dụng đúng `object-position: top / center / bottom` |
| **Khoảng cách lề `0px`** | Khối dính sát vào khối trên/dưới đúng 0px, không bị hở 28px |
| **Chú thích khối ảnh nội dung** | Nằm ngay dưới ảnh khối con, chỉ hiển thị khi có nội dung |
| **Khối phân đoạn Section** | Có huy hiệu số (`01`, `02`) nền đỏ, khung nền xám nhạt, render đủ khối con |
| **Nút CTA** | Nút đỏ `#ca2a30`, chữ trắng, link mở sang tab mới |
| **Bài viết chưa xuất bản (`isPublished: false`)** | Frontend trả về trang 404 Not Found |
