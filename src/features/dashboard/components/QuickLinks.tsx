"use client";

import Link from "next/link";
import { usePermission } from "@/hooks/usePermission";

export function QuickLinks() {
  const isSuperadmin = usePermission("admin-users:*");

  if (!isSuperadmin) return null;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-[0px_2px_2px_rgba(0,0,0,0.05)]">
      <h3 className="mb-4 text-lg font-bold text-text">Lối tắt (Superadmin)</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
        <Link
          href="/admin-users"
          className="group flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span className="font-medium text-text group-hover:text-primary transition-colors">Quản trị viên</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Link>

        <Link
          href="/operation-fields"
          className="group flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <span className="font-medium text-text group-hover:text-primary transition-colors">Lĩnh vực h/động</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Link>

        <Link
          href="/partners"
          className="group flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span className="font-medium text-text group-hover:text-primary transition-colors">Đối tác</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
