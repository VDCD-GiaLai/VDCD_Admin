"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { DataTable, type ColumnDef, type SortDescriptor } from "@/components/shared";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormSearchSelect,
  FormFileInput,
  FormColorInput,
} from "@/components/ui";
import {
  FormCheckbox,
  FormCheckboxGroup,
  FormRadio,
  FormRadioGroup,
  FormSwitch,
  FormToggleButton,
  FormToggleButtonGroup,
} from "@/components/ui";
import {
  AppButton,
  ButtonGroup,
} from "@/components/ui";
import type { CheckColor, ButtonColor, BadgeColor } from "@/components/ui";
import {
  Badge,
  BadgeDot,
  BadgeOverlay,
} from "@/components/ui";
import {
  AppBreadcrumb,
  ChevronSeparator,
  DoubleChevronSeparator,
  ArrowSeparator,
  HomeIcon as BreadcrumbHomeIcon,
  FolderIcon,
  FileIcon,
} from "@/components/ui";
import {
  Dropdown,
  DropdownItem,
  DropdownHeader,
  DropdownDivider,
  DropdownText,
  DropdownCustom,
} from "@/components/ui";
import { Popover } from "@/components/ui";
import type { PopoverColor } from "@/components/ui";
import { Pagination } from "@/components/ui";
import type { PaginationColor } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Tooltip } from "@/components/ui";
import type { TooltipColor } from "@/components/ui";
import { Spinner } from "@/components/ui";
import type { SpinnerColor } from "@/components/ui";
import { Progress } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";

// ─── Icon helpers (inline SVGs for demo) ─────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
    </svg>
  );
}

// ─── Section wrapper ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border border-border bg-surface shadow-sm">
      <CardHeader className="border-b border-border px-5 py-3.5">
        <CardTitle className="text-base font-semibold text-text">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════
//  Page Component
// ═════════════════════════════════════════════════════════════

export default function UIElementPage() {
  const router = useRouter();
  const { toast } = useToast();

  // ── State for interactive demos ──
  const [radioValue, setRadioValue] = useState("option1");
  const [checkboxValues, setCheckboxValues] = useState<string[]>(["opt1"]);
  const [switchStates, setSwitchStates] = useState({
    primary: true,
    secondary: false,
    success: true,
    warning: false,
    danger: false,
    info: true,
    dark: false,
  });
  const [toggleValue, setToggleValue] = useState("html");
  const [toggleMulti, setToggleMulti] = useState<string[]>(["react"]);
  const [colorRadio, setColorRadio] = useState("primary");

  // ── Search Select state ──
  const [searchSingle, setSearchSingle] = useState<string | null>(null);
  const [searchMulti, setSearchMulti] = useState<string[]>([]);
  const [searchGrouped, setSearchGrouped] = useState<string | null>(null);
  const [searchMultiGrouped, setSearchMultiGrouped] = useState<string[]>([]);

  // ── Pagination state ──
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);
  const [page3, setPage3] = useState(5);
  const [page4, setPage4] = useState(3);

  // ── Modal state ──
  const [isBasicModalOpen, setBasicModalOpen] = useState(false);
  const [isSmallModalOpen, setSmallModalOpen] = useState(false);
  const [isLargeModalOpen, setLargeModalOpen] = useState(false);
  const [isFullModalOpen, setFullModalOpen] = useState(false);
  const [isTopModalOpen, setTopModalOpen] = useState(false);
  const [isStaticModalOpen, setStaticModalOpen] = useState(false);
  const [isInsideScrollModalOpen, setInsideScrollModalOpen] = useState(false);
  const allColors: CheckColor[] = ["primary", "secondary", "success", "warning", "danger", "info", "dark"];

  // ── DataTable demo state ──
  interface TaskItem {
    id: string;
    task: string;
    taskId: string;
    assignedDate: string;
    status: "In Progress" | "Completed" | "Pending";
    dueDate: string;
    priority: "High" | "Medium" | "Low";
  }

  const sampleTasks: TaskItem[] = useMemo(() => [
    { id: "1", task: "Design Homepage", taskId: "SPK-1001", assignedDate: "2025-03-01", status: "In Progress", dueDate: "2025-03-10", priority: "High" },
    { id: "2", task: "Implement Login Feature", taskId: "SPK-1002", assignedDate: "2025-03-02", status: "Completed", dueDate: "2025-03-05", priority: "Medium" },
    { id: "3", task: "Develop Admin Dashboard", taskId: "SPK-1003", assignedDate: "2025-03-03", status: "Pending", dueDate: "2025-03-15", priority: "High" },
    { id: "4", task: "Fix Bugs in User Profile", taskId: "SPK-1004", assignedDate: "2025-03-04", status: "In Progress", dueDate: "2025-03-12", priority: "Low" },
    { id: "5", task: "Update API Integration", taskId: "SPK-1005", assignedDate: "2025-03-05", status: "Completed", dueDate: "2025-03-06", priority: "High" },
    { id: "6", task: "Create User Notifications", taskId: "SPK-1006", assignedDate: "2025-03-06", status: "Pending", dueDate: "2025-03-20", priority: "Medium" },
    { id: "7", task: "Test Payment Gateway", taskId: "SPK-1007", assignedDate: "2025-03-07", status: "In Progress", dueDate: "2025-03-14", priority: "High" },
    { id: "8", task: "Implement Search Feature", taskId: "SPK-1008", assignedDate: "2025-03-08", status: "Completed", dueDate: "2025-03-09", priority: "Low" },
    { id: "9", task: "Set Up Analytics Dashboard", taskId: "SPK-1009", assignedDate: "2025-03-09", status: "Pending", dueDate: "2025-03-25", priority: "Medium" },
    { id: "10", task: "Finalize Reporting Module", taskId: "SPK-1010", assignedDate: "2025-03-10", status: "In Progress", dueDate: "2025-03-18", priority: "High" },
  ], []);

  const [tableSelectedKeys, setTableSelectedKeys] = useState<Set<string | number>>(new Set());
  const [tableSortDescriptor, setTableSortDescriptor] = useState<SortDescriptor | undefined>(undefined);
  const [tablePage, setTablePage] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);

  const tablePageSize = 5;

  const sortedTasks = useMemo(() => {
    if (!tableSortDescriptor) return sampleTasks;
    const sorted = [...sampleTasks].sort((a, b) => {
      const aVal = a[tableSortDescriptor.key as keyof TaskItem] ?? "";
      const bVal = b[tableSortDescriptor.key as keyof TaskItem] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return tableSortDescriptor.direction === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [sampleTasks, tableSortDescriptor]);

  const pagedTasks = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return sortedTasks.slice(start, start + tablePageSize);
  }, [sortedTasks, tablePage]);

  const taskColumns: ColumnDef<TaskItem>[] = useMemo(() => [
    { key: "task", label: "Task", sortable: true, cellClassName: "font-medium" },
    { key: "taskId", label: "Task ID", sortable: true, cellClassName: "text-text-muted" },
    { key: "assignedDate", label: "Assigned Date", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (item) => {
        const statusColor: Record<string, string> = {
          "In Progress": "text-info",
          "Completed": "text-success",
          "Pending": "text-warning",
        };
        return <span className={`text-sm font-medium ${statusColor[item.status] ?? "text-text"}`}>{item.status}</span>;
      },
    },
    { key: "dueDate", label: "Due Date", sortable: true },
    {
      key: "priority",
      label: "Priority",
      render: (item) => {
        const prioColors: Record<string, { bg: string; text: string }> = {
          High: { bg: "bg-danger/10", text: "text-danger" },
          Medium: { bg: "bg-warning/10", text: "text-warning" },
          Low: { bg: "bg-info/10", text: "text-info" },
        };
        const c = prioColors[item.priority] ?? { bg: "bg-surface-muted", text: "text-text" };
        return (
          <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
            {item.priority}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Action",
      align: "center",
      render: () => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
            aria-label="Sửa"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
            aria-label="Xoá"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ),
    },
  ], []);

  const handleToggleLoading = useCallback(() => {
    setTableLoading(true);
    setTimeout(() => setTableLoading(false), 2000);
  }, []);

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-text">UI Elements</h1>
        <p className="text-sm text-text-muted">
          Trang demo tất cả reusable components — dùng làm reference khi xây dựng form/page mới.
        </p>

        {/* ═══════════════════════════════════════════════════════
          FORM INPUTS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="text-lg font-semibold text-text">Form Inputs</h2>

        {/* Basic Input Types */}
        <Section title="Basic Input Types">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormInput label="Text" placeholder="Nhập nội dung..." />
            <FormInput label="Email" type="email" placeholder="admin@vdcd.vn" />
            <FormInput label="Password" type="password" placeholder="Nhập mật khẩu" />
            <FormInput label="Number" type="number" placeholder="0" />
            <FormInput label="Phone" type="tel" placeholder="+84 xxx xxx xxx" />
            <FormInput label="URL" type="url" placeholder="https://..." />
            <FormInput label="Date" type="date" />
            <FormInput label="Time" type="time" />
            <FormInput label="Date & Time" type="datetime-local" />
            <FormInput label="Month" type="month" />
            <FormInput label="Week" type="week" />
            <FormInput label="Search" type="search" placeholder="Tìm kiếm..." />
          </div>
        </Section>

        {/* Input with Start/End Content */}
        <Section title="Input with Icons / Addons">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormInput
              label="Tìm kiếm"
              placeholder="Tìm kiếm..."
              startContent={<SearchIcon />}
            />
            <FormInput
              label="Email"
              type="email"
              placeholder="admin@vdcd.vn"
              startContent={<MailIcon />}
            />
            <FormInput
              label="Password"
              type="password"
              placeholder="Nhập mật khẩu"
              startContent={<LockIcon />}
            />
            <FormInput
              label="Username"
              placeholder="Tên đăng nhập"
              startContent={<UserIcon />}
              endContent={<span className="text-xs text-[var(--muted)]">@vdcd.vn</span>}
            />
            <FormInput
              label="Giá (VNĐ)"
              type="number"
              placeholder="0"
              endContent={<span className="text-xs font-medium">₫</span>}
            />
            <FormInput
              label="Website"
              type="url"
              placeholder="example.com"
              startContent={<span className="text-xs">https://</span>}
            />
          </div>
        </Section>

        {/* Input Sizes */}
        <Section title="Input Sizes">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormInput label="Small" size="sm" placeholder="Size sm" />
            <FormInput label="Medium (default)" size="md" placeholder="Size md" />
            <FormInput label="Large" size="lg" placeholder="Size lg" />
          </div>
        </Section>

        {/* Input Radius */}
        <Section title="Input Radius Variants">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormInput label="No Radius" radius="none" placeholder="rounded-none" />
            <FormInput label="Medium Radius (default)" radius="md" placeholder="rounded-md" />
            <FormInput label="Full Radius" radius="full" placeholder="rounded-full" />
          </div>
        </Section>

        {/* Input Border Styles */}
        <Section title="Input Border Styles">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormInput label="Solid (default)" borderStyle="solid" placeholder="border-solid" />
            <FormInput label="Dashed" borderStyle="dashed" placeholder="border-dashed" />
            <FormInput label="Dotted" borderStyle="dotted" placeholder="border-dotted" />
          </div>
        </Section>

        {/* Input States */}
        <Section title="Input States">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormInput label="Default" placeholder="Bình thường" />
            <FormInput label="With Helper Text" placeholder="Có gợi ý" helperText="Đây là gợi ý cho người dùng" />
            <FormInput label="Required" placeholder="Bắt buộc" isRequired />
            <FormInput label="Error State" placeholder="Có lỗi" errorMessage="Trường này không được để trống" />
            <FormInput label="Disabled" placeholder="Không thể sửa" disabled />
            <FormInput label="Readonly" placeholder="Chỉ đọc" readOnly defaultValue="Giá trị cố định" />
          </div>
        </Section>

        {/* Textarea */}
        <Section title="Textarea">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormTextarea label="Mô tả" placeholder="Nhập mô tả chi tiết..." helperText="Tối đa 500 ký tự" />
            <FormTextarea label="Ghi chú (Error)" placeholder="Nhập ghi chú..." errorMessage="Nội dung quá ngắn, cần ít nhất 20 ký tự" />
            <FormTextarea label="Small" size="sm" placeholder="Size sm" rows={3} />
            <FormTextarea label="Readonly" readOnly defaultValue="Nội dung chỉ đọc, không chỉnh sửa được." rows={3} />
          </div>
        </Section>

        {/* Native Select */}
        <Section title="Native Select">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormSelect
              label="Lĩnh vực hoạt động"
              placeholderOption="-- Chọn lĩnh vực --"
              options={[
                { value: "env", label: "Môi trường" },
                { value: "edu", label: "Giáo dục" },
                { value: "health", label: "Sức khoẻ" },
                { value: "tech", label: "Công nghệ" },
              ]}
            />
            <FormSelect
              label="Trạng thái"
              options={[
                { value: "published", label: "Đã xuất bản" },
                { value: "draft", label: "Bản nháp" },
                { value: "archived", label: "Đã lưu trữ" },
              ]}
              helperText="Chọn trạng thái bài viết"
            />
            <FormSelect
              label="Error State"
              placeholderOption="-- Chọn --"
              options={[{ value: "a", label: "Option A" }]}
              errorMessage="Vui lòng chọn một giá trị"
            />
          </div>
        </Section>

        {/* Select Sizes */}
        <Section title="Select Sizes">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormSelect
              label="Small"
              size="sm"
              options={[
                { value: "1", label: "Option 1" },
                { value: "2", label: "Option 2" },
              ]}
            />
            <FormSelect
              label="Medium (default)"
              size="md"
              options={[
                { value: "1", label: "Option 1" },
                { value: "2", label: "Option 2" },
              ]}
            />
            <FormSelect
              label="Large"
              size="lg"
              options={[
                { value: "1", label: "Option 1" },
                { value: "2", label: "Option 2" },
              ]}
            />
          </div>
        </Section>

        {/* Select with Option Groups */}
        <Section title="Select with Option Groups">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Chọn vị trí"
              placeholderOption="-- Chọn vị trí --"
              options={[
                {
                  label: "Kỹ thuật",
                  options: [
                    { value: "fe", label: "Frontend Developer" },
                    { value: "be", label: "Backend Developer" },
                    { value: "devops", label: "DevOps Engineer" },
                  ],
                },
                {
                  label: "Thiết kế",
                  options: [
                    { value: "ui", label: "UI/UX Designer" },
                    { value: "graphic", label: "Graphic Designer" },
                  ],
                },
                {
                  label: "Quản lý",
                  options: [
                    { value: "pm", label: "Project Manager" },
                    { value: "po", label: "Product Owner" },
                  ],
                },
              ]}
            />
            <FormSelect
              label="Disabled"
              disabled
              options={[{ value: "x", label: "Cannot change" }]}
            />
          </div>
        </Section>

        {/* Multiple Select & Visible Rows */}
        <Section title="Multiple Select & Visible Rows">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Multiple Select"
              multiple
              helperText="Giữ Ctrl/Cmd để chọn nhiều"
              options={[
                { value: "react", label: "React" },
                { value: "vue", label: "Vue" },
                { value: "angular", label: "Angular" },
                { value: "svelte", label: "Svelte" },
                { value: "nextjs", label: "Next.js" },
                { value: "nuxt", label: "Nuxt" },
              ]}
            />
            <FormSelect
              label="Visible Rows (size=4)"
              visibleOptions={4}
              helperText="Hiển thị 4 dòng"
              options={[
                { value: "1", label: "JavaScript" },
                { value: "2", label: "TypeScript" },
                { value: "3", label: "Python" },
                { value: "4", label: "Go" },
                { value: "5", label: "Rust" },
                { value: "6", label: "Java" },
              ]}
            />
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          ADVANCED / SEARCHABLE SELECT
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Searchable Select</h2>

        {/* Searchable Single Select */}
        <Section title="Searchable Single Select">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSearchSelect
              label="Chọn tỉnh/thành"
              placeholder="Tìm tỉnh/thành..."
              isSearchable
              isClearable
              value={searchSingle}
              onChange={setSearchSingle}
              options={[
                { value: "hcm", label: "TP. Hồ Chí Minh" },
                { value: "hn", label: "Hà Nội" },
                { value: "dn", label: "Đà Nẵng" },
                { value: "hp", label: "Hải Phòng" },
                { value: "ct", label: "Cần Thơ" },
                { value: "bd", label: "Bình Dương" },
                { value: "gl", label: "Gia Lai" },
                { value: "dl", label: "Đắk Lắk" },
              ]}
              helperText={`Đã chọn: ${searchSingle ? searchSingle : "chưa có"}`}
            />
            <FormSearchSelect
              label="Không tìm kiếm"
              placeholder="Chọn..."
              isSearchable={false}
              isClearable
              value={searchSingle}
              onChange={setSearchSingle}
              options={[
                { value: "hcm", label: "TP. Hồ Chí Minh" },
                { value: "hn", label: "Hà Nội" },
                { value: "dn", label: "Đà Nẵng" },
              ]}
            />
          </div>
        </Section>

        {/* Searchable Multi Select with Tags */}
        <Section title="Multi Select with Tags">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSearchSelect
              label="Chọn kỹ năng"
              placeholder="Tìm kỹ năng..."
              isMulti
              isSearchable
              isClearable
              values={searchMulti}
              onChangeMulti={setSearchMulti}
              options={[
                { value: "react", label: "React" },
                { value: "vue", label: "Vue.js" },
                { value: "angular", label: "Angular" },
                { value: "nextjs", label: "Next.js" },
                { value: "typescript", label: "TypeScript" },
                { value: "nodejs", label: "Node.js" },
                { value: "python", label: "Python" },
                { value: "go", label: "Go" },
              ]}
              helperText={`Đã chọn: ${searchMulti.length} kỹ năng`}
            />
            <FormSearchSelect
              label="Giới hạn 3 lựa chọn"
              placeholder="Chọn tối đa 3..."
              isMulti
              isSearchable
              maxSelections={3}
              values={searchMulti}
              onChangeMulti={setSearchMulti}
              options={[
                { value: "react", label: "React" },
                { value: "vue", label: "Vue.js" },
                { value: "angular", label: "Angular" },
                { value: "nextjs", label: "Next.js" },
                { value: "typescript", label: "TypeScript" },
              ]}
              helperText="Tối đa 3 lựa chọn"
            />
          </div>
        </Section>

        {/* Searchable with Option Groups */}
        <Section title="Searchable with Option Groups">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSearchSelect
              label="Chọn vị trí (Grouped)"
              placeholder="Tìm vị trí..."
              isSearchable
              isClearable
              value={searchGrouped}
              onChange={setSearchGrouped}
              options={[
                {
                  label: "Kỹ thuật",
                  options: [
                    { value: "fe", label: "Frontend Developer" },
                    { value: "be", label: "Backend Developer" },
                    { value: "devops", label: "DevOps Engineer" },
                  ],
                },
                {
                  label: "Thiết kế",
                  options: [
                    { value: "ui", label: "UI/UX Designer" },
                    { value: "graphic", label: "Graphic Designer" },
                  ],
                },
              ]}
            />
            <FormSearchSelect
              label="Multi + Grouped"
              placeholder="Tìm và chọn..."
              isMulti
              isSearchable
              isClearable
              values={searchMultiGrouped}
              onChangeMulti={setSearchMultiGrouped}
              options={[
                {
                  label: "Frontend",
                  options: [
                    { value: "react", label: "React" },
                    { value: "vue", label: "Vue.js" },
                    { value: "angular", label: "Angular" },
                  ],
                },
                {
                  label: "Backend",
                  options: [
                    { value: "nodejs", label: "Node.js" },
                    { value: "python", label: "Python" },
                    { value: "go", label: "Go" },
                  ],
                },
              ]}
            />
          </div>
        </Section>

        {/* Searchable Select States */}
        <Section title="Searchable Select States">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormSearchSelect
              label="Disabled"
              placeholder="Không thể chọn"
              disabled
              options={[
                { value: "a", label: "Option A" },
                { value: "b", label: "Option B" },
              ]}
            />
            <FormSearchSelect
              label="Error State"
              placeholder="Chọn giá trị..."
              errorMessage="Trường này bắt buộc"
              isRequired
              options={[
                { value: "a", label: "Option A" },
                { value: "b", label: "Option B" },
              ]}
            />
            <FormSearchSelect
              label="Small Size"
              size="sm"
              placeholder="Size sm..."
              isClearable
              options={[
                { value: "a", label: "Option A" },
                { value: "b", label: "Option B" },
              ]}
            />
          </div>
        </Section>

        {/* File Input */}
        <Section title="File Input">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormFileInput label="Upload File" helperText="PNG, JPG, GIF — tối đa 5MB" />
            <FormFileInput label="Multiple Files" multiple helperText="Chọn nhiều file" />
            <FormFileInput label="Images Only" accept="image/*" />
            <FormFileInput label="Error State" errorMessage="File vượt quá kích thước cho phép (5MB)" />
          </div>
        </Section>

        {/* Color Input */}
        <Section title="Color Input">
          <div className="flex flex-wrap gap-6">
            <FormColorInput label="Màu chính" defaultValue="#ca2a30" />
            <FormColorInput label="Màu phụ" defaultValue="#FF49CD" />
            <FormColorInput label="Màu nền" defaultValue="#F8F9FD" />
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          CHECKBOXES
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Checkboxes</h2>

        {/* Basic Checkboxes */}
        <Section title="Basic Checkboxes">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <FormCheckbox label="Default" defaultChecked />
            <FormCheckbox label="Unchecked" />
            <FormCheckbox label="Disabled" disabled />
            <FormCheckbox label="Disabled Checked" disabled defaultChecked />
          </div>
        </Section>

        {/* Checkbox Colors */}
        <Section title="Checkbox Colors">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {allColors.map((c) => (
              <FormCheckbox key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} color={c} defaultChecked />
            ))}
          </div>
        </Section>

        {/* Checkbox Sizes */}
        <Section title="Checkbox Sizes">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <FormCheckbox label="Small" size="sm" defaultChecked />
            <FormCheckbox label="Medium" size="md" defaultChecked />
            <FormCheckbox label="Large" size="lg" defaultChecked />
          </div>
        </Section>

        {/* Outlined Checkboxes */}
        <Section title="Outlined Checkboxes">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {allColors.map((c) => (
              <FormCheckbox key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} color={c} isOutlined defaultChecked />
            ))}
          </div>
        </Section>

        {/* Reversed Checkboxes */}
        <Section title="Reversed Layout">
          <div className="max-w-xs space-y-2">
            <FormCheckbox label="Nhận email thông báo" isReversed defaultChecked />
            <FormCheckbox label="Cho phép hiển thị công khai" isReversed />
            <FormCheckbox label="Kích hoạt 2FA" isReversed disabled />
          </div>
        </Section>

        {/* Checkbox with Error / Description */}
        <Section title="Checkbox with Error / Description">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormCheckbox
              label="Đồng ý điều khoản sử dụng"
              description="Bằng cách đồng ý, bạn chấp nhận các điều khoản và chính sách bảo mật."
            />
            <FormCheckbox
              label="Đồng ý điều khoản"
              errorMessage="Bạn phải đồng ý điều khoản để tiếp tục"
              color="danger"
            />
          </div>
        </Section>

        {/* Checkbox Group */}
        <Section title="Checkbox Group">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormCheckboxGroup
              label="Chọn lĩnh vực (Vertical)"
              name="fields-v"
              isRequired
              value={checkboxValues}
              onChange={setCheckboxValues}
              options={[
                { value: "opt1", label: "Môi trường" },
                { value: "opt2", label: "Giáo dục" },
                { value: "opt3", label: "Sức khoẻ" },
                { value: "opt4", label: "Công nghệ", disabled: true },
              ]}
              helperText={`Đã chọn: ${checkboxValues.join(", ") || "chưa có"}`}
            />
            <FormCheckboxGroup
              label="Chọn lĩnh vực (Horizontal)"
              name="fields-h"
              direction="horizontal"
              color="secondary"
              value={checkboxValues}
              onChange={setCheckboxValues}
              options={[
                { value: "opt1", label: "Môi trường" },
                { value: "opt2", label: "Giáo dục" },
                { value: "opt3", label: "Sức khoẻ" },
              ]}
            />
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          RADIOS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Radio Buttons</h2>

        {/* Basic Radios */}
        <Section title="Basic Radio Buttons">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <FormRadio name="basic-radio" label="Option 1" value="1" defaultChecked />
            <FormRadio name="basic-radio" label="Option 2" value="2" />
            <FormRadio name="basic-radio-dis" label="Disabled" value="3" disabled />
            <FormRadio name="basic-radio-dis-c" label="Disabled Checked" value="4" disabled defaultChecked />
          </div>
        </Section>

        {/* Radio Colors */}
        <Section title="Radio Colors">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {allColors.map((c) => (
              <FormRadio
                key={c}
                name="radio-color"
                label={c.charAt(0).toUpperCase() + c.slice(1)}
                color={c}
                value={c}
                checked={colorRadio === c}
                onChange={() => setColorRadio(c)}
              />
            ))}
          </div>
        </Section>

        {/* Radio Sizes */}
        <Section title="Radio Sizes">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <FormRadio name="radio-size" label="Small" size="sm" value="sm" defaultChecked />
            <FormRadio name="radio-size" label="Medium" size="md" value="md" />
            <FormRadio name="radio-size" label="Large" size="lg" value="lg" />
          </div>
        </Section>

        {/* Outlined Radios */}
        <Section title="Outlined Radio Buttons">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {allColors.map((c) => (
              <FormRadio key={c} name={`radio-outline-${c}`} label={c.charAt(0).toUpperCase() + c.slice(1)} color={c} isOutlined defaultChecked />
            ))}
          </div>
        </Section>

        {/* Radio Group */}
        <Section title="Radio Group">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormRadioGroup
              label="Vai trò (Vertical)"
              name="role-v"
              isRequired
              value={radioValue}
              onChange={(e) => setRadioValue(e.target.value)}
              options={[
                { value: "option1", label: "Super Admin" },
                { value: "option2", label: "Editor" },
                { value: "option3", label: "Viewer" },
                { value: "option4", label: "Guest (disabled)", disabled: true },
              ]}
              helperText={`Đã chọn: ${radioValue}`}
            />
            <FormRadioGroup
              label="Vai trò (Horizontal)"
              name="role-h"
              direction="horizontal"
              color="success"
              value={radioValue}
              onChange={(e) => setRadioValue(e.target.value)}
              options={[
                { value: "option1", label: "Super Admin" },
                { value: "option2", label: "Editor" },
                { value: "option3", label: "Viewer" },
              ]}
            />
            <FormRadioGroup
              label="Radio Group (Error)"
              name="role-err"
              color="danger"
              errorMessage="Vui lòng chọn một vai trò"
              options={[
                { value: "a", label: "Option A" },
                { value: "b", label: "Option B" },
              ]}
            />
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          SWITCHES
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Toggle Switches</h2>

        {/* Switch Colors */}
        <Section title="Switch Colors">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {allColors.map((c) => (
              <FormSwitch
                key={c}
                label={c.charAt(0).toUpperCase() + c.slice(1)}
                color={c}
                checked={switchStates[c as keyof typeof switchStates]}
                onChange={(e) =>
                  setSwitchStates((prev) => ({ ...prev, [c]: e.target.checked }))
                }
              />
            ))}
          </div>
        </Section>

        {/* Switch Sizes */}
        <Section title="Switch Sizes">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <FormSwitch label="Small" size="sm" defaultChecked />
            <FormSwitch label="Medium" size="md" defaultChecked />
            <FormSwitch label="Large" size="lg" defaultChecked />
          </div>
        </Section>

        {/* Switch Variants */}
        <Section title="Switch Variants">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <FormSwitch label="Rounded (default)" variant="rounded" defaultChecked />
            <FormSwitch label="Square" variant="square" defaultChecked />
            <FormSwitch label="Disabled Off" disabled />
            <FormSwitch label="Disabled On" disabled defaultChecked />
          </div>
        </Section>

        {/* Switch Reversed */}
        <Section title="Switch Reversed Layout">
          <div className="max-w-xs space-y-3">
            <FormSwitch label="Nhận thông báo email" isReversed defaultChecked />
            <FormSwitch label="Chế độ bảo trì" isReversed color="warning" />
            <FormSwitch label="Xoá tự động" isReversed color="danger" />
          </div>
        </Section>

        {/* Switch with Error */}
        <Section title="Switch with Error / Description">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSwitch label="Kích hoạt tính năng" description="Bật để kích hoạt tính năng mới cho hệ thống." defaultChecked />
            <FormSwitch label="Đồng ý điều khoản" errorMessage="Bạn cần bật tùy chọn này để tiếp tục" color="danger" />
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          TOGGLE BUTTONS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Toggle Buttons</h2>

        {/* Single Toggle Buttons */}
        <Section title="Toggle Button Styles">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-text-muted">Outline (single toggles):</p>
              <div className="flex flex-wrap gap-2">
                {allColors.map((c) => (
                  <FormToggleButton
                    key={c}
                    label={c.charAt(0).toUpperCase() + c.slice(1)}
                    color={c}
                    variant="outline"
                    defaultChecked={c === "primary"}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-text-muted">Solid (single toggles):</p>
              <div className="flex flex-wrap gap-2">
                {allColors.map((c) => (
                  <FormToggleButton
                    key={c}
                    label={c.charAt(0).toUpperCase() + c.slice(1)}
                    color={c}
                    variant="solid"
                    defaultChecked={c === "primary"}
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Toggle Button Sizes */}
        <Section title="Toggle Button Sizes">
          <div className="flex flex-wrap items-end gap-2">
            <FormToggleButton label="Small" size="sm" defaultChecked />
            <FormToggleButton label="Medium" size="md" defaultChecked />
            <FormToggleButton label="Large" size="lg" defaultChecked />
          </div>
        </Section>

        {/* Toggle Button Group — Radio Mode */}
        <Section title="Toggle Button Group (Radio Mode)">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormToggleButtonGroup
              label="Chọn ngôn ngữ"
              name="lang-radio"
              type="radio"
              value={toggleValue}
              onChange={(e) => setToggleValue(e.target.value)}
              options={[
                { value: "html", label: "HTML" },
                { value: "css", label: "CSS" },
                { value: "js", label: "JavaScript" },
                { value: "ts", label: "TypeScript" },
              ]}
              color="primary"
            />
            <FormToggleButtonGroup
              label="Chọn trạng thái"
              name="status-radio"
              type="radio"
              variant="solid"
              color="success"
              value={toggleValue}
              onChange={(e) => setToggleValue(e.target.value)}
              options={[
                { value: "active", label: "Hoạt động" },
                { value: "inactive", label: "Tạm dừng" },
                { value: "archived", label: "Lưu trữ" },
              ]}
            />
          </div>
        </Section>

        {/* Toggle Button Group — Checkbox Mode */}
        <Section title="Toggle Button Group (Checkbox Mode)">
          <FormToggleButtonGroup
            label="Chọn công nghệ (chọn nhiều)"
            name="tech-check"
            type="checkbox"
            value={toggleMulti}
            onChangeMulti={setToggleMulti}
            options={[
              { value: "react", label: "React" },
              { value: "vue", label: "Vue" },
              { value: "angular", label: "Angular" },
              { value: "svelte", label: "Svelte" },
              { value: "nextjs", label: "Next.js" },
            ]}
            color="secondary"
          />
          <p className="mt-2 text-xs text-text-muted">Đã chọn: {toggleMulti.join(", ") || "chưa có"}</p>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          BUTTONS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Buttons</h2>

        {/* Solid Buttons */}
        <Section title="Solid Buttons">
          <div className="flex flex-wrap gap-2">
            {(["primary", "secondary", "success", "warning", "danger", "info", "dark", "light", "orange", "teal", "purple"] as ButtonColor[]).map((c) => (
              <AppButton key={c} color={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</AppButton>
            ))}
          </div>
        </Section>

        {/* Outline Buttons */}
        <Section title="Outline Buttons">
          <div className="flex flex-wrap gap-2">
            {(["primary", "secondary", "success", "warning", "danger", "info", "dark"] as ButtonColor[]).map((c) => (
              <AppButton key={c} color={c} variant="outline">{c.charAt(0).toUpperCase() + c.slice(1)}</AppButton>
            ))}
          </div>
        </Section>

        {/* Soft Buttons */}
        <Section title="Soft / Light Buttons">
          <div className="flex flex-wrap gap-2">
            {(["primary", "secondary", "success", "warning", "danger", "info", "dark"] as ButtonColor[]).map((c) => (
              <AppButton key={c} color={c} variant="soft">{c.charAt(0).toUpperCase() + c.slice(1)}</AppButton>
            ))}
          </div>
        </Section>

        {/* Ghost Buttons */}
        <Section title="Ghost Buttons">
          <div className="flex flex-wrap gap-2">
            {(["primary", "secondary", "success", "danger", "info", "dark"] as ButtonColor[]).map((c) => (
              <AppButton key={c} color={c} variant="ghost">{c.charAt(0).toUpperCase() + c.slice(1)}</AppButton>
            ))}
          </div>
        </Section>

        {/* Button Sizes */}
        <Section title="Button Sizes">
          <div className="flex flex-wrap items-end gap-2">
            <AppButton size="xs">Extra Small</AppButton>
            <AppButton size="sm">Small</AppButton>
            <AppButton size="md">Medium</AppButton>
            <AppButton size="lg">Large</AppButton>
          </div>
        </Section>

        {/* Button Radius */}
        <Section title="Button Radius">
          <div className="flex flex-wrap gap-2">
            <AppButton radius="none">Square</AppButton>
            <AppButton radius="md">Rounded</AppButton>
            <AppButton radius="full">Pill</AppButton>
            <AppButton variant="outline" radius="full">Pill Outline</AppButton>
            <AppButton variant="soft" radius="full">Pill Soft</AppButton>
          </div>
        </Section>

        {/* Button Shadows */}
        <Section title="Button Shadows">
          <div className="flex flex-wrap gap-3">
            <AppButton shadow="sm">Shadow SM</AppButton>
            <AppButton shadow="md">Shadow MD</AppButton>
            <AppButton shadow="lg">Shadow LG</AppButton>
            <AppButton shadow="colored">Colored Shadow</AppButton>
            <AppButton shadow="colored" color="danger">Danger Colored</AppButton>
            <AppButton shadow="colored" color="success">Success Colored</AppButton>
            <AppButton shadow="raised">Raised</AppButton>
          </div>
        </Section>

        {/* Button with Icons */}
        <Section title="Buttons with Icons">
          <div className="flex flex-wrap gap-2">
            <AppButton
              startContent={<SearchIcon />}
            >
              Tìm kiếm
            </AppButton>
            <AppButton
              color="success"
              endContent={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              }
            >
              Xác nhận
            </AppButton>
            <AppButton color="danger" variant="outline"
              startContent={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022 1.005 11.27A2.75 2.75 0 007.77 20h4.46a2.75 2.75 0 002.75-2.778l1.005-11.27.149.022a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" />
                </svg>
              }
            >
              Xoá
            </AppButton>
          </div>
        </Section>

        {/* Icon Only Buttons */}
        <Section title="Icon-Only Buttons">
          <div className="flex flex-wrap gap-2">
            <AppButton isIconOnly size="sm">
              <SearchIcon />
            </AppButton>
            <AppButton isIconOnly color="success">
              <UserIcon />
            </AppButton>
            <AppButton isIconOnly color="danger" variant="outline">
              <MailIcon />
            </AppButton>
            <AppButton isIconOnly color="warning" variant="soft" radius="full">
              <LockIcon />
            </AppButton>
            <AppButton isIconOnly color="info" radius="full" size="lg">
              <SearchIcon className="h-5 w-5" />
            </AppButton>
          </div>
        </Section>

        {/* Loading Buttons */}
        <Section title="Loading State">
          <div className="flex flex-wrap gap-2">
            <AppButton isLoading>Loading</AppButton>
            <AppButton isLoading loadingText="Đang xử lý...">Submit</AppButton>
            <AppButton isLoading loadingPlacement="end" loadingText="Đang lưu.." color="success" />
            <AppButton isLoading isIconOnly color="secondary" />
          </div>
        </Section>

        {/* Disabled Buttons */}
        <Section title="Disabled State">
          <div className="flex flex-wrap gap-2">
            <AppButton disabled>Solid Disabled</AppButton>
            <AppButton disabled variant="outline" color="danger">Outline Disabled</AppButton>
            <AppButton disabled variant="soft" color="success">Soft Disabled</AppButton>
          </div>
        </Section>

        {/* Full Width Buttons */}
        <Section title="Full Width (Block)">
          <div className="max-w-md space-y-2">
            <AppButton isBlock>Full Width Primary</AppButton>
            <AppButton isBlock variant="outline" color="secondary">Full Width Outline</AppButton>
            <AppButton isBlock variant="soft" color="success">Full Width Soft</AppButton>
          </div>
        </Section>

        {/* Button Groups */}
        <Section title="Button Group">
          <div className="space-y-4">
            <ButtonGroup>
              <AppButton>Left</AppButton>
              <AppButton>Center</AppButton>
              <AppButton>Right</AppButton>
            </ButtonGroup>

            <ButtonGroup>
              <AppButton variant="outline">Năm</AppButton>
              <AppButton variant="outline">Tháng</AppButton>
              <AppButton variant="outline">Tuần</AppButton>
              <AppButton variant="outline">Ngày</AppButton>
            </ButtonGroup>

            <ButtonGroup>
              <AppButton color="success" variant="soft">Active</AppButton>
              <AppButton color="warning" variant="soft">Pending</AppButton>
              <AppButton color="danger" variant="soft">Inactive</AppButton>
            </ButtonGroup>
          </div>
        </Section>

        {/* Link Buttons */}
        <Section title="Link as Button">
          <div className="flex flex-wrap gap-2">
            <AppButton as="a" href="#">Link Primary</AppButton>
            <AppButton as="a" href="#" variant="outline" color="info">Link Outline</AppButton>
            <AppButton as="a" href="#" variant="ghost" color="danger">Link Ghost</AppButton>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          BADGES
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Badges</h2>

        {/* Solid Badges */}
        <Section title="Solid Badges">
          <div className="flex flex-wrap gap-2">
            {(["primary", "secondary", "success", "warning", "danger", "info", "dark", "light", "orange", "teal", "purple"] as BadgeColor[]).map((c) => (
              <Badge key={c} color={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</Badge>
            ))}
          </div>
        </Section>

        {/* Soft Badges */}
        <Section title="Soft / Light Badges">
          <div className="flex flex-wrap gap-2">
            {(["primary", "secondary", "success", "warning", "danger", "info", "dark"] as BadgeColor[]).map((c) => (
              <Badge key={c} color={c} variant="soft">{c.charAt(0).toUpperCase() + c.slice(1)}</Badge>
            ))}
          </div>
        </Section>

        {/* Outline Badges */}
        <Section title="Outline Badges">
          <div className="flex flex-wrap gap-2">
            {(["primary", "secondary", "success", "warning", "danger", "info", "dark"] as BadgeColor[]).map((c) => (
              <Badge key={c} color={c} variant="outline">{c.charAt(0).toUpperCase() + c.slice(1)}</Badge>
            ))}
          </div>
        </Section>

        {/* Gradient Badges */}
        <Section title="Gradient Badges">
          <div className="flex flex-wrap gap-2">
            {(["primary", "secondary", "success", "danger", "info", "orange", "purple"] as BadgeColor[]).map((c) => (
              <Badge key={c} color={c} variant="gradient">{c.charAt(0).toUpperCase() + c.slice(1)}</Badge>
            ))}
          </div>
        </Section>

        {/* Pill Badges */}
        <Section title="Pill Badges (rounded-full)">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["primary", "secondary", "success", "warning", "danger", "info", "dark"] as BadgeColor[]).map((c) => (
                <Badge key={c} color={c} radius="full">{c.charAt(0).toUpperCase() + c.slice(1)}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["primary", "secondary", "success", "danger", "info"] as BadgeColor[]).map((c) => (
                <Badge key={c} color={c} variant="soft" radius="full">{c.charAt(0).toUpperCase() + c.slice(1)}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["primary", "secondary", "success", "danger", "info"] as BadgeColor[]).map((c) => (
                <Badge key={c} color={c} variant="outline" radius="full">{c.charAt(0).toUpperCase() + c.slice(1)}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["primary", "secondary", "success", "danger", "orange", "purple"] as BadgeColor[]).map((c) => (
                <Badge key={c} color={c} variant="gradient" radius="full">{c.charAt(0).toUpperCase() + c.slice(1)}</Badge>
              ))}
            </div>
          </div>
        </Section>

        {/* Badge Sizes */}
        <Section title="Badge Sizes">
          <div className="flex flex-wrap items-end gap-2">
            <Badge size="xs">Extra Small</Badge>
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
          </div>
        </Section>

        {/* Badge with Icon */}
        <Section title="Badge with Icon">
          <div className="flex flex-wrap gap-2">
            <Badge color="danger" radius="full" startContent={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              </svg>
            }>
              Hot
            </Badge>
            <Badge color="success" variant="soft" startContent={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            }>
              Verified
            </Badge>
            <Badge color="warning" variant="outline" radius="full" startContent={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            }>
              Caution
            </Badge>
            <Badge color="info" radius="full" startContent={
              <MailIcon className="h-3 w-3" />
            }>
              3 tin nhắn
            </Badge>
          </div>
        </Section>

        {/* Dismissible Badges */}
        <Section title="Dismissible Badges">
          <div className="flex flex-wrap gap-2">
            <Badge color="primary" radius="full" isDismissible onDismiss={() => alert("Dismissed!")}>React</Badge>
            <Badge color="secondary" variant="soft" radius="full" isDismissible>Vue.js</Badge>
            <Badge color="success" variant="outline" radius="full" isDismissible>Angular</Badge>
            <Badge color="danger" radius="full" isDismissible>Svelte</Badge>
          </div>
        </Section>

        {/* Badge Dots */}
        <Section title="Badge Dots (Notification Indicators)">
          <div className="flex flex-wrap items-center gap-6">
            {(["primary", "secondary", "success", "warning", "danger", "info", "dark"] as BadgeColor[]).map((c) => (
              <div key={c} className="flex items-center gap-2">
                <BadgeDot color={c} />
                <span className="text-xs text-text-muted">{c}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <BadgeDot color="success" isPing />
              <span className="text-xs text-text-muted">Ping (online)</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeDot color="danger" isPing />
              <span className="text-xs text-text-muted">Ping (alert)</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeDot color="warning" isPing size="lg" />
              <span className="text-xs text-text-muted">Ping (large)</span>
            </div>
          </div>
        </Section>

        {/* Badge on Buttons (Overlay) */}
        <Section title="Badge Overlay (on Buttons)">
          <div className="flex flex-wrap items-center gap-6">
            <BadgeOverlay content="4">
              <AppButton>Notifications</AppButton>
            </BadgeOverlay>
            <BadgeOverlay content="99+" color="danger">
              <AppButton variant="outline">Inbox</AppButton>
            </BadgeOverlay>
            <BadgeOverlay isDot isPing color="success">
              <AppButton variant="soft" color="secondary">Messages</AppButton>
            </BadgeOverlay>
            <BadgeOverlay content="N" color="info" position="top-left">
              <AppButton variant="outline" color="info">Top Left</AppButton>
            </BadgeOverlay>
          </div>
        </Section>

        {/* Badge on Icons/Avatars */}
        <Section title="Badge Overlay (on Icons)">
          <div className="flex flex-wrap items-center gap-8">
            <BadgeOverlay content="3" color="danger">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MailIcon className="h-5 w-5" />
              </span>
            </BadgeOverlay>
            <BadgeOverlay isDot color="success">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text">
                <UserIcon className="h-5 w-5" />
              </span>
            </BadgeOverlay>
            <BadgeOverlay isDot isPing color="danger" position="bottom-right">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-dark text-white">
                <LockIcon className="h-5 w-5" />
              </span>
            </BadgeOverlay>
          </div>
        </Section>

        {/* Badge in Headings */}
        <Section title="Badges in Headings">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-text">Heading 1 <Badge size="sm">New</Badge></h1>
            <h2 className="text-xl font-semibold text-text">Heading 2 <Badge size="sm" color="secondary">Hot</Badge></h2>
            <h3 className="text-lg font-semibold text-text">Heading 3 <Badge size="xs" color="success" variant="soft" radius="full">Updated</Badge></h3>
            <h4 className="text-base font-medium text-text">Heading 4 <Badge size="xs" color="danger" variant="outline">Alert</Badge></h4>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          BREADCRUMBS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Breadcrumbs</h2>

        {/* Default Breadcrumb (slash) */}
        <Section title="Default (Slash Separator)">
          <div className="space-y-3">
            <AppBreadcrumb items={[{ label: "Dashboard", href: "/" }]} />
            <AppBreadcrumb items={[
              { label: "Dashboard", href: "/" },
              { label: "Dự án", href: "/projects" },
            ]} />
            <AppBreadcrumb items={[
              { label: "Dashboard", href: "/" },
              { label: "Dự án", href: "/projects" },
              { label: "Chi tiết dự án" },
            ]} />
          </div>
        </Section>

        {/* Text Separators */}
        <Section title="Text Separators">
          <div className="space-y-3">
            <AppBreadcrumb separator="chevron" items={[
              { label: "Dashboard", href: "/" },
              { label: "Bài viết", href: "/articles" },
              { label: "Tạo mới" },
            ]} />
            <AppBreadcrumb separator="arrow" items={[
              { label: "Dashboard", href: "/" },
              { label: "Tuyển dụng", href: "/jobs" },
              { label: "Frontend Dev" },
            ]} />
            <AppBreadcrumb separator="dot" items={[
              { label: "Dashboard", href: "/" },
              { label: "Cài đặt", href: "/settings" },
              { label: "Hồ sơ" },
            ]} />
            <AppBreadcrumb separator="pipe" items={[
              { label: "Dashboard", href: "/" },
              { label: "Slide", href: "/slides" },
              { label: "Chỉnh sửa" },
            ]} />
            <AppBreadcrumb separator="dash" items={[
              { label: "Dashboard", href: "/" },
              { label: "Đối tác" },
            ]} />
            <AppBreadcrumb separator="tilde" items={[
              { label: "Dashboard", href: "/" },
              { label: "Leads" },
            ]} />
          </div>
        </Section>

        {/* SVG Icon Separators */}
        <Section title="SVG Icon Separators">
          <div className="space-y-3">
            <AppBreadcrumb
              separator={<ChevronSeparator className="h-3.5 w-3.5" />}
              items={[
                { label: "Dashboard", href: "/" },
                { label: "Dự án", href: "/projects" },
                { label: "Chi tiết" },
              ]}
            />
            <AppBreadcrumb
              separator={<DoubleChevronSeparator className="h-3.5 w-3.5" />}
              items={[
                { label: "Dashboard", href: "/" },
                { label: "Bài viết" },
              ]}
            />
            <AppBreadcrumb
              separator={<ArrowSeparator className="h-3.5 w-3.5" />}
              items={[
                { label: "Dashboard", href: "/" },
                { label: "Chương trình", href: "/programs" },
                { label: "Tạo mới" },
              ]}
            />
          </div>
        </Section>

        {/* Contained Style */}
        <Section title="Contained Style (Background)">
          <div className="space-y-3">
            <AppBreadcrumb variant="contained" items={[
              { label: "Dashboard", href: "/" },
              { label: "Dự án", href: "/projects" },
              { label: "Chi tiết dự án" },
            ]} />
            <AppBreadcrumb variant="contained" separator="chevron" items={[
              { label: "Dashboard", href: "/" },
              { label: "Tổ chức", href: "/organization" },
              { label: "Lĩnh vực", href: "/operation-fields" },
              { label: "Môi trường" },
            ]} />
          </div>
        </Section>

        {/* Icon Style */}
        <Section title="Icon Style (Per Item)">
          <div className="space-y-3">
            <AppBreadcrumb variant="icon" items={[
              { label: "Dashboard", href: "/", icon: <BreadcrumbHomeIcon /> },
              { label: "Dự án", href: "/projects", icon: <FolderIcon /> },
              { label: "file.pdf", icon: <FileIcon /> },
            ]} />
            <AppBreadcrumb variant="icon" separator="chevron" items={[
              { label: "Dashboard", href: "/", icon: <BreadcrumbHomeIcon /> },
              { label: "Bài viết", href: "/articles", icon: <FolderIcon /> },
              { label: "Tạo mới", icon: <FileIcon /> },
            ]} />
            <AppBreadcrumb variant="icon" separator={<ChevronSeparator className="h-3.5 w-3.5" />} items={[
              { label: "Dashboard", href: "/", icon: <BreadcrumbHomeIcon /> },
              { label: "Cài đặt", icon: <FolderIcon /> },
            ]} />
          </div>
        </Section>

        {/* Breadcrumb Sizes */}
        <Section title="Breadcrumb Sizes">
          <div className="space-y-3">
            <AppBreadcrumb size="sm" items={[
              { label: "Dashboard", href: "/" },
              { label: "Small" },
            ]} />
            <AppBreadcrumb size="md" items={[
              { label: "Dashboard", href: "/" },
              { label: "Medium (default)" },
            ]} />
            <AppBreadcrumb size="lg" items={[
              { label: "Dashboard", href: "/" },
              { label: "Large" },
            ]} />
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          DROPDOWNS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Dropdowns</h2>

        {/* Basic Dropdown */}
        <Section title="Basic Dropdown">
          <div className="flex flex-wrap gap-3">
            <Dropdown
              trigger={<AppButton>Dropdown Button</AppButton>}
            >
              <DropdownItem onClick={() => alert("Action clicked")}>Action</DropdownItem>
              <DropdownItem>Another action</DropdownItem>
              <DropdownItem>Something else here</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton variant="outline">Outline Dropdown</AppButton>}
            >
              <DropdownItem>Action</DropdownItem>
              <DropdownItem>Another action</DropdownItem>
              <DropdownDivider />
              <DropdownItem>Separated link</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton variant="soft">Soft Dropdown</AppButton>}
            >
              <DropdownItem>Action</DropdownItem>
              <DropdownItem>Another action</DropdownItem>
            </Dropdown>
          </div>
        </Section>

        {/* Color Dropdown Buttons */}
        <Section title="Color Variants">
          <div className="flex flex-wrap gap-2">
            {(["primary", "secondary", "success", "danger", "warning", "info", "dark"] as const).map((c) => (
              <Dropdown
                key={c}
                trigger={<AppButton color={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</AppButton>}
              >
                <DropdownItem>Action</DropdownItem>
                <DropdownItem>Another action</DropdownItem>
                <DropdownDivider />
                <DropdownItem>Separated link</DropdownItem>
              </Dropdown>
            ))}
          </div>
        </Section>

        {/* Dropdown with Headers & Dividers */}
        <Section title="Headers, Dividers & Disabled Items">
          <div className="flex flex-wrap gap-3">
            <Dropdown
              trigger={<AppButton>Menu with Sections</AppButton>}
            >
              <DropdownHeader>User Actions</DropdownHeader>
              <DropdownItem onClick={() => router.push('/profile')} startContent={<UserIcon className="h-4 w-4" />}>Hồ sơ cá nhân</DropdownItem>
              <DropdownItem startContent={<MailIcon className="h-4 w-4" />}>Tin nhắn</DropdownItem>
              <DropdownDivider />
              <DropdownHeader>Settings</DropdownHeader>
              <DropdownItem startContent={<LockIcon className="h-4 w-4" />}>Bảo mật</DropdownItem>
              <DropdownItem disabled>Tính năng đang phát triển</DropdownItem>
              <DropdownDivider />
              <DropdownItem isActive>Active Item</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton variant="outline" color="danger">With Disabled</AppButton>}
            >
              <DropdownItem>Regular action</DropdownItem>
              <DropdownItem disabled>Disabled action</DropdownItem>
              <DropdownItem>Another action</DropdownItem>
            </Dropdown>
          </div>
        </Section>

        {/* Dropdown Placement */}
        <Section title="Dropdown Placement">
          <div className="flex flex-wrap gap-3">
            <Dropdown
              trigger={<AppButton>Bottom Start (default)</AppButton>}
              placement="bottom-start"
            >
              <DropdownItem>Item 1</DropdownItem>
              <DropdownItem>Item 2</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton color="secondary">Bottom End</AppButton>}
              placement="bottom-end"
            >
              <DropdownItem>Item 1</DropdownItem>
              <DropdownItem>Item 2</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton color="success">Top Start</AppButton>}
              placement="top-start"
            >
              <DropdownItem>Item 1</DropdownItem>
              <DropdownItem>Item 2</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton color="warning">Top End</AppButton>}
              placement="top-end"
            >
              <DropdownItem>Item 1</DropdownItem>
              <DropdownItem>Item 2</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton color="info">Left</AppButton>}
              placement="left"
            >
              <DropdownItem>Item 1</DropdownItem>
              <DropdownItem>Item 2</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton color="dark">Right</AppButton>}
              placement="right"
            >
              <DropdownItem>Item 1</DropdownItem>
              <DropdownItem>Item 2</DropdownItem>
            </Dropdown>
          </div>
        </Section>

        {/* Dropdown with Icons */}
        <Section title="Dropdown with Icons">
          <Dropdown
            trigger={<AppButton startContent={<SearchIcon className="h-4 w-4" />}>Actions</AppButton>}
          >
            <DropdownItem startContent={<SearchIcon className="h-4 w-4" />}>Tìm kiếm</DropdownItem>
            <DropdownItem startContent={<UserIcon className="h-4 w-4" />}>Thành viên</DropdownItem>
            <DropdownItem startContent={<MailIcon className="h-4 w-4" />}>Gửi email</DropdownItem>
            <DropdownDivider />
            <DropdownItem
              startContent={<LockIcon className="h-4 w-4" />}
              endContent={<Badge size="xs" color="danger" radius="full">2</Badge>}
            >
              Bảo mật
            </DropdownItem>
          </Dropdown>
        </Section>

        {/* Dropdown with Icon-Only Trigger */}
        <Section title="Icon-Only Trigger">
          <div className="flex flex-wrap gap-3">
            <Dropdown
              trigger={<AppButton isIconOnly variant="soft"><SearchIcon /></AppButton>}
            >
              <DropdownItem>Action</DropdownItem>
              <DropdownItem>Another action</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton isIconOnly variant="outline" color="danger" radius="full"><MailIcon /></AppButton>}
              placement="bottom-end"
            >
              <DropdownItem>View all</DropdownItem>
              <DropdownItem>Mark as read</DropdownItem>
              <DropdownDivider />
              <DropdownItem>Delete all</DropdownItem>
            </Dropdown>
          </div>
        </Section>

        {/* Dropdown with Text & Custom Content */}
        <Section title="Text & Custom Content">
          <div className="flex flex-wrap gap-3">
            <Dropdown
              trigger={<AppButton variant="outline">With Help Text</AppButton>}
              autoClose={false}
            >
              <DropdownText>
                Chọn một hành động bên dưới.
                Menu này không tự đóng khi click item.
              </DropdownText>
              <DropdownDivider />
              <DropdownItem>Action 1</DropdownItem>
              <DropdownItem>Action 2</DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={<AppButton color="secondary">Form Inside</AppButton>}
              autoClose={false}
              minWidth={240}
            >
              <DropdownCustom>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text">Email</label>
                    <input type="email" className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text outline-none focus:border-primary" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text">Mật khẩu</label>
                    <input type="password" className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text outline-none focus:border-primary" placeholder="********" />
                  </div>
                  <AppButton isBlock size="sm">Sign In</AppButton>
                </form>
              </DropdownCustom>
            </Dropdown>
          </div>
        </Section>

        {/* Dropdown Sizes */}
        <Section title="Dropdown Trigger Sizes">
          <div className="flex flex-wrap items-end gap-2">
            <Dropdown trigger={<AppButton size="xs">XS</AppButton>}>
              <DropdownItem>Action</DropdownItem>
            </Dropdown>
            <Dropdown trigger={<AppButton size="sm">Small</AppButton>}>
              <DropdownItem>Action</DropdownItem>
            </Dropdown>
            <Dropdown trigger={<AppButton size="md">Medium</AppButton>}>
              <DropdownItem>Action</DropdownItem>
            </Dropdown>
            <Dropdown trigger={<AppButton size="lg">Large</AppButton>}>
              <DropdownItem>Action</DropdownItem>
            </Dropdown>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          POPOVERS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Popovers</h2>

        {/* Default Popover Placements */}
        <Section title="Default Popovers (Click — 4 Placements)">
          <div className="flex flex-wrap items-center gap-3 py-8">
            <Popover
              trigger={<AppButton variant="outline">Top</AppButton>}
              title="Popover Top"
              placement="top"
            >
              Nội dung popover ở vị trí trên.
            </Popover>
            <Popover
              trigger={<AppButton variant="outline">Right</AppButton>}
              title="Popover Right"
              placement="right"
            >
              Nội dung popover ở bên phải.
            </Popover>
            <Popover
              trigger={<AppButton variant="outline">Bottom</AppButton>}
              title="Popover Bottom"
              placement="bottom"
            >
              Nội dung popover ở bên dưới.
            </Popover>
            <Popover
              trigger={<AppButton variant="outline">Left</AppButton>}
              title="Popover Left"
              placement="left"
            >
              Nội dung popover ở bên trái.
            </Popover>
          </div>
        </Section>

        {/* Hover Trigger */}
        <Section title="Hover Trigger">
          <div className="flex flex-wrap items-center gap-3 py-4">
            <Popover
              trigger={<AppButton color="info">Hover me (Top)</AppButton>}
              title="Hover Popover"
              placement="top"
              triggerMode="hover"
            >
              Popover xuất hiện khi hover, tự ẩn khi rời chuột.
            </Popover>
            <Popover
              trigger={<AppButton color="success" variant="outline">Hover (Right)</AppButton>}
              title="Hiển thị nhanh"
              placement="right"
              triggerMode="hover"
            >
              Thông tin bổ sung khi di chuột.
            </Popover>
          </div>
        </Section>

        {/* Colored Header Popovers */}
        <Section title="Colored Header Popovers">
          <div className="flex flex-wrap items-center gap-3 py-6">
            {(["primary", "secondary", "success", "danger", "warning", "info"] as PopoverColor[]).map((c) => (
              <Popover
                key={c}
                trigger={<AppButton color={c === "default" ? "primary" : c}>{c.charAt(0).toUpperCase() + c.slice(1)}</AppButton>}
                title={`${c.charAt(0).toUpperCase() + c.slice(1)} Header`}
                color={c}
                variant="header"
                placement="bottom"
              >
                Đây là popover với header màu {c}.
              </Popover>
            ))}
          </div>
        </Section>

        {/* Solid Colored Popovers */}
        <Section title="Solid Colored Popovers">
          <div className="flex flex-wrap items-center gap-3 py-6">
            {(["primary", "secondary", "success", "danger", "info", "dark"] as PopoverColor[]).map((c) => (
              <Popover
                key={c}
                trigger={<AppButton color={c === "default" ? "primary" : c}>{c.charAt(0).toUpperCase() + c.slice(1)}</AppButton>}
                title={`${c.charAt(0).toUpperCase() + c.slice(1)} Solid`}
                color={c}
                variant="solid"
                placement="bottom"
              >
                Full background color popover.
              </Popover>
            ))}
          </div>
        </Section>

        {/* Soft/Light Colored Popovers */}
        <Section title="Soft / Light Popovers">
          <div className="flex flex-wrap items-center gap-3 py-6">
            {(["primary", "secondary", "success", "danger", "info"] as PopoverColor[]).map((c) => (
              <Popover
                key={c}
                trigger={<AppButton color={c === "default" ? "primary" : c} variant="soft">{c.charAt(0).toUpperCase() + c.slice(1)}</AppButton>}
                title={`${c.charAt(0).toUpperCase() + c.slice(1)} Soft`}
                color={c}
                variant="soft"
                placement="bottom"
              >
                Light background popover.
              </Popover>
            ))}
          </div>
        </Section>

        {/* No Title / No Arrow */}
        <Section title="Without Title & Without Arrow">
          <div className="flex flex-wrap items-center gap-3 py-4">
            <Popover
              trigger={<AppButton variant="outline" color="dark">No Title</AppButton>}
              placement="bottom"
            >
              Popover chỉ có nội dung, không có tiêu đề.
            </Popover>
            <Popover
              trigger={<AppButton variant="outline" color="secondary">No Arrow</AppButton>}
              title="No Arrow"
              showArrow={false}
              placement="bottom"
            >
              Popover không có mũi tên.
            </Popover>
          </div>
        </Section>

        {/* Disabled Popover */}
        <Section title="Disabled Popover">
          <Popover
            trigger={<AppButton disabled>Disabled Button</AppButton>}
            title="Won&apos;t Show"
            disabled
          >
            This popover will never appear.
          </Popover>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          PAGINATION
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Pagination</h2>

        {/* Basic Pagination */}
        <Section title="Basic Pagination (Default style)">
          <div className="flex flex-col gap-4 py-2">
            <Pagination
              currentPage={page1}
              totalPages={5}
              onPageChange={setPage1}
              prevContent="Prev"
              nextContent="Next"
            />
            <Pagination
              currentPage={page1}
              totalPages={5}
              onPageChange={setPage1}
              prevContent="«"
              nextContent="»"
            />
            <Pagination
              currentPage={page1}
              totalPages={5}
              onPageChange={setPage1}
            />
          </div>
        </Section>

        {/* Shapes (Radius) */}
        <Section title="Pagination Radius">
          <div className="flex flex-col gap-4 py-2">
            <Pagination
              currentPage={page2}
              totalPages={5}
              onPageChange={setPage2}
              radius="md" // default
            />
            <Pagination
              currentPage={page2}
              totalPages={5}
              onPageChange={setPage2}
              radius="full" // pill
            />
          </div>
        </Section>

        {/* Visual Variants (Style 1-4) */}
        <Section title="Visual Variants (Styles)">
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Style 1 (Default: bordered, solid active)</span>
              <Pagination currentPage={page3} totalPages={10} onPageChange={setPage3} variant="default" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Style 2 (Filled: background on hover/active, no border)</span>
              <Pagination currentPage={page3} totalPages={10} onPageChange={setPage3} variant="filled" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Style 3 (Outlined: border colored active)</span>
              <Pagination currentPage={page3} totalPages={10} onPageChange={setPage3} variant="outlined" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Style 4 (Minimal: no border, solid active)</span>
              <Pagination currentPage={page3} totalPages={10} onPageChange={setPage3} variant="minimal" />
            </div>
          </div>
        </Section>

        {/* Sizes */}
        <Section title="Pagination Sizes">
          <div className="flex flex-col items-start gap-4 py-2">
            <Pagination currentPage={page1} totalPages={3} onPageChange={setPage1} size="sm" variant="filled" />
            <Pagination currentPage={page1} totalPages={3} onPageChange={setPage1} size="md" variant="filled" />
            <Pagination currentPage={page1} totalPages={3} onPageChange={setPage1} size="lg" variant="filled" />
          </div>
        </Section>

        {/* Alignments */}
        <Section title="Alignment">
          <div className="flex flex-col gap-4 py-2">
            <Pagination currentPage={page1} totalPages={3} onPageChange={setPage1} align="start" />
            <Pagination currentPage={page1} totalPages={3} onPageChange={setPage1} align="center" variant="filled" />
            <Pagination currentPage={page1} totalPages={3} onPageChange={setPage1} align="end" variant="minimal" radius="full" />
          </div>
        </Section>

        {/* Colors */}
        <Section title="Color Variants">
          <div className="flex flex-col gap-4 py-2">
            {(["primary", "secondary", "success", "danger", "warning", "info", "dark"] as PaginationColor[]).map((c) => (
              <Pagination
                key={c}
                currentPage={page4}
                totalPages={5}
                onPageChange={setPage4}
                color={c}
                variant="filled"
                radius="full"
              />
            ))}
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          TOASTS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Toasts (Notifications)</h2>

        {/* Basic Toast */}
        <Section title="Basic Toast (Default Style)">
          <div className="flex flex-wrap gap-3 py-2">
            <AppButton
              onClick={() =>
                toast({
                  title: "Thành công",
                  description: "Hành động của bạn đã được thực hiện.",
                  time: "vừa xong",
                })
              }
            >
              Show Default Toast
            </AppButton>

            <AppButton
              variant="outline"
              onClick={() =>
                toast({
                  title: "Có lỗi xảy ra",
                  description: "Không thể kết nối đến máy chủ, vui lòng thử lại.",
                  time: "1 phút trước",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  ),
                })
              }
            >
              With Custom Icon
            </AppButton>
          </div>
        </Section>

        {/* Solid Toasts */}
        <Section title="Solid Color Toasts">
          <div className="flex flex-wrap gap-3 py-2">
            {(["primary", "success", "danger", "warning", "info", "dark"] as const).map((c) => (
              <AppButton
                key={c}
                color={c}
                onClick={() =>
                  toast({
                    title: `${c.charAt(0).toUpperCase() + c.slice(1)} Toast`,
                    description: "This is a solid color toast notification.",
                    variant: "solid",
                    color: c,
                  })
                }
              >
                {c}
              </AppButton>
            ))}
          </div>
        </Section>

        {/* Soft Toasts */}
        <Section title="Soft/Light Color Toasts">
          <div className="flex flex-wrap gap-3 py-2">
            {(["primary", "secondary", "success", "danger", "info"] as const).map((c) => (
              <AppButton
                key={c}
                color={c}
                variant="soft"
                onClick={() =>
                  toast({
                    title: `${c.charAt(0).toUpperCase() + c.slice(1)} Toast`,
                    description: "This is a light/soft color toast notification.",
                    variant: "soft",
                    color: c,
                  })
                }
              >
                {c}
              </AppButton>
            ))}
          </div>
        </Section>

        {/* Toast with Actions */}
        <Section title="Toast with Action">
          <div className="flex flex-wrap gap-3 py-2">
            <AppButton
              onClick={() =>
                toast({
                  title: "Bản cập nhật mới",
                  description: "Đã có phiên bản mới của ứng dụng. Bạn có muốn cập nhật ngay?",
                  duration: 10000,
                  action: {
                    label: "Cập nhật",
                    onClick: () => alert("Đang cập nhật..."),
                  },
                })
              }
            >
              Toast with Action Button
            </AppButton>

            <AppButton
              color="danger"
              onClick={() =>
                toast({
                  title: "Xóa dữ liệu",
                  description: "Bạn vừa xóa 1 dự án.",
                  variant: "soft",
                  color: "danger",
                  action: {
                    label: "Hoàn tác (Undo)",
                    onClick: () => alert("Đã hoàn tác!"),
                  },
                })
              }
            >
              Undo Action
            </AppButton>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          TOOLTIPS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Tooltips</h2>

        {/* Directions */}
        <Section title="Tooltip Directions">
          <div className="flex flex-wrap gap-3 py-2">
            <Tooltip content="Tooltip on top" placement="top">
              <AppButton>Tooltip on top</AppButton>
            </Tooltip>
            <Tooltip content="Tooltip on right" placement="right">
              <AppButton>Tooltip on right</AppButton>
            </Tooltip>
            <Tooltip content="Tooltip on bottom" placement="bottom">
              <AppButton>Tooltip on bottom</AppButton>
            </Tooltip>
            <Tooltip content="Tooltip on left" placement="left">
              <AppButton>Tooltip on left</AppButton>
            </Tooltip>
          </div>
        </Section>

        {/* Colors */}
        <Section title="Colored Tooltips">
          <div className="flex flex-wrap gap-3 py-2">
            {(["primary", "secondary", "warning", "info", "success", "danger", "light", "dark"] as TooltipColor[]).map((c) => (
              <Tooltip
                key={c}
                content={`${c.charAt(0).toUpperCase() + c.slice(1)} Tooltip`}
                color={c}
                placement="top"
              >
                <AppButton color={c === "default" || c === "light" ? "primary" : c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)} Tooltip
                </AppButton>
              </Tooltip>
            ))}
          </div>
        </Section>

        {/* Inline links */}
        <Section title="Tooltips on links">
          <div className="py-2">
            Hover on the link to view the{" "}
            <Tooltip content="Link Tooltip" color="primary">
              <a href="#" className="font-semibold text-primary hover:underline">
                Tooltip
              </a>
            </Tooltip>
          </div>
        </Section>

        {/* SVG Icons */}
        <Section title="With SVGs">
          <div className="flex flex-wrap gap-5 py-2">
            <Tooltip content="Home" color="primary">
              <a href="#" className="text-primary hover:opacity-80">
                <BreadcrumbHomeIcon className="h-5 w-5" />
              </a>
            </Tooltip>
            <Tooltip content="Message" color="secondary">
              <a href="#" className="text-secondary hover:opacity-80">
                <MailIcon className="h-5 w-5" />
              </a>
            </Tooltip>
            <Tooltip content="Add User" color="warning">
              <a href="#" className="text-warning hover:opacity-80">
                <UserIcon className="h-5 w-5" />
              </a>
            </Tooltip>
            <Tooltip content="Action" color="success">
              <a href="#" className="text-success hover:opacity-80">
                <LockIcon className="h-5 w-5" />
              </a>
            </Tooltip>
          </div>
        </Section>

        {/* Disabled elements */}
        <Section title="Disabled elements">
          <div className="py-2">
            <Tooltip content="Disabled tooltip">
              <AppButton disabled>Disabled Button</AppButton>
            </Tooltip>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          SPINNERS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Spinners</h2>

        {/* Border Spinners */}
        <Section title="Border Spinner">
          <div className="flex flex-wrap gap-4 py-2">
            {(["primary", "secondary", "success", "danger", "warning", "info", "light", "dark"] as SpinnerColor[]).map((c) => (
              <div key={c} className={c === "light" ? "rounded bg-dark p-2" : ""}>
                <Spinner color={c} />
              </div>
            ))}
          </div>
        </Section>

        {/* Growing Spinners */}
        <Section title="Growing Spinner">
          <div className="flex flex-wrap gap-4 py-2">
            {(["primary", "secondary", "success", "danger", "warning", "info", "light", "dark"] as SpinnerColor[]).map((c) => (
              <div key={c} className={c === "light" ? "rounded bg-dark p-2" : ""}>
                <Spinner variant="grow" color={c} />
              </div>
            ))}
          </div>
        </Section>

        {/* Alignment */}
        <Section title="Alignment">
          <div className="flex w-full flex-col gap-4 py-2">
            <div className="flex justify-start">
              <Spinner color="primary" />
            </div>
            <div className="flex justify-center">
              <Spinner color="secondary" />
            </div>
            <div className="flex justify-end">
              <Spinner color="success" />
            </div>
          </div>
        </Section>

        {/* Sizes */}
        <Section title="Sizes">
          <div className="flex flex-wrap items-center gap-6 py-2">
            <Spinner size="sm" color="primary" />
            <Spinner size="md" color="secondary" />
            <Spinner size="lg" color="success" />

            <div className="w-4" /> {/* separator */}

            <Spinner variant="grow" size="sm" color="primary" />
            <Spinner variant="grow" size="md" color="secondary" />
            <Spinner variant="grow" size="lg" color="success" />
          </div>
        </Section>

        {/* Spinners in Buttons */}
        <Section title="Spinners in Buttons">
          <div className="flex flex-wrap gap-4 py-2">
            <AppButton disabled startContent={<Spinner size="sm" color="light" />}>
              Loading...
            </AppButton>

            <AppButton disabled color="secondary" startContent={<Spinner variant="grow" size="sm" color="light" />}>
              Loading...
            </AppButton>

            <AppButton disabled variant="outline" startContent={<Spinner size="sm" color="primary" />}>
              Processing
            </AppButton>

            <AppButton disabled isIconOnly color="success">
              <Spinner size="sm" color="light" />
            </AppButton>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          PROGRESS BARS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Progress Bars</h2>

        {/* Basic & Colors */}
        <Section title="Basic Progress & Colors">
          <div className="flex w-full flex-col gap-4 py-2">
            <Progress value={20} color="primary" />
            <Progress value={40} color="secondary" />
            <Progress value={60} color="success" />
            <Progress value={80} color="danger" />
          </div>
        </Section>

        {/* Light Track */}
        <Section title="Light Track">
          <div className="flex w-full flex-col gap-4 py-2">
            <Progress value={50} color="primary" isLightTrack />
            <Progress value={60} color="warning" isLightTrack />
          </div>
        </Section>

        {/* Striped & Animated */}
        <Section title="Striped & Animated">
          <div className="flex w-full flex-col gap-4 py-2">
            <Progress value={50} color="info" isStriped />
            <Progress value={75} color="success" isStriped isAnimated />
          </div>
        </Section>

        {/* Sizes */}
        <Section title="Sizes">
          <div className="flex w-full flex-col gap-4 py-2">
            <Progress value={30} size="xs" color="primary" />
            <Progress value={40} size="sm" color="secondary" />
            <Progress value={50} size="md" color="success" />
            <Progress value={60} size="lg" color="warning" />
            <Progress value={70} size="xl" color="danger" />
          </div>
        </Section>

        {/* Labels */}
        <Section title="Labels">
          <div className="flex w-full flex-col gap-4 py-2">
            <Progress value={60} size="lg" showValueLabel color="primary" />
            <Progress value={45} size="lg" label="Downloading..." color="secondary" />
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">Modals</h2>

        {/* Basic & Static Modals */}
        <Section title="Basic & Static Modals">
          <div className="flex flex-wrap gap-4 py-2">
            <AppButton onClick={() => setBasicModalOpen(true)}>Basic Modal</AppButton>
            <AppButton color="secondary" onClick={() => setStaticModalOpen(true)}>Static Backdrop Modal</AppButton>
          </div>
        </Section>

        {/* Modal Sizes */}
        <Section title="Modal Sizes">
          <div className="flex flex-wrap gap-4 py-2">
            <AppButton variant="outline" onClick={() => setSmallModalOpen(true)}>Small Modal</AppButton>
            <AppButton variant="outline" onClick={() => setLargeModalOpen(true)}>Large Modal</AppButton>
            <AppButton variant="outline" onClick={() => setFullModalOpen(true)}>Fullscreen Modal</AppButton>
          </div>
        </Section>

        {/* Placements & Scrolling */}
        <Section title="Placements & Scrolling">
          <div className="flex flex-wrap gap-4 py-2">
            <AppButton color="info" onClick={() => setTopModalOpen(true)}>Top Placement</AppButton>
            <AppButton color="success" onClick={() => setInsideScrollModalOpen(true)}>Inside Scroll (Long Content)</AppButton>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════
          DATA TABLE
          ═══════════════════════════════════════════════════════ */}

        <h2 className="mt-4 text-lg font-semibold text-text">DataTable</h2>

        {/* Full Featured DataTable */}
        <Section title="Task List View (Vyzor Style)">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <AppButton size="sm" onClick={handleToggleLoading}>
              Simulate Loading (2s)
            </AppButton>
            <p className="text-xs text-text-muted">
              Selected: {tableSelectedKeys.size} row(s)
            </p>
          </div>

          <DataTable<TaskItem>
            data={pagedTasks}
            columns={taskColumns}
            keyExtractor={(t) => t.id}
            selectable
            selectedKeys={tableSelectedKeys}
            onSelectionChange={setTableSelectedKeys}
            sortDescriptor={tableSortDescriptor}
            onSortChange={setTableSortDescriptor}
            isLoading={tableLoading}
            pagination={{
              currentPage: tablePage,
              totalPages: Math.ceil(sampleTasks.length / tablePageSize),
              onPageChange: setTablePage,
              totalItems: sampleTasks.length,
              pageSize: tablePageSize,
            }}
          />
        </Section>

        {/* Minimal DataTable (no selection, no pagination) */}
        <Section title="Minimal DataTable (no selection, no pagination)">
          <DataTable<TaskItem>
            data={sampleTasks.slice(0, 3)}
            columns={taskColumns.filter((c) => ["task", "taskId", "status", "priority"].includes(c.key))}
            keyExtractor={(t) => t.id}
          />
        </Section>

        {/* Empty State */}
        <Section title="Empty State">
          <DataTable<TaskItem>
            data={[]}
            columns={taskColumns}
            keyExtractor={(t) => t.id}
            emptyContent={
              <div className="flex flex-col items-center gap-2 py-4">
                <svg className="h-12 w-12 text-text-muted/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
                <p className="text-sm font-medium text-text-muted">Chưa có tác vụ nào</p>
                <p className="text-xs text-text-muted/70">Tạo tác vụ đầu tiên để bắt đầu</p>
              </div>
            }
          />
        </Section>
      </div>

      {/* ─── Modal Implementations ─── */}

      <Modal isOpen={isBasicModalOpen} onClose={() => setBasicModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Basic Modal</ModalHeader>
          <ModalBody>
            <p>Duis sit non in cillum amet labore voluptate nostrud reprehenderit do magna minim ipsum.</p>
          </ModalBody>
          <ModalFooter>
            <AppButton variant="ghost" onClick={() => setBasicModalOpen(false)}>Cancel</AppButton>
            <AppButton onClick={() => setBasicModalOpen(false)}>Save Changes</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isStaticModalOpen} onClose={() => setStaticModalOpen(false)} isDismissable={false}>
        <ModalContent>
          <ModalHeader>Static Backdrop</ModalHeader>
          <ModalBody>
            <p>I will not close if you click outside me. Don&apos;t even try to press escape key.</p>
          </ModalBody>
          <ModalFooter>
            <AppButton color="secondary" onClick={() => setStaticModalOpen(false)}>Understood</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSmallModalOpen} onClose={() => setSmallModalOpen(false)} size="sm">
        <ModalContent>
          <ModalHeader>Small Modal</ModalHeader>
          <ModalBody>
            <p>This is a small modal.</p>
          </ModalBody>
          <ModalFooter>
            <AppButton size="sm" onClick={() => setSmallModalOpen(false)}>Close</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isLargeModalOpen} onClose={() => setLargeModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader>Large Modal</ModalHeader>
          <ModalBody>
            <p>This is a large modal. It takes up more space for wider content like tables or complex forms.</p>
          </ModalBody>
          <ModalFooter>
            <AppButton onClick={() => setLargeModalOpen(false)}>Close</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isFullModalOpen} onClose={() => setFullModalOpen(false)} size="full">
        <ModalContent>
          <ModalHeader>Fullscreen Modal</ModalHeader>
          <ModalBody>
            <p>This modal takes up the entire screen.</p>
          </ModalBody>
          <ModalFooter>
            <AppButton onClick={() => setFullModalOpen(false)}>Close</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isTopModalOpen} onClose={() => setTopModalOpen(false)} placement="top">
        <ModalContent>
          <ModalHeader>Top Placement</ModalHeader>
          <ModalBody>
            <p>This modal is aligned to the top of the screen instead of being centered.</p>
          </ModalBody>
          <ModalFooter>
            <AppButton color="info" onClick={() => setTopModalOpen(false)}>Close</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isInsideScrollModalOpen} onClose={() => setInsideScrollModalOpen(false)} scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Scroll Behavior: Inside</ModalHeader>
          <ModalBody>
            {Array.from({ length: 30 }).map((_, i) => (
              <p key={i} className="mb-4">
                Block {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            ))}
          </ModalBody>
          <ModalFooter>
            <AppButton color="success" onClick={() => setInsideScrollModalOpen(false)}>Close</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </>
  );
}
