"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import type { AdminRole } from "@/types/auth";
import Image from "next/image";

// ─── Menu structure ─────────────────────────────────────────

interface MenuItem {
  label: string;
  href: string;
  /** Roles that can see this menu item. Empty = all roles. */
  roles: AdminRole[];
  icon: React.ReactNode;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/",
    roles: [],
    icon: <DashboardIcon />,
  },
  {
    label: "Tổ chức",
    href: "/organization",
    roles: ["superadmin", "editor"],
    icon: <BuildingIcon />,
  },
  {
    label: "Lĩnh vực hoạt động",
    href: "/operation-fields",
    roles: ["superadmin", "editor"],
    icon: <LayersIcon />,
  },
  {
    label: "Chương trình",
    href: "/programs",
    roles: ["superadmin", "editor"],
    icon: <FolderIcon />,
  },
  {
    label: "Giải pháp",
    href: "/solutions",
    roles: ["superadmin", "editor"],
    icon: <LightbulbIcon />,
  },
  {
    label: "Dự án",
    href: "/projects",
    roles: ["superadmin", "editor"],
    icon: <BriefcaseIcon />,
  },
  {
    label: "Bài viết",
    href: "/articles",
    roles: ["superadmin", "editor"],
    icon: <FileTextIcon />,
  },
  {
    label: "Tuyển dụng",
    href: "/jobs",
    roles: ["superadmin", "editor"],
    icon: <UsersIcon />,
  },
  {
    label: "Slide",
    href: "/slides",
    roles: ["superadmin", "editor"],
    icon: <ImageIcon />,
  },
  {
    label: "Page Banner",
    href: "/page-banners",
    roles: ["superadmin", "editor"],
    icon: <BannerIcon />,
  },
  {
    label: "Tỉnh thành",
    href: "/provinces",
    roles: ["superadmin", "editor"],
    icon: <MapIcon />,
  },
  {
    label: "Đối tác",
    href: "/partners",
    roles: ["superadmin", "editor"],
    icon: <HandshakeIcon />,
  },
  {
    label: "Ứng viên",
    href: "/leads",
    roles: [],
    icon: <InboxIcon />,
  },
  {
    label: "Liên hệ",
    href: "/contacts",
    roles: [],
    icon: <ContactIcon />,
  },
  {
    label: "Quản lý Admin",
    href: "/admin-users",
    roles: ["superadmin"],
    icon: <ShieldIcon />,
  },
];

// ─── Component ──────────────────────────────────────────────

interface SidebarProps {
  userRole: AdminRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);

  const visibleItems = MENU_ITEMS.filter(
    (item) => item.roles.length === 0 || item.roles.includes(userRole)
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-40 flex h-full flex-col border-r border-border bg-menu-bg transition-[width] duration-200 ${isCollapsed ? "w-16" : "w-64"
        }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center">
          {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
            V
          </div> */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
            <Image src="https://ik.imagekit.io/huy01040104/vdcd/images/logo%20V%20only.svg" width={22} height={22} alt="VDCD Logo" />
          </div>
          {!isCollapsed && (
            <span className="text-base font-bold text-text">VDCD</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors ${isActive
                    ? "bg-primary font-medium text-primary-fg"
                    : "text-menu-text hover:bg-surface-muted"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="h-4.5 w-4.5 shrink-0">{item.icon}</span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

// ─── Inline SVG icons ───────────────────────────────────────
// Simple Lucide-style icons. Avoids adding lucide-react dependency.

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect width={7} height={9} x={3} y={3} rx={1} />
      <rect width={7} height={5} x={14} y={3} rx={1} />
      <rect width={7} height={9} x={14} y={12} rx={1} />
      <rect width={7} height={5} x={3} y={16} rx={1} />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect width={16} height={20} x={4} y={2} rx={2} ry={2} />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width={20} height={14} x={2} y={6} rx={2} />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 13H8M16 17H8M16 13h-2" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect width={18} height={18} x={3} y={3} rx={2} ry={2} />
      <circle cx={9} cy={9} r={2} />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0Z" />
      <path d="M15 5.764v15M9 3.236v15" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect width={20} height={16} x={2} y={4} rx={2} />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function BannerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect width={20} height={12} x={2} y={6} rx={2} ry={2} />
      <path d="M12 12h.01" />
      <path d="M17 12h.01" />
      <path d="M7 12h.01" />
    </svg>
  );
}
