"use client";

import React, { useState } from "react";
import { DocumentContentRenderer } from "@/shared/content-editor";
import type { DocumentContent } from "@/shared/content-editor";
import type { ProjectImage, TechnicalHighlight } from "@/types/project";
import { ProjectHeaderBadges } from "./ProjectHeaderBadges";
import { ProjectSpecsSection } from "./ProjectSpecsSection";
import {
  ProjectChallengeSection,
  ProjectGallerySection,
} from "./ProjectExtraSections";

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
  content: DocumentContent;
  galleryImages?: ProjectImage[];
}

/**
 * PHASE 12 — Project Reader / Đọc bài
 *
 * Requirements:
 * - Read-only view (NO drag, NO toolbar, NO edit, NO delete, NO add block).
 * - Renders Title, Thumbnail, Project metadata, Content, and Gallery.
 * - Renders strictly from CURRENT LIVE STATE (unsaved state from Block Editor / Visual Editor / Form).
 * - Section 13: Strictly uses Shared Renderer (DocumentContentRenderer) for content.blocks.
 * - Section 14: Renders gallery images with captions and responsive sizing (small/large).
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
  content,
  galleryImages = [],
}: ProjectReaderProps) {
  const [viewport, setViewport] = useState<ProjectReaderViewport>("desktop");
  const currentConfig = VIEWPORT_CONFIG[viewport];
  const blocks = content?.blocks ?? [];
  const simulatedUrl = slug
    ? `vdcd.vn/du-an/${slug}`
    : "vdcd.vn/du-an/(chua-co-slug)";

  return (
    <div className="space-y-4">
      {/* Reader Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-surface px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-text">
            Chế độ đọc dự án hoàn chỉnh (Read-only View)
          </h3>
          <p className="text-xs text-text-muted">
            Hiển thị nội dung chính xác như trên website công khai, không có
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
          className={`${currentConfig.width} mx-auto rounded-xl border border-border/60 bg-surface shadow-xs overflow-hidden transition-all duration-300`}
        >
          {/* 1. HERO SECTION */}
          <header className="border-b border-border/50 p-6 sm:p-8 lg:p-10 space-y-6">
            {/* Badges Bar */}
            <ProjectHeaderBadges
              fieldName={fieldName}
              provinceName={provinceName}
              year={year}
            />

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text leading-tight">
              {title || (
                <span className="italic text-text-muted/50">
                  (Chưa có tên dự án)
                </span>
              )}
            </h1>

            {/* Overview */}
            {overview && (
              <div
                className="prose prose-sm max-w-none text-base text-text-muted leading-relaxed"
                dangerouslySetInnerHTML={{ __html: overview }}
              />
            )}

            {/* Thumbnail Banner */}
            {thumbnail && (
              <div className="overflow-hidden rounded-lg border border-border/60 bg-surface-muted shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail}
                  alt={title || "Project thumbnail"}
                  className="h-64 sm:h-80 lg:h-96 w-full object-cover"
                />
              </div>
            )}
          </header>

          {/* 2. PROJECT METADATA CARD (THÔNG SỐ DỰ ÁN & DỊCH VỤ) */}
          <ProjectSpecsSection
            discipline={discipline}
            provinceName={provinceName}
            year={year}
            services={services}
            technicalHighlights={technicalHighlights}
            interactive={false}
          />

          {/* 3. CHALLENGE SECTION */}
          <ProjectChallengeSection
            challenge={challenge}
            challengeImage={challengeImage}
            className="border-b border-border/50 rounded-none border-x-0 border-t-0"
          />

          {/* 4. MAIN ARTICLE CONTENT — SHARED RENDERER (SECTION 13) */}
          <div className="p-6 sm:p-8 lg:p-10 space-y-6">
            {blocks.length === 0 ? (
              <p className="text-center py-8 text-sm italic text-text-muted">
                Chưa có khối nội dung nào trong bài viết.
              </p>
            ) : (
              <DocumentContentRenderer blocks={blocks} />
            )}
          </div>

          {/* 6. GALLERY (SECTION 14) */}
          <ProjectGallerySection
            galleryImages={galleryImages}
            className="border-t border-border/50 rounded-none border-x-0 border-b-0"
          />
        </article>
      </div>
    </div>
  );
}
