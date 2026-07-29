/**
 * Shared Components — barrel export.
 *
 * Import from "@/components/shared" for reusable compound components
 * (DataTable, FormLayout, StatusBadge, etc.).
 */

// ─── DataTable ───────────────────────────────────────────────

export { DataTable } from "./DataTable";

export type {
  DataTableProps,
  DataTablePagination,
  ColumnDef,
  SortDescriptor,
  SortDirection,
} from "./DataTable";
