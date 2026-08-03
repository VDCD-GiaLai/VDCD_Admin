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

// ─── RichTextEditor ──────────────────────────────────────────

export { RichTextEditor } from "./RichTextEditor";
export type { RichTextEditorProps } from "./RichTextEditor";

// ─── PublishToggle ───────────────────────────────────────────

export { PublishToggle } from "./PublishToggle";
export type { PublishToggleProps } from "./PublishToggle";

// ─── TablePagination ─────────────────────────────────────────

export { TablePagination } from "./TablePagination";
export type { TablePaginationProps } from "./TablePagination";
