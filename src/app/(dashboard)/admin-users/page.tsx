"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton, Badge } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { useAdminUsers, useDeleteAdminUser } from "@/features/admin-users/api";
import { DataTable } from "@/components/shared";
import type { ColumnDef } from "@/components/shared";
import { AdminUser } from "@/types/auth";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/components/ui";

export default function AdminUsersPage() {
  const router = useRouter();
  const isSuperadmin = usePermission("admin-users:*");
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const deleteMutation = useDeleteAdminUser();

  const { data, isLoading } = useAdminUsers({
    page,
    limit: 10,
    role: roleFilter === "all" ? undefined : roleFilter,
  });

  const handleDelete = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Xóa thành công",
          description: "Đã xóa tài khoản quản trị.",
          color: "success",
        });
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast({
          title: "Xóa thất bại",
          description: error.message,
          color: "danger",
        });
      },
    });
  };

  if (!isSuperadmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-text-muted">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const columns: ColumnDef<AdminUser>[] = [
    {
      key: "username",
      label: "TÊN ĐĂNG NHẬP",
      render: (user) => <span className="font-medium text-text">{user.username}</span>,
    },
    {
      key: "email",
      label: "EMAIL",
      render: (user) => <span className="text-text-muted">{user.email}</span>,
    },
    {
      key: "role",
      label: "VAI TRÒ",
      render: (user) => {
        const color =
          user.role === "superadmin"
            ? "danger"
            : user.role === "editor"
            ? "warning"
            : "info";
        return (
          <Badge color={color as "danger" | "warning" | "info"} variant="soft">
            {user.role}
          </Badge>
        );
      },
    },
    {
      key: "isActive",
      label: "TRẠNG THÁI",
      render: (user) => (
        <Badge
          color={user.isActive ? "success" : "light"}
          variant="soft"
        >
          {user.isActive ? "Hoạt động" : "Bị khóa"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "THAO TÁC",
      align: "center",
      width: "w-32",
      render: (user) => (
        <div className="flex items-center justify-center gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin-users/${user.id}`);
            }}
          >
            Sửa
          </AppButton>
          <AppButton
            variant="ghost"
            color="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(user);
            }}
          >
            Xóa
          </AppButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Quản trị viên</h1>
          <p className="text-sm text-text-muted">
            Quản lý tài khoản và phân quyền truy cập hệ thống
          </p>
        </div>
        <AppButton
          color="primary"
          onClick={() => router.push("/admin-users/new")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-2 h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Thêm tài khoản
        </AppButton>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <select
            className="h-9 w-48 rounded-md border border-border bg-surface px-3 py-1 text-sm text-text"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="superadmin">Superadmin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        pagination={
          data
            ? {
                currentPage: data.page,
                totalPages: data.totalPages,
                totalItems: data.total,
                pageSize: data.limit,
                onPageChange: setPage,
              }
            : undefined
        }
        emptyContent="Không có tài khoản nào."
      />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc chắn muốn xóa tài khoản{" "}
              <span className="font-medium">{deleteTarget?.username}</span>?
              Hành động này không thể hoàn tác.
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
              Xoá
            </AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
