"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AppButton,
  useToast,
} from "@/components/ui";
import { exportBlogToHTML, exportBlogToJSON } from "../../utils/blog-exporter";
import type { SlideDetailBlogContent } from "@/types/slide-detail-blog";

export interface BlogExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | null;
  slug?: string | null;
  content: SlideDetailBlogContent;
  heroImageUrl?: string | null;
}

export function BlogExportModal({
  isOpen,
  onClose,
  title,
  subtitle,
  slug,
  content,
  heroImageUrl,
}: BlogExportModalProps) {
  const [activeTab, setActiveTab] = useState<"html" | "json">("html");
  const [copied, setCopied] = useState<boolean>(false);
  const { toast } = useToast();

  const fileNameBase = slug?.trim() || "bai-viet-vdcd";

  const exportedHtml = useMemo(() => {
    return exportBlogToHTML(content, {
      title: title || "Bài viết chưa đặt tiêu đề",
      subtitle: subtitle || undefined,
      heroImageUrl: heroImageUrl || undefined,
    });
  }, [title, subtitle, content, heroImageUrl]);

  const exportedJson = useMemo(() => {
    return exportBlogToJSON(content, {
      title: title || "Bài viết chưa đặt tiêu đề",
      subtitle: subtitle || undefined,
      heroImageUrl: heroImageUrl || undefined,
    });
  }, [title, subtitle, content, heroImageUrl]);

  const activeContent = activeTab === "html" ? exportedHtml : exportedJson;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      toast({
        title: "Đã sao chép vào bộ nhớ tạm",
        description: `Mã ${activeTab.toUpperCase()} đã sẵn sàng để dán.`,
        color: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Không thể sao chép",
        description: "Vui lòng chọn thủ công trong khung văn bản và nhấn Ctrl+C.",
        color: "danger",
      });
    }
  }, [activeContent, activeTab, toast]);

  const handleDownload = useCallback(() => {
    const isHtml = activeTab === "html";
    const mimeType = isHtml ? "text/html;charset=utf-8" : "application/json;charset=utf-8";
    const extension = isHtml ? "html" : "json";
    const filename = `${fileNameBase}.${extension}`;

    const blob = new Blob([activeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Đã tải xuống tệp tin",
      description: `Đã lưu tệp ${filename} về máy của bạn.`,
      color: "success",
    });
  }, [activeContent, activeTab, fileNameBase, toast]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v3.69l1.22-1.22a.75.75 0 111.06 1.06l-2.5 2.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 111.06-1.06l1.22 1.22V8.75z"
                clipRule="evenodd"
              />
            </svg>
            <span>Xuất dữ liệu bài viết (HTML / JSON)</span>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Tab buttons */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => setActiveTab("html")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "html"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-text-muted hover:text-text"
                }`}
              >
                Mã HTML độc lập (Semantic HTML5)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("json")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "json"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-text-muted hover:text-text"
                }`}
              >
                Dữ liệu JSON gốc (Backup / API)
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs"
              >
                {copied ? "✓ Đã chép" : "Sao chép mã"}
              </AppButton>
              <AppButton
                type="button"
                variant="solid"
                size="sm"
                onClick={handleDownload}
                className="bg-primary text-xs text-white hover:bg-primary-dark"
              >
                Tải file .{activeTab}
              </AppButton>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-text-muted">
            {activeTab === "html"
              ? "Trang HTML độc lập hoàn chỉnh với inline CSS chuẩn 1:1, bao gồm cấu trúc danh sách lồng cấp, hộp kiểm, ký hiệu đầu mục và typography đã thiết lập."
              : "Cấu trúc dữ liệu JSON nguyên bản của tài liệu, dùng để sao lưu, khôi phục hoặc tích hợp qua API mà không mất bất kỳ thuộc tính nào."}
          </p>

          {/* Code Viewer */}
          <div className="relative overflow-hidden rounded-lg border border-border bg-gray-950 font-mono text-xs text-gray-200">
            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-3 py-1.5 text-[11px] text-gray-400">
              <span>{activeTab === "html" ? `${fileNameBase}.html` : `${fileNameBase}.json`}</span>
              <span>{activeContent.length.toLocaleString()} ký tự</span>
            </div>
            <pre className="max-h-96 overflow-auto p-3 text-[11px] leading-relaxed select-all">
              <code>{activeContent}</code>
            </pre>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex w-full items-center justify-between">
            <span className="text-[11px] text-text-muted">
              Đảm bảo tính tương thích tuyệt đối giữa Visual Editor, Reader Preview và Export.
            </span>
            <AppButton type="button" variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </AppButton>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
