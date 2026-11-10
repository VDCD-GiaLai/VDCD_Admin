"use client";

import { ArticleEditor } from "@/features/articles/editor/ArticleEditor";

/**
 * Create Article page — UC-ART-02.
 * Uses unified 4-tab Article Editor (Thông tin, Nội dung, Đọc bài, Trực quan).
 */
export default function CreateArticlePage() {
  return <ArticleEditor mode="create" />;
}
