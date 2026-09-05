"use client";

import { useParams, useRouter } from "next/navigation";
import { Spinner, AppButton } from "@/components/ui";
import { useProgram } from "@/features/programs/api";
import { ProgramEditor } from "@/features/programs/editor/ProgramEditor";

/**
 * Edit Program page — UC-PRG-03.
 * Uses unified 4-tab Program Editor (Thông tin, Nội dung, Đọc bài, Trực quan).
 */
export default function EditProgramPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: program, isLoading } = useProgram(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-4 text-center py-16">
        <p className="text-sm text-text-muted">Không tìm thấy chương trình.</p>
        <AppButton variant="ghost" onClick={() => router.push("/programs")}>
          Quay lại danh sách
        </AppButton>
      </div>
    );
  }

  return <ProgramEditor mode="edit" program={program} />;
}
