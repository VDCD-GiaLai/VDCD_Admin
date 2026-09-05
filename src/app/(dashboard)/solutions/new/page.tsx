"use client";

import { SolutionEditor } from "@/features/solutions/editor/SolutionEditor";

/**
 * Create Solution page — UC-SLT-04.
 * Uses unified 4-tab Solution Editor (Thông tin, Nội dung, Đọc bài, Trực quan).
 */
export default function CreateSolutionPage() {
  return <SolutionEditor mode="create" />;
}
