"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppButton, Spinner, Badge } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { DataTable } from "@/components/shared";
import type { ColumnDef } from "@/components/shared";
import {
  usePageBanners,
  useDeletePageBanner,
  useTogglePageBanner,
} from "@/features/page-banners/api";
import { usePermission } from "@/hooks/usePermission";
import type { PageBanner } from "@/types/page-banner";

const PAGE_NAMES: Record<string, string> = {
  home: "Trang chủ (Home)",
  about: "Về chúng tôi (About)",
  programs: "Chương trình (Programs)",
  solutions: "Giải pháp (Solutions)",
  projects: "Dự án (Projects)",
  articles: "Tin tức (Articles)",
  contact: "Liên hệ (Contact)",
  careers: "Tuyển dụng (Careers)",
};

export default function PageBannersPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const hasWildcard = usePermission("page-banners:*");
  const hasCreate = usePermission("page-banners:create");
  const hasDelete = usePermission("page-banners:delete");

  const canCreate = hasWildcard || hasCreate;
  const canDelete = hasWildcard || hasDelete;

  const { data: banners, isLoading } = usePageBanners();
  const deleteMutation = useDeletePageBanner();
  const toggleMutation = useTogglePageBanner();

  const [deleteTarget, setDeleteTarget] = useState<PageBanner | null>(null);

  const handleToggle = useCallback(
    (pageKey: string, isActive: boolean) => {
      toggleMutation.mutate(
        { pageKey, isActive },
        {
          onSuccess: () => {
            toast({
              title: isActive ? "Đã hiển thị banner" : "Đã ẩn banner",
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
        }
      );
    },
    [toggleMutation, toast]
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Đã xoá",
          description: `Banner của trang "${PAGE_NAMES[deleteTarget.pageKey] || deleteTarget.pageKey}" đã được xoá.`,
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

  const columns: ColumnDef<PageBanner>[] = [
    {
      key: "imageUrl",
      label: "Ảnh Banner",
      width: "w-32",
      render: (item) => (
        <div className="h-12 w-24 overflow-hidden rounded-md border border-border bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title || item.pageKey}
            className="h-full w-full object-cover"
          />
        </div>
      ),
    },
    {
      key: "pageKey",
      label: "Trang áp dụng",
      render: (item) => (
        <div>
          <span className="font-medium text-text">
            {PAGE_NAMES[item.pageKey] || item.pageKey}
          </span>
          {item.tag && (
            <p className="mt-1 text-xs text-text-muted">Tag: {item.tag}</p>
          )}
        </div>
      ),
    },
    {
      key: "title",
      label: "Tiêu đề",
      render: (item) => (
        <span className="text-sm text-text-muted line-clamp-2">
          {item.title || "—"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Trạng thái",
      align: "center" as const,
      render: (item) => (
        <button
          type="button"
          onClick={() => handleToggle(item.pageKey, !item.isActive)}
          disabled={toggleMutation.isPending}
          className="inline-flex disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Badge color={item.isActive ? "success" : "secondary"} variant="soft">
            {toggleMutation.isPending ? "..." : item.isActive ? "Hiển thị" : "Đã ẩn"}
          </Badge>
        </button>
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
            onClick={() => router.push(`/page-banners/${item.id}`)}
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
            <h1 className="text-xl font-bold text-text">Page Banner</h1>
            <p className="text-sm text-text-muted">Quản lý banner hiển thị trên từng trang web.</p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/page-banners/new")}>
              + Thêm banner
            </AppButton>
          )}
        </div>

        <DataTable
          data={banners ?? []}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyContent="Chưa có banner nào"
        />
      </div>

      {/* Delete modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá banner của trang{" "}
              <strong>{deleteTarget ? (PAGE_NAMES[deleteTarget.pageKey] || deleteTarget.pageKey) : ""}</strong>?
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
