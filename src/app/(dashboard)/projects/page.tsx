"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { DataTable, PublishToggle } from "@/components/shared";
import type { ColumnDef } from "@/components/shared";
import {
  useProjects,
  useDeleteProject,
  usePublishProject,
  type ProjectFilters,
} from "@/features/projects/api";
import { useOperationFields } from "@/features/operation-fields/api";
import { useProvinces } from "@/features/provinces/api";
import { usePermission } from "@/hooks/usePermission";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const canCreate = usePermission("projects:create");
  const canDelete = usePermission("projects:delete");

  const [filters, setFilters] = useState<ProjectFilters>({
    page: 1,
    limit: 10,
    fieldId: "",
    provinceId: "",
    year: undefined,
    isPublished: "",
  });

  const { data: projectsData, isLoading } = useProjects(filters);
  const { data: operationFields } = useOperationFields();
  const { data: provinces } = useProvinces();
  const deleteMutation = useDeleteProject();
  const publishMutation = usePublishProject();

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

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

  const columns: ColumnDef<Project>[] = [
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
            {item.year && (
              <span className="rounded bg-surface-muted px-1.5 py-0.5 font-medium">
                {item.year}
              </span>
            )}
            {item.province && <span>📍 {item.province.name}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "field",
      label: "Lĩnh vực",
      render: (item) => (
        <span className="text-sm text-text-muted">
          {item.field?.name ?? "—"}
        </span>
      ),
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
            onClick={() => router.push(`/projects/${item.id}`)}
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

  // Generate year options from 1990 to current year + 1
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1990 + 2 }, (_, i) => currentYear + 1 - i);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">Dự án</h1>
            <p className="text-sm text-text-muted">
              Quản lý các dự án đã và đang triển khai.
            </p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/projects/new")}>
              + Thêm dự án
            </AppButton>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            value={filters.fieldId ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                fieldId: e.target.value || undefined,
                page: 1,
              }))
            }
          >
            <option value="">Tất cả lĩnh vực</option>
            {operationFields?.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            value={filters.provinceId ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                provinceId: e.target.value || undefined,
                page: 1,
              }))
            }
          >
            <option value="">Tất cả tỉnh thành</option>
            {provinces?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            value={filters.year ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                year: e.target.value ? parseInt(e.target.value) : undefined,
                page: 1,
              }))
            }
          >
            <option value="">Tất cả năm</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            value={
              filters.isPublished === ""
                ? ""
                : filters.isPublished
                  ? "true"
                  : "false"
            }
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                isPublished:
                  e.target.value === ""
                    ? ""
                    : e.target.value === "true",
                page: 1,
              }))
            }
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đã xuất bản</option>
            <option value="false">Bản nháp</option>
          </select>
        </div>

        <DataTable
          data={projectsData?.items ?? []}
          columns={columns}
          keyExtractor={(item) => item.id}
          pagination={
            projectsData
              ? {
                  currentPage: projectsData.page,
                  totalPages: projectsData.totalPages,
                  totalItems: projectsData.total,
                  pageSize: projectsData.limit,
                  onPageChange: (page) =>
                    setFilters((f) => ({ ...f, page })),
                }
              : undefined
          }
          emptyContent="Chưa có dự án nào"
        />
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá dự án{" "}
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
