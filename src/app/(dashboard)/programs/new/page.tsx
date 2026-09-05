"use client";

import { ProgramEditor } from "@/features/programs/editor/ProgramEditor";

/**
 * Create Program page — UC-PRG-02.
 * Uses unified 4-tab Program Editor (Thông tin, Nội dung, Đọc bài, Trực quan).
 */
export default function CreateProgramPage() {
  return <ProgramEditor mode="create" />;
}
