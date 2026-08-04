"use client";

import { useState, useCallback } from "react";
import { AppButton, Spinner, Badge, DropdownSelect } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { DataTable, TablePagination } from "@/components/shared";
import type { ColumnDef } from "@/components/shared";
import {
  useContacts,
  useToggleReadContact,
  useDeleteContact,
  exportContactsCSV,
  type ContactFilters,
} from "@/features/contacts/api";
import { usePermission } from "@/hooks/usePermission";
import type { Contact } from "@/types/contact";

export default function ContactsPage() {
  const { toast } = useToast();
  
  const hasWildcard = usePermission("contacts:*");
  const hasDeletePerm = usePermission("contacts:delete");
  const hasExportPerm = usePermission("contacts:export");
  
  const canDelete = hasWildcard || hasDeletePerm;
  const canExport = hasWildcard || hasExportPerm;

  const [filters, setFilters] = useState<ContactFilters>({
    page: 1,
    limit: 10,
    isRead: false,
  });

  const { data: contactsData, isLoading } = useContacts(filters);
  const { data: unreadContactsData } = useContacts({ isRead: false, limit: 1 });
  const unreadCount = unreadContactsData?.total ?? 0;

  const toggleMutation = useToggleReadContact();
  const deleteMutation = useDeleteContact();

  const [viewTarget, setViewTarget] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleToggleRead = useCallback(
    (id: string, isRead: boolean) => {
      toggleMutation.mutate(
        { id, isRead },
        {
          onSuccess: () => {
            toast({
              title: isRead ? "Đã đánh dấu là đã đọc" : "Đã đánh dấu là chưa đọc",
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

  const handleView = useCallback(
    (contact: Contact) => {
      setViewTarget(contact);
      if (!contact.isRead) {
        toggleMutation.mutate({ id: contact.id, isRead: true });
      }
    },
    [toggleMutation]
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Đã xoá",
          description: `Liên hệ từ "${deleteTarget.fullName}" đã được xoá.`,
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

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportContactsCSV(filters);
      toast({ title: "Xuất file thành công", color: "success" });
    } catch (error) {
      toast({
        title: "Xuất file thất bại",
        description: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
        color: "danger",
      });
    } finally {
      setIsExporting(false);
    }
  }, [filters, toast]);

  const columns: ColumnDef<Contact>[] = [
    {
      key: "createdAt",
      label: "Ngày gửi",
      width: "w-32",
      render: (item) => (
        <span className={`text-sm ${!item.isRead ? "font-bold text-text" : "text-text-muted"}`}>
          {new Date(item.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "fullName",
      label: "Họ tên",
      render: (item) => (
        <div>
          <p className={`text-sm ${!item.isRead ? "font-bold text-text" : "font-medium text-text"}`}>
            {item.fullName}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{item.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Số điện thoại",
      render: (item) => (
        <span className={`text-sm ${!item.isRead ? "font-bold text-text" : "text-text-muted"}`}>
          {item.phone}
        </span>
      ),
    },
    {
      key: "subject",
      label: "Tiêu đề",
      render: (item) => (
        <span className={`text-sm line-clamp-1 ${!item.isRead ? "font-bold text-text" : "text-text-muted"}`}>
          {item.subject || "—"}
        </span>
      ),
    },
    {
      key: "isRead",
      label: "Trạng thái",
      align: "center" as const,
      width: "w-32",
      render: (item) => (
        <button
          type="button"
          onClick={() => handleToggleRead(item.id, !item.isRead)}
          disabled={toggleMutation.isPending}
          className="inline-flex disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Badge color={item.isRead ? "secondary" : "warning"} variant="soft">
            {item.isRead ? "Đã đọc" : "Chưa đọc"}
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
            aria-label="Xem chi tiết"
            onClick={() => handleView(item)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text">Liên hệ</h1>
              {unreadCount > 0 && (
                <Badge color="orange" variant="solid" radius="full" size="sm">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <p className="text-sm text-text-muted">Danh sách khách hàng để lại thông tin liên hệ từ website.</p>
          </div>
          {canExport && (
            <AppButton variant="solid" onClick={handleExport} isLoading={isExporting}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1.5 h-4 w-4">
                <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v7.59l2.22-2.22a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.22 2.22V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M3 15a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 15z" clipRule="evenodd" />
              </svg>
              Xuất CSV
            </AppButton>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <DropdownSelect
            value={
              filters.isRead === ""
                ? ""
                : filters.isRead
                  ? "true"
                  : "false"
            }
            onChange={(val) =>
              setFilters((f) => ({
                ...f,
                isRead:
                  val === ""
                    ? ""
                    : val === "true",
                page: 1,
              }))
            }
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "false", label: "Chưa đọc" },
              { value: "true", label: "Đã đọc" },
            ]}
          />
        </div>

        <DataTable
          data={contactsData?.items ?? []}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyContent="Chưa có liên hệ nào"
        />

        <TablePagination
          currentPage={filters.page || 1}
          totalPages={contactsData?.totalPages || 1}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          limit={filters.limit || 10}
          onLimitChange={(limit) =>
            setFilters((f) => ({ ...f, limit, page: 1 }))
          }
          label="Danh sách liên hệ của khách hàng"
          disabled={isLoading}
          className="mt-4"
        />
      </div>

      {/* View Detail Modal */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)}>
        <ModalContent className="max-w-xl">
          <ModalHeader>Chi tiết liên hệ</ModalHeader>
          <ModalBody>
            {viewTarget && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-text-muted">HỌ TÊN</p>
                    <p className="text-sm text-text">{viewTarget.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted">NGÀY GỬI</p>
                    <p className="text-sm text-text">
                      {new Date(viewTarget.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted">EMAIL</p>
                    <p className="text-sm text-text">{viewTarget.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted">SỐ ĐIỆN THOẠI</p>
                    <p className="text-sm text-text">{viewTarget.phone}</p>
                  </div>
                </div>

                {viewTarget.subject && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted">TIÊU ĐỀ</p>
                    <p className="text-sm text-text">{viewTarget.subject}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-text-muted">NỘI DUNG LỜI NHẮN</p>
                  <div className="mt-1 rounded-md border border-border bg-surface-muted p-3 text-sm text-text whitespace-pre-wrap">
                    {viewTarget.message || "Không có lời nhắn."}
                  </div>
                </div>

                {viewTarget.attachment && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted">ĐÍNH KÈM</p>
                    <a
                      href={viewTarget.attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                      </svg>
                      Xem file đính kèm
                    </a>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <AppButton variant="solid" onClick={() => setViewTarget(null)}>Đóng</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá liên hệ từ <strong>{deleteTarget?.fullName}</strong>? Hành động này không thể hoàn tác.
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
