"use client";

import { useParams, useRouter } from "next/navigation";
import { Spinner, AppButton } from "@/components/ui";
import { useSolution } from "@/features/solutions/api";
import { SolutionEditor } from "@/features/solutions/editor/SolutionEditor";

/**
 * Edit Solution page — UC-SLT-05.
 * Uses unified 4-tab Solution Editor (Thông tin, Nội dung, Đọc bài, Trực quan).
 */
export default function EditSolutionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: solution, isLoading } = useSolution(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-sm text-text-muted">Không tìm thấy giải pháp.</p>
        <AppButton variant="ghost" onClick={() => router.push("/solutions")}>
          Quay lại danh sách
        </AppButton>
      </div>
    );
  }

  return <SolutionEditor mode="edit" solution={solution} />;
}
