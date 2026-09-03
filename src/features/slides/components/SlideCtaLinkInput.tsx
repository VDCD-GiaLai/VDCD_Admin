"use client";

import React, { useState, useMemo } from "react";
import { FormInput, FormSelect, Spinner } from "@/components/ui";
import { useSlideDetailBlogs } from "@/features/slide-detail-blogs/api";
import type { SelectOption } from "@/components/ui/FormSelect";
import type { SlideDetailBlogListItem } from "@/types/slide-detail-blog";

interface SlideCtaLinkInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  onBlogSelect?: (blog: SlideDetailBlogListItem) => void;
  errorMessage?: string;
  className?: string;
}

type LinkMode = "blog" | "custom";

export function SlideCtaLinkInput({
  value = "",
  onChange,
  onBlogSelect,
  errorMessage,
  className,
}: SlideCtaLinkInputProps) {
  const currentValue = value || "";

  // Fetch list of slide detail blogs (up to 100 items)
  const { data: blogData, isLoading } = useSlideDetailBlogs({ limit: 100 });
  const blogs = useMemo(() => blogData?.items ?? [], [blogData]);

  // Determine matching blog from current value
  const matchedBlog = useMemo(() => {
    if (!currentValue) return null;
    return blogs.find(
      (b) =>
        currentValue === `/slides/${b.slug}` ||
        currentValue === b.slug ||
        currentValue.endsWith(`/slides/${b.slug}`)
    );
  }, [currentValue, blogs]);

  // Mode derivation: if user explicitly toggles mode, use userMode; otherwise infer from value
  const [userMode, setUserMode] = useState<LinkMode | null>(null);
  const isCustomUrl = Boolean(currentValue && !currentValue.startsWith("/slides/"));
  const mode: LinkMode = userMode ?? (isCustomUrl ? "custom" : "blog");

  // Options for FormSelect: only published blogs are selectable; drafts are disabled
  const blogOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [
      { value: "", label: "-- Chọn bài viết chi tiết đã xuất bản --" },
    ];
    blogs.forEach((b) => {
      if (b.isPublished) {
        options.push({
          value: `/slides/${b.slug}`,
          label: `${b.title} [Đã xuất bản]`,
        });
      } else {
        options.push({
          value: `/slides/${b.slug}`,
          label: `${b.title} [Bản nháp — Không thể chọn]`,
          disabled: true, // Vô hiệu hoá không cho chọn bản nháp
        });
      }
    });
    return options;
  }, [blogs]);

  // Selected value for FormSelect
  const selectedBlogValue = matchedBlog ? `/slides/${matchedBlog.slug}` : "";

  const handleBlogSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange(val);
    if (val) {
      const found = blogs.find((b) => `/slides/${b.slug}` === val);
      if (found && onBlogSelect) {
        onBlogSelect(found);
      }
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text">Link CTA</label>
        <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-surface-muted p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setUserMode("blog")}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
              mode === "blog"
                ? "bg-surface font-semibold text-primary shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
            </svg>
            Chọn từ bài viết
          </button>
          <button
            type="button"
            onClick={() => setUserMode("custom")}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
              mode === "custom"
                ? "bg-surface font-semibold text-primary shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
              <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
            </svg>
            Tự nhập link
          </button>
        </div>
      </div>

      {/* Mode: Select from detail blogs */}
      {mode === "blog" ? (
        <div className="space-y-1.5">
          {isLoading ? (
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-surface-muted/50 px-3 text-xs text-text-muted">
              <Spinner size="sm" />
              <span>Đang tải danh sách bài viết chi tiết...</span>
            </div>
          ) : blogs.length === 0 ? (
            <div className="rounded-md border border-border bg-surface-muted/50 p-2.5 text-xs text-text-muted">
              Chưa có bài viết chi tiết nào. Vui lòng chuyển sang tab{" "}
              <button
                type="button"
                onClick={() => setUserMode("custom")}
                className="font-semibold text-primary underline"
              >
                Tự nhập link
              </button>{" "}
              hoặc tạo bài viết mới.
            </div>
          ) : (
            <FormSelect
              options={blogOptions}
              value={selectedBlogValue}
              onChange={handleBlogSelect}
              errorMessage={errorMessage}
            />
          )}

          {currentValue && (
            <div className="space-y-1">
              <div className="flex items-center justify-between rounded-md bg-surface-muted/60 px-3 py-1.5 text-[11px] text-text-muted">
                <span className="truncate">
                  <strong className="text-text">Liên kết áp dụng:</strong>{" "}
                  <code className="rounded bg-surface px-1 py-0.5 font-mono text-primary">
                    {currentValue}
                  </code>
                </span>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="ml-2 text-danger hover:underline"
                >
                  Xóa
                </button>
              </div>

              {matchedBlog && !matchedBlog.isPublished && (
                <div className="flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-[11px] text-warning">
                  <span>⚠️</span>
                  <span>
                    Bài viết <strong>{matchedBlog.title}</strong> hiện là{" "}
                    <strong>Bản nháp</strong>. Vui lòng xuất bản bài viết để người dùng ngoài website có thể truy cập.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Mode: Custom URL input */
        <FormInput
          type="text"
          placeholder="VD: /slides/ten-bai-viet hoặc https://example.com"
          value={currentValue}
          onChange={handleCustomChange}
          errorMessage={errorMessage}
          helperText="Nhập đường dẫn nội bộ (/slides/..., /lien-he) hoặc URL ngoài (https://...)"
        />
      )}
    </div>
  );
}
