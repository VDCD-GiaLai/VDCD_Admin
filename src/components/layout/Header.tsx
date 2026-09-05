"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useLogout } from "@/features/auth/api";
import type { AdminUser } from "@/types/auth";
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  DropdownCustom,
  Tooltip,
} from "@/components/ui";
import { SearchDialog } from "./SearchDialog";
import { useEffect } from "react";

// ─── Props ───────────────────────────────────────────────────

interface HeaderProps {
  user: AdminUser;
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Quản trị viên",
  editor: "Biên tập viên",
};

// ─── Component ──────────────────────────────────────────────

/**
 * Header component — top bar for admin panel.
 * Left: sidebar toggle.
 * Center: search bar.
 * Right: notification, fullscreen, user profile dropdown.
 */
export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const toggle = useSidebarStore((s) => s.toggle);
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const logoutMutation = useLogout();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-6 transition-[margin-left] duration-200 ${isCollapsed ? "ml-16" : "ml-64"
        }`}
    >
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ─── Left: sidebar toggle ─── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <MenuIcon />
        </button>
      </div>

      {/* ─── Center: search bar ─── */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="relative w-full group flex h-9 items-center rounded-md border border-border bg-surface pl-9 pr-4 text-sm text-text-muted transition-all hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </span>
          <span className="flex-1 text-left">Tìm kiếm...</span>
          <div className="flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium opacity-70 group-hover:opacity-100">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* ─── Right: actions ─── */}
      <div className="flex items-center gap-1">
        {/* Search toggle for mobile */}
        <Tooltip content="Tìm kiếm" placement="bottom">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            aria-label="Tìm kiếm"
          >
            <SearchIcon />
          </button>
        </Tooltip>

        {/* Notifications */}
        {/* <Dropdown
          trigger={
            <Tooltip content="Thông báo" placement="bottom">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                aria-label="Thông báo"
              >
                <BadgeOverlay content={3} color="danger" position="top-right">
                  <BellIcon />
                </BadgeOverlay>
              </button>
            </Tooltip>
          }
          placement="bottom-end"
          minWidth={320}
        >
          <DropdownHeader>Thông báo</DropdownHeader>
          <DropdownDivider />
          <DropdownCustom className="py-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-text-muted">
                <BellOffIcon />
              </span>
              <p className="text-sm text-text-muted">
                Chưa có thông báo mới
              </p>
            </div>
          </DropdownCustom>
          <DropdownDivider />
          <DropdownItem className="justify-center text-primary font-medium">
            Xem tất cả
          </DropdownItem>
        </Dropdown> */}

        {/* Fullscreen toggle */}
        <Tooltip
          content={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          placement="bottom"
        >
          <button
            type="button"
            onClick={handleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            aria-label={
              isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"
            }
          >
            {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
          </button>
        </Tooltip>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-border" />

        {/* User profile */}
        <Dropdown
          trigger={
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-muted transition-colors"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-fg">
                {user.username.charAt(0).toUpperCase()}
              </div>
              {/* Name & role (hidden on small) */}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium leading-tight text-text">
                  {user.username}
                </p>
                <p className="text-[11px] leading-tight text-text-muted">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
              <ChevronDownIcon />
            </button>
          }
          placement="bottom-end"
          minWidth={220}
        >
          {/* Profile header */}
          <DropdownCustom className="bg-primary/5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-fg">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text truncate">
                  {user.username}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {user.email}
                </p>
                <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            </div>
          </DropdownCustom>

          {/* Menu items */}
          <DropdownItem
            startContent={<UserCircleIcon />}
            onClick={() => router.push('/profile')}
          >
            Hồ sơ cá nhân
          </DropdownItem>
          {/* <DropdownItem
            startContent={<SettingsIcon />}
          >
            Cài đặt tài khoản
          </DropdownItem> */}

          <DropdownDivider />

          {/* Logout */}
          <DropdownItem
            startContent={<LogOutIcon />}
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-danger hover:bg-danger/10"
          >
            {logoutMutation.isPending ? "Đang xuất..." : "Đăng xuất"}
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}

// ─── Inline SVG Icons ───────────────────────────────────────
// Lucide-style icons to avoid adding dependencies.

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1={4} x2={20} y1={12} y2={12} />
      <line x1={4} x2={20} y1={6} y2={6} />
      <line x1={4} x2={20} y1={18} y2={18} />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx={11} cy={11} r={8} />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}


function MaximizeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <path d="M14 10l7-7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function UserCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={10} r={3} />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} x2={9} y1={12} y2={12} />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="hidden lg:block h-3.5 w-3.5 text-text-muted">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
