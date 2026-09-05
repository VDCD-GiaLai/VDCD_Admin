"use client";

import React, { useState } from "react";
import { DocumentContentRenderer } from "./DocumentContentRenderer";
import type { DocumentContent, ViewportMode } from "../model/document.types";

export interface DocumentPreviewContainerProps {
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  shortDescription?: string | null;
  heroImageUrl?: string | null;
  content: DocumentContent;
  slug?: string | null;
  urlPrefix?: string;
  badge?: string | null;
}

const VIEWPORT_CONFIG: Record<
  ViewportMode,
  { label: string; maxWidth: string; icon: React.ReactNode }
> = {
  desktop: {
    label: "Desktop",
    maxWidth: "max-w-4xl",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5H3.5v-7.5zM5 13.5h10v-.25a.75.75 0 00-.75-.75H5.75a.75.75 0 00-.75.75v.25z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  tablet: {
    label: "Tablet",
    maxWidth: "max-w-2xl",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M5 1a3 3 0 00-3 3v12a3 3 0 003 3h10a3 3 0 003-3V4a3 3 0 00-3-3H5zm5 15.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  mobile: {
    label: "Mobile",
    maxWidth: "max-w-sm",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M8 16.25a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75z" />
        <path
          fillRule="evenodd"
          d="M4 4a3 3 0 013-3h6a3 3 0 013 3v12a3 3 0 01-3 3H7a3 3 0 01-3-3V4zm3-1.5A1.5 1.5 0 005.5 4v12A1.5 1.5 0 007 17.5h6a1.5 1.5 0 001.5-1.5V4A1.5 1.5 0 0013 2.5H7z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

/**
 * Pure Read-Only Article View Container (Tab "Đọc bài")
 *
 * Requirements:
 * - NO block border
 * - NO drag handle
 * - NO block toolbar
 * - NO delete button
 * - NO duplicate button
 * - NO insert zone
 * - NO selected block
 * - NO editor sidebar
 * - NO editing controls
 * - Reads directly from live unsaved form state without API refetch
 * - Responsive viewports: Desktop (900px), Tablet (672px), Mobile (384px)
 */
export function DocumentPreviewContainer({
  title,
  subtitle,
  excerpt,
  shortDescription,
  heroImageUrl,
  content,
  slug,
  urlPrefix = "vdcd.vn/chuong-trinh/",
  badge,
}: DocumentPreviewContainerProps) {
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const currentConfig = VIEWPORT_CONFIG[viewport];
  const blocks = content?.blocks ?? [];
  const displayExcerpt = excerpt ?? shortDescription;

  const simulatedUrl = slug ? `${urlPrefix}${slug}` : `${urlPrefix}...`;

  return (
    <div className="space-y-4">
      {/* Viewport Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted">
            Chế độ xem:
          </span>
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5">
            {(Object.entries(VIEWPORT_CONFIG) as [ViewportMode, typeof VIEWPORT_CONFIG[ViewportMode]][]).map(
              ([mode, config]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewport(mode)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    viewport === mode
                      ? "bg-surface font-semibold text-primary shadow-xs"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  {config.icon}
                  {config.label}
                </button>
              ),
            )}
          </div>
        </div>

        <span className="text-[11px] text-text-muted">
          {blocks.length} khối nội dung
        </span>
      </div>

      {/* Preview Frame */}
      <div className="rounded-xl border border-border bg-surface-muted/30 p-4 sm:p-6 lg:p-8">
        {/* Simulated browser chrome */}
        <div className="mb-4 flex items-center gap-1.5 pb-3 border-b border-border/60">
          <div className="h-2.5 w-2.5 rounded-full bg-danger/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-warning/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/40" />
          <div className="ml-3 flex-1 rounded-md bg-surface-muted px-3 py-1">
            <span className="text-[10px] text-text-muted/60">
              {simulatedUrl}
            </span>
          </div>
        </div>

        {/* Article Container — responsive via max-width */}
        <div
          className={`${currentConfig.maxWidth} mx-auto bg-surface rounded-lg shadow-xs border border-border/50 overflow-hidden transition-all duration-300`}
        >
          {/* Hero Section */}
          <div className="blog-preview-hero">
            {(() => {
              const heroMeta = content?.heroMeta;
              const heroPlacement = heroMeta?.placement ?? "above_title";
              const heroPosition = heroMeta?.position ?? "center";
              const heroCaption = heroMeta?.caption ?? "";

              const renderHeroMedia = () => (
                <div>
                  {heroImageUrl ? (
                    <div className="blog-preview-hero-image-wrapper">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroImageUrl}
                        alt={title || "Thumbnail"}
                        className="blog-preview-hero-image"
                        style={{ objectPosition: heroPosition }}
                      />
                    </div>
                  ) : null}

                  {heroCaption && (
                    <figcaption className="blog-preview-hero-caption">
                      {heroCaption}
                    </figcaption>
                  )}
                </div>
              );

              const renderHeroHeader = () => (
                <div className="space-y-2">
                  {badge && (
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {badge}
                    </span>
                  )}
                  {subtitle && (
                    <p className="blog-preview-subtitle">{subtitle}</p>
                  )}
                  <h1 className="blog-preview-title">
                    {title || (
                      <span className="italic text-text-muted/40">
                        (Chưa có tiêu đề)
                      </span>
                    )}
                  </h1>
                </div>
              );

              const renderHeroExcerpt = () => (
                <div>
                  {displayExcerpt && (
                    <p className="blog-preview-excerpt">{displayExcerpt}</p>
                  )}
                </div>
              );

              if (heroPlacement === "between_title_desc") {
                return (
                  <>
                    <div className="blog-preview-hero-text pb-3">
                      {renderHeroHeader()}
                    </div>
                    {renderHeroMedia()}
                    <div className="blog-preview-hero-text pt-3">
                      {renderHeroExcerpt()}
                    </div>
                  </>
                );
              }

              if (heroPlacement === "below_desc") {
                return (
                  <>
                    <div className="blog-preview-hero-text">
                      {renderHeroHeader()}
                      {renderHeroExcerpt()}
                    </div>
                    {renderHeroMedia()}
                  </>
                );
              }

              // Default: above_title
              return (
                <>
                  {renderHeroMedia()}
                  <div className="blog-preview-hero-text">
                    {renderHeroHeader()}
                    {renderHeroExcerpt()}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Content Body — pure render */}
          <div className="blog-preview-body">
            <DocumentContentRenderer blocks={blocks} />
          </div>
        </div>
      </div>
    </div>
  );
}
