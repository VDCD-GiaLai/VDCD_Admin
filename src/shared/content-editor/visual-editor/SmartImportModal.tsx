"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import type { ContentBlock } from "../model/document.types";
import type { ImageBlock, HeadingBlock } from "@/types/slide-detail-blog";
import {
  parseHtmlToBlocks,
  parsePlainTextToBlocks,
  uploadEmbeddedImages,
  isUploadCandidate,
} from "./quick-import";

export interface SmartImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (blocks: ContentBlock[]) => void;
}

type MainTab = "quick" | "smart";
type SmartInputMode = "paste" | "text";
type ProcessingState = "idle" | "uploading" | "preview" | "processing-ai" | "error";

/**
 * Smart & Quick Import Modal
 * - Tab 1 (Quick Import): Instant client-side parsing from Google Docs/Word,
 *   preserving styles, alignments, colors, tables, and auto-uploading images to CDN.
 * - Tab 2 (Smart Import): AI-powered restructuring using Google Gemini Flash.
 */
export function SmartImportModal({ open, onClose, onImport }: SmartImportModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("quick");

  // ── Quick Import States ──
  const [quickBlocks, setQuickBlocks] = useState<ContentBlock[]>([]);
  const [quickState, setQuickState] = useState<ProcessingState>("idle");
  const [quickError, setQuickError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const quickPasteAreaRef = useRef<HTMLDivElement>(null);

  // ── Smart (AI) Import States ──
  const [smartMode, setSmartMode] = useState<SmartInputMode>("paste");
  const [smartRawText, setSmartRawText] = useState("");
  const [smartPastedHtml, setSmartPastedHtml] = useState("");
  const [smartState, setSmartState] = useState<ProcessingState>("idle");
  const [smartError, setSmartError] = useState("");
  const [smartPreviewBlocks, setSmartPreviewBlocks] = useState<ContentBlock[]>([]);
  const smartPasteAreaRef = useRef<HTMLDivElement>(null);

  // Block counts for Quick Import preview
  const quickStats = useMemo(() => {
    const counts = { headings: 0, paragraphs: 0, images: 0, lists: 0, quotes: 0, uploadCandidates: 0 };
    for (const b of quickBlocks) {
      if (b.type === "heading") counts.headings++;
      else if (b.type === "paragraph") counts.paragraphs++;
      else if (b.type === "image") {
        counts.images++;
        const img = b as ImageBlock;
        if (isUploadCandidate(img.url) || (img.secondaryUrl && isUploadCandidate(img.secondaryUrl))) {
          counts.uploadCandidates++;
        }
      } else if (b.type === "list") counts.lists++;
      else if (b.type === "quote") counts.quotes++;
    }
    return counts;
  }, [quickBlocks]);

  // ── Quick Import Handlers ──
  const handleQuickPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const rtf = e.clipboardData.getData("text/rtf");
    const text = e.clipboardData.getData("text/plain");

    setQuickError("");

    let blocks: ContentBlock[] = [];
    if (html && html.trim().length > 20) {
      blocks = parseHtmlToBlocks(html, rtf);
    } else if (text && text.trim().length > 0) {
      blocks = parsePlainTextToBlocks(text);
    }

    if (blocks.length > 0) {
      setQuickBlocks(blocks);
      setQuickState("preview");
    } else {
      setQuickError("Không tìm thấy nội dung hợp lệ từ bảng tạm. Vui lòng thử lại.");
    }
  }, []);

  const handleQuickConfirm = useCallback(async () => {
    if (quickBlocks.length === 0) return;

    // Check if any images need uploading to CDN
    const hasImagesToUpload = quickStats.uploadCandidates > 0;

    if (hasImagesToUpload) {
      setQuickState("uploading");
      setUploadProgress("Đang chuẩn bị tải ảnh lên...");

      try {
        const result = await uploadEmbeddedImages(quickBlocks, (info) => {
          setUploadProgress(info.message || `Đang tải lên ảnh ${info.current}/${info.total}...`);
        });

        onImport(result.blocks);
        // Reset state & close
        setQuickBlocks([]);
        setQuickState("idle");
        onClose();
      } catch (err) {
        console.error("Lỗi tải ảnh lên CDN:", err);
        // Fallback: import blocks anyway so user doesn't lose text
        onImport(quickBlocks);
        setQuickBlocks([]);
        setQuickState("idle");
        onClose();
      }
    } else {
      onImport(quickBlocks);
      setQuickBlocks([]);
      setQuickState("idle");
      onClose();
    }
  }, [quickBlocks, quickStats.uploadCandidates, onImport, onClose]);

  const handleQuickReset = useCallback(() => {
    setQuickBlocks([]);
    setQuickState("idle");
    setQuickError("");
    setUploadProgress("");
  }, []);

  // ── Smart (AI) Import Handlers ──
  const handleSmartPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html && html.trim().length > 50) {
      setSmartPastedHtml(html);
      setSmartRawText(text);
      setSmartMode("paste");
    } else {
      setSmartRawText(text);
      setSmartPastedHtml("");
      setSmartMode("text");
    }
  }, []);

  const handleSmartProcess = useCallback(async () => {
    const content = smartPastedHtml || smartRawText;
    if (!content.trim()) return;

    setSmartState("processing-ai");
    setSmartError("");

    try {
      const res = await fetch("/api/smart-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mode: smartPastedHtml ? "html" : "text",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSmartError(data.error || "Lỗi xử lý AI");
        setSmartState("error");
        return;
      }

      setSmartPreviewBlocks(data.blocks as ContentBlock[]);
      setSmartState("preview");
    } catch {
      setSmartError("Không thể kết nối server AI. Vui lòng kiểm tra lại cấu hình API key.");
      setSmartState("error");
    }
  }, [smartPastedHtml, smartRawText]);

  const handleSmartConfirm = useCallback(() => {
    onImport(smartPreviewBlocks);
    setSmartRawText("");
    setSmartPastedHtml("");
    setSmartPreviewBlocks([]);
    setSmartState("idle");
    onClose();
  }, [smartPreviewBlocks, onImport, onClose]);

  const handleSmartReset = useCallback(() => {
    setSmartRawText("");
    setSmartPastedHtml("");
    setSmartPreviewBlocks([]);
    setSmartState("idle");
    setSmartError("");
  }, []);

  if (!open) return null;

  const smartHasContent = (smartPastedHtml || smartRawText).trim().length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={quickState === "uploading" ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">Nhập nội dung vào bài viết</h2>
              <p className="text-xs text-text-muted">Dán từ Google Docs, Word hoặc dùng AI để tự động tạo cấu trúc</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={quickState === "uploading"}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* 2 Main Mode Tabs */}
        <div className="flex border-b border-border bg-surface-muted/30 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("quick")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "quick"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <span className="text-sm">⚡</span>
            <span>Quick Import (Docs/Word & Tự tải ảnh)</span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Khuyên dùng
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("smart")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "smart"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <span className="text-sm">🤖</span>
            <span>Smart Import (AI Gemini)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ══════════════════════════════════════════════════ */}
          {/* TAB 1: QUICK IMPORT                                */}
          {/* ══════════════════════════════════════════════════ */}
          {activeTab === "quick" && (
            <div className="space-y-4">
              {quickState === "idle" || quickState === "error" ? (
                <div className="space-y-4">
                  {/* Paste Zone */}
                  <div
                    ref={quickPasteAreaRef}
                    onPaste={handleQuickPaste}
                    contentEditable
                    suppressContentEditableWarning
                    tabIndex={0}
                    className="min-h-[280px] max-h-[420px] overflow-y-auto rounded-xl border-2 border-dashed border-border p-6 text-sm text-text focus:border-primary focus:outline-none transition-colors cursor-text"
                  >
                    <div className="flex flex-col items-center justify-center py-12 text-center pointer-events-none select-none">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                          <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-base font-semibold text-text">Dán toàn bộ nội dung Docs/Word vào đây</p>
                      <p className="mt-1.5 max-w-md text-xs text-text-muted leading-relaxed">
                        Bấm <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] shadow-xs">Ctrl + V</kbd> hoặc <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] shadow-xs">⌘ + V</kbd> sau khi sao chép từ Google Docs hoặc Microsoft Word.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-text-muted">
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1">
                          ✓ Giữ nguyên in đậm, nghiêng, màu sắc
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1">
                          ✓ Tự động nhận diện tiêu đề & danh sách
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1">
                          ✓ Tự tải ảnh lên CDN vĩnh viễn
                        </span>
                      </div>
                    </div>
                  </div>

                  {quickError && (
                    <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger">
                      ⚠️ {quickError}
                    </div>
                  )}
                </div>
              ) : quickState === "uploading" ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <p className="text-sm font-semibold text-text">{uploadProgress || "Đang tải ảnh lên máy chủ..."}</p>
                  <p className="mt-1 text-xs text-text-muted">Ảnh đang được tải lên CDN ImageKit. Vui lòng không đóng cửa sổ.</p>
                </div>
              ) : quickState === "preview" ? (
                <div className="space-y-4">
                  {/* Summary bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-muted/50 p-3.5 border border-border">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-text">
                        ✅ Nhận diện được {quickBlocks.length} khối nội dung:
                      </span>
                      {quickStats.headings > 0 && (
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {quickStats.headings} tiêu đề
                        </span>
                      )}
                      {quickStats.paragraphs > 0 && (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {quickStats.paragraphs} đoạn văn
                        </span>
                      )}
                      {quickStats.images > 0 && (
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {quickStats.images} ảnh {quickStats.uploadCandidates > 0 ? `(sẽ upload ${quickStats.uploadCandidates})` : ""}
                        </span>
                      )}
                      {quickStats.lists > 0 && (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {quickStats.lists} danh sách
                        </span>
                      )}
                      {quickStats.quotes > 0 && (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          {quickStats.quotes} trích dẫn
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickReset}
                      className="text-xs text-text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      ← Dán lại nội dung khác
                    </button>
                  </div>

                  {/* Preview block list */}
                  <div className="max-h-[380px] overflow-y-auto rounded-xl border border-border divide-y divide-border bg-surface">
                    {quickBlocks.map((block, idx) => (
                      <div key={block.id || idx} className="p-3.5 hover:bg-surface-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Type badge */}
                          <span className={`shrink-0 mt-0.5 inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            block.type === "heading"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : block.type === "paragraph"
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                : block.type === "image"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                  : block.type === "list"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          }`}>
                            {block.type === "heading" ? `H${(block as HeadingBlock).level}` : block.type}
                          </span>

                          {/* Block Preview Content */}
                          <div className="flex-1 min-w-0">
                            {block.type === "image" ? (
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={(block as ImageBlock).url}
                                  alt={(block as ImageBlock).alt || "Preview"}
                                  className="h-16 w-24 object-cover rounded-lg border border-border"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-text truncate">
                                    {(block as ImageBlock).caption || (block as ImageBlock).alt || "Hình ảnh bài viết"}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-text-muted truncate">
                                    {(block as ImageBlock).url.startsWith("data:")
                                      ? "Ảnh nhúng (Base64) — sẽ tự động upload lên CDN khi nhập"
                                      : (block as ImageBlock).url}
                                  </p>
                                </div>
                              </div>
                            ) : block.type === "list" && "items" in block ? (
                              <div className="text-xs text-text space-y-1">
                                <p className="font-semibold text-text-muted">
                                  Danh sách {(block as { listType?: string }).listType === "ordered" ? "thứ tự" : "gạch đầu dòng"} ({(block as { items: unknown[] }).items.length} mục):
                                </p>
                                <ul className="list-disc pl-4 space-y-0.5 text-text-muted">
                                  {(block as { items: { content?: string }[] }).items.slice(0, 3).map((it, iIdx) => (
                                    <li key={iIdx} className="truncate" dangerouslySetInnerHTML={{ __html: it.content || "" }} />
                                  ))}
                                  {(block as { items: unknown[] }).items.length > 3 && (
                                    <li className="text-text-muted/60 italic">...và thêm {(block as { items: unknown[] }).items.length - 3} mục nữa</li>
                                  )}
                                </ul>
                              </div>
                            ) : "text" in block ? (
                              <div
                                className="text-xs text-text line-clamp-3 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: (block as { text: string }).text }}
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* TAB 2: SMART IMPORT (AI GEMINI)                    */}
          {/* ══════════════════════════════════════════════════ */}
          {activeTab === "smart" && (
            <div className="space-y-4">
              {smartState === "idle" || smartState === "error" ? (
                <div className="space-y-4">
                  {/* Mode tabs */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSmartMode("paste")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        smartMode === "paste"
                          ? "bg-primary/10 text-primary"
                          : "text-text-muted hover:bg-surface-muted"
                      }`}
                    >
                      📋 Paste từ Word/Docs
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmartMode("text")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        smartMode === "text"
                          ? "bg-primary/10 text-primary"
                          : "text-text-muted hover:bg-surface-muted"
                      }`}
                    >
                      ✏️ Nhập text thuần
                    </button>
                  </div>

                  {smartMode === "paste" ? (
                    <div
                      ref={smartPasteAreaRef}
                      onPaste={handleSmartPaste}
                      contentEditable
                      suppressContentEditableWarning
                      className="min-h-[260px] max-h-[380px] overflow-y-auto rounded-xl border-2 border-dashed border-border p-4 text-sm text-text focus:border-primary focus:outline-none transition-colors"
                    >
                      {!smartHasContent && (
                        <div className="flex flex-col items-center justify-center py-12 text-center pointer-events-none">
                          <p className="text-sm font-medium text-text-muted">Paste nội dung vào đây</p>
                          <p className="mt-1 text-xs text-text-muted/70">Ctrl+V hoặc ⌘V — AI sẽ phân tích và tạo cấu trúc chuẩn</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={smartRawText}
                      onChange={(e) => setSmartRawText(e.target.value)}
                      placeholder="Nhập hoặc paste nội dung text thuần vào đây...&#10;&#10;AI sẽ tự động phân tích và tạo cấu trúc:&#10;- Tiêu đề → Heading blocks&#10;- Đoạn văn → Paragraph blocks&#10;- Danh sách → List blocks"
                      className="min-h-[260px] w-full rounded-xl border border-border bg-surface-muted/30 p-4 text-sm text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none resize-y transition-colors"
                    />
                  )}

                  {smartError && (
                    <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger">
                      ⚠️ {smartError}
                    </div>
                  )}

                  <div className="rounded-lg bg-primary/5 px-4 py-3">
                    <p className="text-xs text-text-muted">
                      <strong className="text-text">💡 Gợi ý:</strong> Chế độ AI sử dụng Gemini Flash để phân tích và chuẩn hóa lại nội dung nếu tài liệu gốc bị lộn xộn.
                    </p>
                  </div>
                </div>
              ) : smartState === "processing-ai" ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <p className="text-sm font-medium text-text">AI đang phân tích và cấu trúc nội dung...</p>
                  <p className="mt-1 text-xs text-text-muted">Thường mất 3-8 giây</p>
                </div>
              ) : smartState === "preview" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text">
                      ✅ AI đã tạo {smartPreviewBlocks.length} khối nội dung
                    </p>
                    <button
                      type="button"
                      onClick={handleSmartReset}
                      className="text-xs text-text-muted hover:text-text transition-colors"
                    >
                      ← Nhập lại
                    </button>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto rounded-xl border border-border divide-y divide-border">
                    {smartPreviewBlocks.map((block, i) => (
                      <div key={block.id || i} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                            {block.type === "heading" && "level" in block ? `H${(block as { level: number }).level}` : block.type}
                          </span>
                          <div className="flex-1 text-xs text-text line-clamp-2">
                            {"text" in block
                              ? String((block as { text: string }).text).replace(/<[^>]+>/g, "").substring(0, 140)
                              : block.type === "list" && "items" in block
                                ? `${(block as { items: unknown[] }).items.length} mục danh sách`
                                : "..."}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface-muted/20">
          <button
            type="button"
            onClick={onClose}
            disabled={quickState === "uploading"}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-text-muted hover:bg-surface-muted transition-colors disabled:opacity-40"
          >
            Đóng
          </button>

          {activeTab === "quick" ? (
            quickState === "preview" ? (
              <button
                type="button"
                onClick={handleQuickConfirm}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
              >
                {quickStats.uploadCandidates > 0
                  ? `Tải ${quickStats.uploadCandidates} ảnh lên & Thêm ${quickBlocks.length} khối vào bài`
                  : `Thêm ${quickBlocks.length} khối vào bài`}
              </button>
            ) : null
          ) : (
            smartState === "preview" ? (
              <button
                type="button"
                onClick={handleSmartConfirm}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
              >
                Thêm {smartPreviewBlocks.length} khối vào bài
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSmartProcess}
                disabled={!smartHasContent || smartState === "processing-ai"}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {smartState === "processing-ai" ? "Đang xử lý..." : "🤖 AI phân tích nội dung"}
              </button>
            )
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
