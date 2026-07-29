"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Badge } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/shared";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { useProvinces, useDeleteProvince } from "@/features/provinces/api";
import { usePermission } from "@/hooks/usePermission";
import type { Province } from "@/types/province";

/**
 * Provinces list page — UC-MAP-01.
 */
export default function ProvincesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: provinces, isLoading } = useProvinces();
  const deleteMutation = useDeleteProvince();
  const canCreate = usePermission("provinces:create");
  const canDelete = usePermission("provinces:delete");

  const [deleteTarget, setDeleteTarget] = useState<Province | null>(null);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Đã xoá",
          description: `Tỉnh "${deleteTarget.name}" đã được xoá.`,
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

  const columns: ColumnDef<Province>[] = useMemo(
    () => [
      {
        key: "code",
        label: "Mã",
        width: "w-20",
        cellClassName: "font-mono text-xs font-bold text-primary",
      },
      {
        key: "name",
        label: "Tên tỉnh / thành phố",
        cellClassName: "font-medium",
      },
      {
        key: "hasProject",
        label: "Có dự án",
        align: "center",
        render: (item) => (
          <Badge color={item.hasProject ? "success" : "secondary"} variant="soft">
            {item.hasProject ? "Có" : "Không"}
          </Badge>
        ),
      },
      {
        key: "centerCount",
        label: "Số trung tâm",
        align: "center",
        render: (item) => (
          <span className="font-medium">{item.centerCount}</span>
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
              onClick={() => router.push(`/provinces/${item.id}`)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
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
            <h1 className="text-xl font-bold text-text">Tỉnh thành</h1>
            <p className="text-sm text-text-muted">
              Quản lý danh sách tỉnh/thành phố.
            </p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/provinces/new")}>
              + Thêm tỉnh
            </AppButton>
          )}
        </div>

        <DataTable<Province>
          data={provinces ?? []}
          columns={columns}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyContent={
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm font-medium text-text-muted">Chưa có tỉnh thành nào</p>
            </div>
          }
        />
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá tỉnh <strong>{deleteTarget?.name}</strong>?
            </p>
          </ModalBody>
          <ModalFooter>
            <AppButton variant="ghost" onClick={() => setDeleteTarget(null)}>Huỷ</AppButton>
            <AppButton color="danger" isLoading={deleteMutation.isPending} onClick={handleDelete}>Xoá</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
