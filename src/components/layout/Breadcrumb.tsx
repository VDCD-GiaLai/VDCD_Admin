"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Vietnamese labels for route segments.
 * Maps URL slugs to display names.
 */
const SEGMENT_LABELS: Record<string, string> = {
  "": "Dashboard",
  organization: "Tổ chức",
  "operation-fields": "Lĩnh vực hoạt động",
  programs: "Chương trình",
  solutions: "Giải pháp",
  projects: "Dự án",
  articles: "Bài viết",
  jobs: "Tuyển dụng",
  slides: "Slide",
  "slide-detail-blogs": "Bài viết Slide",
  "page-banners": "Page Banner",
  provinces: "Tỉnh thành",
  partners: "Đối tác",
  leads: "Leads",
  "admin-users": "Quản lý Admin",
  profile: "Hồ sơ cá nhân",
  new: "Tạo mới",
};

/**
 * Breadcrumb — auto-generated from current pathname.
 * Always starts with "Dashboard" as home.
 */
export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = SEGMENT_LABELS[segment] ?? segment;
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm">
        <li>
          <Link
            href="/"
            className="text-text-muted transition-colors hover:text-text"
          >
            Dashboard
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <ChevronIcon />
            {item.isLast ? (
              <span className="font-medium text-text">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-text-muted transition-colors hover:text-text"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 text-text-muted"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
