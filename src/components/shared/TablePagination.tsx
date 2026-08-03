"use client";

import { Pagination, DropdownSelect } from "@/components/ui";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  limitOptions = [5, 10, 15, 20],
  label = "Phân trang tương tác",
  className,
  disabled = false,
}: TablePaginationProps) {
  const options = limitOptions.map((opt) => ({
    value: String(opt),
    label: String(opt),
  }));

  return (
    <div className={`rounded-lg border border-border bg-surface p-6 shadow-sm ${className || ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Số mục trên trang:
          </span>
          <DropdownSelect
            value={String(limit)}
            onChange={(val) => {
              onLimitChange(Number(val));
            }}
            options={options}
            className="w-24"
            minWidth={100}
            disabled={disabled}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {label} (Trang hiện tại: {currentPage} / {totalPages})
          </span>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          color="primary"
          variant="default"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
