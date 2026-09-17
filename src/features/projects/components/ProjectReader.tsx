"use client";

import React, { useState, useMemo } from "react";
import { DocumentContentRenderer } from "@/shared/content-editor";
import type { DocumentContent, ContentBlock, HeroMeta } from "@/shared/content-editor";
import type { ProjectImage, TechnicalHighlight } from "@/types/project";
import { ProjectHeaderBadges } from "./ProjectHeaderBadges";
import { ProjectSpecsSection } from "./ProjectSpecsSection";
import {
  ProjectChallengeSection,
  ProjectGallerySection,
} from "./ProjectExtraSections";
import { ProjectTransformationSection } from "./ProjectTransformationSection";

export type ProjectReaderViewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_CONFIG: Record<
  ProjectReaderViewport,
  { label: string; width: string; icon: string }
> = {
  desktop: {
    label: "Desktop",
    width: "max-w-4xl",
    icon: "💻",
  },
  tablet: {
    label: "Tablet",
    width: "max-w-2xl",
    icon: "📱",
  },
  mobile: {
    label: "Mobile",
    width: "max-w-sm",
    icon: "📲",
  },
};

export interface ProjectReaderProps {
  title: string;
  slug?: string | null;
  thumbnail?: string | null;
  overview?: string | null;
  fieldName?: string | null;
  provinceName?: string | null;
  year?: number | null;
  discipline?: string | null;
  services?: string[] | null;
  technicalHighlights?: TechnicalHighlight[] | null;
  challenge?: string | null;
  challengeImage?: string | null;
  transformationBefore?: string | null;
  transformationAfter?: string | null;
  createdAt?: string | null;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  heroMeta?: HeroMeta | null;
  content: DocumentContent;
  galleryImages?: ProjectImage[];
}

/**
 * PHASE 12 & 13 — Project Reader / Đọc bài
 *
 * Đồng bộ 100% dữ liệu và giao diện hiển thị với trang Project Detail trên VDCD Frontend:
 * - Vạch tiến trình đọc màu đỏ thương hiệu (#ca2a30).
 * - Thanh Breadcrumb (Trang chủ / Dự án / Chuyên mục) và Meta (Ngày đăng, Thời gian đọc tự động tính).
 * - Badges Lĩnh vực (tag đỏ), Địa điểm (tag kèm ghim 📍), Năm (tag kèm lịch 🗓️).
 * - Tiêu đề H1 typography hiện đại (#011A42) & Đoạn mô tả Overview.
 * - Ảnh bìa cover tỷ lệ 16/9 bo góc lớn rounded-2xl kèm chú thích caption (tự co giãn khi thumbnail là optional).
 * - Section THÔNG SỐ DỰ ÁN & DỊCH VỤ (3 card thông số chính, chips dịch vụ kèm tick ✓, điểm nhấn kỹ thuật đỏ #ca2a30).
 * - Section Thách thức dự án & Hiện trạng.
 * - DocumentContentRenderer render thuần tuý các khối nội dung bài viết.
 * - Thư viện ảnh công trình (Gallery) hỗ trợ chế độ Trượt ngang (slider) và Lưới (grid), Lightbox modal phóng to.
 * - Thanh chia sẻ mạng xã hội (Facebook, Twitter/X, Copy link) và Xem tất cả dự án.
 * - Khối Dự án liên quan (Related Projects preview).
 * - Nút điều hướng Quay lại danh sách dự án.
 * - Khối kêu gọi hành động hợp nhất (Common CTA Section).
 */
export function ProjectReader({
  title,
  slug,
  thumbnail,
  overview,
  fieldName,
  provinceName,
  year,
  discipline,
  services = [],
  technicalHighlights = [],
  challenge,
  challengeImage,
  transformationBefore,
  transformationAfter,
  createdAt,
  publishedAt,
  heroMeta,
  content,
  galleryImages = [],
}: ProjectReaderProps) {
  const [viewport, setViewport] = useState<ProjectReaderViewport>("desktop");
  const [copiedLink, setCopiedLink] = useState(false);

  const currentConfig = VIEWPORT_CONFIG[viewport];
  const blocks = useMemo(() => content?.blocks ?? [], [content?.blocks]);
  const simulatedUrl = slug
    ? `vdcd.vn/du-an/${slug}`
    : "vdcd.vn/du-an/(chua-co-slug)";

  // Tính toán thời gian đọc ước tính dựa trên toàn bộ nội dung
  const readingTimeMinutes = useMemo(() => {
    let textContent = [
      title || "",
      overview || "",
      fieldName || "",
      challenge || "",
    ].join(" ");

    const extractBlockText = (blockList: ContentBlock[]): string => {
      return blockList
        .map((b) => {
          if (b.type === "paragraph" || b.type === "heading" || b.type === "quote") {
            return b.text || "";
          }
          if (b.type === "highlight") {
            return b.text || "";
          }
          if (b.type === "list" || b.type === "ordered_list") {
            const getItemsText = (items: unknown[]): string => {
              return items
                .map((i) => {
                  if (typeof i === "string") return i;
                  if (i && typeof i === "object") {
                    const rec = i as { content?: string; text?: string; children?: unknown[] };
                    return `${rec.content || rec.text || ""} ${rec.children?.length ? getItemsText(rec.children) : ""}`;
                  }
                  return "";
                })
                .join(" ");
            };
            return getItemsText(b.items || []);
          }
          if (b.type === "section") {
            return `${b.title || ""} ${extractBlockText(b.children || [])}`;
          }
          return "";
        })
        .join(" ");
    };

    if (blocks.length > 0) {
      textContent += " " + extractBlockText(blocks);
    }

    const words = textContent
      .replace(/<[^>]*>/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [
    title,
    overview,
    fieldName,
    challenge,
    blocks,
  ]);

  // Format ngày tháng hiển thị
  const formattedDate = useMemo(() => {
    const rawDate = publishedAt || createdAt;
    if (!rawDate) {
      const now = new Date();
      return `${now.getDate()} Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
    }
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
    } catch {
      return rawDate;
    }
  }, [publishedAt, createdAt]);

  const heroPosition = heroMeta?.position || "center";
  const heroCaption = heroMeta?.caption;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${simulatedUrl}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Reader Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-surface px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-text">
            Chế độ đọc dự án hoàn chỉnh (Read-only View)
          </h3>
          <p className="text-xs text-text-muted">
            Hiển thị nội dung chính xác 100% như trên website công khai, không có
            viền chỉnh sửa hay công cụ thao tác.
          </p>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted">
            Khung nhìn:
          </span>
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5">
            {(
              Object.entries(VIEWPORT_CONFIG) as [
                ProjectReaderViewport,
                (typeof VIEWPORT_CONFIG)[ProjectReaderViewport],
              ][]
            ).map(([mode, config]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewport(mode)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  viewport === mode
                    ? "bg-surface font-semibold text-primary shadow-xs"
                    : "text-text-muted hover:text-text"
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reader Canvas / Frame */}
      <div className="rounded-xl border border-border bg-surface-muted/30 p-4 sm:p-6 lg:p-8">
        {/* Simulated Browser Bar */}
        <div className="mb-6 flex items-center gap-1.5 border-b border-border/60 pb-3">
          <div className="h-2.5 w-2.5 rounded-full bg-danger/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-warning/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/40" />
          <div className="ml-3 flex-1 rounded-md bg-surface-muted px-3 py-1">
            <span className="text-[11px] text-text-muted/70 font-mono">
              https://{simulatedUrl}
            </span>
          </div>
        </div>

        {/* Main Document Content Container */}
        <article
          className={`${currentConfig.width} mx-auto rounded-xl border border-border/60 bg-surface shadow-xs overflow-hidden transition-all duration-300 relative`}
        >
          {/* 1. Reading Progress Bar (Accent Line) */}
          <div className="h-[3px] w-full bg-[#ca2a30]" />

          {/* 2. HERO HEADER SECTION */}
          <header className="p-6 sm:p-8 lg:p-10 space-y-6">
            {/* Top Navigation & Breadcrumbs & Reading Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/50">
              <nav
                aria-label="Breadcrumb"
                className="text-xs font-mono font-bold uppercase tracking-widest text-text-muted"
              >
                <ol className="flex items-center gap-2 flex-wrap">
                  <li className="hover:text-primary transition-colors cursor-default">
                    Trang chủ
                  </li>
                  <li>/</li>
                  <li className="hover:text-primary transition-colors cursor-default">
                    Dự án
                  </li>
                  {fieldName && (
                    <>
                      <li>/</li>
                      <li className="text-text font-semibold line-clamp-1 max-w-[200px]">
                        Lĩnh vực: {fieldName}
                      </li>
                    </>
                  )}
                </ol>
              </nav>

              <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {readingTimeMinutes} phút đọc
                </span>
              </div>
            </div>

            {/* Badges Bar */}
            <ProjectHeaderBadges
              fieldName={fieldName}
              provinceName={provinceName}
              year={year}
            />

            {/* Main Title H1 */}
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#011A42] dark:text-white tracking-tight leading-[1.2] mb-3">
              {title || (
                <span className="italic text-text-muted/40 font-normal">
                  (Chưa có tên dự án)
                </span>
              )}
            </h1>

            {/* Overview / Subtitle */}
            {overview && (
              <div
                className="text-base sm:text-lg text-[#6C7E96] dark:text-zinc-400 leading-relaxed font-normal"
                dangerouslySetInnerHTML={{ __html: overview }}
              />
            )}

            {/* Thumbnail / Hero Cover Image (Optional) */}
            {thumbnail && (
              <figure className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail}
                  alt={title || "Project thumbnail"}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: heroPosition }}
                />
                {heroCaption && (
                  <figcaption className="p-3 text-center text-xs sm:text-sm italic text-[#6C7E96] dark:text-zinc-400 border-t border-slate-200/60 dark:border-zinc-800">
                    {heroCaption}
                  </figcaption>
                )}
              </figure>
            )}
          </header>

          {/* Divider between Hero and Specs */}
          <div className="border-t border-border/50" />

          {/* 3. THÔNG SỐ DỰ ÁN & DỊCH VỤ */}
          <ProjectSpecsSection
            discipline={discipline || fieldName || "Trắc địa & Quy hoạch"}
            provinceName={provinceName || "Việt Nam"}
            year={year || 2025}
            services={services}
            technicalHighlights={technicalHighlights}
            interactive={false}
            className="rounded-none border-x-0 border-t-0"
          />

          {/* 4. CHALLENGE SECTION (Thách thức dự án & Hiện trạng) */}
          <ProjectChallengeSection
            challenge={challenge}
            challengeImage={challengeImage}
            className="border-b border-border/50 rounded-none border-x-0 border-t-0"
          />

          {/* 4.5. TRANSFORMATION SECTION (Chuyển đổi số & Hiện trạng Trước / Sau) */}
          <ProjectTransformationSection
            transformationBefore={transformationBefore}
            transformationAfter={transformationAfter}
            className="border-b border-border/50 rounded-none border-x-0 border-t-0"
          />

          {/* 5. MAIN ARTICLE CONTENT — SHARED RENDERER (SECTION 13) */}
          {blocks.length > 0 && (
            <div className="p-6 sm:p-8 lg:p-10 space-y-6">
              <DocumentContentRenderer blocks={blocks} />
            </div>
          )}

          {/* 7. GALLERY (SECTION 14) */}
          <ProjectGallerySection
            galleryImages={galleryImages}
            className="border-t border-border/50 rounded-none border-x-0 border-b-0"
          />

          {/* 8. SOCIAL SHARING BAR */}
          <div className="px-6 sm:px-8 lg:px-10 py-6 border-t border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border/60">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#011A42] dark:text-zinc-300">
                  Chia sẻ dự án:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Chia sẻ trên Facebook"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-surface text-text-muted hover:text-primary hover:border-primary/50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Chia sẻ trên Twitter / X"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-surface text-text-muted hover:text-primary hover:border-primary/50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title="Sao chép liên kết dự án"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-surface text-text-muted hover:text-primary hover:border-primary/50 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copiedLink ? (
                      <span className="text-xs font-bold text-emerald-600">✓</span>
                    ) : (
                      <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-primary uppercase tracking-wider cursor-default">
                <span>Xem tất cả dự án</span>
                <span>→</span>
              </span>
            </div>
          </div>

          {/* 9. RELATED PROJECTS (Preview simulation) */}
          <section className="px-6 sm:px-8 lg:px-10 pb-10" aria-label="Dự án liên quan">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg sm:text-xl font-bold uppercase text-[#011A42] dark:text-white font-mono">
                Dự án liên quan
              </h3>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary cursor-default">
                Xem thêm →
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                {
                  title: "Khảo sát địa hình 3D Bán đảo Sơn Trà",
                  category: "Khảo sát địa hình",
                  location: provinceName || "Đà Nẵng",
                  image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=80",
                },
                {
                  title: "Bay quét LiDAR tuyến cao tốc Bắc Nam",
                  category: "Giao thông & Hạ tầng",
                  location: provinceName || "Gia Lai",
                  image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
                },
                {
                  title: "Số hoá mô hình BIM Đô thị sinh thái",
                  category: "Đô thị sinh thái",
                  location: provinceName || "Bình Định",
                  image: "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=600&auto=format&fit=crop&q=80",
                },
              ].map((rel, i) => (
                <div
                  key={i}
                  className="group block rounded-xl border border-border/80 bg-surface overflow-hidden shadow-2xs transition-all hover:border-primary/50"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rel.image}
                      alt={rel.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase text-primary tracking-wider mb-1.5 font-mono">
                      {rel.category}
                    </p>
                    <h4 className="text-xs sm:text-sm font-bold text-[#011A42] dark:text-white line-clamp-2 uppercase group-hover:text-primary transition-colors">
                      {rel.title}
                    </h4>
                    <span className="text-[11px] text-text-muted font-mono flex items-center gap-1 mt-2">
                      <span>📍</span>
                      <span>{rel.location}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 10. BACK TO PROJECTS BUTTON */}
          <div className="pb-10 text-center">
            <span className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-surface text-text font-mono text-xs font-bold uppercase tracking-widest shadow-2xs cursor-default">
              ← Quay lại danh sách dự án
            </span>
          </div>

          {/* 11. UNIFIED CTA SECTION */}
          <section className="border-t border-border/60 bg-surface-muted/30 p-8 sm:p-12 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Triển khai thực tế
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-tight text-[#011A42] dark:text-white">
                BẠN CẦN GIẢI PHÁP TƯƠNG TỰ CHO CÔNG TRÌNH CỦA MÌNH?
              </h3>
              <p className="text-xs sm:text-sm text-[#6C7E96] dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
                Đội ngũ kỹ sư và chuyên gia công nghệ VDCD sẵn sàng khảo sát thực địa và tư vấn phương án tối ưu.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm cursor-default">
                  <span>✉</span>
                  <span>Liên hệ tư vấn dự án</span>
                </span>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-surface text-text font-mono text-xs font-bold uppercase tracking-wider shadow-2xs cursor-default">
                  <span>Xem các dự án khác</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
