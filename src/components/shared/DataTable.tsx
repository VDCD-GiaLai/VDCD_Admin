"use client";

import {
  type ReactNode,
  useCallback,
  useMemo,
} from "react";
import { Pagination } from "@/components/ui";

// ─── Types ───────────────────────────────────────────────────

export type SortDirection = "asc" | "desc";

export interface SortDescriptor {
  key: string;
  direction: SortDirection;
}

export interface ColumnDef<T> {
  /** Unique column key — used for sort callbacks and as React key */
  key: string;
  /** Column header label */
  label: string;
  /** Custom cell renderer. Falls back to `item[key]` */
  render?: (item: T, index: number) => ReactNode;
  /** Enable sort indicator + click handler on this column header */
  sortable?: boolean;
  /** Fixed width (Tailwind or CSS value, e.g. "w-12", "120px") */
  width?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Extra classes on the <th> */
  headerClassName?: string;
  /** Extra classes on the <td> */
  cellClassName?: string;
}

export interface DataTablePagination {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Total items count — shown as "Hiển thị X–Y của Z mục" */
  totalItems?: number;
  /** Items per page — needed for the info text calculation */
  pageSize?: number;
}

export interface DataTableProps<T> {
  /** Row data */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Unique key extractor per row */
  keyExtractor: (item: T) => string | number;

  // ── Selection ──────────────────────────────────────────────
  /** Enable checkbox column */
  selectable?: boolean;
  /** Controlled set of selected row keys */
  selectedKeys?: Set<string | number>;
  /** Called when selection changes */
  onSelectionChange?: (keys: Set<string | number>) => void;

  // ── Sorting ────────────────────────────────────────────────
  /** Current sort state */
  sortDescriptor?: SortDescriptor;
  /** Called when a sortable column header is clicked */
  onSortChange?: (descriptor: SortDescriptor) => void;

  // ── Pagination ─────────────────────────────────────────────
  /** Pagination configuration — omit to hide pagination */
  pagination?: DataTablePagination;

  // ── States ─────────────────────────────────────────────────
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Number of skeleton rows to show while loading */
  loadingRowCount?: number;
  /** Custom empty state content */
  emptyContent?: ReactNode;

  // ── Styling ────────────────────────────────────────────────
  /** Additional class on the outer wrapper */
  className?: string;
  /** Additional class on the <table> */
  tableClassName?: string;
  /** Row click handler */
  onRowClick?: (item: T) => void;
}

// ─── Alignment helper ────────────────────────────────────────

const alignClasses: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// ─── Sort icon component ─────────────────────────────────────

function SortIcon({
  direction,
  active,
}: {
  direction?: SortDirection;
  active: boolean;
}) {
  return (
    <span className="ml-1 inline-flex flex-col items-center justify-center leading-none">
      <svg
        className={`h-2.5 w-2.5 ${
          active && direction === "asc"
            ? "text-primary"
            : "text-text-muted/40"
        }`}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      <svg
        className={`-mt-0.5 h-2.5 w-2.5 ${
          active && direction === "desc"
            ? "text-primary"
            : "text-text-muted/40"
        }`}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  );
}

// ─── Skeleton row ────────────────────────────────────────────

function SkeletonRow({
  colSpan,
  hasCheckbox,
}: {
  colSpan: number;
  hasCheckbox: boolean;
}) {
  const totalCols = hasCheckbox ? colSpan + 1 : colSpan;
  return (
    <tr className="border-b border-border">
      {Array.from({ length: totalCols }, (_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 animate-pulse rounded bg-surface-muted" />
        </td>
      ))}
    </tr>
  );
}

// ═════════════════════════════════════════════════════════════
//  DataTable
// ═════════════════════════════════════════════════════════════

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  sortDescriptor,
  onSortChange,
  pagination,
  isLoading = false,
  loadingRowCount = 5,
  emptyContent,
  className,
  tableClassName,
  onRowClick,
}: DataTableProps<T>) {
  // ── Selection helpers ────────────────────────────────────

  const allKeys = useMemo(
    () => new Set(data.map((item) => keyExtractor(item))),
    [data, keyExtractor],
  );

  const isAllSelected = useMemo(() => {
    if (!selectedKeys || allKeys.size === 0) return false;
    for (const key of allKeys) {
      if (!selectedKeys.has(key)) return false;
    }
    return true;
  }, [selectedKeys, allKeys]);

  const isIndeterminate = useMemo(() => {
    if (!selectedKeys || allKeys.size === 0) return false;
    let some = false;
    let all = true;
    for (const key of allKeys) {
      if (selectedKeys.has(key)) {
        some = true;
      } else {
        all = false;
      }
    }
    return some && !all;
  }, [selectedKeys, allKeys]);

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      // Deselect all on current page
      const next = new Set(selectedKeys);
      for (const key of allKeys) {
        next.delete(key);
      }
      onSelectionChange(next);
    } else {
      // Select all on current page
      const next = new Set(selectedKeys);
      for (const key of allKeys) {
        next.add(key);
      }
      onSelectionChange(next);
    }
  }, [isAllSelected, allKeys, selectedKeys, onSelectionChange]);

  const handleSelectRow = useCallback(
    (key: string | number) => {
      if (!onSelectionChange) return;
      const next = new Set(selectedKeys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onSelectionChange(next);
    },
    [selectedKeys, onSelectionChange],
  );

  // ── Sort handler ─────────────────────────────────────────

  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSortChange) return;
      const nextDirection: SortDirection =
        sortDescriptor?.key === columnKey && sortDescriptor.direction === "asc"
          ? "desc"
          : "asc";
      onSortChange({ key: columnKey, direction: nextDirection });
    },
    [sortDescriptor, onSortChange],
  );

  // ── Pagination info text ─────────────────────────────────

  const paginationInfo = useMemo(() => {
    if (
      !pagination?.totalItems ||
      !pagination.pageSize ||
      pagination.totalItems === 0
    )
      return null;
    const start = (pagination.currentPage - 1) * pagination.pageSize + 1;
    const end = Math.min(
      pagination.currentPage * pagination.pageSize,
      pagination.totalItems,
    );
    return `Hiển thị ${start}–${end} của ${pagination.totalItems} mục`;
  }, [pagination]);

  // ── Render ───────────────────────────────────────────────

  const showEmpty = !isLoading && data.length === 0;

  return (
    <div
      className={[
        "overflow-hidden rounded-lg border border-border bg-surface shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto">
        <table
          className={[
            "w-full border-collapse text-sm",
            tableClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* ── Header ── */}
          <thead>
            <tr className="border-b border-border bg-surface-muted/60">
              {/* Checkbox header */}
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={handleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary focus:ring-2 focus:ring-primary/30"
                      aria-label="Chọn tất cả"
                    />
                  </div>
                </th>
              )}

              {/* Column headers */}
              {columns.map((col) => {
                const isSorted = sortDescriptor?.key === col.key;
                const canSort = col.sortable && !!onSortChange;

                return (
                  <th
                    key={col.key}
                    className={[
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted",
                      alignClasses[col.align ?? "left"],
                      col.width,
                      canSort
                        ? "cursor-pointer select-none transition-colors hover:text-text"
                        : "",
                      col.headerClassName,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={canSort ? () => handleSort(col.key) : undefined}
                    aria-sort={
                      isSorted
                        ? sortDescriptor.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {col.label}
                      {canSort && (
                        <SortIcon
                          active={isSorted}
                          direction={isSorted ? sortDescriptor.direction : undefined}
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {/* Loading state */}
            {isLoading &&
              Array.from({ length: loadingRowCount }, (_, i) => (
                <SkeletonRow
                  key={`skeleton-${i}`}
                  colSpan={columns.length}
                  hasCheckbox={selectable}
                />
              ))}

            {/* Empty state */}
            {showEmpty && (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  {emptyContent ?? (
                    <div className="flex flex-col items-center gap-2 text-text-muted">
                      <svg
                        className="h-10 w-10 text-text-muted/30"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                      <p className="text-sm font-medium">Không có dữ liệu</p>
                    </div>
                  )}
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              data.map((item, rowIndex) => {
                const rowKey = keyExtractor(item);
                const isSelected = selectedKeys?.has(rowKey) ?? false;

                return (
                  <tr
                    key={rowKey}
                    className={[
                      "border-b border-border transition-colors last:border-b-0",
                      isSelected
                        ? "bg-primary/5"
                        : "bg-surface hover:bg-surface-muted/50",
                      onRowClick ? "cursor-pointer" : "",
                    ].join(" ")}
                    onClick={
                      onRowClick ? () => onRowClick(item) : undefined
                    }
                  >
                    {/* Checkbox cell */}
                    {selectable && (
                      <td className="w-12 px-4 py-3.5">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectRow(rowKey);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary focus:ring-2 focus:ring-primary/30"
                            aria-label={`Chọn hàng ${rowKey}`}
                          />
                        </div>
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={[
                          "px-4 py-3.5 text-sm text-text",
                          alignClasses[col.align ?? "left"],
                          col.width,
                          col.cellClassName,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {col.render
                          ? col.render(item, rowIndex)
                          : (item as Record<string, unknown>)[col.key] != null
                            ? String((item as Record<string, unknown>)[col.key])
                            : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ── Footer: Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-3">
          {/* Info text */}
          {paginationInfo ? (
            <p className="text-xs text-text-muted">{paginationInfo}</p>
          ) : (
            <div />
          )}

          {/* Pagination controls */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            size="sm"
            variant="minimal"
            color="primary"
          />
        </div>
      )}
    </div>
  );
}
