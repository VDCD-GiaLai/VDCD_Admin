"use client";

import { useParams, useRouter } from "next/navigation";
import { Spinner, AppButton } from "@/components/ui";
import { useArticle } from "@/features/articles/api";
import { ArticleEditor } from "@/features/articles/editor/ArticleEditor";

/**
 * Edit Article page — UC-ART-03.
 * Uses unified 4-tab Article Editor (Thông tin, Nội dung, Đọc bài, Trực quan).
 */
export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: article, isLoading } = useArticle(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="py-20 text-center">
        <p className="text-text-muted">Không tìm thấy bài viết.</p>
        <AppButton variant="ghost" className="mt-4" onClick={() => router.push("/articles")}>
          ← Quay lại danh sách
        </AppButton>
      </div>
    );
  }

  return <ArticleEditor mode="edit" article={article} />;
}
