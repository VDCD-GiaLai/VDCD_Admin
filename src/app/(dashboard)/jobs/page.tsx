"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { DataTable, PublishToggle } from "@/components/shared";
import type { ColumnDef } from "@/components/shared";
import {
  useJobs,
  useDeleteJob,
  useToggleJob,
  type JobFilters,
} from "@/features/jobs/api";
import { usePermission } from "@/hooks/usePermission";
import type { Job } from "@/types/job";
import { format } from "date-fns";

/**
 * Jobs list page — UC-JOB-04.
 * Features: paginated table, filter by type/status, active toggle, CRUD.
 */
export default function JobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const canCreate = usePermission("jobs:create");
  const canDelete = usePermission("jobs:delete");

  // ── Filters ──────────────────────────────────────────────────
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 10,
    type: "",
    isActive: "",
  });

  const { data: jobsData, isLoading } = useJobs(filters);
  const deleteMutation = useDeleteJob();
  const toggleMutation = useToggleJob();

  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  // ── Handlers ─────────────────────────────────────────────────

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      toggleMutation.mutate(
        { id, isActive },
        {
          onSuccess: () => {
            toast({
              title: isActive ? "Đã mở tuyển dụng" : "Đã đóng tuyển dụng",
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
    [toggleMutation, toast],
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Đã xoá",
          description: `Vị trí "${deleteTarget.title}" đã được xoá.`,
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

  // ── Column definitions ───────────────────────────────────────

  const columns: ColumnDef<Job>[] = [
    {
      key: "title",
      label: "Tiêu đề",
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-text">{item.title}</p>
            {item.isUrgent && (
              <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                Tuyển gấp
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            {item.department ? `${item.department} • ` : ""}
            {item.location || "Không rõ địa điểm"}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      label: "Loại hình",
      render: (item) => {
        const typeLabels: Record<string, string> = {
          "full-time": "Toàn thời gian",
          "part-time": "Bán thời gian",
          intern: "Thực tập sinh",
        };
        return (
          <span className="text-sm text-text-muted">
            {typeLabels[item.type] || item.type}
          </span>
        );
      },
    },
    {
      key: "deadline",
      label: "Hạn nộp",
      render: (item) => (
        <span className="text-sm text-text-muted">
          {item.deadline ? format(new Date(item.deadline), "dd/MM/yyyy") : "Không thời hạn"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Trạng thái",
      align: "center" as const,
      render: (item) => (
        <PublishToggle
          isPublished={item.isActive}
          onToggle={(val) => handleToggle(item.id, val)}
          isLoading={toggleMutation.isPending}
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
            onClick={() => router.push(`/jobs/${item.id}`)}
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

  // ── Render ────────────────────────────────────────────────────

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
            <h1 className="text-xl font-bold text-text">Tuyển dụng</h1>
            <p className="text-sm text-text-muted">
              Quản lý các vị trí tuyển dụng.
            </p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/jobs/new")}>
              + Thêm vị trí
            </AppButton>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            value={filters.type ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                type: e.target.value || undefined,
                page: 1,
              }))
            }
          >
            <option value="">Tất cả loại hình</option>
            <option value="full-time">Toàn thời gian</option>
            <option value="part-time">Bán thời gian</option>
            <option value="intern">Thực tập sinh</option>
          </select>

          <select
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            value={
              filters.isActive === ""
                ? ""
                : filters.isActive
                  ? "true"
                  : "false"
            }
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                isActive:
                  e.target.value === ""
                    ? ""
                    : e.target.value === "true",
                page: 1,
              }))
            }
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang mở</option>
            <option value="false">Đã đóng</option>
          </select>
        </div>

        {/* Table */}
        <DataTable
          data={jobsData?.items ?? []}
          columns={columns}
          keyExtractor={(item) => item.id}
          pagination={
            jobsData
              ? {
                  currentPage: jobsData.page,
                  totalPages: jobsData.totalPages,
                  totalItems: jobsData.total,
                  pageSize: jobsData.limit,
                  onPageChange: (page) =>
                    setFilters((f) => ({ ...f, page })),
                }
              : undefined
          }
          emptyContent="Chưa có vị trí tuyển dụng nào"
        />
      </div>

      {/* Delete modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá vị trí{" "}
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
