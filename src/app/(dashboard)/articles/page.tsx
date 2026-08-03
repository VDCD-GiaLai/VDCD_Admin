"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppButton, Spinner, DropdownSelect } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { DataTable, PublishToggle, TablePagination } from "@/components/shared";
import type { ColumnDef } from "@/components/shared";
import {
  useArticles,
  useDeleteArticle,
  usePublishArticle,
  type ArticleFilters,
} from "@/features/articles/api";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import type { Article } from "@/types/article";
import { format } from "date-fns";

export default function ArticlesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const canCreate = usePermission("articles:create");
  const canDelete = usePermission("articles:delete");

  const [categoryInput, setCategoryInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const debouncedCategory = useDebounce(categoryInput, 500);
  const debouncedTags = useDebounce(tagsInput, 500);

  const [filters, setFilters] = useState<ArticleFilters>({
    page: 1,
    limit: 10,
    category: "",
    tags: "",
    isPublished: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => {
        if (f.category === debouncedCategory && f.tags === debouncedTags) return f;
        return { ...f, category: debouncedCategory, tags: debouncedTags, page: 1 };
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [debouncedCategory, debouncedTags]);

  const { data: articlesData, isLoading } = useArticles(filters);
  const deleteMutation = useDeleteArticle();
  const publishMutation = usePublishArticle();

  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const handlePublish = useCallback(
    (id: string, isPublished: boolean) => {
      publishMutation.mutate(
        { id, isPublished },
        {
          onSuccess: () => {
            toast({
              title: isPublished ? "Đã xuất bản" : "Đã chuyển về bản nháp",
              color: "success",
            });
          },
          onError: (error) => {
            toast({
              title: "Thao tác thất bại",
              description: error.message,
              color: "danger",
            });
          },
        },
      );
    },
    [publishMutation, toast],
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Đã xoá",
          description: `"${deleteTarget.title}" đã được xoá.`,
          color: "success",
        });
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast({
          title: "Xoá thất bại",
          description: error.message,
          color: "danger",
        });
      },
    });
  }, [deleteTarget, deleteMutation, toast]);

  const columns: ColumnDef<Article>[] = [
    {
      key: "thumbnail",
      label: "Ảnh",
      width: "w-20",
      render: (item) => (
        <div className="h-12 w-16 overflow-hidden rounded-md border border-border bg-surface-muted">
          {item.thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
              —
            </div>
          )}
        </div>
      ),
    },
    {
      key: "title",
      label: "Tiêu đề",
      render: (item) => (
        <div>
          <p className="font-medium text-text">{item.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
            {item.category && (
              <span className="rounded bg-surface-muted px-1.5 py-0.5 font-medium">
                {item.category}
              </span>
            )}
            <span>
              {item.publishedAt ? format(new Date(item.publishedAt), "dd/MM/yyyy") : "Chưa có ngày xuất bản"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "linkedTo",
      label: "Liên kết",
      render: (item) => {
        if (item.project) return <span className="text-xs">Dự án: {item.project.title}</span>;
        if (item.program) return <span className="text-xs">Chương trình: {item.program.title}</span>;
        if (item.solution) return <span className="text-xs">Giải pháp: {item.solution.title}</span>;
        return <span className="text-xs text-text-muted">—</span>;
      },
    },
    {
      key: "isPublished",
      label: "Trạng thái",
      align: "center" as const,
      render: (item) => (
        <PublishToggle
          isPublished={item.isPublished}
          onToggle={(val) => handlePublish(item.id, val)}
          isLoading={publishMutation.isPending}
        />
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      align: "center" as const,
      width: "w-28",
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
            aria-label="Sửa"
            onClick={() => router.push(`/articles/${item.id}`)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
          {canDelete && (
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
              aria-label="Xoá"
              onClick={() => setDeleteTarget(item)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">Bài viết & Tin tức</h1>
            <p className="text-sm text-text-muted">
              Quản lý các bài viết truyền thông.
            </p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/articles/new")}>
              + Thêm bài viết
            </AppButton>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Lọc theo danh mục..."
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
          />
          <input
            type="text"
            placeholder="Lọc theo tags..."
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />

          <DropdownSelect
            value={
              filters.isPublished === ""
                ? ""
                : filters.isPublished
                  ? "true"
                  : "false"
            }
            onChange={(val) =>
              setFilters((f) => ({
                ...f,
                isPublished:
                  val === ""
                    ? ""
                    : val === "true",
                page: 1,
              }))
            }
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "true", label: "Đã xuất bản" },
              { value: "false", label: "Bản nháp" },
            ]}
          />
        </div>

        <DataTable
          data={articlesData?.items ?? []}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyContent="Chưa có bài viết nào"
        />

        <TablePagination
          currentPage={filters.page || 1}
          totalPages={articlesData?.totalPages || 1}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          limit={filters.limit || 10}
          onLimitChange={(limit) =>
            setFilters((f) => ({ ...f, limit, page: 1 }))
          }
          label="Danh sách bài viết"
          disabled={isLoading}
          className="mt-4"
        />
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá bài viết{" "}
              <strong>{deleteTarget?.title}</strong>?
            </p>
          </ModalBody>
          <ModalFooter>
            <AppButton
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
            >
              Huỷ
            </AppButton>
            <AppButton
              color="danger"
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Xoá
            </AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
