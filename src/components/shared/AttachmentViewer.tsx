"use client";

import { useState } from "react";

export type AttachmentType = "pdf" | "image" | "document" | "unknown";

/**
 * Detect attachment file type from URL.
 * Strips query params before checking extension.
 */
export function getAttachmentType(url: string): AttachmentType {
  try {
    const pathname = new URL(url, "https://placeholder.com").pathname.toLowerCase();
    if (pathname.endsWith(".pdf")) return "pdf";
    if (/\.(jpe?g|png|webp|gif|bmp|svg)$/.test(pathname)) return "image";
    if (/\.(docx?|odt|rtf)$/.test(pathname)) return "document";
    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Extract a readable filename from a URL.
 */
export function getFilename(url: string): string {
  try {
    const pathname = new URL(url, "https://placeholder.com").pathname;
    return decodeURIComponent(pathname.split("/").pop() || "tài liệu");
  } catch {
    return "tài liệu";
  }
}

export interface AttachmentViewerProps {
  url: string;
  title?: string;
  className?: string;
}

export function AttachmentViewer({ url, title, className = "" }: AttachmentViewerProps) {
  const [iframeError, setIframeError] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const type = getAttachmentType(url);
  const filename = getFilename(url);
  const documentTitle = title || filename;

  const downloadLink = (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
      </svg>
      Tải xuống
    </a>
  );

  const openInNewTab = (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text hover:underline"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
      </svg>
      Mở tab mới
    </a>
  );

  // PDF → iframe viewer with Google Docs fallback
  if (type === "pdf") {
    const viewerUrl = useGoogleViewer
      ? `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
      : url;

    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-danger">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-text">{filename}</span>
          </div>
          <div className="flex items-center gap-3">
            {!useGoogleViewer && iframeError && (
              <button
                type="button"
                onClick={() => {
                  setUseGoogleViewer(true);
                  setIframeError(false);
                }}
                className="text-sm font-medium text-warning hover:underline"
              >
                Thử Google Viewer
              </button>
            )}
            {useGoogleViewer && (
              <button
                type="button"
                onClick={() => {
                  setUseGoogleViewer(false);
                  setIframeError(false);
                }}
                className="text-sm font-medium text-text-muted hover:underline"
              >
                Xem trực tiếp
              </button>
            )}
            {openInNewTab}
            {downloadLink}
          </div>
        </div>
        {!iframeError ? (
          <div className="overflow-hidden rounded-md border border-border">
            <iframe
              src={viewerUrl}
              title={`Tài liệu - ${documentTitle}`}
              className="h-[700px] w-full"
              onError={() => setIframeError(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-md border border-border bg-surface-muted py-12">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mb-3 h-8 w-8 text-text-muted">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z" clipRule="evenodd" />
            </svg>
            <p className="mb-2 text-sm text-text-muted">Không thể hiển thị PDF trực tiếp.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setUseGoogleViewer(true);
                  setIframeError(false);
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Thử Google Docs Viewer
              </button>
              {downloadLink}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Image → inline preview
  if (type === "image") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text">{filename}</span>
          <div className="flex items-center gap-3">
            {openInNewTab}
            {downloadLink}
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Đính kèm: ${documentTitle}`}
            className="max-h-[600px] w-full object-contain bg-surface-muted"
          />
        </div>
      </div>
    );
  }

  // DOC/DOCX/unknown → download link with icon
  return (
    <div className={`flex items-center gap-3 rounded-md border border-border bg-surface-muted p-4 ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-info shrink-0">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{filename}</p>
        <p className="text-xs text-text-muted">
          {type === "document" ? "File Word — không thể xem trực tiếp" : "Tệp đính kèm"}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {openInNewTab}
        {downloadLink}
      </div>
    </div>
  );
}
