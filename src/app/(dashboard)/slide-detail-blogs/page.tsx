"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppButton, Spinner, DropdownSelect } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { DataTable, PublishToggle, TablePagination } from "@/components/shared";
import type { ColumnDef } from "@/components/shared";
import {
  useSlideDetailBlogs,
  useDeleteSlideDetailBlog,
  usePublishSlideDetailBlog,
} from "@/features/slide-detail-blogs/api";
import { usePermission } from "@/hooks/usePermission";
import type {
  SlideDetailBlogListItem,
  SlideDetailBlogFilters,
} from "@/types/slide-detail-blog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Slide Detail Blogs list page.
 * Features: paginated table, search by title, filter by status, publish toggle, CRUD.
 */
export default function SlideDetailBlogsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const canCreate = usePermission("slide-detail-blogs:create");
  const canDelete = usePermission("slide-detail-blogs:delete");

  // ── Filters ──────────────────────────────────────────────────
  const [filters, setFilters] = useState<SlideDetailBlogFilters>({
    page: 1,
    limit: 10,
    search: "",
    isPublished: "",
  });

  const { data: blogsData, isLoading } = useSlideDetailBlogs(filters);
  const deleteMutation = useDeleteSlideDetailBlog();
  const publishMutation = usePublishSlideDetailBlog();

  const [deleteTarget, setDeleteTarget] = useState<SlideDetailBlogListItem | null>(null);

  // ── Handlers ─────────────────────────────────────────────────

  const handlePublish = useCallback(
    (id: string, isPublished: boolean) => {
      publishMutation.mutate(
        { id, isPublished },
        {
          onSuccess: () => {
            toast({
              title: isPublished ? "Đã xuất bản bài viết" : "Đã chuyển về bản nháp",
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
    deleteMutation.mutate(
      { id: deleteTarget.id, slideId: deleteTarget.slideId },
      {
        onSuccess: () => {
          toast({
            title: "Đã xoá bài viết",
            description: `"${deleteTarget.title}" đã được xoá vĩnh viễn.`,
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
      },
    );
  }, [deleteTarget, deleteMutation, toast]);

  // ── Column definitions ───────────────────────────────────────

  const columns: ColumnDef<SlideDetailBlogListItem>[] = [
    {
      key: "heroImageUrl",
      label: "Ảnh Hero",
      width: "w-24",
      render: (item) => (
        <div className="h-12 w-20 overflow-hidden rounded-md border border-border bg-surface-muted">
          {item.heroImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.heroImageUrl}
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
      label: "Tiêu đề & Slug",
      render: (item) => (
        <div>
          <p className="font-semibold text-text">{item.title}</p>
          {item.subtitle && (
            <p className="line-clamp-1 text-xs text-text-muted">{item.subtitle}</p>
          )}
          <p className="mt-0.5 text-[11px] text-text-muted/80">/{item.slug}</p>
        </div>
      ),
    },
    {
      key: "slide",
      label: "Slide liên kết",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.slide?.imageUrl && (
            <div className="h-7 w-10 shrink-0 overflow-hidden rounded border border-border bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.slide.imageUrl}
                alt={item.slide.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <span className="line-clamp-1 text-xs font-medium text-text">
            {item.slide?.title ?? "Slide"}
          </span>
        </div>
      ),
    },
    {
      key: "isPublished",
      label: "Trạng thái",
      align: "center",
      render: (item) => (
        <PublishToggle
          isPublished={item.isPublished}
          onToggle={(val) => handlePublish(item.id, val)}
          isLoading={publishMutation.isPending}
        />
      ),
    },
    {
      key: "publishedAt",
      label: "Ngày xuất bản",
      align: "center",
      render: (item) => (
        <span className="text-xs text-text-muted">
          {item.publishedAt
            ? format(new Date(item.publishedAt), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })
            : "Chưa xuất bản"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      align: "center",
      width: "w-28",
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
            aria-label="Sửa"
            onClick={() => router.push(`/slide-detail-blogs/${item.id}`)}
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
            <h1 className="text-xl font-bold text-text">Bài viết Slide</h1>
            <p className="text-sm text-text-muted">
              Quản lý bài viết chi tiết liên kết với từng Slide trang chủ.
            </p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/slide-detail-blogs/new")}>
              + Thêm bài viết slide
            </AppButton>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề..."
              value={filters.search ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
              }
              className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

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

        {/* Table */}
        <DataTable
          data={blogsData?.items ?? []}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyContent="Chưa có bài viết slide nào"
        />

        <TablePagination
          currentPage={filters.page || 1}
          totalPages={blogsData?.totalPages || 1}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          limit={filters.limit || 10}
          onLimitChange={(limit) =>
            setFilters((f) => ({ ...f, limit, page: 1 }))
          }
          label="Danh sách bài viết slide"
          disabled={isLoading}
          className="mt-4"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá bài viết</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá vĩnh viễn bài viết{" "}
              <strong>{deleteTarget?.title}</strong>?
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Lưu ý: Hành động này không thể hoàn tác. Tất cả ảnh trên ImageKit thuộc bài viết sẽ được tự động dọn dẹp.
            </p>
          </ModalBody>
          <ModalFooter>
            <AppButton variant="ghost" onClick={() => setDeleteTarget(null)}>
              Huỷ
            </AppButton>
            <AppButton
              color="danger"
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Xoá vĩnh viễn
            </AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
