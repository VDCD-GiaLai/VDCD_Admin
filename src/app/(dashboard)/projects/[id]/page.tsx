"use client";

import { useParams, useRouter } from "next/navigation";
import { Spinner, AppButton } from "@/components/ui";
import { useProject } from "@/features/projects/api";
import { ProjectEditor } from "@/features/projects/editor";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: project, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-sm text-text-muted">Đang tải thông tin dự án...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-text-muted">Không tìm thấy dự án yêu cầu.</p>
        <AppButton variant="outline" onClick={() => router.push("/projects")}>
          ← Quay lại danh sách
        </AppButton>
      </div>
    );
  }

  return <ProjectEditor mode="edit" project={project} />;
}
