"use client";

import React, { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { ContentBlock } from "../model/document.types";

export interface SmartImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (blocks: ContentBlock[]) => void;
}

type ImportMode = "paste" | "text";
type ProcessingState = "idle" | "processing" | "preview" | "error";

/**
 * Smart Import Modal — paste from Word/Docs or raw text.
 * Uses Gemini AI to intelligently structure content into blocks.
 */
export function SmartImportModal({ open, onClose, onImport }: SmartImportModalProps) {
  const [mode, setMode] = useState<ImportMode>("paste");
  const [rawText, setRawText] = useState("");
  const [pastedHtml, setPastedHtml] = useState("");
  const [state, setState] = useState<ProcessingState>("idle");
  const [error, setError] = useState("");
  const [previewBlocks, setPreviewBlocks] = useState<ContentBlock[]>([]);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html && html.trim().length > 50) {
      // Rich content from Word/Docs
      setPastedHtml(html);
      setRawText(text);
      setMode("paste");
    } else {
      // Plain text
      setRawText(text);
      setPastedHtml("");
      setMode("text");
    }
  }, []);

  const handleProcess = useCallback(async () => {
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
        setError(data.error || "Lỗi xử lý");
        setState("error");
        return;
      }

      setPreviewBlocks(data.blocks as ContentBlock[]);
      setState("preview");
    } catch {
      setError("Không thể kết nối server. Kiểm tra lại.");
      setState("error");
    }
  }, [pastedHtml, rawText]);

  const handleConfirm = useCallback(() => {
    onImport(previewBlocks);
    // Reset state
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

  if (!open) return null;

  const hasContent = (pastedHtml || rawText).trim().length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl">
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
              <h2 className="text-base font-semibold text-text">Nhập nội dung thông minh</h2>
              <p className="text-xs text-text-muted">Paste từ Word/Docs hoặc nhập text — AI tự tạo cấu trúc</p>
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
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:bg-surface-muted"
                  }`}
                >
                  📋 Paste từ Word/Docs
                </button>
                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    mode === "text"
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:bg-surface-muted"
                  }`}
                >
                  ✏️ Nhập text thuần
                </button>
              </div>

              {mode === "paste" ? (
                <div
                  ref={pasteAreaRef}
                  onPaste={handlePaste}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[280px] max-h-[400px] overflow-y-auto rounded-xl border-2 border-dashed border-border p-4 text-sm text-text focus:border-primary focus:outline-none transition-colors"
                  data-placeholder="Ctrl+V để paste nội dung từ Word, Google Docs, hoặc website..."
                  style={{
                    // Show placeholder when empty
                    ...(!(pastedHtml || rawText)
                      ? {}
                      : {}),
                  }}
                >
                  {!hasContent && (
                    <div className="flex flex-col items-center justify-center py-12 text-center pointer-events-none">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary/40">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                          <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-text-muted">Paste nội dung vào đây</p>
                      <p className="mt-1 text-xs text-text-muted/70">Ctrl+V hoặc ⌘V — hỗ trợ Word, Google Docs, website</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Nhập hoặc paste nội dung text thuần vào đây...&#10;&#10;AI sẽ tự động phân tích và tạo cấu trúc:&#10;- Tiêu đề → Heading blocks&#10;- Đoạn văn → Paragraph blocks&#10;- Danh sách → List blocks"
                  className="min-h-[280px] w-full rounded-xl border border-border bg-surface-muted/30 p-4 text-sm text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none resize-y transition-colors"
                />
              )}

              {/* Error */}
              {state === "error" && error && (
                <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  ⚠️ {error}
                </div>
              )}

              {/* Info */}
              <div className="rounded-lg bg-primary/5 px-4 py-3">
                <p className="text-xs text-text-muted">
                  <strong className="text-text">💡 Gợi ý:</strong>{" "}
                  AI sẽ tự nhận diện tiêu đề, đoạn văn, danh sách và tạo khối tương ứng. 
                  Bạn có thể xem trước và chỉnh sửa sau khi import.
                </p>
              </div>
            </div>
          ) : state === "processing" ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-sm font-medium text-text">AI đang phân tích nội dung...</p>
              <p className="mt-1 text-xs text-text-muted">Thường mất 3-8 giây</p>
            </div>
          ) : state === "preview" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text">
                  ✅ Đã tạo {previewBlocks.length} khối nội dung
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-text-muted hover:text-text transition-colors"
                >
                  ← Nhập lại
                </button>
              </div>

              {/* Preview blocks */}
              <div className="max-h-[400px] overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {previewBlocks.map((block, i) => (
                  <div key={block.id || i} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        block.type === "heading"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : block.type === "paragraph"
                            ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            : block.type === "list"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : block.type === "image"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-gray-100 text-gray-600"
                      }`}>
                        {block.type === "heading"
                          ? `H${"level" in block ? (block as { level: number }).level : "?"}`
                          : block.type}
                      </span>
                      <div className="flex-1 text-sm text-text line-clamp-2">
                        {"text" in block
                          ? String((block as { text: string }).text).replace(/<[^>]+>/g, "").substring(0, 120)
                          : block.type === "list" && "items" in block
                            ? `${(block as { items: unknown[] }).items.length} mục`
                            : block.type === "image" && "url" in block
                              ? (block as { url: string }).url
                              : "..."}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
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
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              Thêm {previewBlocks.length} khối vào bài
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProcess}
              disabled={!hasContent || state === "processing"}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {state === "processing" ? "Đang xử lý..." : "🤖 AI phân tích nội dung"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
