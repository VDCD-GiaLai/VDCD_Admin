"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { AppButton, Spinner, DropdownSelect } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { DataTable, TablePagination } from "@/components/shared";
import type { ColumnDef } from "@/components/shared";
import {
  useLeads,
  useDeleteLead,
  useMarkLeadRead,
  downloadLeadsCsv,
  type LeadFilters,
} from "@/features/leads/api";
import { usePermission } from "@/hooks/usePermission";
import type { Lead } from "@/types/lead";
import { useRouter } from "next/navigation";

/**
 * Leads list page — UC-LED-02, UC-LED-04, UC-LED-05.
 */
export default function LeadsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const canDelete = usePermission("leads:delete");
  const canExport = usePermission("leads:export"); // assuming superadmin only based on API docs

  // ── Filters ──────────────────────────────────────────────────
  const [filters, setFilters] = useState<LeadFilters>({
    page: 1,
    limit: 10,
    isRead: "",
  });

  const { data: leadsData, isLoading } = useLeads(filters);
  const deleteMutation = useDeleteLead();
  const markReadMutation = useMarkLeadRead();

  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  // ── Handlers ─────────────────────────────────────────────────

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

  const handleToggleRead = useCallback(
    (lead: Lead) => {
      markReadMutation.mutate(
        { id: lead.id, isRead: !lead.isRead },
        {
          onSuccess: () => {
            toast({
              title: !lead.isRead ? "Đã đánh dấu đã đọc" : "Đã đánh dấu chưa đọc",
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
    [markReadMutation, toast]
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadLeadsCsv(exportFrom || undefined, exportTo || undefined);
      setShowExportModal(false);
      toast({ title: "Đang tải file CSV...", color: "success" });
    } catch {
      toast({ title: "Xuất file thất bại", color: "danger" });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Column definitions ───────────────────────────────────────

  const columns: ColumnDef<Lead>[] = [
    {
      key: "fullName",
      label: "Họ và tên",
      render: (item) => (
        <div>
          <p className={`font-medium ${!item.isRead ? "text-text font-bold" : "text-text"}`}>
            {item.fullName}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            {format(new Date(item.createdAt), "HH:mm dd/MM/yyyy")}
          </p>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Liên hệ",
      render: (item) => (
        <div className={!item.isRead ? "font-semibold" : ""}>
          <p className="text-sm text-text">{item.email}</p>
          {item.phone && <p className="text-xs text-text-muted">{item.phone}</p>}
        </div>
      ),
    },
    {
      key: "subject",
      label: "Chủ đề",
      render: (item) => (
        <p className={`text-sm ${!item.isRead ? "font-semibold text-text" : "text-text-muted"}`}>
          {item.subject || "—"}
        </p>
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
          onClick={(e) => {
            e.stopPropagation();
            handleToggleRead(item);
          }}
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
            item.isRead
              ? "bg-surface-muted text-text-muted hover:bg-surface-hover"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
          disabled={markReadMutation.isPending}
        >
          {item.isRead ? "Đã đọc" : "Chưa đọc"}
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
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/leads/${item.id}`);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </button>
          {canDelete && (
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
              aria-label="Xoá"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(item);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd" />
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
            <h1 className="text-xl font-bold text-text">Liên hệ</h1>
            <p className="text-sm text-text-muted">
              Quản lý danh sách liên hệ từ website.
            </p>
          </div>
          {canExport && (
            <AppButton onClick={() => setShowExportModal(true)}>
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
              { value: "true", label: "Đã đọc" },
              { value: "false", label: "Chưa đọc" },
            ]}
          />
        </div>

        {/* Table */}
        <DataTable
          data={leadsData?.items ?? []}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyContent="Chưa có liên hệ nào"
          onRowClick={(item) => router.push(`/leads/${item.id}`)}
        />

        <TablePagination
          currentPage={filters.page || 1}
          totalPages={leadsData?.totalPages || 1}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          limit={filters.limit || 10}
          onLimitChange={(limit) =>
            setFilters((f) => ({ ...f, limit, page: 1 }))
          }
          label="Danh sách liên hệ khách hàng"
          disabled={isLoading}
          className="mt-4"
        />
      </div>

      {/* Export modal */}
      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)}>
        <ModalContent>
          <ModalHeader>Xuất dữ liệu liên hệ (CSV)</ModalHeader>
          <ModalBody className="space-y-4">
            <p className="text-sm text-text-muted">
              Chọn khoảng thời gian để xuất dữ liệu (Để trống để xuất tất cả).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-text">Từ ngày</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-text">Đến ngày</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <AppButton variant="ghost" onClick={() => setShowExportModal(false)}>
              Huỷ
            </AppButton>
            <AppButton
              color="primary"
              isLoading={isExporting}
              onClick={handleExport}
            >
              Tải xuống
            </AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá liên hệ từ{" "}
              <strong>{deleteTarget?.fullName}</strong>?
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
