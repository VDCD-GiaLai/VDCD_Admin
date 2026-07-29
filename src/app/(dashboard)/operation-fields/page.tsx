"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Spinner } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/shared";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import {
  useOperationFields,
  useDeleteOperationField,
} from "@/features/operation-fields/api";
import { usePermission } from "@/hooks/usePermission";
import type { OperationField } from "@/types/operation-field";

/**
 * Operation Fields list page — UC-FLD-01.
 */
export default function OperationFieldsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: fields, isLoading } = useOperationFields();
  const deleteMutation = useDeleteOperationField();
  const canCreate = usePermission("operation-fields:create");
  const canDelete = usePermission("operation-fields:delete");

  const [deleteTarget, setDeleteTarget] = useState<OperationField | null>(null);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Đã xoá",
          description: `Lĩnh vực "${deleteTarget.name}" đã được xoá.`,
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

  const columns: ColumnDef<OperationField>[] = useMemo(
    () => [
      {
        key: "order",
        label: "#",
        width: "w-16",
        align: "center",
        render: (item) => (
          <span className="text-text-muted">{item.order}</span>
        ),
      },
      {
        key: "name",
        label: "Tên lĩnh vực",
        cellClassName: "font-medium",
      },
      {
        key: "slug",
        label: "Slug",
        cellClassName: "text-text-muted font-mono text-xs",
      },
      {
        key: "icon",
        label: "Icon",
        render: (item) => (
          <span className="text-xs text-text-muted">
            {item.icon ?? "—"}
          </span>
        ),
      },
      {
        key: "shortDescription",
        label: "Mô tả",
        render: (item) => (
          <span className="line-clamp-1 text-text-muted">
            {item.shortDescription ?? "—"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Thao tác",
        align: "center",
        render: (item) => (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
              aria-label="Sửa"
              onClick={() =>
                router.push(`/operation-fields/${item.id}`)
              }
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
    ],
    [canDelete, router],
  );

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
            <h1 className="text-xl font-bold text-text">Lĩnh vực hoạt động</h1>
            <p className="text-sm text-text-muted">
              Quản lý các lĩnh vực phân loại chương trình, giải pháp, dự án.
            </p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/operation-fields/new")}>
              + Thêm lĩnh vực
            </AppButton>
          )}
        </div>

        <DataTable<OperationField>
          data={fields ?? []}
          columns={columns}
          keyExtractor={(f) => f.id}
          isLoading={isLoading}
          emptyContent={
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm font-medium text-text-muted">
                Chưa có lĩnh vực nào
              </p>
              <p className="text-xs text-text-muted/70">
                Thêm lĩnh vực đầu tiên để bắt đầu
              </p>
            </div>
          }
        />
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
      >
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá lĩnh vực{" "}
              <strong>{deleteTarget?.name}</strong>? Hành động này không thể
              hoàn tác.
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
