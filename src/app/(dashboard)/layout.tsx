"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { useSidebarStore } from "@/stores/sidebar-store";

/**
 * Dashboard layout — wraps all authenticated pages.
 * Fetches current user, renders Sidebar + Header + content area.
 * Redirects to /login if user is not authenticated.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);

  // Auth check — redirect to login on error
  if (isError) {
    router.push("/login");
    return null;
  }

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-body-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-text-muted">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-body-bg">
      <Sidebar userRole={user.role} />
      <Header user={user} />

      <main
        className={`p-6 transition-[margin-left] duration-200 ${
          isCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <Breadcrumb />
        {children}
      </main>
    </div>
  );
}
