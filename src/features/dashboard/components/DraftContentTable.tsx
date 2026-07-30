"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type ColumnDef } from "@/components/shared";
import { Badge, AppButton } from "@/components/ui";
import { useDashboardDrafts, type DraftContent } from "../api";
import { format } from "date-fns";

export function DraftContentTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDashboardDrafts(page, 5);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "program": return "Chương trình";
      case "solution": return "Giải pháp";
      case "project": return "Dự án";
      case "article": return "Bài viết";
      default: return type;
    }
  };

  const getEditUrl = (item: DraftContent) => {
    switch (item.type) {
      case "program": return `/programs/${item.id}`;
      case "solution": return `/solutions/${item.id}`;
      case "project": return `/projects/${item.id}`;
      case "article": return `/articles/${item.id}`;
      default: return "#";
    }
  };

  const columns: ColumnDef<DraftContent>[] = [
    {
      key: "title",
      label: "TIÊU ĐỀ",
      render: (item) => (
        <span className="font-medium text-text line-clamp-1">{item.title}</span>
      ),
    },
    {
      key: "type",
      label: "LOẠI",
      render: (item) => (
        <Badge color="info" variant="soft">
          {getTypeLabel(item.type)}
        </Badge>
      ),
    },
    {
      key: "updatedAt",
      label: "CẬP NHẬT LẦN CUỐI",
      render: (item) => (
        <span className="text-text-muted">
          {item.updatedAt ? format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm") : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (item) => (
        <AppButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(getEditUrl(item))}
        >
          Tiếp tục sửa
        </AppButton>
      ),
    },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface shadow-[0px_2px_2px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="border-b border-border p-5">
        <h3 className="text-lg font-bold text-text">Bản nháp gần đây</h3>
        <p className="text-sm text-text-muted">Nội dung chưa xuất bản</p>
        {/* TODO: Hiện tại Backend (schema) chưa có field assigned_to / created_by trong các bảng Program/Solution/Project/Article nên không thể lọc "bản nháp của tôi". Do đó, bảng này đang hiển thị toàn bộ draft của hệ thống. Cần bổ sung field vào schema nếu muốn lọc theo user. */}
      </div>
      
      <div className="p-0">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          keyExtractor={(item) => `${item.type}-${item.id}`}
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
          emptyContent="Không có bản nháp nào."
        />
      </div>
    </div>
  );
}
