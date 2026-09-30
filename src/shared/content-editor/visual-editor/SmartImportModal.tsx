"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ContentBlock } from "../model/document.types";
import { parseWordHtmlToBlocks, parsePlainTextToBlocks } from "../paste/wordHtmlParser";

export interface SmartImportModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onImport: (blocks: ContentBlock[]) => void;
  initialBlocks?: ContentBlock[];
}

type ImportMode = "paste" | "text";
type ProcessingState = "idle" | "processing" | "preview" | "error";

/**
 * Smart Import Modal — paste from Word/Docs or raw text.
 * Automatically parses full content: Headings, Paragraphs, Images (data & web URLs),
 * Lists, and rich styles (color, align, bold, italic).
 * Includes optional AI refinement via Google Gemini.
 */
export function SmartImportModal({
  open,
  isOpen,
  onClose,
  onImport,
  initialBlocks,
}: SmartImportModalProps) {
  const isModalOpen = open ?? isOpen ?? false;

  const [mode, setMode] = useState<ImportMode>("paste");
  const [rawText, setRawText] = useState("");
  const [pastedHtml, setPastedHtml] = useState("");
  const [state, setState] = useState<ProcessingState>("idle");
  const [error, setError] = useState("");
  const [previewBlocks, setPreviewBlocks] = useState<ContentBlock[]>([]);

  // Sync initial blocks if provided
  useEffect(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      setPreviewBlocks(initialBlocks);
      setState("preview");
    }
  }, [initialBlocks]);

  // Calculate block statistics
  const stats = useMemo(() => {
    const counts = {
      headings: 0,
      paragraphs: 0,
      images: 0,
      lists: 0,
      quotes: 0,
    };
    for (const b of previewBlocks) {
      if (b.type === "heading") counts.headings++;
      else if (b.type === "paragraph") counts.paragraphs++;
      else if (b.type === "image") counts.images++;
      else if (b.type === "list") counts.lists++;
      else if (b.type === "quote") counts.quotes++;
    }
    return counts;
  }, [previewBlocks]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const rtf = e.clipboardData.getData("text/rtf");
    const text = e.clipboardData.getData("text/plain");

    let parsed: ContentBlock[] = [];

    if (html && html.trim().length > 20) {
      setPastedHtml(html);
      setRawText(text);
      parsed = parseWordHtmlToBlocks(html, rtf);
    } else if (text && text.trim().length > 0) {
      setRawText(text);
      setPastedHtml("");
      parsed = parsePlainTextToBlocks(text);
    }

    if (parsed.length > 0) {
      setPreviewBlocks(parsed);
      setState("preview");
      setError("");
    } else {
      setError("Không tìm thấy nội dung hợp lệ để chuyển đổi. Vui lòng thử lại.");
    }
  }, []);

  const handleManualConvert = useCallback(() => {
    if (!rawText.trim()) return;
    const parsed = parsePlainTextToBlocks(rawText);
    if (parsed.length > 0) {
      setPreviewBlocks(parsed);
      setState("preview");
      setError("");
    } else {
      setError("Không thể phân tích nội dung văn bản này.");
    }
  }, [rawText]);

  // Optional AI refinement
  const handleAiRefine = useCallback(async () => {
    const content = pastedHtml || rawText;
    if (!content.trim()) return;

    setState("processing");
    setError("");

    try {
      const res = await fetch("/api/smart-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mode: pastedHtml ? "html" : "text",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Lỗi AI xử lý");
        setState("preview"); // keep current preview
        return;
      }

      setPreviewBlocks(data.blocks as ContentBlock[]);
      setState("preview");
    } catch {
      setError("Không thể kết nối đến AI server. Đang giữ nguyên bản parse từ Word.");
      setState("preview");
    }
  }, [pastedHtml, rawText]);

  const handleConfirm = useCallback(() => {
    onImport(previewBlocks);
    setRawText("");
    setPastedHtml("");
    setPreviewBlocks([]);
    setState("idle");
    onClose();
  }, [previewBlocks, onImport, onClose]);

  const handleReset = useCallback(() => {
    setRawText("");
    setPastedHtml("");
    setPreviewBlocks([]);
    setState("idle");
    setError("");
  }, []);

  if (!isModalOpen) return null;

  const hasContent = (pastedHtml || rawText).trim().length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM12.75 12a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V18a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V12z" clipRule="evenodd" />
                <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">Dán & Nhập nội dung từ Word / Docs</h2>
              <p className="text-xs text-text-muted">Tự động giữ nguyên đầy đủ hình ảnh, tiêu đề, màu sắc, căn lề & danh sách</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {state === "idle" || state === "error" ? (
            <div className="space-y-4">
              {/* Mode tabs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("paste")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    mode === "paste"
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-text-muted hover:bg-surface-muted"
                  }`}
                >
                  📋 Dán trực tiếp từ Word / Docs (Khuyên dùng)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    mode === "text"
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-text-muted hover:bg-surface-muted"
                  }`}
                >
                  ✏️ Nhập văn bản thuần
                </button>
              </div>

              {mode === "paste" ? (
                <div
                  tabIndex={0}
                  onPaste={handlePaste}
                  className="min-h-[260px] max-h-[380px] overflow-y-auto rounded-xl border-2 border-dashed border-primary/30 bg-primary/2 hover:border-primary/60 p-6 text-sm text-text focus:border-primary focus:outline-none transition-all cursor-pointer flex flex-col items-center justify-center text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                      <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-base font-medium text-text">Bấm vào đây rồi nhấn <kbd className="rounded-md bg-surface-muted px-2 py-0.5 font-mono text-xs font-semibold text-text shadow-xs">Ctrl + V</kbd> để dán</p>
                  <p className="mt-2 text-xs text-text-muted max-w-md">
                    Hỗ trợ trích xuất <strong>toàn bộ hình ảnh</strong>, tiêu đề các cấp, đoạn văn in đậm/nghiêng/màu sắc, và danh sách từ Microsoft Word hoặc Google Docs.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Dán hoặc gõ nội dung văn bản vào đây...&#10;&#10;Hệ thống tự động nhận diện:&#10;- Tiêu đề theo số: 1. Mục 1, 2. Mục 2&#10;- Danh sách: dấu gạch ngang (-), hoa thị (*), số thứ tự&#10;- Đoạn văn bản cách dòng"
                    className="min-h-[260px] w-full rounded-xl border border-border bg-surface-muted/30 p-4 text-sm text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none resize-y transition-colors"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleManualConvert}
                      disabled={!rawText.trim()}
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 disabled:opacity-40"
                    >
                      ⚡ Chuyển thành khối nội dung
                    </button>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : state === "processing" ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-sm font-medium text-text">AI đang phân tích và tối ưu hóa cấu trúc...</p>
              <p className="mt-1 text-xs text-text-muted">Vui lòng đợi giây lát</p>
            </div>
          ) : state === "preview" ? (
            <div className="space-y-4">
              {/* Summary Stats bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-muted/50 p-3 border border-border">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-text">
                    🎉 Đã nhận diện {previewBlocks.length} khối:
                  </span>
                  {stats.headings > 0 && (
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {stats.headings} tiêu đề
                    </span>
                  )}
                  {stats.paragraphs > 0 && (
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {stats.paragraphs} đoạn văn
                    </span>
                  )}
                  {stats.images > 0 && (
                    <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      🖼️ {stats.images} hình ảnh
                    </span>
                  )}
                  {stats.lists > 0 && (
                    <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      📋 {stats.lists} danh sách
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-text-muted hover:text-danger transition-colors font-medium"
                >
                  ✕ Dán nội dung khác
                </button>
              </div>

              {/* Notice if error during AI refinement */}
              {error && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  ℹ️ {error}
                </div>
              )}

              {/* Block Cards List */}
              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border divide-y divide-border bg-surface">
                {previewBlocks.map((block, i) => (
                  <div key={block.id || i} className="p-3.5 hover:bg-surface-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Badge indicator */}
                      <span className={`mt-0.5 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        block.type === "heading"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : block.type === "paragraph"
                            ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            : block.type === "list"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : block.type === "image"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                : "bg-gray-100 text-gray-600"
                      }`}>
                        {block.type === "heading"
                          ? `H${"level" in block ? (block as { level: number }).level : "?"}`
                          : block.type}
                      </span>

                      {/* Content preview */}
                      <div className="flex-1 min-w-0">
                        {block.type === "heading" && "text" in block && (
                          <div className="space-y-1">
                            <h4
                              className="text-sm font-bold text-text truncate"
                              style={{
                                color: (block as { color?: string }).color,
                                textAlign: (block as { textAlign?: "left" | "center" | "right" | "justify" }).textAlign,
                              }}
                            >
                              {(block as { text: string }).text.replace(/<[^>]+>/g, "")}
                            </h4>
                            {(block as { color?: string }).color && (
                              <span className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
                                <span className="inline-block w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: (block as { color?: string }).color }} />
                                {(block as { color?: string }).color}
                              </span>
                            )}
                          </div>
                        )}

                        {block.type === "paragraph" && "text" in block && (
                          <div className="space-y-1">
                            <p
                              className="text-xs text-text line-clamp-2 leading-relaxed"
                              style={{
                                color: (block as { color?: string }).color,
                                textAlign: (block as { textAlign?: "left" | "center" | "right" | "justify" }).textAlign,
                              }}
                              dangerouslySetInnerHTML={{
                                __html: (block as { text: string }).text,
                              }}
                            />
                            {(block as { textAlign?: string }).textAlign && (block as { textAlign?: string }).textAlign !== "left" && (
                              <span className="text-[10px] text-text-muted">
                                Căn: {(block as { textAlign?: string }).textAlign}
                              </span>
                            )}
                          </div>
                        )}

                        {block.type === "image" && "url" in block && (
                          <div className="flex items-center gap-3">
                            {/* Image thumbnail */}
                            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={(block as { url: string }).url}
                                alt={(block as { alt?: string }).alt || ""}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 text-xs">
                              <p className="font-medium text-text truncate">
                                {(block as { alt?: string }).alt || "Hình ảnh"}
                              </p>
                              {(block as { caption?: string | null }).caption && (
                                <p className="text-[11px] text-text-muted italic truncate">
                                  Chú thích: {(block as { caption?: string | null }).caption}
                                </p>
                              )}
                              <p className="text-[10px] text-text-muted font-mono truncate">
                                {(block as { url: string }).url.startsWith("data:")
                                  ? "Dữ liệu ảnh nhúng trực tiếp (Base64)"
                                  : (block as { url: string }).url}
                              </p>
                            </div>
                          </div>
                        )}

                        {block.type === "list" && "items" in block && (
                          <div className="text-xs text-text space-y-1">
                            <p className="text-text-muted">
                              {(block as { items: unknown[] }).items.length} mục{" "}
                              {("listType" in block && (block as { listType: string }).listType === "ordered")
                                ? "(Đánh số)"
                                : "(Gạch đầu dòng)"}
                            </p>
                            <ul className="list-disc list-inside text-text/80 text-[11px] max-h-16 overflow-y-auto">
                              {(block as { items: { content: string }[] }).items.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="truncate">
                                  {item.content.replace(/<[^>]+>/g, "")}
                                </li>
                              ))}
                              {(block as { items: unknown[] }).items.length > 3 && (
                                <li className="text-text-muted italic">
                                  ...và {(block as { items: unknown[] }).items.length - 3} mục khác
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {block.type === "quote" && "text" in block && (
                          <p className="text-xs italic text-text-muted border-l-2 border-primary/40 pl-2 line-clamp-2">
                            {(block as { text: string }).text.replace(/<[^>]+>/g, "")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div>
            {state === "preview" && (
              <button
                type="button"
                onClick={handleAiRefine}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                title="Sử dụng Google Gemini AI để viết lại hoặc tái cấu trúc"
              >
                <span>🤖</span>
                <span>Tối ưu bằng AI</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted transition-colors"
            >
              Hủy
            </button>

            {state === "preview" ? (
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all flex items-center gap-1.5"
              >
                <span>Thêm {previewBlocks.length} khối vào bài</span>
                <span>→</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
